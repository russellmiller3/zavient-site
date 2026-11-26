// Round 5 structural checks (26 Nov 2026): the build thread's 15 gaps in the figure checks, each now a check.
// Russell: "Make it so every fix is structual to templates so it doesnt reoccur".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { figures, backs, numberProblems, surveyGroup, surveyScopeProblems, isPrice, mostProblems, citedSentences, stemWord } from '../src/lib/source-numbers.mjs';
import { mirrorProblems, duplicateProblems, dateProblems, urlDate } from '../src/lib/source-rules.mjs';
import { rivalProblems } from '../src/lib/rival-firms.mjs';
import { figureCheckProblems, FIGURE_CHECK_PENDING } from '../src/lib/figure-check.mjs';
import { edgarProblems, hitListProblems, EDGAR_PENDING } from '../src/lib/edgar-hits.mjs';

const root = new URL('../', import.meta.url).pathname;
const dir = join(root, 'src/content/ai-work');
const pages = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => [f.slice(0, -5), JSON.parse(readFileSync(join(dir, f), 'utf8'))]);
const page = (sentence, what, extra = {}) => ({ summary: sentence, sources: [{ name: 'Source', url: 'https://example.org/a', what }], ...extra });

test('1. a range checks both ends', () => {
  assert.deepEqual(figures('cuts 20-50% of time').map((f) => f.key), ['pct:20', 'pct:50']);
  assert.deepEqual(figures('between 10 and 15 percent').map((f) => f.key), ['pct:10', 'pct:15']);
  assert.deepEqual(figures('$10-50k a year').map((f) => f.key), ['$:10000', '$:50000']);
  assert.equal(numberProblems(page('Cuts 20-50% of time.[^1]', 'Study: 50% of time saved')).length, 1);
  assert.equal(numberProblems(page('Cuts 20-50% of time.[^1]', 'Study: 20% to 50% of time saved')).length, 0);
  assert.equal(figures('from 2024-2026').length, 0);
});

test('2. a hedge word sets the tolerance; a bare figure is the source figure rounded', () => {
  const [about] = figures('about 32%'); const [bare] = figures('32%'); const [bare33] = figures('33%');
  const [note] = figures('32.6%');
  assert.ok(backs(about, note));
  assert.ok(!backs(bare, note));
  assert.ok(backs(bare33, note));
  assert.ok(backs(figures('more than 30%')[0], figures('32.6%')[0]));
  assert.ok(!backs(figures('more than 30%')[0], figures('29%')[0]));
  assert.ok(backs(figures('nearly 60%')[0], figures('58%')[0]));
  assert.ok(!backs(figures('nearly 60%')[0], figures('61%')[0]));
});

test('3 and 5. survey groups: "700+", "more than N", "1.2 million", "U.S.", stems, and no "AI" as a group', () => {
  assert.deepEqual(surveyGroup('Survey of 700+ CFOs'), ['CFOs']);
  assert.deepEqual(surveyGroup('Survey of more than 2,000 US workers'), ['US', 'workers']);
  assert.deepEqual(surveyGroup('Poll of 1.2 million U.S. adults'), ['U.S.', 'adults']);
  assert.deepEqual(surveyGroup('Survey of 300 AI leaders'), ['leaders']);
  assert.deepEqual(surveyGroup('AGC 2026 outlook | 951 contractors in 49 states: 61% use AI'), ['contractors']);
  assert.equal(surveyGroup('Survey of 1,719 respondents'), null);
  assert.equal(stemWord('agencies'), stemWord('agency'));
  assert.equal(stemWord('advisory'), stemWord('advisors'));
  assert.equal(stemWord("respondent's"), stemWord('respondents'));
  assert.notEqual(stemWord('U.S.'), stemWord('us'));
  const d = page('Of agencies polled, 40% use AI.[^1]', 'Survey of 500 insurance agencies: 40% use AI');
  assert.equal(surveyScopeProblems(d).length, 0);
});

