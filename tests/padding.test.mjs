// Padded footnotes (28 Nov 2026): a footnote on a figure whose source doesn't state that figure, added to reach
// "several sources". 150 were cleaned off 58 pages (moved to the clause they state, dropped, or given their own
// clause); the check is now a failure on every page, and these tests pin the patterns it learned on the way.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { gate } from '../scripts/check-page.mjs';
import { everyPageProblems } from '../src/lib/every-page.mjs';
import { figures, figureGroups, paddingProblems } from '../src/lib/source-numbers.mjs';

const root = new URL('..', import.meta.url).pathname;
const dir = join(root, 'src/content/ai-work');
const two = (what1, what2, text) => ({ sources: [{ name: 'A', url: 'https://a.com/', what: what1 }, { name: 'B', url: 'https://b.com/', what: what2 }], humanRole: [text] });

test('padding is a failure, not a warning: in the every-page checks and the publish gate', () => {
  const d = two('Survey of 44 investors: 70% have teams.', 'A guide; 12% of funds fail audits.', 'Most investors, 70% of 44 surveyed, have a team.[^1][^2]');
  assert.ok(everyPageProblems(d).some((p) => /^footnote: .*\[\^2\] doesn't state 70%/.test(p)));
  const page = JSON.parse(readFileSync(join(dir, 'operational-due-diligence.json'), 'utf8'));
  const bad = { ...page, humanRole: [...page.humanRole, 'Most investors, 59% of 44 surveyed, use their own DDQ.[^1][^6]'] };
  const { fail, warn } = gate(bad, { slug: 'operational-due-diligence' });
  assert.ok(fail.some((p) => /footnote: .*\[\^6\] doesn't state 59%/.test(p)), 'fails');
  assert.ok(!warn.some((p) => /doesn't state/.test(p)), 'no longer only a warning');
});

test('moving the footnote to the clause it states clears it', () => {
  const pad = two('Survey of 44 investors: 70% have teams.', 'A guide that says teams need owners; 12% of funds fail audits.', 'Teams need owners, and 70% of 44 surveyed investors have one.[^1][^2]');
  assert.equal(paddingProblems(pad).length, 1);
  const moved = { ...pad, humanRole: ['Teams need owners[^2], and 70% of 44 surveyed investors have one.[^1]'] };
  assert.deepEqual(paddingProblems(moved), []);
});

test('a multiplication sign is a multiple, as an x is', () => {
  assert.deepEqual(figures('overage runs 1.25× to 2.5× the base rate').map((f) => f.key), ['x:1.25', 'x:2.5']);
  const d = { sources: [{ name: 'Zapier', url: 'https://z.com/', what: 'Overage 1.25× yearly, 2.5× monthly.' }, { name: 'Make', url: 'https://m.com/', what: 'Extra credits cost 25% more.' }],
    watchOuts: ['Zapier overage runs 1.25× to 2.5× the base rate, and Make\'s extra credits cost 25% more[^1][^2].'] };
  assert.deepEqual(paddingProblems(d), []);
});

test('a price range is backed by a source whose own price sits inside it', () => {
  const d = { sources: [{ name: 'Google', url: 'https://g.com/', what: 'Business Standard $14 per user a month.' }, { name: 'Microsoft', url: 'https://m.com/', what: 'Copilot Business $21 per user a month.' }, { name: 'OpenAI', url: 'https://o.com/', what: 'Standard seat $20 per user a month.' }],
    humanRole: ['Business AI seats list at $14 to $21 per person a month on three plans.[^1][^2][^3]'] };
  assert.deepEqual(paddingProblems(d), []);
  // a point figure still needs the source's own figure
  assert.ok(paddingProblems({ ...d, humanRole: ['Business AI seats list at $14 or $21 a month.[^1][^2][^3]'] }).some((p) => /\[\^3\] doesn't state/.test(p)));
  // above the range is not inside it
  assert.ok(paddingProblems({ ...d, humanRole: ['Seats list at $14 to $19 a month.[^1][^3]'] }).some((p) => /\[\^3\] doesn't state/.test(p)));
});

test('a share range or a change is not a range a stray figure can back', () => {
  // A false-positive rate of 10% falls inside "8-12%" but says nothing about savings.
  const share = two('Predictive saves 8-12% over preventive.', 'A model lost money at a 10% false-positive rate.', 'Predictive saves 8-12% over preventive.[^1][^2]');
  assert.ok(paddingProblems(share).some((p) => /\[\^2\] doesn't state/.test(p)));
  const rose = two('Positive views rose from 15% to 55%.', '54% would use AI tools without approval.', 'Positive views rose from 15% to 55%.[^1][^2]');
  assert.ok(paddingProblems(rose).some((p) => /\[\^2\] doesn't state/.test(p)));
  const price = two('The fee rose from $5 to $9.', 'A plan at $7 a month.', 'The fee rose from $5 to $9.[^1][^2]');
  assert.ok(paddingProblems(price).some((p) => /\[\^2\] doesn't state/.test(p)));
  assert.deepEqual(figureGroups('a build runs $10-50k[^1]')[0].figs.map((f) => f.range), [[10000, 50000], [10000, 50000]], 'a written money range is a range');
});

test('no page carries a padded footnote', () => {
  const bad = [];
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) for (const p of paddingProblems(JSON.parse(readFileSync(join(dir, f), 'utf8')))) bad.push(`${f}: ${p}`);
  assert.deepEqual(bad, []);
});

test('a page whose source check only covered the padding cleanup still asks for its full check', () => {
  const page = JSON.parse(readFileSync(join(dir, 'operational-due-diligence.json'), 'utf8'));
  const partial = { ...page, sourceCheck: { date: '2026-11-28', by: 'padding cleanup (flagged footnotes only, not a full source-claim check)', checked: 1, fixed: [] } };
  assert.ok(gate(partial, { slug: 'operational-due-diligence' }).warn.some((w) => /no source-claim check logged/.test(w)));
});
