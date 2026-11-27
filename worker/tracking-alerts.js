// Recipient details stay in private KV, not in the public site or repository.
export async function notifyTrackingEvent(env, event) {
  if (!env.TRACKING_EMAIL || !env.TRACKING_ALERTS) return;
  if (!['open', 'click'].includes(event.event)) return;
  const recipients = await env.TRACKING_ALERTS.get('campaign:2026-12-01', 'json');
  if (!recipients || !Object.hasOwn(recipients, event.track_id)) return;
  const person = recipients[event.track_id];
  const receiptKey = `notified:${event.track_id}:${event.event}`;
  if (await env.TRACKING_ALERTS.get(receiptKey)) return;
  const action = event.event === 'open' ? 'Open recorded' : 'Click recorded';
  const when = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles', dateStyle: 'medium', timeStyle: 'long',
  }).format(new Date());
  const text = [
    `${action}: ${person.name} — ${person.firm}`,
    `Email subject: ${person.subject}`,
    `Time: ${when}`,
    ...(event.target ? [`Destination: ${event.target}`] : []),
    '',
    event.event === 'open'
      ? 'The tracking image loaded. This is not proof the person read the email; privacy services and security scanners can load it automatically.'
      : 'The tracked link was requested. Security scanners can also request links automatically.',
    '',
    'You receive one alert for the first recorded open and one for the first recorded click per campaign email.',
  ].join('\n');
  const result = await env.TRACKING_EMAIL.send({
    from: { name: 'Zavient Alerts', email: 'tracking@alerts.zavient.com' },
    to: 'rmiller@zavient.com',
    subject: `[Zavient] ${action}: ${person.name}`,
    text,
  });
  // Record only after delivery submission succeeds; a failed send can retry on the next event.
  await env.TRACKING_ALERTS.put(receiptKey, JSON.stringify({
    messageId: result.messageId, notifiedAt: new Date().toISOString(),
  }));
  console.log(JSON.stringify({ type: 'zavient_tracking_alert_sent', track_id: event.track_id, event: event.event, messageId: result.messageId }));
}