test('4. "sample size not published" is a survey marker; dropping the word survey is caught', () => {
  assert.equal(surveyScopeProblems(page('In a survey, 40% use AI.[^1]', 'Survey, sample size not published: 40% use AI')).length, 0);
  assert.equal(surveyScopeProblems(page('40% use AI.[^1]', 'Survey, sample size not published: 40% use AI')).length, 1);
  assert.equal(surveyScopeProblems(page('In a survey, 40% use AI.[^1]', 'Report: 40% use AI')).length, 1);
  assert.equal(surveyScopeProblems(page('CFOs lead.[^1]', '62% of CFOs say AI helps')).length, 1);
});

test('6. "up from $X", market sizes, fines and salaries are not prices', () => {
  assert.ok(isPrice('Plans start at $30 per user a month.'));
  assert.ok(!isPrice('Revenue reached $2M, up from $1.5M a year earlier.'));
  assert.ok(!isPrice('Lending grew to $500B, from about $350B a year before.'));
  assert.ok(!isPrice('Statutory fines run $10,000 a year per violation.'));
  assert.ok(!isPrice('Analysts earn $95,000 a year.'));
});

test('7. a table column headed "our math" clears its cells', () => {
  const d = { tables: [{ title: 'T', headers: ['Firm', 'Rate', 'Carried at % of cost, our math'], rows: [{ name: 'A', cells: ['2.4%[^1]', '58%[^1]'] }] }],
    sources: [{ name: 'S', url: 'https://example.org', what: 'Non-accrual 2.4%' }] };
  assert.equal(numberProblems(d).length, 0);
  assert.ok(citedSentences(d).find((c) => c.sentence.startsWith('58%')).own);
});

test('8. word figures are checked: twice, three times as, 2 to 1', () => {
  assert.deepEqual(figures('twice as often').map((f) => f.key), ['x:2']);
  assert.deepEqual(figures('three times as likely').map((f) => f.key), ['x:3']);
  assert.deepEqual(figures('a 2 to 1 edge').map((f) => f.key), ['x:2']);
  assert.equal(figures('twice a year').length, 0);
  assert.equal(numberProblems(page('Bought tools succeed about twice as often.[^1]', '67% vs 33% success')).length, 1);
  assert.equal(numberProblems(page('Bought tools succeed about twice as often.[^1]', '67% vs 33% success, about 2x')).length, 0);
});

test('9. the same page listed twice fails', () => {
  assert.equal(duplicateProblems([{ url: 'https://www.a.com/x/' }, { url: 'https://a.com/x?utm_source=z' }]).length, 1);
  assert.equal(duplicateProblems([{ url: '/industries/m.html#own-data' }, { url: '/industries/m.html#own-data' }]).length, 0);
});

test('10. the rival-firm check skips the source-check log', () => {
  const d = { summary: 'Plain page.', sourceCheck: { date: '2026-11-26', by: 'x', checked: 1, fixed: ['cut Anaptyss fee of $40 an hour from the consulting fees row'] } };
  assert.equal(rivalProblems(d).length, 0);
});

test('11. "most" over a share under 50% fails', () => {
  assert.equal(mostProblems(page('Most firms, 42%, use AI.[^1]', '42% use AI')).length, 1);
  assert.equal(mostProblems(page('Most firms, 62%, use AI.[^1]', '62% use AI')).length, 0);
  assert.equal(mostProblems(page('Most firms are early: only 11% run agents.[^1]', '11%')).length, 0);
});

test('12. the live figure record: needed on new pages, newer than the page, every unconfirmed figure quoted', () => {
  assert.equal(figureCheckProblems({ updated: '2026-11-26' }, 'new-page').length, 1);
  const ok = { updated: '2026-11-26', figureCheck: { date: '2026-11-26', checked: 3, notFound: [], redirects: [], byHand: [{ where: 'summary', figure: '98%', url: 'u', why: 'w', quote: 'Retention was 98% in 2025.' }] } };
  assert.equal(figureCheckProblems(ok, 'new-page').length, 0);
  assert.equal(figureCheckProblems({ ...ok, figureCheck: { ...ok.figureCheck, date: '2026-11-20' } }, 'new-page').length, 1);
  assert.equal(figureCheckProblems({ ...ok, figureCheck: { ...ok.figureCheck, byHand: [{ where: 's', figure: '98%', url: 'u', why: 'w' }] } }, 'new-page').length, 1);
  assert.equal(figureCheckProblems({ ...ok, figureCheck: { ...ok.figureCheck, byHand: [{ where: 's', figure: '98%', url: 'u', why: 'w', quote: 'Retention was high.' }] } }, 'new-page').length, 1);
  assert.equal(figureCheckProblems({ ...ok, figureCheck: { ...ok.figureCheck, redirects: ['a -> b'] } }, 'new-page').length, 1);
});

