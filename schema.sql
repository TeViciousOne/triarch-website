-- Database design for the real version of the site (Supabase / PostgreSQL).
-- Applied to the Supabase project "triarch" (eu-central-1). Review the security rules with a developer before real client data goes in.

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null,
  role text not null default 'client' check (role in ('client', 'staff')),
  created_at timestamptz not null default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  type text,
  phase_index int not null default 0 check (phase_index between 0 and 4),
  revision text not null default 'A',
  summary text,
  last_update date not null default current_date,
  created_at timestamptz not null default now()
);

-- Which clients may see which project. A couple or a company can have several people per project.
create table project_members (
  project_id uuid not null references projects on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  primary key (project_id, user_id)
);

create table milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  phase_index int not null check (phase_index between 0 and 4),
  title text not null,
  note text,
  due_date date not null,
  status text not null default 'upcoming' check (status in ('upcoming', 'awaiting', 'changes', 'done')),
  response_decision text check (response_decision in ('approved', 'changes')),
  response_text text,
  responded_by uuid references profiles,
  responded_at timestamptz
);

create table gallery_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  title text not null,
  kind text not null check (kind in ('elevation', 'plan', 'render', 'photo')),
  storage_path text not null,           -- file in Supabase Storage bucket "project-files"
  created_at timestamptz not null default now()
);

-- A comment pinned to a spot on an image. x and y are percentages (0 to 100).
create table pins (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references gallery_items on delete cascade,
  x numeric not null check (x between 0 and 100),
  y numeric not null check (y between 0 and 100),
  body text not null,
  author_id uuid not null references profiles default auth.uid(),
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create table pin_replies (
  id uuid primary key default gen_random_uuid(),
  pin_id uuid not null references pins on delete cascade,
  body text not null,
  author_id uuid not null references profiles default auth.uid(),
  created_at timestamptz not null default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  name text not null,
  file_type text not null,
  version text not null default 'v1',
  size_bytes bigint,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  author_id uuid references profiles default auth.uid(),  -- null for automatic notes
  body text not null,
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create index on project_members (user_id);
create index on milestones (project_id);
create index on gallery_items (project_id);
create index on pins (item_id);
create index on documents (project_id);
create index on messages (project_id, created_at);

-- ---------- who can see what ----------
create function is_staff() returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid() and role = 'staff') $$;

create function is_member(pid uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from project_members where project_id = pid and user_id = auth.uid()) $$;

alter table profiles enable row level security;
alter table projects enable row level security;
alter table project_members enable row level security;
alter table milestones enable row level security;
alter table gallery_items enable row level security;
alter table pins enable row level security;
alter table pin_replies enable row level security;
alter table documents enable row level security;
alter table messages enable row level security;

-- Staff can do everything.
create policy staff_all on profiles for all using (is_staff()) with check (is_staff());
create policy staff_all on projects for all using (is_staff()) with check (is_staff());
create policy staff_all on project_members for all using (is_staff()) with check (is_staff());
create policy staff_all on milestones for all using (is_staff()) with check (is_staff());
create policy staff_all on gallery_items for all using (is_staff()) with check (is_staff());
create policy staff_all on pins for all using (is_staff()) with check (is_staff());
create policy staff_all on pin_replies for all using (is_staff()) with check (is_staff());
create policy staff_all on documents for all using (is_staff()) with check (is_staff());
create policy staff_all on messages for all using (is_staff()) with check (is_staff());

-- Clients can read only their own projects.
create policy own_profile on profiles for select using (id = auth.uid());
create policy member_read on projects for select using (is_member(id));
create policy member_read on project_members for select using (user_id = auth.uid());
create policy member_read on milestones for select using (is_member(project_id));
create policy member_read on gallery_items for select using (is_member(project_id));
create policy member_read on documents for select using (is_member(project_id));
create policy member_read on messages for select using (is_member(project_id));
create policy member_read on pins for select using (exists (select 1 from gallery_items g where g.id = item_id and is_member(g.project_id)));
create policy member_read on pin_replies for select using (exists (select 1 from pins p join gallery_items g on g.id = p.item_id where p.id = pin_id and is_member(g.project_id)));

-- Clients can add comments and messages in their own projects, as themselves.
create policy member_write on messages for insert with check (author_id = auth.uid() and is_system = false and is_member(project_id));
create policy member_write on pins for insert with check (author_id = auth.uid() and exists (select 1 from gallery_items g where g.id = item_id and is_member(g.project_id)));
create policy member_write on pin_replies for insert with check (author_id = auth.uid() and exists (select 1 from pins p join gallery_items g on g.id = p.item_id where p.id = pin_id and is_member(g.project_id)));

-- Clients answer a milestone through this function only, so they cannot edit titles, dates or other people's answers.
create function respond_to_milestone(mid uuid, decision text, reply text default '') returns void
language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
  select project_id into pid from milestones where id = mid and status = 'awaiting';
  if pid is null or not is_member(pid) then raise exception 'Milestone not available'; end if;
  if decision not in ('approved', 'changes') then raise exception 'Invalid decision'; end if;
  update milestones set status = case when decision = 'approved' then 'done' else 'changes' end,
    response_decision = decision, response_text = reply, responded_by = auth.uid(), responded_at = now()
  where id = mid;
  update projects set last_update = current_date where id = pid;
  insert into messages (project_id, author_id, body, is_system)
  values (pid, null, (select full_name from profiles where id = auth.uid()) ||
    case when decision = 'approved' then ' approved ' else ' asked for changes to ' end ||
    (select title from milestones where id = mid) || '.', true);
end $$;

-- Files: create a private Storage bucket named "project-files" with paths like <project_id>/<filename>,
-- then allow reads when is_member((storage.foldername(name))[1]::uuid) or is_staff(), and writes only for staff.

-- Do not let the public API call the helper functions directly.
revoke execute on function is_staff() from public, anon;
revoke execute on function is_member(uuid) from public, anon;
revoke execute on function respond_to_milestone(uuid, text, text) from public, anon;

-- Every new sign-up gets a client profile. Staff are promoted by hand: update profiles set role = 'staff' where id = '...';
create function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, role)
  values (new.id, coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)), 'client');
  return new;
