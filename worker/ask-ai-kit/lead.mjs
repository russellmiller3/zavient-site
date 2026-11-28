import { emailConfigured, json, text, uuid } from './common.mjs';
import { answerText } from './transcripts.mjs';

const EMAIL = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;

async function deliver(env, email, transcript, conversationId) {
  const message = {
    from: env.ASK_AI_EMAIL_FROM,
    to: email,
    subject: 'Your Ask AI transcript',
    text: transcript,
  };
  if (env.ASK_AI_EMAIL?.send) {
    return env.ASK_AI_EMAIL.send(message);
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.ASK_AI_RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `ask-ai-copy/${conversationId}`,
    },
    body: JSON.stringify(message),
  });
  if (!response.ok) throw new Error('Email provider did not accept the transcript');
}

export async function lead({ request, env = {} }) {
  if (!emailConfigured(env)) return json({ error: 'Transcript email is unavailable' }, 503);
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return json({ error: 'Invalid origin' }, 403);
  if (env.ASK_AI_LEAD_LIMIT && request.headers.has('CF-Connecting-IP')) {
    const { success } = await env.ASK_AI_LEAD_LIMIT.limit({ key: request.headers.get('CF-Connecting-IP') });
    if (!success) return json({ error: 'Too many transcript requests. Please try again later.' }, 429);
  }

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON body' }, 400); }
  if (body?.purpose !== 'email-my-transcript') return json({ error: 'Confirm you are requesting your own copy' }, 400);
  const conversationId = uuid(body?.conversationId);
  const email = text(body?.email, 255);
  if (!conversationId || email.length > 254 || !EMAIL.test(email)) {
    return json({ error: 'Enter a valid email address' }, 400);
  }

  const db = env.ASK_AI_DB;
  try {
    const { results } = await db.prepare(
      'SELECT question, selection, reply FROM ask_ai_transcript_turns WHERE conversation_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 40'
    ).bind(conversationId).all();
    if (!results.some((turn) => turn.reply)) return json({ error: 'Ask a question before emailing the transcript' }, 400);

    const transcript = results.map((turn) => [
      'You: ' + turn.question,
      turn.selection && 'Selected text: ' + turn.selection,
      turn.reply && 'Ask AI: ' + answerText(turn),
    ].filter(Boolean).join('\n\n')).reverse().join('\n\n').slice(-30000);
    const claim = await db.prepare(
      "INSERT OR IGNORE INTO ask_ai_transcript_emails (conversation_id, state, created_at) VALUES (?, 'sending', ?) RETURNING state"
    ).bind(conversationId, new Date().toISOString()).first();
    if (!claim) {
      const receipt = await db.prepare('SELECT state FROM ask_ai_transcript_emails WHERE conversation_id = ?').bind(conversationId).first();
      return receipt?.state === 'sent'
        ? json({ sent: true })
        : json({ error: 'A request is already processing. Please try again shortly.' }, 409);
    }

    try {
      await deliver(env, email, transcript, conversationId);
    } catch {
      await db.prepare("DELETE FROM ask_ai_transcript_emails WHERE conversation_id = ? AND state = 'sending'").bind(conversationId).run();
      console.error(JSON.stringify({ event: 'ask_ai_transcript_send_failed' }));
      return json({ error: 'The transcript could not be sent. Please try again.' }, 502);
    }
    await db.prepare("UPDATE ask_ai_transcript_emails SET state = 'sent' WHERE conversation_id = ?").bind(conversationId).run();
    return json({ sent: true });
  } catch {
    console.error(JSON.stringify({ event: 'ask_ai_transcript_storage_failed', conversationId }));
    return json({ error: 'The transcript request could not be confirmed' }, 503);
  }
}
