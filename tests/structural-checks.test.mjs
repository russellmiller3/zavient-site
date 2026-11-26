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

// Round 3 (26 Nov 2026): the PE / family-office / holdco batch's 16 hand fixes, made structural.
import { answerProblems } from '../src/lib/answer-first.mjs';
import { acronymProblems } from '../src/lib/acronyms.mjs';
import { structureProblems } from '../src/lib/structure-rules.mjs';
import { searchResultProblems } from '../src/lib/source-rules.mjs';
import { splitSentences } from '../src/lib/sentences.mjs';
import { researchProblems } from '../scripts/check-research.mjs';
import { REVIEWERS } from '../src/lib/page-types.mjs';
import { sentences as readabilitySentences } from '../scripts/check-readability.mjs';

const base = pages.find(([s]) => s === 'ai-invoice-processing')[1];
const slugSet = new Set(pages.map(([s]) => s));

test('a bare yes or no first sentence fails; the answer must carry its reason', () => {
  assert.ok(answerProblems('Is RPA dead?', 'No. Gartner still says to use it for routine work.[^1]').some((p) => /bare/.test(p)));
  assert.ok(answerProblems('Should we block AI tools or approve some?', 'Approve some. Bans doubled misuse.[^1]').some((p) => /bare/.test(p)));
  assert.equal(answerProblems('Is RPA dead?', 'No: Gartner still says to use automation for routine workflows.[^1]').filter((p) => /bare/.test(p)).length, 0);
});

test('one sentence splitter for every check: initials, abbreviations and quotes do not end a sentence', () => {
  assert.deepEqual(splitSentences('No. Gartner says so.'), ['No.', 'Gartner says so.']);
  assert.deepEqual(splitSentences('J.D. Power found 40% liked it. The U.S. Census agrees.'), ['J.D. Power found 40% liked it.', 'The U.S. Census agrees.']);
  assert.deepEqual(splitSentences('St. Louis Fed data (No. 7) agree. One wrote, "We are 90%. Maybe 40%." Clean it.'), ['St. Louis Fed data (No. 7) agree.', 'One wrote, "We are 90%. Maybe 40%."', 'Clean it.']);
  assert.deepEqual(splitSentences('Use drawing revision C. Back come three quotes.'), ['Use drawing revision C.', 'Back come three quotes.']);
  assert.deepEqual(readabilitySentences('J.D. Power found it. Next one.'), ['J.D. Power found it.', 'Next one.']);
});

test('a jargon acronym that is never spelled out fails', () => {
  // The build thread's hand fix: "EPM suite" with no spelled-out form on multi-entity-close
  const bare = { ...base, summary: 'Pick an EPM suite when you consolidate many entities.[^1]' };
  assert.ok(acronymProblems(bare).some((p) => p.includes('"EPM"')));
  assert.equal(acronymProblems({ ...base, summary: 'Pick an enterprise performance management (EPM) suite.[^1]' }).filter((p) => p.includes('"EPM"')).length, 0);
  assert.equal(acronymProblems({ ...base, summary: 'Pick an EPM (enterprise performance management) suite.[^1]' }).filter((p) => p.includes('"EPM"')).length, 0);
  // A name that only contains the letters is not the acronym
  assert.equal(acronymProblems({ ...base, summary: 'UI-CUBE tests agents.[^1]' }).filter((p) => p.includes('"UI"')).length, 0);
});

test('search-results pages fail as sources; a government price list does not', () => {
  assert.equal(searchResultProblems([{ url: 'https://www.google.com/search?q=ai+consulting' }]).length, 1);
  assert.equal(searchResultProblems([{ url: 'https://duckduckgo.com/?q=ai' }]).length, 1);
  assert.equal(searchResultProblems([{ url: 'https://www.bls.gov/search.htm?query=wages' }]).length, 1);
  assert.equal(searchResultProblems([{ url: 'https://buy.gsa.gov/pricing/qr/mas?q=Artificial%20Intelligence' }]).length, 0);
});

test('page structure: description, footnotes, real slugs, repeated heading words and stray answer slots fail', () => {
  const p = (d) => structureProblems({ ...base, ...d }, slugSet);
  assert.ok(p({ description: 'x'.repeat(161) }).some((x) => /description is 161/.test(x)));
  assert.ok(p({ title: 'Can AI pay invoices?[^1]' }).some((x) => /footnote marker in the title/.test(x)));
  assert.ok(p({ stats: [{ num: '5%', label: 'error rate', source: 'APQC, 2025' }] }).some((x) => /key number 5% has no footnote/.test(x)));
  assert.ok(p({ related: ['ai-consulting', 'ai-procurement'] }).some((x) => /"ai-consulting" is not a page/.test(x)));
  assert.ok(p({ related: ['ai-procurement'] }).some((x) => /related has 1 links/.test(x)));
  assert.ok(p({ type: 'industry', topic: 'AI in insurance', related: ['ai-procurement', 'ai-collections'], spokes: [{ slug: 'ai-underwriting', why: 'x[^1]' }, { slug: 'ai-underwriting', why: 'y[^1]' }] }).some((x) => /listed twice/.test(x)));
  assert.ok(p({ type: 'industry', topic: 'AI in insurance', related: ['ai-procurement', 'ai-collections'] }).some((x) => /repeats "ai"/.test(x)));
  assert.ok(p({ answers: { ...base.answers, 'what-it-is': 'AI reads invoices and codes them for review.[^1]' } }).some((x) => /what-it-is renders above the summary/.test(x)));
  assert.ok(p({ answers: { ...base.answers, sources: 'Sources we read on the day.[^1]' } }).some((x) => /answers.sources/.test(x)));
});