end $$;
revoke execute on function handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- Private file storage.
insert into storage.buckets (id, name, public) values ('project-files', 'project-files', false) on conflict do nothing;
create policy files_read on storage.objects for select to authenticated
  using (bucket_id = 'project-files' and (is_staff() or is_member(((storage.foldername(name))[1])::uuid)));
create policy files_staff_write on storage.objects for insert to authenticated
  with check (bucket_id = 'project-files' and is_staff());
create policy files_staff_update on storage.objects for update to authenticated
  using (bucket_id = 'project-files' and is_staff());
create policy files_staff_delete on storage.objects for delete to authenticated
  using (bucket_id = 'project-files' and is_staff());

-- ---------- second step: what the screens need ----------
alter table projects add column seed int not null default (floor(random() * 900) + 10);           -- picks the placeholder drawing
alter table gallery_items add column seed int not null default (floor(random() * 900) + 10);
alter table gallery_items alter column storage_path drop not null;                                 -- no file yet = placeholder drawing
alter table documents alter column storage_path drop not null;

-- Clients may see the names of studio staff and of people on their own projects (for comments and messages).
create function shares_project(uid uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from project_members a join project_members b on a.project_id = b.project_id
                  where a.user_id = (select auth.uid()) and b.user_id = uid) $$;
revoke execute on function shares_project(uuid) from public, anon;
create policy colleagues_read on profiles for select to authenticated using (role = 'staff' or shares_project(id));

-- Messages from the public contact form. Anyone may send one; only staff can read them.
create table contact_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  email text not null check (char_length(email) between 3 and 320),
  kind text check (char_length(kind) <= 100),
  message text not null check (char_length(message) between 1 and 4000),
  created_at timestamptz not null default now()
);
alter table contact_requests enable row level security;
create policy anyone_can_send on contact_requests for insert to anon, authenticated with check (true);
create policy staff_read on contact_requests for select to authenticated using (is_staff());
create policy staff_delete on contact_requests for delete to authenticated using (is_staff());

-- ---------- third step: usernames and studio-created accounts ----------
alter table profiles add column username text;
alter table profiles add constraint username_format check (username is null or username ~ '^[a-z0-9._-]{3,32}$');
create unique index profiles_username_key on profiles (username);

create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, role, username)
  values (new.id, coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), 'New user'), 'client', nullif(new.raw_user_meta_data->>'username', ''));
  return new;
end $$;

