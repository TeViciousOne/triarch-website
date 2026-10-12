# triArch: accounts and passwords

Everyone signs in with a **username** and a password. There are no email logins and no public sign-up.

## Studio account
The first studio account already exists: username **triarch**. Sign in, then open **Account** and change the temporary password straight away.

## Add a client (in the Admin area)
1. Sign in as studio staff and open **Admin**.
2. Under **Clients**, fill in **Create a client account**: the client's name, a username and a password. **Generate password** makes a strong one.
3. After you click **Create account**, the username and password are shown once. Give them to the client.
4. Under **Add a project**, pick the client from the list so they can see the project.

The first time a client signs in they are taken to **Account** and asked to choose their own password. A reminder stays at the top of their pages until they do. If a client forgets it, use **Set password** next to their name in the Clients list and give them the new one.

## Managing clients and projects (Admin)
- **Clients**: rename a client or change their username, set a new password, **Disable account** (blocks sign-in without deleting anything; **Enable account** brings it back).
- **Project, Progress tab, Project settings**: edit the name, location, type and description; give another client access or remove someone's access; delete the project.
- **Milestones**: **Edit or delete** under each milestone.
- **Drawings and photos**: open an image to rename or delete it, or delete a comment.
- **Documents**: rename or delete.
- **Enquiries from the contact form** are listed at the bottom of Admin, with a reply-by-email button.

Deleting a client account permanently is not in the website. Disable it, or delete it in Supabase (**Authentication, then Users**); their comments and messages then show as "Former user".

## Settings to check in Supabase (once)
- **Authentication, then Sign In / Providers**: switch off **Allow new users to sign up**. Accounts are only created by the studio.

## Where things are
- Contact form messages: **Table Editor, then contact_requests**.
- Uploaded drawings and documents: **Storage, then project-files** (private; only the studio and the project's clients can open them).
- Passwords are stored by Supabase in scrambled form and are never visible to the website or to the studio.
