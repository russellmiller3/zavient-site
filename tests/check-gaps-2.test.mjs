// Check gaps found by the page writers on 28 Nov 2026, round 2, made structural (feature/check-gaps-2).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gate } from '../scripts/check-page.mjs';
import { checkPage, checkHtml, LIMITS } from '../scripts/check-readability.mjs';
import { pageSchema } from '../src/lib/page-schema.mjs';
import { isSurvey, surveyScopeProblems, figureGroups } from '../src/lib/source-numbers.mjs';
import { staleProblems } from '../src/lib/stale-rules.mjs';
import { NOT_RENDERED, NOT_RENDERED_OWN_DATA } from '../src/lib/rendered-fields.mjs';
import { judgeGroup, figureCheckProblems, claimWords } from '../src/lib/figure-check.mjs';
import { BANNED } from '../src/lib/page-types.mjs';

const root = new URL('..', import.meta.url).pathname;
const page = (slug) => JSON.parse(readFileSync(join(root, 'src/content/ai-work', `${slug}.json`), 'utf8'));

// 1. a security questionnaire is a form, not a survey
test('security questionnaires in any wording are not a survey', () => {
  for (const t of ['Security questionnaires eat 40% of a presales week.', 'Cybersecurity questionnaires take 40% longer to answer.',
    'Security and compliance questionnaires slow 40% of deals.', 'Security assessment questionnaires: AI drafts 40% of answers.',
    'Security-questionnaire automation saves 40% of the time.', 'Vendor claim: the AI answers questionnaires 40% faster.',
    'Vanta, Questionnaire Automation | Vendor claim: 40% faster reviews.', 'Questionnaires about security take 40% of the week.'])
    assert.equal(isSurvey(t), false, t);
  const d = { sources: [{ name: 'Acme, Security questionnaire automation', url: 'https://acme.com/q', what: 'Vendor claim: AI answers cybersecurity questionnaires 40% faster.' }],
    summary: 'Security and compliance questionnaires get answered 40% faster with a reviewed answer library.[^1]' };
  assert.deepEqual(surveyScopeProblems(d), []);
});
test('a real survey still reads as a survey, form words or not', () => {
  for (const t of ['a survey of 255 professionals', 'Survey of 255 security, compliance and IT professionals; 70% rely on security questionnaires',
    'Security questionnaire sent to 400 CISOs', '300 risk managers completed the questionnaire', 'risk survey questionnaire', 'Questionnaire sent to 300 CFOs'])
    assert.equal(isSurvey(t), true, t);
  const d = { sources: [{ name: 'Secureframe survey', url: 'https://s.com/r', what: 'Survey of 255 security, compliance and IT professionals: 70% rely on security questionnaires.' }],
    summary: 'Nearly 70% of teams still prove their posture by hand.[^1]' };
  assert.ok(surveyScopeProblems(d).some((p) => /a survey figure without its group/.test(p)));
});

// 2. the stale-rule check reads only what renders
test('a log that never renders cannot fail the stale-rule check', () => {
  const d = { summary: 'Model risk follows SR 26-2.', sourceCheck: { date: '2026-11-28', by: 'x', checked: 3, fixed: ['faq 2 cited SR 11-7 as current; fixed'] },
    figureCheck: { date: '2026-11-28', checked: 1, notFound: [], padded: [], redirects: [], byHand: [{ where: 'faq 1', figure: '40%', url: 'https://a.com', why: 'x', quote: 'Under SR 11-7, 40% of banks validate yearly.' }] },
    reviews: [{ reader: 'CFO', notes: 'SR 11-7 is fine' }], keyword: { phrase: 'sr 11-7 model risk', searches: 1, cpc: 1, difficulty: null },
    ownData: { title: 't', intro: 'i', headers: [], rows: [], note: 'n', method: 'Counted filings citing SR 11-7.' } };
  assert.deepEqual(staleProblems(d), []);
});
test('every field the template renders is still scanned for superseded rules', () => {
  const keys = Object.keys(pageSchema._def.schema.shape).filter((k) => !NOT_RENDERED.includes(k));
  assert.ok(keys.length > 40);
  for (const k of keys) assert.ok(staleProblems({ [k]: 'Banks follow SR 11-7 today.' }).length, `${k} is not scanned`);
  for (const k of ['intro', 'note', 'title']) assert.ok(staleProblems({ ownData: { [k]: 'Banks follow SR 11-7 today.' } }).length, `ownData.${k} is not scanned`);
  assert.ok(staleProblems({ ownData: { rows: [['Banks follow SR 11-7 today.']] } }).length, 'ownData.rows is not scanned');
});
test('the page template reads none of the fields the checks skip as unrendered', () => {
  const walk = (dir) => readdirSync(dir).flatMap((f) => statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : f.endsWith('.astro') ? [join(dir, f)] : []);
  const files = ['src/components', 'src/pages', 'src/layouts'].flatMap((d) => walk(join(root, d)));
  const re = new RegExp(`\\.(?:${NOT_RENDERED.join('|')})\\b|ownData\\??\\.(?:${NOT_RENDERED_OWN_DATA.join('|')})\\b`);
  for (const f of files) assert.doesNotMatch(readFileSync(f, 'utf8'), re, `${f.slice(root.length)} renders a field the checks skip: take it off src/lib/rendered-fields.mjs`);
});