-- Staff create client accounts from the Admin area. People sign in with a username; Supabase wants an email-shaped
-- identifier, so the username becomes <username>@triarch.example.com internally. That address is never used for mail.
create function create_client_account(p_username text, p_full_name text, p_password text) returns uuid
language plpgsql security definer set search_path = public, extensions, auth as $$
declare uid uuid := gen_random_uuid(); uname text := lower(trim(coalesce(p_username, ''))); mail text; fname text := trim(coalesce(p_full_name, ''));
begin
  if not is_staff() then raise exception 'Only studio staff can create accounts'; end if;
  if uname !~ '^[a-z0-9._-]{3,32}$' then raise exception 'The username must be 3 to 32 characters: letters, numbers, dots, dashes or underscores'; end if;
  if char_length(coalesce(p_password, '')) < 8 then raise exception 'The password must be at least 8 characters'; end if;
  if char_length(fname) < 1 or char_length(fname) > 200 then raise exception 'Enter the client''s name'; end if;
  if exists (select 1 from profiles where username = uname) then raise exception 'That username is already taken'; end if;
  mail := uname || '@triarch.example.com';
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
  values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', mail, crypt(p_password, gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', fname, 'username', uname), now(), now(), '', '', '', '', '', '', '', '');
  insert into auth.identities (user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  values (uid, jsonb_build_object('sub', uid::text, 'email', mail, 'email_verified', true), 'email', uid::text, now(), now(), now());
  return uid;
end $$;
revoke execute on function create_client_account(text, text, text) from public, anon;

create function reset_client_password(p_user uuid, p_password text) returns void
language plpgsql security definer set search_path = public, extensions, auth as $$
begin
  if not is_staff() then raise exception 'Only studio staff can change passwords'; end if;
  if char_length(coalesce(p_password, '')) < 8 then raise exception 'The password must be at least 8 characters'; end if;
  if not exists (select 1 from profiles where id = p_user and role = 'client') then raise exception 'Client not found'; end if;
  update auth.users set encrypted_password = crypt(p_password, gen_salt('bf')), updated_at = now() where id = p_user;
end $$;
revoke execute on function reset_client_password(uuid, text) from public, anon;

-- ---------- fourth step: forced-change reminder, managing accounts and content ----------
alter table profiles add column must_change_password boolean not null default false;  -- true for accounts the studio created or reset
alter table profiles add column disabled boolean not null default false;              -- access switched off by the studio

-- create_client_account and reset_client_password (above) also set must_change_password = true.
create function password_changed() returns void language sql security definer set search_path = public as
$$ update profiles set must_change_password = false where id = (select auth.uid()) $$;
revoke execute on function password_changed() from public, anon;

create function rename_client_username(p_user uuid, p_username text) returns void
language plpgsql security definer set search_path = public, extensions, auth as $$
declare uname text := lower(trim(coalesce(p_username, ''))); mail text;
begin
  if not is_staff() then raise exception 'Only studio staff can change usernames'; end if;
  if uname !~ '^[a-z0-9._-]{3,32}$' then raise exception 'The username must be 3 to 32 characters: letters, numbers, dots, dashes or underscores'; end if;
  if not exists (select 1 from profiles where id = p_user and role = 'client') then raise exception 'Client not found'; end if;
  if exists (select 1 from profiles where username = uname and id <> p_user) then raise exception 'That username is already taken'; end if;
  mail := uname || '@triarch.example.com';
  update auth.users set email = mail, raw_user_meta_data = raw_user_meta_data || jsonb_build_object('username', uname), updated_at = now() where id = p_user;
  update auth.identities set identity_data = identity_data || jsonb_build_object('email', mail) where user_id = p_user;
  update profiles set username = uname where id = p_user;
end $$;
revoke execute on function rename_client_username(uuid, text) from public, anon;

create function set_client_disabled(p_user uuid, p_disabled boolean) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not is_staff() then raise exception 'Only studio staff can change accounts'; end if;
  if not exists (select 1 from profiles where id = p_user and role = 'client') then raise exception 'Client not found'; end if;
  update auth.users set banned_until = case when p_disabled then 'infinity'::timestamptz else null end, updated_at = now() where id = p_user;
  update profiles set disabled = p_disabled where id = p_user;
end $$;
revoke execute on function set_client_disabled(uuid, boolean) from public, anon;

-- Comments and messages stay if an account is ever removed (shown as "Former user").
alter table pins alter column author_id drop not null;
alter table pin_replies alter column author_id drop not null;
alter table pins drop constraint pins_author_id_fkey, add constraint pins_author_id_fkey foreign key (author_id) references profiles(id) on delete set null;
alter table pin_replies drop constraint pin_replies_author_id_fkey, add constraint pin_replies_author_id_fkey foreign key (author_id) references profiles(id) on delete set null;
alter table messages drop constraint messages_author_id_fkey, add constraint messages_author_id_fkey foreign key (author_id) references profiles(id) on delete set null;
alter table milestones drop constraint milestones_responded_by_fkey, add constraint milestones_responded_by_fkey foreign key (responded_by) references profiles(id) on delete set null;
