# triArch: website and client portal preview

**Three points. One vision.**

Style: an iOS-inspired look with a frosted-glass top bar, rounded cards, pill buttons, a segmented control and, on phones, a bottom tab bar in the client portal. It follows the device's light or dark setting. The page structure follows the Luzen template: numbered sections for about, success, projects, news and questions. The colours are set at the top of `styles.css`.

The studio name (triArch, written exactly like this) and the slogan (Three points. One vision.) are both set in one place, at the top of `data.js`. Change them there and they update everywhere. The slogan is the main line on the home page and sits small under the triArch wordmark in the top bar.

## Two modes
With `supabaseKey` empty in `config.js` the site runs as an offline demo with sample data (this is what `triarch-preview.html` is). With the key filled in, as it is in the repository, it uses the real database: real logins, shared data, private file storage. See `SETUP.md` for creating accounts.

## How to open the offline demo
Double-click **triarch-preview.html**. It opens in your browser and needs no installation. With an internet connection it uses the font Inter on non-Apple devices; Apple devices use their own system font (SF Pro). It works on phones and computers.

## What you can try
**Public site:** home page, projects, a page for each project, studio, contact form.

**Client login:** on the login page pick a sample client, for example *Maya Reyes*. Then you can:
- see the project timeline, percentage complete and milestones
- approve a milestone, or ask for changes with a note
- open a drawing and click anywhere on it to leave a comment pinned to that spot
- read documents and send messages to the studio

**Studio admin:** pick *Elena Marku*. Then you can:
- see what needs attention across all projects
- move a project to the next phase and change the drawing revision
- add milestones, set their status, and ask the client for feedback
- add images and documents, reply to pinned comments and mark them resolved
- message the client

## What is real and what is not
The preview is a working prototype with sample data. Everything you do is saved only in your own browser, so another person on another computer will not see your changes. The "Reset sample data" button in the admin area starts again.

Not yet real: secure logins with real passwords, real file uploads, email notifications, and sharing between devices. Those come with the full version.

## The full version
- **Technology:** Next.js (website), Supabase (logins, database, file storage), Vercel (hosting).
- **schema.sql** is the database design for it, including the rules that make each client see only their own projects. It has not been run yet, so a developer should review it before use.
- The screens in the preview are the design to build from. The sample data in `data.js` is replaced by the database.
- Because the site follows European data rules (GDPR), the full version should also include a cookie and privacy notice, a way for clients to download their data, and a way to delete it.

## Files
- `triarch-preview.html`: the whole preview in one file
- `index.html`, `styles.css`, `app.js`, `data.js`, `drawings.js`: the same preview as separate source files
- `config.js`, `boot.js`, `supa.js`: connect the same screens to Supabase
- `schema.sql`: the database design (already applied to the Supabase project)
- `SETUP.md`: how to create the first studio account and add clients
