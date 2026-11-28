const ID = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

export function uuid(value) {
  return typeof value === 'string' && ID.test(value) ? value.toLowerCase() : null;
}

export function text(value, limit) {
  return typeof value === 'string' ? value.trim().slice(0, limit) : '';
}

export function json(data, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function emailConfigured(env) {
  return Boolean(env.ASK_AI_DB && env.ASK_AI_EMAIL_FROM &&
    (env.ASK_AI_EMAIL?.send || env.ASK_AI_RESEND_API_KEY));
}
