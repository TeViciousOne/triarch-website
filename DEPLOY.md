# Put triArch online: GitHub, then Vercel

You only need your GitHub and Vercel accounts for this. Supabase comes later, when we build the real client logins.

## Part 1: Put the files on GitHub (about 5 minutes)
1. Go to github.com and sign in.
2. Click the **+** at the top right, then **New repository**.
3. Name it `triarch-website`. Choose **Private**. Leave everything else as it is. Click **Create repository**.
4. On the new page click the link **uploading an existing file**.
5. Drag these files into the page, from the folder you downloaded:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `data.js`
   - `drawings.js`
   - `README.md`
   - `schema.sql` (not used yet, but good to keep)
6. Do not drag a folder. Drag the files themselves, so `index.html` ends up at the top level of the repository.
7. Scroll down and click **Commit changes**.

## Part 2: Publish it with Vercel (about 3 minutes)
1. Go to vercel.com and sign in. Choose **Continue with GitHub** if you have not linked it yet.
2. Click **Add New...**, then **Project**.
3. Find `triarch-website` in the list and click **Import**. If it is missing, click **Adjust GitHub App Permissions** and allow that repository.
4. Leave every setting as it is. Do not add a framework. Click **Deploy**.
5. After about 30 seconds you get an address like `triarch-website.vercel.app`. Open it on your phone and your computer.

## Changing something later
Edit a file on GitHub (click the file, then the pencil icon, then **Commit changes**). Vercel updates the site by itself within a minute. The studio name, slogan and all sample text are at the top of `data.js`.

## What this version does and does not do
- Works: the whole public site and every screen of the client area and admin area, on phones and computers.
- Does not work yet: real logins, and sharing changes between people. Each visitor sees sample data that is saved only in their own browser. Do not put real client information into it.

## Next step: real logins with Supabase
When you are ready, we build the version where clients have real accounts and the studio's updates show up for everyone. That is where Supabase (login, database, file storage) is used, and `schema.sql` is the starting design.
