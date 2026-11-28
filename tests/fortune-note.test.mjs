// Fortune's write-up of MIT NANDA (28 Nov 2026): one canonical note, and Fortune's "a third as often" misreading fails.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { CANONICAL_SOURCES, canonicalFor, canonicalProblems, thirdAsOftenProblems } from '../src/lib/canonical-sources.mjs';
import { claimProblems, paddingProblems } from '../src/lib/source-numbers.mjs';

const FORT = CANONICAL_SOURCES.find((c) => c.id === 'fortune-mit-nanda');
const MIT = CANONICAL_SOURCES.find((c) => c.id === 'mit-nanda-genai-divide');

test('the Fortune write-up is canonical by name or URL, and other Fortune stories are not', () => {
  assert.equal(canonicalFor({ name: 'Fortune on MIT NANDA, 18 Aug 2025', url: 'https://example.org' }), FORT);
  assert.equal(canonicalFor({ name: 'Press coverage', url: 'https://fortune.com/2025/08/18/mit-report-95-percent-generative-ai-pilots-at-companies-failing-cfo' }), FORT);
  assert.equal(canonicalFor({ name: 'Fortune, Klarna brings humans back', url: 'https://fortune.com/2025/05/09/klarna-ai-humans-return-on-investment/' }), undefined);
  assert.equal(canonicalFor({ name: MIT.name, url: MIT.url }), MIT);
});

test('the canonical Fortune note backs 67% only and leaves the ratio to MIT', () => {
  assert.ok(FORT.what.includes('67%'));
  assert.ok(!/\b(?:2x|33%|twice as)\b/i.test(FORT.what), 'Fortune must not back "twice" or 33%');
  assert.equal(thirdAsOftenProblems({ sources: [FORT] }).length, 0);
  assert.equal(canonicalProblems([{ name: FORT.name, url: FORT.url, what: 'Bought tools succeed 67%; internal builds about a third as often.' }]).length, 1);
});

test('"a third as often" fails in a note or in page text, but a log may quote it', () => {
  for (const t of ['internal builds about a third as often', 'internal builds succeed only one-third as often', 'one third as likely']) {
    assert.equal(thirdAsOftenProblems({ sources: [{ name: 'X', url: 'https://x.example', what: t }] }).length, 1, t);
    assert.equal(thirdAsOftenProblems({ buyVsBuild: { buy: `Bought tools win; ${t}.[^1]` } }).length, 1, t);
  }
  assert.equal(thirdAsOftenProblems({ sourceCheck: { fixed: ['old note said "a third as often"'] } }).length, 0);
  assert.equal(thirdAsOftenProblems({ summary: 'About a third of the time, internal builds ship.' }).length, 0);
  const d = { updated: '2026-11-28', summary: 'Bought tools succeed 67% of the time; internal builds about a third as often.[^1]', sources: [{ name: 'Y', url: 'https://y.example', what: 'Bought tools succeed 67% of the time. Read 28 Nov 2026.' }] };
  assert.ok(claimProblems(d).some((p) => /third as often/.test(p)));
});

test('Fortune on "twice" is padding; 67% on Fortune and "twice" on MIT is not', () => {
  const sources = [{ name: MIT.name, url: MIT.url, what: MIT.what }, { name: FORT.name, url: FORT.url, what: FORT.what }];
  assert.equal(paddingProblems({ summary: 'Bought tools reach deployment twice as often as internal builds.[^1][^2]', sources }).length, 1);
  assert.equal(paddingProblems({ summary: 'Bought tools reach deployment about 67% of the time[^2], twice the internal-build rate.[^1]', sources }).length, 0);
});

test('no page repeats the misreading, and every Fortune MIT copy carries the canonical note', () => {
  const dir = new URL('../src/content/ai-work/', import.meta.url);
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
    const d = JSON.parse(readFileSync(new URL(f, dir), 'utf8'));
    assert.deepEqual(thirdAsOftenProblems(d), [], f);
    for (const s of d.sources || []) if (canonicalFor(s) === FORT) assert.ok(s.url === FORT.url && s.what.startsWith(FORT.what), f);
  }
});
