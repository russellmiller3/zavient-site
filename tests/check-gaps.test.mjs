// Check gaps found by the page writers on 28 Nov 2026, made structural (feature/check-gaps).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { gate } from '../scripts/check-page.mjs';
import { schemaProblems } from '../src/lib/page-schema.mjs';
import { isSurvey, surveyScopeProblems, figureGroups, paddingProblems, wordsToNumbers } from '../src/lib/source-numbers.mjs';
import { findQuote, judgeGroup, figureCheckProblems, claimWords } from '../src/lib/figure-check.mjs';
import { placeFootnotes, placeRenderedFootnotes, renderedFootnoteProblems } from '../src/lib/footnotes.mjs';
import { proxyFor } from '../src/lib/fetch-source.mjs';
import { acronymProblems } from '../src/lib/acronyms.mjs';

const root = new URL('..', import.meta.url).pathname;
const page = (slug) => JSON.parse(readFileSync(join(root, 'src/content/ai-work', `${slug}.json`), 'utf8'));
const odd = () => page('operational-due-diligence');

// 1. check-page validates against the content collection's schema
test('check-page fails a table with no intro, as astro build would', () => {
  const d = odd();
  assert.deepEqual(schemaProblems(d), []);
  delete d.tables[0].intro;
  assert.ok(schemaProblems(d).some((p) => /^tables\.0\.intro:/.test(p)));
  assert.ok(gate(d, { slug: 'operational-due-diligence' }).fail.some((p) => /schema: tables\.0\.intro/.test(p)));
});
test('check-page reports a field of the wrong kind', () => {
  const d = odd(); d.keyword.searches = '260';
  assert.ok(gate(d, { slug: 'operational-due-diligence' }).fail.some((p) => /schema: keyword\.searches/.test(p)));
});

