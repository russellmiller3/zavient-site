import { emailConfigured, json, text, uuid } from './common.mjs';

const EMAIL = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;

async function deliver(env, email, transcript, conversationId) {
  const message = {
    from: env.ASK_AI_EMAIL_FROM,
    to: env.ASK_AI_EMAIL_TO,
    subject: 'New Ask AI lead and transcript',
    text: `Email: ${email}\nConversation: ${conversationId}\n\n${transcript}`,
  };
  if (env.ASK_AI_EMAIL?.send) {
    return env.ASK_AI_EMAIL.send({ ...message, replyTo: email });
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.ASK_AI_RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `ask-ai/${conversationId}`,
    },
    body: JSON.stringify({ ...message, reply_to: email }),
  });
  if (!response.ok) throw new Error('Email provider did not accept the transcript');
}

export async function lead({ request, env = {} }) {
  if (!emailConfigured(env)) return json({ error: 'Transcript email is unavailable' }, 503);
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return json({ error: 'Invalid origin' }, 403);
  if (env.ASK_AI_LEAD_LIMIT && request.headers.has('CF-Connecting-IP')) {
    const { success } = await env.ASK_AI_LEAD_LIMIT.limit({ key: request.headers.get('CF-Connecting-IP') });
    if (!success) return json({ error: 'Too many contact requests. Please try again later.' }, 429);
  }

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON body' }, 400); }
  const conversationId = uuid(body?.conversationId);
  const email = text(body?.email, 255);
  const turns = Array.isArray(body?.turns) ? body.turns.slice(-40) : [];
  const transcript = turns
    .filter((turn) => (turn?.role === 'user' || turn?.role === 'bot') && text(turn.text, 2000))
    .map((turn) => `${turn.role === 'user' ? 'Visitor' : 'Ask AI'}: ${text(turn.text, 2000)}`)
    .join('\n\n')
    .slice(0, 30000);

  if (!conversationId || email.length > 254 || !EMAIL.test(email) || !transcript || body?.consent !== true) {
    return json({ error: 'A valid email, consent and transcript are required' }, 400);
  }

  const db = env.ASK_AI_DB;
  try {
    const known = await db.prepare('SELECT 1 FROM ask_ai_turns WHERE conversation_id = ? LIMIT 1').bind(conversationId).first();
    if (!known) return json({ error: 'Ask a question before requesting follow-up' }, 400);
    const claim = await db.prepare(
      "INSERT OR IGNORE INTO ask_ai_leads (conversation_id, state, created_at) VALUES (?, 'sending', ?) RETURNING state"
    ).bind(conversationId, new Date().toISOString()).first();
    if (!claim) {
      const receipt = await db.prepare('SELECT state FROM ask_ai_leads WHERE conversation_id = ?').bind(conversationId).first();
      return receipt?.state === 'sent'
        ? json({ sent: true })
        : json({ error: 'A request is already processing. Please try again shortly.' }, 409);
    }

    try {
      await deliver(env, email, transcript, conversationId);
    } catch {
      await db.prepare("DELETE FROM ask_ai_leads WHERE conversation_id = ? AND state = 'sending'").bind(conversationId).run();
      console.error(JSON.stringify({ event: 'ask_ai_transcript_send_failed' }));
      return json({ error: 'The transcript could not be sent. Please try again.' }, 502);
    }
    await db.prepare("UPDATE ask_ai_leads SET state = 'sent' WHERE conversation_id = ?").bind(conversationId).run();
    return json({ sent: true });
  } catch {
    console.error(JSON.stringify({ event: 'ask_ai_transcript_storage_failed', conversationId }));
    return json({ error: 'The transcript request could not be confirmed' }, 503);
  }
}