test('a research file fails on any finding without a URL or read date', () => {
  assert.equal(researchProblems('## Slot\n- Finding | Source: BLS | URL: https://www.bls.gov/x | Read: 2026-11-26\n').length, 0);
  assert.ok(researchProblems('## Slot\n- Finding | Source: BLS | Read: 2026-11-26\n').some((x) => /no URL/.test(x)));
  assert.ok(researchProblems('## Slot\n- Finding | URL: https://www.bls.gov/x\n').some((x) => /no read date/.test(x)));
  assert.ok(researchProblems('## Empty slot\n\n## Next\n- no source found: searched BLS, Census\n').some((x) => /Empty slot/.test(x)));
});

test('the persona doc lists the same five reviewers, in order, that the page check enforces', () => {
  const doc = readFileSync(join(root, 'docs/steve-persona.md'), 'utf8');
  const listed = [...doc.matchAll(/^\d+\. ([^:]+):/gm)].map((m) => m[1]).slice(0, REVIEWERS.length + 1);
  assert.deepEqual(listed.slice(0, REVIEWERS.length), REVIEWERS);
});

test('no live page has an acronym, structure, bare-answer or search-result problem', () => {
  const bad = [];
  for (const [s, d] of pages) {
    for (const p of [...acronymProblems(d), ...structureProblems(d, slugSet), ...searchResultProblems(d.sources)]) bad.push(`${s}: ${p}`);
  }
  assert.deepEqual(bad, []);
});

test('the skeleton maker writes no answer slot the page check would fail, at one-space indent', () => {
  const src = readFileSync(join(root, 'scripts/new-page.mjs'), 'utf8');
  assert.match(src, /JSON\.stringify\(page, null, 1\)/);
  assert.match(src, /id !== 'what-it-is' && isQuestion\(id\)/);
  assert.match(src, /check-research\.mjs/);
  assert.doesNotMatch(readFileSync(join(root, 'src/lib/page-types.mjs'), 'utf8'), /\b2% cut jobs\b/);
});

// Round 4 (26 Nov 2026): the build thread's 10 fixes from the PE and lending batches, made structural.
import { figure, numberProblems, twoFigureProblems, surveyScopeProblems, priceProblems, claimProblems } from '../src/lib/source-numbers.mjs';
import { sourceProblems } from '../src/lib/source-rules.mjs';

test('a footnoted figure must be in its source note, unless the sentence says it is our math', () => {
  assert.equal(figure('$205,000'), figure('$205k'));
  assert.equal(figure('56 percent'), figure('56%'));
  assert.equal(figure('3-fold'), figure('3x'));
  const src = [{ name: 'KPMG survey', what: 'Survey of 300 finance leaders: 51% use AI. Read 26 Nov 2026.' }];
  assert.equal(numberProblems({ sources: src, summary: 'About 56% of finance leaders use AI.[^1]' }).length, 1);
  assert.equal(numberProblems({ sources: src, summary: 'About 51% of finance leaders use AI.[^1]' }).length, 0);
  assert.equal(numberProblems({ sources: src, summary: 'By our math that is $40,000 a year.[^1]' }).length, 0);
  assert.equal(numberProblems({ sources: src, summary: 'About 51% use it.[^1] By our math that is $40,000 a year.[^1]' }).length, 0);
});

test('one study giving two figures for one claim fails; parallel table rows do not', () => {
  const sources = [{ name: 'Big I', what: 'Survey of 1,000 independent agencies: 54%; release says 46%.' }];
  assert.equal(twoFigureProblems({ sources, summary: 'AI quoting tools are used by 54% of independent insurance agencies.[^1]', faq: [{ q: 'x?', a: 'About 46% of independent insurance agencies use AI quoting tools.[^1]' }] }).length, 1);
  assert.equal(twoFigureProblems({ sources, tables: [{ rows: [{ cells: ['Small agencies use AI tools: 17%[^1]'] }, { cells: ['Large agencies use AI tools: 33%[^1]'] }] }] }).length, 0);
});

