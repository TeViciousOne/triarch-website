# triArch: accounts and passwords

Everyone signs in with a **username** and a password. There are no email logins and no public sign-up.

## Studio account
The first studio account already exists: username **triarch**. Sign in, then open **Account** and change the temporary password straight away.

## Add a client (in the Admin area)
1. Sign in as studio staff and open **Admin**.
2. Under **Clients**, fill in **Create a client account**: the client's name, a username and a password. **Generate password** makes a strong one.
3. After you click **Create account**, the username and password are shown once. Give them to the client.
4. Under **Add a project**, pick the client from the list so they can see the project.

The client signs in and can change their own password under **Account**. If a client forgets it, use **Set password** next to their name in the Clients list and give them the new one.

## Settings to check in Supabase (once)
- **Authentication, then Sign In / Providers**: switch off **Allow new users to sign up**. Accounts are only created by the studio.

## Where things are
- Contact form messages: **Table Editor, then contact_requests**.
- Uploaded drawings and documents: **Storage, then project-files** (private; only the studio and the project's clients can open them).
- Passwords are stored by Supabase in scrambled form and are never visible to the website or to the studio.
