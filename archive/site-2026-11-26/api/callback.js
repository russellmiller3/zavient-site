// api-docs-read: GitHub OAuth web-app flow (steps 3-4), audited in one pass.
//   POST https://github.com/login/oauth/access_token with { client_id, client_secret, code }
//   Accept: application/json -> { access_token, token_type, scope } | { error, error_description }
//   Then complete Decap's postMessage handshake back to the opener (the /admin window).
export default async function handler(req, res) {
  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  const clientSecret = process.env.OAUTH_GITHUB_CLIENT_SECRET;
  const authCode = req.query && req.query.code;

  if (!clientId || !clientSecret) {
    res.status(500).send('Missing OAUTH_GITHUB_CLIENT_ID / OAUTH_GITHUB_CLIENT_SECRET env vars.');
    return;
  }
  if (!authCode) {
    res.status(400).send('Missing ?code from GitHub.');
    return;
  }

  let authStatus = 'error';
  let handshakePayload = { error: 'Unknown error' };
  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code: authCode }),
    });
    const tokenResult = await tokenResponse.json();
    if (tokenResult.access_token) {
      authStatus = 'success';
      handshakePayload = { token: tokenResult.access_token, provider: 'github' };
    } else {
      handshakePayload = { error: tokenResult.error_description || tokenResult.error || 'No access_token returned' };
    }
  } catch (tokenError) {
    handshakePayload = { error: String(tokenError) };
  }

  const handshakeMessage = `authorization:github:${authStatus}:${JSON.stringify(handshakePayload)}`;
  const handshakePage = `<!doctype html><html><body><script>
  (function () {
    function receiveMessage(event) {
      window.opener && window.opener.postMessage(${JSON.stringify(handshakeMessage)}, event.origin);
      window.removeEventListener('message', receiveMessage, false);
    }
    window.addEventListener('message', receiveMessage, false);
    window.opener && window.opener.postMessage('authorizing:github', '*');
  })();
  </script><p>Completing sign-in&hellip; you can close this window.</p></body></html>`;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(handshakePage);
}