test("a survey figure names its group in the note's words, and a survey note says who answered", () => {
  const sources = [{ name: 'FTI', what: 'Survey of 200 PE leaders at funds of $1B+: 36% of portfolio companies use AI.' }];
  assert.equal(surveyScopeProblems({ sources, summary: '36% of portfolio companies use AI day to day.[^1]' }).length, 1);
  assert.equal(surveyScopeProblems({ sources, summary: 'PE leaders say 36% of portfolio companies use AI day to day.[^1]' }).length, 0);
  assert.ok(surveyScopeProblems({ sources: [{ name: 'X', what: 'An annual survey: 40% of firms use AI.' }], summary: 'x' }).some((p) => /who answered/.test(p)));
});

test('a price needs a source read within 120 days of the update', () => {
  const page = (what) => ({ updated: '2026-11-26', sources: [{ name: 'DealRoom pricing', what }], summary: 'DealRoom starts at $1,250 a month.[^1]' });
  assert.equal(priceProblems(page('Plans: $1,250 a month.')).length, 1);
  assert.equal(priceProblems(page('Plans: $1,250 a month. Read 1 Feb 2026.')).length, 1);
  assert.equal(priceProblems(page('Plans: $1,250 a month. Read 26 Nov 2026.')).length, 0);
  assert.equal(priceProblems(page('Plans: $1,250 a month. Read: 2026-11-20')).length, 0);
});

test('cached or archived copies and stat aggregators are not sources', () => {
  for (const url of ['https://web.archive.org/web/2024/https://dealroom.net/pricing', 'https://archive.ph/abc', 'https://webcache.googleusercontent.com/search?q=cache:x', 'https://www.brokerageaudit.com/stats'])
    assert.equal(sourceProblems([{ url }]).length, 1, url);
});

test('superseded bank guidance, outsourced credit firms and new acronyms are caught', () => {
  const stale = (t) => staleProblems({ summary: t });
  assert.equal(stale('FIL-27-2021 sets the standard for BSA models.').length, 1);
  assert.equal(stale("The OCC's Loan Portfolio Management booklet says to review loans yearly.").length, 1);
  assert.equal(stale('The Loan Portfolio Management booklet was rescinded in 2026.').length, 0);
  assert.equal(stale('FIL-29-2023 governs vendor models.').length, 1);
  assert.equal(stale('FIL-29-2023 governs vendor models; a replacement was proposed in Sep 2026.').length, 0);
  assert.equal(stale('SR 14-4 covers banks of $10B to $50B.').length, 1);
  assert.ok(rivalProblems({ summary: 'Hire Evalueserve to write credit memos.', pickElse: ['Evalueserve: outsourced analysts.[^1]'] }).length >= 1);
  assert.ok(rivalProblems({ summary: 'Loan review firms charge $5,000 to $15,000 a review.' }).length >= 1);
  assert.ok(acronymProblems({ summary: 'The NAIC bulletin applies.' }).some((p) => /NAIC/.test(p)));
  assert.equal(acronymProblems({ summary: 'The National Association of Insurance Commissioners (NAIC) bulletin applies.' }).length, 0);
});

test('a research finding may carry its URL and read date on the lines under it', () => {
  assert.equal(researchProblems('## Slot\n- KPMG: 51% of 300 finance leaders\n  Source: KPMG | URL: https://kpmg.com/x\n  Read: 2026-11-26\n').length, 0);
  assert.ok(researchProblems('## Slot\n- KPMG: 51%\n  URL: https://kpmg.com/x\n- next\n  Read: 2026-11-26\n').length === 2);
});

test('the claim baseline only shrinks: never above a page\'s current count, and only real pages', async () => {
  const { default: baseline } = await import('../src/lib/claim-baseline.mjs');
  const bad = [];
  for (const [slug, n] of Object.entries(baseline)) {
    const page = pages.find(([s]) => s === slug);
    if (!page) { bad.push(`${slug}: no such page; run node scripts/claim-baseline.mjs --write`); continue; }
    const now = claimProblems(page[1]).length;
    if (now < n) bad.push(`${slug}: ${now} claims now, baseline ${n}; lower it with node scripts/claim-baseline.mjs --write`);
    if (now > n) bad.push(`${slug}: ${now} claims, more than its baseline of ${n}: fix the new ones`);
    if (page[1].sourceCheck) bad.push(`${slug}: has a logged source-claim check, so it must be at 0, not in the baseline`);
  }
  for (const [s, d] of pages) if (!(s in baseline) && claimProblems(d).length) bad.push(`${s}: ${claimProblems(d).length} claims and no baseline: new pages start clean`);
  assert.deepEqual(bad, []);
});

test('the brief sends research to the fetch tool where the proxy blocks curl, and runs the live figure check', () => {
  const src = readFileSync(join(root, 'scripts/new-page.mjs'), 'utf8');
  assert.match(src, /sec\.gov/);
  assert.match(src, /check-source-figures\.mjs/);
  assert.match(src, /indented lines under the finding/);
});

test('naming the FIL-58-2026 proposal is enough for the 2023 third-party guidance', () => {
  assert.equal(staleProblems({ summary: 'FIL-29-2023 governs vendor models until FIL-58-2026 is final.' }).length, 0);
});
