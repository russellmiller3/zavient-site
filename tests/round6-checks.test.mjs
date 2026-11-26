// Round 6 structural checks (26 Nov 2026): the build thread's 14 follow-up gaps, each a check or a template rule.
// Russell: "Make it so every fix is structual to templates so it doesnt reoccur".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { figures, surveyGroups, surveyScopeProblems, twoFigureProblems, priceProblems, readDate, OWN_MATH, isPrice, citedSentences, claimProblems } from '../src/lib/source-numbers.mjs';
import { canonicalProblems, CANONICAL_SOURCES } from '../src/lib/canonical-sources.mjs';
import { stalePriceProblems } from '../src/lib/stale-prices.mjs';
import { indexed } from '../src/lib/publish.mjs';

const page = (sentence, what, extra = {}) => ({ summary: sentence, sources: [{ name: 'Source', url: 'https://example.org/a', what }], ...extra });
const keys = (t) => figures(t).map((f) => f.key);

test('money ranges keep each end\'s unit, and a date after a figure is not a range', () => {
  assert.deepEqual(keys('$750,000-$1 million'), ['$:750000', '$:1000000']);
  assert.deepEqual(keys('$10-50k a year'), ['$:10000', '$:50000']);
  assert.ok(!keys('$18 to 31 Dec 2026').includes('$:31'));
});

test('survey groups: "or more", "plus", and every group in a note; a population word matches firms', () => {
  assert.deepEqual(surveyGroups('Survey of 117,000 or more employers'), [['employers']]);
  assert.ok(surveyGroups('Survey of 300 plus CFOs').flat().includes('CFOs'));
  assert.equal(surveyGroups('Survey of 1,719 respondents').length, 0);
  const d = page('Of companies surveyed, 40% use AI.[^1]', 'Survey of 500 businesses: 40% use AI');
  assert.equal(surveyScopeProblems(d).length, 0);
});

test('"asked in March" and "respondents" mark a survey that must name its group (the Atlanta Fed gap)', () => {
  assert.ok(surveyScopeProblems(page('40% plan to use AI.[^1]', 'Firms asked in March 2026: 40% plan to use AI')).length >= 1);
});

test('our own backtest is our math, and two figures in different table rows are not paired', () => {
  assert.ok(OWN_MATH.test('In our backtest, 12% of loans moved grade.'));
  assert.ok(OWN_MATH.test('We ran a backtest on 400 files.'));
  const d = { tables: [{ title: 'T', headers: ['Job', 'Share'], rows: [{ name: 'A', cells: ['40%[^1]'] }, { name: 'B', cells: ['60%[^1]'] }] }],
    sources: [{ name: 'S', url: 'https://example.org', what: 'A 40%, B 60%' }] };
  assert.equal(twoFigureProblems(d).length, 0);
});

test('prices: "from scratch" and build costs are not prices; only the source that holds the price needs a read date', () => {
  assert.ok(!isPrice('Building from scratch runs $8M a year for a large team.'));
  assert.ok(isPrice('Plans start at $30 per user a month.'));
  const d = { updated: '2026-11-26', summary: 'Plans start at $30 per user a month, per a buyer survey.[^1][^2]',
    sources: [{ name: 'Vendor pricing', url: 'https://v.example/pricing', what: '$30 per user a month. Read 26 Nov 2026.' },
      { name: 'Buyer survey', url: 'https://s.example', what: 'Survey of 200 buyers: most pick monthly plans' }] };
  assert.equal(priceProblems(d).length, 0);
});

test('a read date can sit in the name, and "Read live" counts', () => {
  assert.ok(readDate('Read live on 26 Nov 2026'));
  assert.ok(readDate('Read live 26 Nov, 2026'));
});

test('a canonical report has one URL and one note', () => {
  const c = CANONICAL_SOURCES[0];
  assert.equal(canonicalProblems([{ name: c.name, url: c.url, what: c.what }]).length, 0);
  assert.equal(canonicalProblems([{ name: 'MIT NANDA, The GenAI Divide', url: 'https://example.org/copy.pdf', what: c.what }]).length, 1);
  assert.equal(canonicalProblems([{ name: c.name, url: c.url, what: 'Partnered tools succeed three times as often' }]).length, 1);
  assert.ok(c.what.includes('2x as likely'));
});

test('a vendor price that left its page fails every page that quotes it', () => {
  const d = { summary: 'Alkami charges $23K a year for the starter tier.[^1]', sources: [{ name: 'Alkami', url: 'https://www.alkami.com/data-marketing-solutions/', what: 'Starter tier $23K a year' }] };
  assert.equal(stalePriceProblems(d, { citedSentences, figures, isPrice }).length, 2);
  const ok = { summary: 'Alkami sells a data and marketing suite.[^1]', sources: [{ name: 'Alkami', url: 'https://www.alkami.com/data-marketing-solutions', what: 'Data and marketing suite' }] };
  assert.equal(stalePriceProblems(ok, { citedSentences, figures, isPrice }).length, 0);
  assert.ok(claimProblems(d).some((p) => /left the vendor's page/.test(p)));
});

test('the build fails, with reasons, on a page marked for search that the gate rejects', () => {
  const bad = { id: 'x', data: { templateVersion: 2, index: true, title: 'x' } };
  assert.throws(() => indexed(bad, [bad]), /fails the publish gate/);
  assert.equal(indexed({ id: 'y', data: { templateVersion: 2, index: false } }, []), false);
});

test('"most firms" over a survey names the survey\'s group; "business leaders" are leaders, not businesses', () => {
  const gt = 'Survey of 950 business leaders: 78% lack strong confidence they could pass an AI audit';
  assert.equal(surveyScopeProblems(page('Most firms doubt they would pass an AI audit.[^1]', gt)).length, 1);
  assert.equal(surveyScopeProblems(page('Most business leaders lack strong confidence in an AI audit.[^1]', gt)).length, 0);
  assert.equal(surveyScopeProblems(page('Most ops teams should buy first.[^1]', gt)).length, 0);
  assert.equal(surveyScopeProblems(page('Support is among the most common company uses.[^1]', gt)).length, 0);
  assert.equal(surveyScopeProblems(page('78% of firms lack strong confidence.[^1]', gt)).length, 1);
  assert.equal(surveyScopeProblems(page('78% of firms use AI.[^1]', 'Survey of 500 businesses: 78% use AI')).length, 0);
});

test('citing a stale vendor page to say it shows no price is fine', () => {
  const d = { summary: 'CRM seats run $65 to $700 a user a month, while Alkami\'s bank module shows no price.[^1]', sources: [{ name: 'Alkami', url: 'https://www.alkami.com/data-marketing-solutions?m-search', what: 'Three tiers; no price shown on the page' }] };
  assert.equal(stalePriceProblems(d, { citedSentences, figures, isPrice }).length, 0);
});
