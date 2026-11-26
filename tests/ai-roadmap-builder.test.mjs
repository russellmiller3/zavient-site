// Checks the AI roadmap builder (public/tools/embed/ai-roadmap-builder.html) against the Zavient method in
// tools/research/ai-roadmap-builder.research.md: the worked example (150-person insurance firm), the selection rules
// across every answer, and that its copy of the use case finder's data still matches the finder. Runs the page's own
// data and engine scripts, so the test and the page cannot drift apart.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = (f) => readFileSync(new URL(`../public/tools/embed/${f}`, import.meta.url), 'utf8');
const block = (html, id) => html.match(new RegExp(`<script id="${id}">([\\s\\S]*?)</script>`))[1];
const html = read('ai-roadmap-builder.html');
const ctx = { module: { exports: {} } };
vm.runInNewContext(`${block(html, 'data')}\n${block(html, 'engine')}\nmodule.exports.RM = RM; module.exports.FINDER = FINDER;`, ctx);
const { RM, FINDER } = ctx.module.exports;
const finderHtml = read('ai-use-case-finder.html');
const fctx = { module: { exports: {} } };
vm.runInNewContext(`${block(finderHtml, 'data')}\n${block(finderHtml, 'engine')}\nmodule.exports.DATA = DATA;`, fctx);
const { DATA, score } = fctx.module.exports;
const plain = (x) => JSON.parse(JSON.stringify(x));
const r1 = (n) => Math.round(n * 10) / 10;

test('the copy of the finder data matches the use case finder', () => {
  assert.deepEqual(plain(FINDER.industries), plain(DATA.industries.map(({ id, name, core, short }) => ({ id, name, core, short }))));
  assert.deepEqual(plain(FINDER.teams), plain(DATA.teams));
  assert.deepEqual(plain(FINDER.general), plain(DATA.general));
  assert.deepEqual(plain(FINDER.cells), plain(Object.fromEntries(Object.entries(DATA.cells).map(([k, c]) => [k, c.ids]))));
  for (const [id, u] of Object.entries(DATA.uc)) {
    for (const k of ['n', 'does', 'keep', 'eff', 'risk', 'ev', 'sz', 'ads', 'srch', 'measure']) assert.deepEqual(FINDER.uc[id][k], u[k], `${id}.${k}`);
    for (const s of ['40-99', '100-249', '250-500']) assert.equal(RM.finderScore(FINDER.uc[id], s), score(u, s), `${id} score at ${s}`);
    assert.ok(RM.X[id], `no short name for ${id}`);
  }
});

const EX = { industry: 'insurance', size: '100-249', headcount: 150, teams: ['customer-service', 'core', 'finance'], current: 'personal',
  policy: 'none', data: 'messy', risk: 'medium', budget: '25-100', owner: 'yes', stage: '' };

test('worked example: 150-person insurance firm (research section 4)', () => {
  const p = RM.build(EX, {});
  const picks = plain(p.projects.map((x) => [x.id, x.team, x.role, x.score]));
  assert.deepEqual(picks, [
    ['support-agent-assist', 'customer-service', 'Head of customer service', 85],
    ['ar-followup', 'finance', 'Controller or finance manager', 47.6],
    ['claim-letters', 'core', 'Claims manager', 44.8]]);
  assert.equal(p.onDeck.id, 'customer-self-serve');
  assert.equal(p.onDeck.score, 46.2);
  assert.equal(p.two, true);
  assert.equal(p.projects[1].startDay, 46);
  assert.equal(p.projects[1].gateDay, 105);
  assert.equal(p.projects[0].gateDay, 90);
  assert.match(p.projects[2].start, /months 4 to 6/);
  assert.equal(p.champs, 6); // insurance is regulated: ceil(150 / 25)
  assert.equal(p.header, 'For a 150-person insurance firm, start with suggested replies for your service team, then collections follow-up. Claim letters follow in months 4-6, after your first gate.');
  assert.match(p.projects[2].review.text, /approves every letter before it is sent, posted or acted on, for at least the first 60 days/);
  assert.match(p.projects[0].review.text, /People send every reply themselves/);
  // Days 1-30: policy by day 14, approved tool by day 15, baseline, managers and champions trained first
  const ph1 = p.phases[0].tasks.map((t) => `${t.when}: ${t.t}`).join('\n');
  assert.match(ph1, /By day 14: Write and sign a one-page AI use policy/);
  assert.match(ph1, /By day 15: Approve one AI tool/);
  assert.match(ph1, /4-week baseline for Projects 1 and 2/);
  assert.match(ph1, /Train managers and the 6 champions first/);
  assert.deepEqual(plain(p.flags.map((f) => f.t.split('.')[0])), ['Your people are likely already using AI on personal accounts', 'No real customer data goes into any AI tool until the policy is signed']);
  assert.match(p.offer.lead, /suggested replies .* owned by the head of customer service\. By day 15 you approve one AI tool/);
  assert.match(p.offer.settle[0], /policy and the tool choice you need by day 15/);
  // Day-90 gate: 60% weekly use of the pilot group, 8 of 12 people
  assert.match(p.gates.scale, /at least 60% of the pilot group use it every week \(8 of 12 people\)/);
});

