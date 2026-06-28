# Zavient site — how it works now

The site is an **Astro** project deployed by **Vercel** (auto-builds on every push to `master`).

- **Home + offer pages** are plain HTML in `public/` (`index.html`, `ai-offer.html`) — untouched, served as-is.
- **Insights articles** are Markdown files in `src/content/insights/`. Astro turns each one into a styled page at `/insights/<slug>.html` and auto-builds the hub at `/insights/`.
- **Editing** happens either by editing the Markdown directly, or through the **Decap CMS** web admin at `/admin`.

## Writing a new article (the simple way)

1. Copy any file in `src/content/insights/` to a new name, e.g. `energy-utilities.md`.
2. Edit the frontmatter (title, dek, tag, stats, sources) and the body.
3. Commit. Vercel rebuilds; the new article appears in the hub automatically (sorted by `order`).

## Writing via the /admin web editor (Decap)

Go to `https://zavient.com/admin`, sign in with GitHub, fill the form, hit Publish. It commits the Markdown for you. **This requires the one-time OAuth setup below.**

---

## One-time Decap OAuth setup (your hands needed — ~5 minutes)

Decap needs a GitHub OAuth app so it can commit on your behalf. The serverless functions are already in `api/auth.js` and `api/callback.js`; they just need credentials.

### Step 1 — Create a GitHub OAuth App
1. Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**
   (https://github.com/settings/developers).
2. Fill in:
   - **Application name:** `Zavient CMS`
   - **Homepage URL:** `https://zavient.com`
   - **Authorization callback URL:** `https://zavient.com/api/callback`
3. Click **Register application**.
4. Copy the **Client ID**. Click **Generate a new client secret** and copy the **Client Secret**.

### Step 2 — Add the credentials to Vercel
1. Vercel → your `zavient-site` project → **Settings → Environment Variables**.
2. Add two variables (Production scope):
   - `OAUTH_GITHUB_CLIENT_ID` = the Client ID
   - `OAUTH_GITHUB_CLIENT_SECRET` = the Client Secret
3. **Redeploy** (Vercel → Deployments → … → Redeploy) so the functions pick up the vars.

### Step 3 — Test
Visit `https://zavient.com/admin`, click **Login with GitHub**, authorize. You should land in the editor with the Insights collection.

> If login fails, the most common cause is a mismatch between the callback URL in the GitHub app and `https://zavient.com/api/callback`, or the env vars not being set on the Production environment.
