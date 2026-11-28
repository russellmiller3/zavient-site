import { json } from './common.mjs';

const PERIODS = {
  daily: { start: "date('now')", step: '-1 day', end: '+1 day', count: 31 },
  weekly: { start: "date('now', 'weekday 0', '-6 days')", step: '-7 days', end: '+7 days', count: 12 },
  monthly: { start: "date('now', 'start of month')", step: '-1 month', end: '+1 month', count: 12 },
};

export async function usage({ request, env = {} }) {
  const token = env.ASK_AI_ADMIN_TOKEN;
  if (!token || !env.ASK_AI_DB) return json({ error: 'Usage reporting is unavailable' }, 503);
  const supplied = request.headers.get('authorization');
  if (supplied !== `Bearer ${token}`) return json({ error: 'Unauthorized' }, 401);

  const selected = new URL(request.url).searchParams.get('period');
  if (selected && !Object.hasOwn(PERIODS, selected)) return json({ error: 'Use daily, weekly or monthly' }, 400);
  const entries = selected ? [[selected, PERIODS[selected]]] : Object.entries(PERIODS);
  try {
    const periods = await Promise.all(entries.map(async ([name, { start, step, end, count }]) => {
      const { results } = await env.ASK_AI_DB.prepare(`
        WITH RECURSIVE periods(start_date, depth) AS (
          SELECT ${start}, 1
          UNION ALL
          SELECT date(start_date, ?1), depth + 1 FROM periods WHERE depth < ?2
        )
        SELECT start_date AS start, count(turns.id) AS answers,
          count(DISTINCT turns.conversation_id) AS conversations
        FROM periods
        LEFT JOIN ask_ai_turns AS turns
          ON turns.created_at >= start_date AND turns.created_at < date(start_date, ?3)
        GROUP BY start_date ORDER BY start_date DESC
      `).bind(step, count, end).all();
      return [name, results];
    }));
    return json({ timezone: 'UTC', ...Object.fromEntries(periods) });
  } catch {
    console.error(JSON.stringify({ event: 'ask_ai_usage_read_failed' }));
    return json({ error: 'Usage reporting is unavailable' }, 503);
  }
}