// 3. check-page applies the hub's sentence limit to the description
test('check-page fails a description sentence over the hub limit, with the hub check\'s own counting', () => {
  const d = page('account-reconciliation-automation');
  const long = 'How a firm of 40 to 500 people can test AI on its own books in a week, who signs off, and what it costs to run it each month.';
  assert.ok(long.length <= 160 && long.split(/\s+/).length > LIMITS.sentenceWords);
  d.description = long;
  assert.ok(gate(d, { slug: 'account-reconciliation-automation' }).fail.some((p) => /^readability: description: sentence of \d+ words \(max 25\)/.test(p)));
  // The built hub's check (checkHtml) reads the same text the same way, so the two can't drift.
  assert.equal(checkHtml(`<p>${long}</p>`).length > 0, checkPage(d).some((p) => p.startsWith('description:')));
  d.description = 'What AI account reconciliation matches on its own, who signs off, and how to test it on your books.';
  assert.ok(!checkPage(d).some((p) => p.startsWith('description:')));
  assert.equal(checkHtml(`<p>${d.description}</p>`).length, 0);
});

// 4. script-rendered source pages go to byHand, and a quote keyed by figure and URL clears them
const nav = 'Home Pricing Product Customers Resources Blog Careers Contact Sign in Book a demo';
const real = ('Our plans start with Starter for small teams that want automated evidence collection, a trust center and policy templates. ' +
  'Growth adds vendor risk management, access reviews and custom frameworks, and Enterprise adds single sign on, audit support and a named manager. ').repeat(3);
test('an empty source page needs byHand, not "not found"', () => {
  const figs = figureGroups('Plans start at $7,500 a year.[^1]')[0].figs;
  const words = claimWords('Plans start at $7,500 a year.');
  const empty = judgeGroup({ where: 'tables[0]', figs, words, sources: [{ c: 1, u: 'https://v.com/pricing', body: nav.toLowerCase() }] });
  assert.deepEqual(empty.notFound, []);
  assert.ok(empty.byHand.some((b) => b.url === 'https://v.com/pricing' && /needs byHand/.test(b.why)));
  const offTopic = judgeGroup({ where: 'tables[0]', figs, words, sources: [{ c: 1, u: 'https://v.com/pricing', body: `${nav} ${'we build trust for every company and every team '.repeat(20)}`.toLowerCase() }] });
  assert.deepEqual(offTopic.notFound, []);
  assert.ok(offTopic.byHand.some((b) => /needs byHand/.test(b.why)));
});
test('a figure missing from a page with real text on the claim still fails', () => {
  const figs = figureGroups('Starter plans start at $7,500 a year.[^1]')[0].figs;
  const words = claimWords('Starter plans start at $7,500 a year.');
  const j = judgeGroup({ where: 'tables[0]', figs, words, sources: [{ c: 1, u: 'https://v.com/pricing', body: real.toLowerCase() }] });
  assert.equal(j.notFound.length, 1);
  assert.deepEqual(j.byHand, []);
});
test('a hand-copied quote for the figure and URL clears a figure the script could not find', () => {
  const figs = figureGroups('Starter plans start at $7,500 a year.[^1]')[0].figs;
  const words = claimWords('Starter plans start at $7,500 a year.');
  const quote = (fig, url) => (fig === '$7,500' && url === 'https://v.com/pricing' ? 'Starter: $7,500 per year' : undefined);
  const j = judgeGroup({ where: 'tables[0]', figs, words, quote, sources: [{ c: 1, u: 'https://v.com/pricing', body: real.toLowerCase() }] });
  assert.deepEqual(j.notFound, []);
  assert.equal(j.byHand[0].url, 'https://v.com/pricing');
  // The page check: an older record's notFound is cleared by a byHand quote for that figure and URL, and only by one.
  const fc = (byHand) => ({ date: '2026-11-28', checked: 1, notFound: ['tables[0]: $7,500 not found in https://v.com/pricing'], padded: [], redirects: [], byHand });
  const hit = (byHand) => figureCheckProblems({ updated: '2026-11-28', figureCheck: fc(byHand) }, 'p');
  assert.ok(hit([]).some((p) => /not on its source's page/.test(p)));
  assert.deepEqual(hit([{ where: 'tables[0]', figure: '$7,500', url: 'https://www.v.com/pricing/', why: 'script-rendered', quote: 'Starter: $7,500 per year' }]), []);
  assert.ok(hit([{ where: 'tables[0]', figure: '$7,500', url: 'https://other.com/pricing', why: 'x', quote: 'Starter: $7,500 per year' }]).some((p) => /not on its source's page/.test(p)), 'another URL\'s quote does not clear it');
  assert.ok(hit([{ where: 'tables[0]', figure: '$7,500', url: 'https://v.com/pricing', why: 'x', quote: 'Starter: call us' }]).some((p) => /doesn't contain it/.test(p)), 'the quote must hold the figure');
});

// 5. Delve the company is fine; delve the filler word is not
test('"Delve" capitalised mid-sentence passes, lowercase "delve" is banned', () => {
  const hit = (t) => BANNED.some((b) => b.re.test(t));
  assert.ok(!hit('Compliance tools such as Vanta, Drata and Delve automate evidence.'));
  assert.ok(!hit("{\"summary\":\"Tools like Delve's agent read policies.\"}"));
  assert.ok(hit('We delve into the numbers.'));
  assert.ok(hit('"Delve into the numbers first."'));
  assert.ok(hit('That is the plan. Delve into it.'));
});
