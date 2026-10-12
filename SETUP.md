# triArch: setting up real accounts

The website now runs on a real database (Supabase project **triarch**). Accounts are created by the studio, so there is no public sign-up.

## 1. Switch off public sign-up (once)
In Supabase: **Authentication, then Sign In / Providers**, and turn off **Allow new users to sign up**. Without this, anyone could create an account.

## 2. Create the first studio account (once)
1. In Supabase: **Authentication, then Users, then Add user, then Create new user**.
2. Enter the studio member's email and a password, and tick **Auto Confirm User**.
3. Tell Claude the email, or run this in **SQL Editor** (replace the email):
   `update profiles set role = 'staff' where id = (select id from auth.users where email = 'you@example.com');`
4. Sign in on the website. You land in the **Admin** area.

## 3. Add a client
1. Create their account the same way (**Add user**, **Auto Confirm User**). Send them the email and password and ask them to keep it private.
2. On the website, in **Admin**, use **Add a project**. The new client appears in the **Client** list. Pick them and save.
3. The client signs in and sees only that project.

To give a second person (a partner, a family member) access to the same project, create their account and add a row in **Table Editor, then project_members** with the project and the person.

## 4. Address settings (once the site has its final address)
In Supabase: **Authentication, then URL Configuration**, and set **Site URL** to the website address.

## Where things are
- Contact form messages: **Table Editor, then contact_requests**.
- Uploaded drawings and documents: **Storage, then project-files** (private; only the studio and the project's clients can open them).
- Passwords are handled by Supabase and are never stored on the website.
