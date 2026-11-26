// Each of today's hand fixes, made structural (Russell, 26 Nov 2026: "Make it so every fix is structual to templates
// so it doesnt reoccur"). Each test feeds the check the exact mistake that was fixed by hand, and checks no live page
// has it. Lead sentences: src/lib/lead-rules.mjs. Superseded rules: src/lib/stale-rules.mjs. Rival firms:
// src/lib/rival-firms.mjs. Own-site links and JSON format: scripts/check-page.mjs and below.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { leadProblems, pageLeadProblems, restatesHeading } from '../src/lib/lead-rules.mjs';
import { staleProblems } from '../src/lib/stale-rules.mjs';
import { rivalProblems } from '../src/lib/rival-firms.mjs';
import { gate } from '../scripts/check-page.mjs';

const root = new URL('../', import.meta.url).pathname;
const dir = join(root, 'src/content/ai-work');
const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
const pages = files.map((f) => [f.slice(0, -5), JSON.parse(readFileSync(join(dir, f), 'utf8'))]);
const lead = (text, extra = {}) => leadProblems({ heading: 'Which way to build AI fits your firm?', text, first: true, ...extra });

test('meta pointers and filler openings fail in any lead text', () => {
  // The live miss on generative-ai-consulting (launch, 26 Nov 2026)
  assert.ok(lead('The work takes one of three shapes; start with this one when a team drafts the same document weekly.').length);
  assert.ok(lead('The work takes three shapes: a policy, an examiner-ready build, or ISO 42001.').length);
  assert.ok(lead('There are several options, depending on size.').length);
  assert.ok(lead('Below is a table of the tools we checked.').length);
  assert.ok(lead('As noted above, data quality matters.').length);
  assert.ok(lead('See the table for prices.').length);
  assert.ok(lead('These six suites sell by quote.').length, 'a first paragraph that leans on its heading');
  // The offer may ask the reader to bring something: that is the offer.
  assert.equal(lead('Bring one document type and your monthly volume.', { offer: true }).length, 0);
  assert.equal(lead('Small teams start with one weekly writing task, and mid-size firms with document work.').length, 0);
});

test('an answer that joins two answers with a semicolon, or runs past 30 words, fails', () => {
  // The three table answers the build thread split by hand (underwriting, community banks, insurance)
  assert.ok(lead('Buy when your line is standard; build when your loss history is your edge.', { answer: true }).length);
  assert.ok(lead(Array(32).fill('word').join(' ') + '.', { answer: true }).length);
  assert.equal(lead('Buy when your line is standard. Build when your loss history is your edge; both need review.', { answer: true }).length, 0, 'only the first sentence is checked');
});

test('a first sentence that only restates its heading fails', () => {
  assert.ok(restatesHeading('What does AI change in insurance underwriting?', 'AI changes insurance underwriting in several ways.'));
  assert.ok(restatesHeading('How much does AI document processing cost?', 'The cost of AI document processing depends on several factors.'));
  assert.equal(restatesHeading('Should we block AI tools or approve some?', 'Approve some.'), false, 'a short real answer is not a restatement');
  assert.equal(restatesHeading('What does AI change in underwriting?', 'AI reads submissions and flags missing loss runs before an underwriter prices the risk.'), false);
});

test('superseded rules fail unless the same item names the replacement or says withdrawn', () => {
  assert.equal(staleProblems({ summary: 'Banks validate models under SR 11-7.' }).length, 1);
  assert.equal(staleProblems({ summary: 'SR 26-2 replaced SR 11-7 in April 2026.' }).length, 0);
  assert.equal(staleProblems({ sources: [{ name: 'CFPB Circular 2022-03', url: 'https://x.gov', what: 'Algorithms are no excuse.' }] }).length, 1);
  assert.equal(staleProblems({ sources: [{ name: 'CFPB Circular 2022-03', url: 'https://x.gov', what: 'Withdrawn 12 May 2025.' }] }).length, 0);
  assert.equal(staleProblems({ faq: [{ q: 'Does SR 11-7 still apply?', a: 'No. SR 26-2 replaced it.' }] }).length, 0, 'a FAQ is one item');
});