// 2. a due diligence questionnaire is not a survey; real surveys still need their sample
test('a DDQ or questionnaire template is not a survey', () => {
  for (const t of ['ILPA, Due Diligence Questionnaire 2.0 | Free questionnaire from the ILPA.', "AIMA's Illustrative Questionnaire for the Due Diligence of Investment Managers",
    'The due diligence questionnaire (DDQ) template', 'answers questionnaires such as ILPA and AIMA', 'The DDQ is a template, not a survey.'])
    assert.equal(isSurvey(t), false, t);
  const d = { sources: [{ name: 'ILPA, Due Diligence Questionnaire 2.0', url: 'https://ilpa.org/x.pdf', what: 'Free questionnaire: 20 sections in short and long form.' }] };
  assert.deepEqual(surveyScopeProblems(d), []);
});
test('a real survey or questionnaire study still needs who answered', () => {
  for (const t of ['Questionnaire sent to 300 CFOs', 'Online questionnaire completed by family offices', 'Survey of 44 investors', '412 respondents']) assert.equal(isSurvey(t), true, t);
  const d = { sources: [{ name: 'Acme, Family office questionnaire results', url: 'https://acme.com/r', what: 'Results of an online questionnaire on reporting tools.' }] };
  assert.ok(surveyScopeProblems(d).some((p) => /is a survey but its note doesn't say who answered/.test(p)));
});

// 3. a hand-checked quote survives moving its block
test('a byHand quote is found by figure and source URL after the block moves', () => {
  const old = [{ where: 'watchOuts[1]', figure: '54%', url: 'https://www.sbai.org/s.pdf', why: 'x', quote: 'CIO / Investment function (54%)' }];
  assert.equal(findQuote(old, { where: 'humanRole[3]', figure: '54%', url: 'https://sbai.org/s.pdf/' }), old[0].quote);
  assert.equal(findQuote(old, { where: 'humanRole[3]', figure: '54%', url: 'https://other.com/', urls: ['https://www.sbai.org/s.pdf'] }), old[0].quote);
  assert.equal(findQuote(old, { where: 'watchOuts[1]', figure: '54%', url: 'https://other.com/' }), old[0].quote, 'position fallback');
  assert.equal(findQuote(old, { where: 'humanRole[3]', figure: '23%', url: 'https://www.sbai.org/s.pdf' }), undefined);
  // Figures logged together keep every hand-copied sentence.
  const two = [...old, { where: 'faq[1]', figure: '23%', url: 'https://www.sbai.org/s.pdf', why: 'x', quote: 'COO / Operations (23%)' }];
  assert.match(findQuote(two, { where: 'faq[2]', figure: '54% / 23%', url: 'https://www.sbai.org/s.pdf' }), /54%.*23%/);
});

// 4. the source reader honours HTTPS_PROXY and NO_PROXY
test('the source reader tunnels through HTTPS_PROXY except for NO_PROXY hosts', () => {
  const env = { HTTPS_PROXY: 'http://127.0.0.1:9', NO_PROXY: 'localhost,.internal.example,pypi.org' };
  assert.equal(proxyFor('www.sbai.org', env)?.port, '9');
  assert.equal(proxyFor('pypi.org', env), null);
  assert.equal(proxyFor('a.internal.example', env), null);
  assert.equal(proxyFor('www.sbai.org', {}), null);
});

// 5. footnotes follow their punctuation, everywhere
test('footnote markers move after punctuation, with no space before them', () => {
  assert.equal(placeFootnotes('gaps[^1][^48]. Next'), 'gaps.[^1][^48] Next');
  assert.equal(placeFootnotes('gaps [^2], then'), 'gaps,[^2] then');
  assert.equal(placeFootnotes('gaps.[^3]'), 'gaps.[^3]');
  const sup = '<sup class="fn"><a href="#fn-1">1</a></sup>';
  assert.equal(placeRenderedFootnotes(`<p>tasks ${sup}.</p>`), `<p>tasks.${sup}</p>`);
  assert.equal(placeRenderedFootnotes(`<script>x="a${sup}."</script>`), `<script>x="a${sup}."</script>`);
  assert.deepEqual(renderedFootnoteProblems(`<p>tasks.${sup}</p>`), []);
  assert.equal(renderedFootnoteProblems(`<p>tasks${sup}.</p><li>x.[^4]</li>`).length, 2);
});
function* htmlFiles(dir) { for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) yield* htmlFiles(p); else if (f.endsWith('.html')) yield p; } }
test('every built page puts footnotes after punctuation and shows no raw markers', { skip: !existsSync(join(root, 'dist')) && 'no dist: run astro build' }, () => {
  const bad = [];
  for (const p of htmlFiles(join(root, 'dist'))) {
    // A static page from public/ renders its own [^n] markers in the browser (rich() in ai-readiness-assessment.html,
    // which applies the same placement), so only its placement is checked here.
    const own = existsSync(join(root, 'public', p.slice(join(root, 'dist').length)));
    for (const x of renderedFootnoteProblems(readFileSync(p, 'utf8'))) if (!(own && /^raw footnote/.test(x))) bad.push(`${p.slice(root.length)}: ${x}`);
  }
  assert.deepEqual(bad, []);
});

// 6. supporting phrases are data, never shown
test('keyword.supporting is optional and checked', () => {
  const d = odd();
  assert.ok(d.keyword.supporting.length >= 3);
  assert.deepEqual(schemaProblems(d), []);
  d.keyword.supporting.push({ phrase: 'x', searches: -1, cpc: 0 });
  assert.ok(schemaProblems(d).length >= 1);
  delete d.keyword.supporting;
  assert.deepEqual(schemaProblems(d), []);
});
test('supporting phrases never render', { skip: !existsSync(join(root, 'dist/ai-work/operational-due-diligence.html')) && 'no dist' }, () => {
  const html = readFileSync(join(root, 'dist/ai-work/operational-due-diligence.html'), 'utf8');
  // The page's own copy may use a phrase; the planning record itself never reaches the HTML.
  assert.ok(!/"supporting"|"searches"/.test(html));
  for (const f of ['src/components/Block.astro', 'src/components/AiWorkPage.astro', 'src/pages/ai-work/[slug].astro']) assert.ok(!/keyword\.supporting|\.supporting\b/.test(readFileSync(join(root, f), 'utf8')), f);
});

