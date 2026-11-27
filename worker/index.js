// Cloudflare Worker in front of the static site (dist/). Static files are served by Cloudflare directly; this
// script runs for "/" (mapping "/" -> "/index.html" while html_handling is "none") and "/api/lead" (forwarding
// diagnostic requests to the Google Sheet webhook stored in the LEAD_SHEET_URL secret).
const LEAD_FIELDS = ['name', 'email', 'company', 'workflow', 'page', 'job'];

async function handleLead(request, env) {
  if (request.method !== 'POST') return new Response('method not allowed', { status: 405 });
  let form;
  try { form = await request.formData(); } catch { return new Response('bad form', { status: 400 }); }
  // Honeypot field: real users never see it; spam bots fill it. Return ok and save nothing.
  if (form.get('company_fax')) return new Response('ok');
  const data = {};
  for (const field of LEAD_FIELDS) data[field] = String(form.get(field) ?? '').trim().slice(0, 2000);
  if (!data.name || !data.workflow || !/^\S+@\S+\.\S+$/.test(data.email)) {
    return new Response('missing a required field', { status: 400 });
  }
  if (!env.LEAD_SHEET_URL) return new Response('lead receiver not configured', { status: 503 });
  const lead = { form_name: 'zavient-diagnostic', id: crypto.randomUUID(), created_at: new Date().toISOString(), data };
  try {
    const saved = await fetch(env.LEAD_SHEET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
    });
    const answer = (await saved.text()).trim();
    if (saved.ok && (answer === 'ok' || answer === 'duplicate')) return new Response('ok');
    return new Response('lead receiver did not confirm', { status: 502 });
  } catch {
    return new Response('lead receiver unreachable', { status: 502 });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/lead') return handleLead(request, env);
    if (url.pathname === '/') {
      url.pathname = '/index.html';
      return env.ASSETS.fetch(new Request(url, request));
    }
    return env.ASSETS.fetch(request);
  },
};
