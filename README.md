# Debbie's Fashion

A responsive sewing-inspiration studio with real email/password authentication provided by Supabase. The gallery includes category filters, search, and user-scoped saved picks. WhatsApp contact opens a chat to +234 903 094 3035.

## Connect Supabase

1. Create a Supabase project and open **Project Settings → API**.
2. Copy the project URL and the publishable key (or legacy `anon` key) into `supabase-config.js`. These are public browser credentials; never put a `service_role` or secret key in this website.
3. In **Authentication → URL Configuration**, add the URL where you host this site to the allowed site URLs and redirect URLs.
4. Choose whether email confirmation is required in the Supabase authentication settings. With confirmation enabled, new users must confirm their email before signing in.

Supabase handles password storage, credential verification, and user sessions. Saved design picks are stored in this browser and keyed to the authenticated user; they are not synced between devices.

## Run locally

Serve the workspace folder with any static HTTP server, then open its local URL. For example, if Python is installed, run `python -m http.server 8000` from this folder and visit `http://localhost:8000`. The Supabase JavaScript client, Google Fonts, and Unsplash images load over the internet.

## Publish on GitHub Pages

The local preview address (`localhost` or `127.0.0.1`) only works on this computer while its server is running. To keep the site available after closing VS Code, publish it with GitHub Pages:

1. On GitHub, create a repository named `debbies-fashion` and choose **Public**.
2. In the new repository, choose **Add file → Upload files**. Upload the five root project files: `index.html`, `app.js`, `styles.css`, `supabase-config.js`, and `README.md`. Commit them to the `main` branch.
3. Choose **Add file → Create new file**. Name it `.github/workflows/deploy.yml`, paste in the workflow from this project's `.github/workflows/deploy.yml`, and commit it to `main`.
4. Open **Settings → Pages** and set the build source to **GitHub Actions**.
5. Open the repository's **Actions** tab and wait for **Deploy static site to GitHub Pages** to finish. The site address will be `https://YOUR-GITHUB-NAME.github.io/debbies-fashion/`.
6. In Supabase, open **Authentication → URL Configuration**. Set **Site URL** to the GitHub Pages address and add that same address to the allowed redirect URLs.
7. Visit the GitHub Pages address to test the site and account confirmation flow.

Every later commit to `main` automatically redeploys the site. Publishing requires your GitHub account. The Supabase publishable/anon key is intended for browser use; never publish a `service_role` key.