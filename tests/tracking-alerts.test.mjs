import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';
import { notifyTrackingEvent } from '../worker/tracking-alerts.js';

function fixture(fail = false) {
  const values = new Map([['campaign:2026-12-01', { campaign1: { name: 'Dana', firm: 'Example', subject: 'One workflow' } }]]);
  const messages = [];
  const env = {
    TRACKING_ALERTS: { get: async (k) => values.get(k), put: async (k, v) => values.set(k, v) },
    TRACKING_EMAIL: { send: async (m) => { if (fail) throw new Error('Email unavailable'); messages.push(m); return { messageId: 'msg1' }; } },
  };
  return { env, values, messages };
}

test('alerts identify the person, use the fixed inbox, and suppress repeat opens independently of clicks', async () => {
  const { env, messages } = fixture();
  await notifyTrackingEvent(env, { event: 'open', track_id: 'campaign1' });
  await notifyTrackingEvent(env, { event: 'open', track_id: 'campaign1' });
  await notifyTrackingEvent(env, { event: 'click', track_id: 'campaign1', target: 'https://zavient.com/' });
  assert.equal(messages.length, 2);
  assert.equal(messages[0].to, 'rmiller@zavient.com');
  assert.match(messages[0].subject, /Open recorded: Dana/);
  assert.match(messages[0].text, /not proof/);
  assert.match(messages[1].text, /Destination: https:\/\/zavient.com\//);
});

test('unknown IDs and preflight requests never trigger emails', async () => {
  const { env, messages } = fixture();
  for (const track_id of ['preflight', 'unknown', '__proto__', 'constructor']) {
    await notifyTrackingEvent(env, { event: 'open', track_id });
  }
  assert.equal(messages.length, 0);
});

test('email failure leaves no deduplication receipt and does not break the pixel', async () => {
  const { env, values } = fixture(true);
  const pending = [];
  const response = await worker.fetch(new Request('https://zavient.com/api/t/o/campaign1.gif'), env, { waitUntil: (p) => pending.push(p) });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Content-Type'), 'image/gif');
  await Promise.all(pending);
  assert.equal(values.has('notified:campaign1:open'), false);
});

test('HEAD and invalid click destinations do not trigger notifications', async () => {
  const { env, messages } = fixture();
  const pending = [];
  const ctx = { waitUntil: (p) => pending.push(p) };
  await worker.fetch(new Request('https://zavient.com/api/t/o/campaign1.gif', { method: 'HEAD' }), env, ctx);
  const response = await worker.fetch(new Request('https://zavient.com/api/t/c/campaign1?u=https://evil.example'), env, ctx);
  await Promise.all(pending);
  assert.equal(response.status, 400);
  assert.equal(messages.length, 0);
});