// 7. every footnote on a figure must state it
test('figure groups attach each figure to the markers after it', () => {
  const g = figureGroups('54% use the CIO[^1] and 23% the COO.[^2][^3]');
  assert.deepEqual(g.map((x) => [x.cites, x.figs.map((f) => f.raw)]), [[[1], ['54%']], [[2, 3], ['23%']]]);
});
test('a second footnote whose note lacks the figure is flagged as padding', () => {
  const d = { sources: [{ name: 'A survey', url: 'https://a.com/', what: 'Survey of 44 investors: 70% have ODD teams.' }, { name: 'B guide', url: 'https://b.com/', what: 'A guide; 12% of funds fail audits.' }],
    humanRole: ['Most investors, 70% of 44 surveyed, have a team.[^1][^2]'] };
  assert.ok(paddingProblems(d).some((p) => /footnote \[\^2\] doesn't state 70%: move or drop it/.test(p)));
});
test('the live check judges every footnote on a figure, not just the first', () => {
  const figs = figureGroups('70% of investors have teams.[^1][^2]')[0].figs;
  const words = claimWords('70% of investors have teams');
  // b.com is a real page of text (an essentially empty page goes to byHand instead: tests/check-gaps-2.test.mjs).
  const both = judgeGroup({ where: 'x', figs, words, sources: [{ c: 1, u: 'https://a.com', body: 'among investors, 70% have teams' }, { c: 2, u: 'https://b.com', body: 'a guide on investors and teams, nothing else. '.repeat(10) }] });
  assert.deepEqual(both.notFound, []);
  assert.match(both.padded[0], /footnote \[\^2\] \(https:\/\/b\.com\) doesn't state 70%: move or drop it/);
  const unread = judgeGroup({ where: 'x', figs, words, sources: [{ c: 1, u: 'https://a.com', body: 'investors: 70% have teams' }, { c: 2, u: 'https://b.com', body: null, err: 'refused' }] });
  assert.equal(unread.byHand.length, 1, 'the unread second source gets its own hand check');
  assert.equal(unread.byHand[0].footnote, 2);
});
test('a hand-check quote for one footnote must hold the figure', () => {
  const fc = (quote) => ({ date: '2026-11-28', checked: 1, notFound: [], padded: [], redirects: [], byHand: [{ where: 'x', figure: '70%', url: 'https://b.com', footnote: 2, why: 'couldn\'t read', quote }] });
  assert.deepEqual(figureCheckProblems({ updated: '2026-11-28', figureCheck: fc('70% of investors have teams') }, 'p'), []);
  assert.ok(figureCheckProblems({ updated: '2026-11-28', figureCheck: fc('a guide to teams') }, 'p').some((p) => /footnote \[\^2\]/.test(p)));
  assert.ok(figureCheckProblems({ updated: '2026-11-28', figureCheck: { ...fc('x 70%'), padded: ['x: footnote [^2] doesn\'t state 70%'] } }, 'p').some((p) => /footnote doesn't state this figure/.test(p)));
});

// 8. fund shorthand is spelled out
test('fund acronyms must be spelled out', () => {
  const d = (t) => ({ summary: t, sources: [] });
  assert.ok(acronymProblems(d('Compare TVPI and DPI across funds.')).some((p) => /"TVPI"/.test(p)));
  assert.deepEqual(acronymProblems(d('Total value to paid-in capital (TVPI) and distributions to paid-in capital (DPI) per fund.')), []);
  assert.deepEqual(acronymProblems(d('Load K-1 tax forms as they land.')), []);
  assert.ok(acronymProblems(d('Load K-1s as they land.')).some((p) => /"K-1"/.test(p)));
  assert.ok(acronymProblems(d('Ask the GP for the DDQ.')).length >= 2);
});

// 9. numbers in words match their figure
test('numbers written in words read as digits', () => {
  assert.equal(wordsToNumbers('Seventy-three percent of LPs'), '73 percent of LPs');
  assert.equal(wordsToNumbers('nine in ten'), '9 in 10');
  assert.equal(wordsToNumbers('one hundred and twelve funds'), '112 funds');
  assert.equal(wordsToNumbers('someone'), 'someone');
  const fc = { date: '2026-11-28', checked: 1, notFound: [], redirects: [], byHand: [{ where: 'x', figure: '73%', url: 'https://a.com', why: 'r', quote: 'Seventy-three percent of family offices report quarterly.' }] };
  assert.deepEqual(figureCheckProblems({ updated: '2026-11-28', figureCheck: fc }, 'p'), []);
  const d = { sources: [{ name: 'A', url: 'https://a.com', what: 'Seventy-three percent of 155 family offices report quarterly.' }], humanRole: ['73% of 155 family offices report quarterly.[^1]'] };
  assert.deepEqual(paddingProblems(d), []);
});