test('a rival consulting firm is never offered, priced or listed as a row; its survey stays allowed', () => {
  // The Accenture marketplace listing launch dropped from the insurance cost FAQ
  assert.ok(rivalProblems({ faq: [{ q: 'What does it cost?', a: 'Accenture lists an underwriting build at $250,000 per engagement.' }] }).length);
  assert.ok(rivalProblems({ pickElse: ['Hire Deloitte if you want a big-name review.'] }).length);
  assert.ok(rivalProblems({ tables: [{ rows: [{ name: 'Accenture', cells: ['Quote only'] }] }] }).length);
  assert.ok(rivalProblems({ summary: 'Specialist consultancies charge $15,000 to $40,000 a month on retainer.' }).length);
  assert.equal(rivalProblems({ faq: [{ q: 'Is it working?', a: "In Deloitte's survey, 11% had agents in production.[^4]" }] }).length, 0);
  assert.equal(rivalProblems({ tables: [{ rows: [{ name: 'McKinsey (2018)', cells: ['study'] }] }] }).length, 0);
  assert.equal(rivalProblems({ faq: [{ q: 'Cost?', a: "On the US government's published price list, median hourly ceilings run $183 to $194 for management consultants." }] }).length, 0);
});

test('page JSON never links our own site with an absolute address', () => {
  const page = pages.find(([s]) => s === 'insurance')[1];
  const bad = structuredClone(page);
  bad.sources[0].url = 'https://zavient.com/about.html';
  assert.ok(gate(bad, { slug: 'insurance', siblings: [] }).fail.some((f) => f.includes('absolute link to our own site')));
  for (const [slug, d] of pages) assert.ok(!/https?:\/\/(?:www\.)?zavient\.com/i.test(JSON.stringify(d)), `${slug}: absolute zavient.com link`);
});

test('every root-relative link in page JSON points at a page the build made', () => {
  const dist = join(root, 'dist');
  if (!existsSync(dist)) return;
  for (const [slug, d] of pages) {
    for (const m of JSON.stringify(d).matchAll(/"url":"(\/[^"#]*)/g)) assert.ok(existsSync(join(dist, m[1])), `${slug}: ${m[1]} is not a built page`);
  }
});

test('no live page has a lead, stale-rule or rival-firm problem', () => {
  for (const [slug, d] of pages) {
    assert.deepEqual(pageLeadProblems(d), [], `${slug}: lead`);
    assert.deepEqual(staleProblems(d), [], `${slug}: stale rule`);
    assert.deepEqual(rivalProblems(d), [], `${slug}: rival firm`);
  }
});

// A writer saved a page at a different indent and turned a one-line fix into a whole-file diff. Pages are 1- or
// 2-space JSON (both exist, so reformatting them all would clash with every patch in flight). Each page keeps its
// own indent: it must be exactly what JSON.stringify writes at that indent, end in one newline, and, where git can
// see the deployed branch, keep the indent it has there.
const indentOf = (s) => (s.match(/^\{\n( +)"/) || [])[1]?.length;
test('page JSON is machine-formatted, ends in a newline and keeps its indent', () => {
  let base = null;
  try { base = execFileSync('git', ['-C', root, 'rev-parse', '--verify', '--quiet', 'origin/master'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { /* no git or no remote: skip the history part */ }
  for (const f of files) {
    const s = readFileSync(join(dir, f), 'utf8');
    assert.ok(s.endsWith('}\n') && !s.endsWith('\n\n'), `${f}: must end in exactly one newline`);
    assert.ok(!s.includes('\t'), `${f}: tabs`);
    const n = indentOf(s);
    const d = JSON.parse(s);
    const hand = ['ai-policy-generator.json', 'ai-roadmap-builder.json', 'ai-roi-calculator.json'].includes(f);
    // Python writes 63.0 where Node writes 63; both are fine.
    if (!hand) assert.equal(s.replace(/(\d)\.0(?=,?\n)/g, '$1'), JSON.stringify(d, null, n) + '\n', `${f}: not machine-formatted at its ${n}-space indent; save with JSON.stringify(data, null, ${n}) + "\\n"`);
    if (base) {
      let old = null;
      try { old = execFileSync('git', ['-C', root, 'show', `${base}:src/content/ai-work/${f}`], { stdio: ['ignore', 'pipe', 'ignore'] }).toString(); } catch { /* new page */ }
      if (old) assert.equal(n, indentOf(old), `${f}: indent changed from ${indentOf(old)} to ${n} spaces, which rewrites the whole file; keep ${indentOf(old)}`);
    }
  }
});
