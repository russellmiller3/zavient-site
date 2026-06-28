// api-docs-read: GitHub OAuth web-app flow, audited in one pass.
//   1. GET https://github.com/login/oauth/authorize?client_id&redirect_uri&scope&state
//   2. GitHub redirects to /api/callback?code=...  (handled in callback.js)
//   3. POST https://github.com/login/oauth/access_token -> { access_token } (callback.js)
//   4. Decap handshake: child posts 'authorizing:github', then 'authorization:github:success:{json}'
// This function is step 1 only: kick off the authorize redirect.
import crypto from 'node:crypto';

export default function handler(req, res) {
  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  if (!clientId) {
    res.status(500).send('Missing OAUTH_GITHUB_CLIENT_ID env var (set it in Vercel project settings).');
    return;
  }
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const redirectUri = `https://${host}/api/callback`;
  const state = crypto.randomBytes(12).toString('hex');
  const url =
    'https://github.com/login/oauth/authorize' +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    '&scope=repo' +
    `&state=${state}`;
  res.writeHead(302, { Location: url });
  res.end();
}