test('12. the pending list only names real pages without a record', () => {
  for (const s of FIGURE_CHECK_PENDING) {
    const p = pages.find(([x]) => x === s);
    assert.ok(p, `${s} is not a page`);
    assert.ok(!p[1].figureCheck, `${s} has its figure record now: take it off FIGURE_CHECK_PENDING`);
  }
});

test('13. EDGAR own data names its hit list and method; exhibits fail when the method counts main documents only', () => {
  const d = { ownData: { intro: 'We searched SEC EDGAR full text', rows: [] } };
  assert.equal(edgarProblems(d, 'new-page').length, 2);
  assert.equal(edgarProblems({ ownData: { ...d.ownData, hitList: 'data/own-data/x.csv', method: 'main document only' } }, 'new-page').length, 0);
  const csv = 'accession,form,filed,file,kind\n0001-26-1,10-K,2026-03-01,x10k.htm,main\n0001-26-2,10-K,2026-03-02,d123dex991.htm,exhibit\n';
  assert.equal(hitListProblems(csv, 'main document only').length, 1);
  assert.equal(hitListProblems(csv, 'main documents and exhibits').length, 0);
  assert.equal(hitListProblems('accession,form,filed,file,kind\n1,10-Q,2026-01-01,ex-10.1.htm,main\n', 'main documents and exhibits').length, 1);
  for (const s of EDGAR_PENDING) assert.ok(pages.find(([x]) => x === s), `${s} is not a page`);
});

test('13. every page\'s EDGAR hit list passes', () => {
  const bad = [];
  for (const [s, d] of pages) {
    if (!d.ownData?.hitList) continue;
    const f = join(root, d.ownData.hitList);
    if (!existsSync(f)) { bad.push(`${s}: ${d.ownData.hitList} not found`); continue; }
    for (const p of hitListProblems(readFileSync(f, 'utf8'), d.ownData.method)) bad.push(`${s}: ${p}`);
  }
  assert.deepEqual(bad, []);
});

test('14. a URL date that differs from the printed date fails', () => {
  assert.equal(urlDate('https://x.org/maps/2026/11/14/map.pdf'), '2026-11-14');
  assert.equal(dateProblems([{ url: 'https://x.org/2026/11/14/map', name: 'Map (13 Nov 2026)', what: 'Read 26 Nov 2026' }]).length, 1);
  assert.equal(dateProblems([{ url: 'https://x.org/2026/11/14/map', name: 'Map (14 Nov 2026)', what: 'Read 26 Nov 2026' }]).length, 0);
  assert.equal(dateProblems([{ url: 'https://x.org/2026/11/14/map', name: 'Map', what: 'Read 26 Nov 2026' }]).length, 0);
});

test('15. a third-party copy fails in favour of the publisher', () => {
  assert.equal(mirrorProblems([{ name: 'MIT NANDA, The GenAI Divide', url: 'https://www.ictworks.org/wp-content/uploads/x.pdf' }]).length, 1);
  assert.equal(mirrorProblems([{ name: 'MIT NANDA, The GenAI Divide', url: 'https://mlq.ai/media/x.pdf' }]).length, 1);
  assert.equal(mirrorProblems([{ name: 'MIT Sloan, AI at work', url: 'https://mitsloan.mit.edu/x' }]).length, 0);
  assert.equal(mirrorProblems([{ name: 'Deloitte, State of AI', url: 'https://www.deloitte.nl/x' }]).length, 0);
  assert.equal(mirrorProblems([{ name: 'Forrester TEI, commissioned by Microsoft', url: 'https://cdn.microsoft.com/x.pdf' }]).length, 0);
});