test('names typed by the reader flow into the plan', () => {
  const p = RM.build(EX, { names: { p1: 'Dana Ortiz', sponsor: 'Sam Lee' } });
  assert.equal(p.projects[0].owner, 'Dana Ortiz');
  assert.equal(p.sponsor, 'Sam Lee');
  assert.match(p.offer.lead, /owned by Dana Ortiz/);
  assert.match(RM.text(p), /Owner: Dana Ortiz/);
});

test('rules hold for every industry, team, size, data, budget, risk and owner answer', () => {
  const inds = [...FINDER.industries.map((i) => i.id), 'other'];
  let n = 0;
  for (const industry of inds) for (const team of RM.teamsFor(industry).map((t) => t.id))
    for (const size of ['40-99', '100-249', '250-500']) for (const data of ['scattered', 'messy', 'clean'])
      for (const budget of ['lt25', '25-100', '100-250', '250plus']) for (const risk of ['low', 'medium', 'high']) for (const owner of ['yes', 'no']) {
        const teams = [team, ...(team === 'finance' ? ['customer-service'] : [])];
        const a = { industry, size, headcount: null, teams, current: 'none', policy: 'none', data, risk, budget, owner, stage: '' };
        const p = RM.build(a, {}); n++;
        const tag = `${industry}|${teams}|${size}|${data}|${budget}|${risk}|${owner}`;
        assert.ok(p.projects.length >= 1 && p.projects.length <= 3, `${tag}: ${p.projects.length} projects`);
        const [P1, P2, P3] = p.projects;
        assert.equal(new Set(p.projects.map((x) => x.id)).size, p.projects.length, `${tag}: duplicate pick`);
        for (const x of [P1, P2].filter(Boolean)) {
          assert.notEqual(x.u.risk, 'high', `${tag}: high-risk use as project ${x.n}`);
          assert.notEqual(x.u.eff, 'build', `${tag}: build as project ${x.n}`);
        }
        if (P3 && P3.u.risk === 'high') assert.equal(risk, 'high', `${tag}: high-risk project 3 without high-risk scope`);
        if (data === 'scattered') {
          // Buy only, unless no bought use exists for these teams; then a set-up tool with a data-cleanup flag
          const anyBuy = p.cands.some((c) => c.u.eff === 'buy' && c.u.risk !== 'high');
          if (anyBuy) assert.equal(P1.u.eff, 'buy', `${tag}: project 1 not bought with scattered data`);
          else assert.ok(p.flags.some((f) => /can be bought ready-made/.test(f.t)), `${tag}: no set-up flag`);
        }
        if (p.projects.some((x) => x.u.eff === 'build')) assert.ok(['100-250', '250plus'].includes(budget) && data !== 'scattered', `${tag}: build not allowed`);
        assert.equal(p.two, size !== '40-99' && budget !== 'lt25' && owner === 'yes');
        if (P2 && teams.length > 1 && p.cands.some((c) => c.team !== P1.team && c.u.risk !== 'high' && c.u.eff !== 'build' && c.id !== P1.id))
          assert.notEqual(P2.team, P1.team, `${tag}: project 2 from the same team`);
        const txt = RM.text(p);
        assert.doesNotMatch(txt, /\bFTEs?\b|head ?count|\breplac|cut jobs/i, `${tag}: banned wording`);
        assert.doesNotMatch(txt, /undefined|\bNaN\b|\bnull\b/, `${tag}: broken wording`);
      }
  assert.ok(n > 10000);
});

test('readiness "clear the runway" stretches groundwork to 45 days', () => {
  const p = RM.build({ ...EX, stage: 'runway' }, {});
  assert.match(p.phases[0].label, /^Days 1-45/);
  assert.equal(p.projects[0].gateDay, 105);
});

test('every footnote key and tool link resolves', () => {
  const keys = [...html.matchAll(/fns\(\[([^\]]*)\]\)/g)].flatMap((m) => [...m[1].matchAll(/"(\w+)"/g)].map((x) => x[1]));
  const p = RM.build(EX, {});
  for (const f of p.flags) (f.src || []).forEach((k) => keys.push(k));
  for (const ph of p.phases) for (const t of ph.tasks) (t.src || []).forEach((k) => keys.push(k));
  for (const k of keys) assert.ok(RM.SRC[k], `missing source ${k}`);
  for (const [, u] of Object.values(RM.SRC)) assert.match(u, /^https:\/\//);
  for (const slug of ['ai-policy-generator', 'ai-training-plan', 'ai-use-case-finder', 'ai-project-cost-estimator', 'ai-roi-calculator'])
    assert.ok(html.includes(`/tools/${slug}.html`) || html.includes(`/tools/embed/${slug}.html`), `no link to ${slug}`);
  assert.ok(html.includes('/ai-readiness-assessment.html'));
  assert.ok(html.includes('https://calendly.com/zavient/call') && html.includes('mailto:hello@zavient.com'));
});
