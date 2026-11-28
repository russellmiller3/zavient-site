import { json, uuid } from './common.mjs';

export function answerText(turn) {
  return turn.reply ? JSON.parse(turn.reply).answer : '';
}

function authorized(request, token) {
  const value = request.headers.get('authorization');
  if (value === 'Bearer ' + token) return true;
  if (!value?.startsWith('Basic ')) return false;
  try { return atob(value.slice(6)) === 'owner:' + token; } catch { return false; }
}

const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

export async function transcripts({ request, env = {} }) {
  if (!env.ASK_AI_DB || !env.ASK_AI_ADMIN_TOKEN) return json({ error: 'Transcript archive is unavailable' }, 503);
  if (!authorized(request, env.ASK_AI_ADMIN_TOKEN)) {
    return new Response('Sign in with username owner and the Ask AI admin token.', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Ask AI transcripts"',
        'Cache-Control': 'no-store',
      },
    });
  }
  const query = new URL(request.url).searchParams;
  const id = uuid(query.get('id'));
  if (query.has('id') && !id) return json({ error: 'Invalid conversation ID' }, 400);
  const page = Math.max(1, Math.min(1_000_000, Number.parseInt(query.get('page'), 10) || 1));
  const limit = id ? 100 : 30;
  const offset = (page - 1) * limit;
  const db = env.ASK_AI_DB;
  try {
    const result = id
      ? await db.prepare(
        'SELECT question, selection, reply, page, created_at FROM ask_ai_transcript_turns WHERE conversation_id = ? ORDER BY created_at, rowid LIMIT ? OFFSET ?'
      ).bind(id, limit + 1, offset).all()
      : await db.prepare(`
        SELECT conversation_id AS id, count(*) AS turns, max(created_at) AS updated,
          (SELECT question FROM ask_ai_transcript_turns AS first_turn WHERE first_turn.conversation_id = chats.conversation_id
            ORDER BY created_at, rowid LIMIT 1) AS first_question
        FROM ask_ai_transcript_turns AS chats
        GROUP BY conversation_id ORDER BY updated DESC, id DESC LIMIT ? OFFSET ?
      `).bind(limit + 1, offset).all();
    const rows = result.results.slice(0, limit);
    const link = (n) => '?'+ (id ? 'id=' + id + '&amp;' : '') + 'page=' + n;
    const pagination = [
      page > 1 ? `<a href="${link(page - 1)}">Previous</a>` : '',
      result.results.length > limit ? `<a href="${link(page + 1)}">Next</a>` : '',
    ].join(' ');
    const list = id
      ? rows.map((turn) => `<article><small>${escape(turn.created_at)} · ${escape(turn.page)}</small>
          <h2>Visitor</h2><pre>${escape(turn.question)}</pre>
          ${turn.selection ? `<blockquote>${escape(turn.selection)}</blockquote>` : ''}
          <h2>Ask AI</h2><pre>${escape(answerText(turn) || 'No reply recorded.')}</pre></article>`).join('')
      : rows.map((chat) => `<article><a href="?id=${escape(chat.id)}">${escape(chat.first_question)}</a>
          <small>${escape(chat.updated)} · ${escape(chat.turns)} turns</small></article>`).join('');
    return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width">
      <title>Ask AI transcripts</title><style>
      body{font:16px/1.5 system-ui;margin:2rem auto;padding:0 1rem;max-width:48rem;color:#172b37}
      article{padding:1rem 0;border-bottom:1px solid #d6e0e6}small{display:block;color:#40596a}
      h2{font-size:1rem;margin:1rem 0 .15rem}pre{margin:0;font:inherit;white-space:pre-wrap;overflow-wrap:anywhere}
      blockquote{margin:.5rem 0;padding-left:.75rem;border-left:2px solid #8098a7}nav a{margin-right:1rem}
      </style><main><h1>Ask AI transcripts</h1>${id ? '<p><a href="?">All chats</a></p>' : ''}
      ${list || '<p>No chats on this page.</p>'}<nav aria-label="Pages">${pagination}</nav></main></html>`, {
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex',
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'" },
    });
  } catch {
    console.error(JSON.stringify({ event: 'ask_ai_archive_read_failed' }));
    return json({ error: 'Transcript archive is unavailable' }, 503);
  }
}
