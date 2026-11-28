import { DEFAULT_SYSTEM_PROMPT } from './prompt.mjs';
import { emailConfigured, json, text, uuid } from './common.mjs';
import { parseReply, UI_INSTRUCTIONS } from './reply.mjs';

const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

export async function ask({ request, env = {}, waitUntil }) {
  if (!env.ASK_AI_DB && typeof env.AI?.run !== 'function') return json({ error: 'Workers AI binding (AI) is not configured' }, 503);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON body' }, 400); }
  const question = text(body?.question, 1000);
  if (!question) return json({ error: 'Question is required' }, 400);
  const context = text(body?.context, 7500);
  const selection = text(body?.selection, 1200);
  const page = text(body?.page, 200) || '/';
  const conversationId = uuid(body?.conversationId);
  const turnId = uuid(body?.turnId) || crypto.randomUUID();
  const history = Array.isArray(body?.history) ? body.history.slice(-6) : [];
  const systemPrompt = text(env.ASK_AI_SYSTEM_PROMPT, 8000) || DEFAULT_SYSTEM_PROMPT;
  const db = env.ASK_AI_DB;
  const archiveId = conversationId || turnId;
  const timestamp = new Date().toISOString();
  const emailAvailable = emailConfigured(env) && Boolean(conversationId);

  if (db) {
    try {
      await db.prepare(
        'INSERT OR IGNORE INTO ask_ai_transcript_turns (id, conversation_id, page, question, selection, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(turnId, archiveId, page, question, selection, timestamp).run();
      const record = await db.prepare(
        'SELECT reply FROM ask_ai_transcript_turns WHERE id = ? AND conversation_id = ? AND question = ? AND selection = ?'
      ).bind(turnId, archiveId, question, selection).first();
      if (!record) return json({ error: 'Turn ID already in use' }, 409);
      if (record.reply) return json({ ...JSON.parse(record.reply), model: MODEL, emailAvailable });
    } catch {
      console.error(JSON.stringify({ event: 'ask_ai_transcript_write_failed' }));
      return json({ error: 'Chat storage is unavailable' }, 503);
    }
  }

  if (typeof env.AI?.run !== 'function') return json({ error: 'Workers AI binding (AI) is not configured' }, 503);

  const messages = [{
    role: 'system',
    content: [systemPrompt, UI_INSTRUCTIONS, `Site scope: ${text(env.ASK_AI_SITE_SCOPE, 3000) || 'Topics clearly covered by the site excerpts or directory.'}`].join('\n\n'),
  }];
  for (const turn of history) {
    if ((turn?.role === 'user' || turn?.role === 'assistant') && typeof turn.content === 'string') {
      messages.push({ role: turn.role, content: turn.content.slice(0, 1500) });
    }
  }
  messages.push({ role: 'user', content: [
    context ? `Site excerpts:\n${context}` : '',
    selection ? `Visitor-highlighted passage:\n${selection}` : '',
    `Visitor question: ${question}`,
  ].filter(Boolean).join('\n\n') });

  let reply;
  try {
    const result = await env.AI.run(MODEL, {
      messages, max_tokens: 750, temperature: 0.2, response_format: { type: 'json_object' },
    });
    const response = result?.response ?? result?.result?.response;
    const raw = typeof response === 'string' ? response.trim() : response;
    if (!raw) return json({ error: 'Empty response from Workers AI' }, 502);
    reply = parseReply(raw);
  } catch {
    return json({ error: 'Workers AI request failed' }, 502);
  }

  if (db) {
    try {
      const saved = await db.prepare(
        'UPDATE ask_ai_transcript_turns SET reply = COALESCE(reply, ?) WHERE id = ? AND conversation_id = ? RETURNING reply'
      ).bind(JSON.stringify(reply), turnId, archiveId).first();
      reply = JSON.parse(saved.reply);
    } catch {
      console.error(JSON.stringify({ event: 'ask_ai_transcript_write_failed' }));
      return json({ error: 'Chat storage is unavailable' }, 503);
    }
    try {
      await db.prepare(
        'INSERT OR IGNORE INTO ask_ai_turns (id, conversation_id, created_at) VALUES (?, ?, ?)'
      ).bind(turnId, archiveId, new Date().toISOString()).run();
    } catch {
      console.error(JSON.stringify({ event: 'ask_ai_usage_write_failed' }));
    }
  }

  console.log(JSON.stringify({ event: 'ask_ai_query', model: MODEL, ts: timestamp }));
  if (env.QUERIES_SHEET_URL) {
    const task = fetch(env.QUERIES_SHEET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        form_name: 'ask_ai', id: turnId, created_at: timestamp,
        data: { name: 'Ask AI query', page, model: MODEL, question, answer: reply.answer.slice(0, 1200) },
      }),
    }).catch(() => {});
    if (typeof waitUntil === 'function') waitUntil(task);
    else await task;
  }

  return json({ ...reply, model: MODEL, emailAvailable });
}
