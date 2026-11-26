// Source quality (26 Nov 2026): forum threads, rival consulting firms and content farms were cut from pages by hand.
// These tests keep them out for good: the page check fails any page that lists one.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { sourceProblems } from '../src/lib/source-rules.mjs';

const dir = new URL('../src/content/ai-work/', import.meta.url).pathname;

test('the source rule catches forums, rival firms and content farms, and passes neutral sources', () => {
  assert.equal(sourceProblems([{ url: 'https://www.reddit.com/r/smallbusiness/comments/x/' }]).length, 1);
  assert.equal(sourceProblems([{ url: 'https://community.make.com/t/approval/94850' }]).length, 1);
  assert.equal(sourceProblems([{ url: 'https://www.quora.com/What-is-RPA' }]).length, 1);
  assert.equal(sourceProblems([{ url: 'https://launchdayadvisors.com/guides/ai-strategy-consultant' }]).length, 1);
  assert.equal(sourceProblems([{ url: 'https://hub.slipperdigital.com/blog' }]).length, 1);
  for (const url of ['https://techcommunity.microsoft.com/blog/x', 'https://public-buyers-community.ec.europa.eu/x', 'https://www.nist.gov/x', 'https://www.sec.gov/x'])
    assert.equal(sourceProblems([{ url }]).length, 0, url);
});

test('no page lists a forum, rival-firm or content-farm source', () => {
  const bad = [];
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json')))
    for (const p of sourceProblems(JSON.parse(readFileSync(dir + f, 'utf8')).sources)) bad.push(`${f} · ${p}`);
  assert.equal(bad.length, 0, bad.join('\n'));
});

test('page text that leans on a forum post fails the banned-wording check', async () => {
  const { BANNED } = await import('../src/lib/page-types.mjs');
  const hit = (t) => BANNED.some((b) => b.re.test(t));
  assert.ok(hit('One IT leader on Reddit says nobody inside can touch it.'));
  assert.ok(hit('Advisors on r/CFP say compliance approved it.'));
  assert.ok(hit('In one FP&A forum thread, many said they use no AI.'));
  assert.ok(!hit('Navigant Construction Forum, 1,362 projects.'));
});
