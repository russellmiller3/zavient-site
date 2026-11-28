// Cloudflare Worker in front of the static site (dist/). Static files are served by Cloudflare directly; this
// script runs for:
//   - "/" -> serves "/index.html" while html_handling is "none"
//   - "/api/lead" -> forwards diagnostic requests to LEAD_SHEET_URL
//   - "/api/t/o/<id>.gif" -> 1x1 transparent open-tracking pixel (logs to LEAD_SHEET_URL if set)
//   - "/api/t/c/<id>?u=<url>" -> safe click-tracking redirect (only zavient.com and calendar.app.google)
import { notifyTrackingEvent } from './tracking-alerts.js';
import { ask } from './ask-ai-kit/ask.mjs';
import { lead as askLead } from './ask-ai-kit/lead.mjs';
import { transcripts as askTranscripts } from './ask-ai-kit/transcripts.mjs';
import { usage as askUsage } from './ask-ai-kit/usage.mjs';

const askRoutes = {
  '/api/ask': { method: 'POST', handler: ask, limit: 'ASK_AI_QUESTION_LIMIT' },
  '/api/ask-lead': { method: 'POST', handler: askLead },
  '/api/ask-transcripts': { method: 'GET', handler: askTranscripts },
  '/api/ask-usage': { method: 'GET', handler: askUsage },
};

const LEAD_FIELDS = ['name', 'email', 'company', 'workflow', 'page', 'job'];
const PIXEL_GIF = Uint8Array.from([
  71, 73, 70, 56, 57, 97, 1, 0, 1, 0, 128, 0, 0, 0, 0, 0, 255, 255, 255,
  33, 249, 4, 1, 0, 0, 0, 0, 44, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 2, 68, 1, 0, 59,
]);
const ALLOWED_REDIRECT_HOSTS = new Set(['zavient.com', 'www.zavient.com', 'calendar.app.google']);

function logTrackEvent(env, ctx, payload) {
  console.log(JSON.stringify({ type: 'zavient_email_track', ts: new Date().toISOString(), ...payload }));
  if (ctx && typeof ctx.waitUntil === 'function') {
    ctx.waitUntil(notifyTrackingEvent(env, payload).catch((error) => {
      console.error(JSON.stringify({ type: 'zavient_tracking_alert_failed', track_id: payload.track_id, error: error.message }));
    }));
  }
  if (!env.LEAD_SHEET_URL) return;
  const req = fetch(env.LEAD_SHEET_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      form_name: 'zavient-email-track',
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      data: payload,
    }),
  }).catch(() => {});
  if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(req);
}

async function handleLead(request, env) {
  if (request.method !== 'POST') return new Response('method not allowed', { status: 405 });
  let form;
  try { form = await request.formData(); } catch { return new Response('bad form', { status: 400 }); }
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

function handleOpenPixel(url, request, env, ctx) {
  const id = url.pathname.replace(/^\/api\/t\/o\//, '').replace(/\.gif$/i, '').slice(0, 120);
  if (request.method === 'GET') logTrackEvent(env, ctx, {
    event: 'open',
    track_id: id,
    user_agent: (request.headers.get('user-agent') || '').slice(0, 200),
  });
  return new Response(PIXEL_GIF, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    },
  });
}

function handleClickRedirect(url, request, env, ctx) {
  const id = url.pathname.replace(/^\/api\/t\/c\//, '').slice(0, 120);
  const rawTarget = url.searchParams.get('u') || 'https://zavient.com/';
  let target;
  try {
    target = new URL(rawTarget);
  } catch {
    return new Response('invalid url', { status: 400 });
  }
  if (target.protocol !== 'https:' || !ALLOWED_REDIRECT_HOSTS.has(target.hostname)) {
    return new Response('redirect host not allowed', { status: 400 });
  }
  if (request.method === 'GET') logTrackEvent(env, ctx, {
    event: 'click',
    track_id: id,
    target: target.toString().slice(0, 500),
    user_agent: (request.headers.get('user-agent') || '').slice(0, 200),
  });
  return Response.redirect(target.toString(), 302);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.hostname === 'www.zavient.com') {
      url.hostname = 'zavient.com';
      if (url.pathname === '/index.html') url.pathname = '/';
      return Response.redirect(url.toString(), 301);
    }
    if (url.pathname === '/index.html') {
      url.pathname = '/';
      return Response.redirect(url.toString(), 301);
    }
    if (Object.hasOwn(askRoutes, url.pathname)) {
      const { method, handler, limit } = askRoutes[url.pathname];
      if (request.method !== method) return new Response('method not allowed', { status: 405, headers: { Allow: method } });
      const ip = request.headers.get('CF-Connecting-IP');
      if (limit && env[limit] && ip && !(await env[limit].limit({ key: ip })).success) {
        return Response.json({ error: 'Too many questions. Please try again shortly.' }, { status: 429 });
      }
      return handler({ request, env, waitUntil: ctx?.waitUntil?.bind(ctx) });
    }
    if (url.pathname === '/api/lead') return handleLead(request, env);
    if (url.pathname.startsWith('/api/t/o/')) return handleOpenPixel(url, request, env, ctx);
    if (url.pathname.startsWith('/api/t/c/')) return handleClickRedirect(url, request, env, ctx);
    if (url.pathname === '/') {
      url.pathname = '/index.html';
      return env.ASSETS.fetch(new Request(url, request));
    }
    return env.ASSETS.fetch(request);
  },
};
