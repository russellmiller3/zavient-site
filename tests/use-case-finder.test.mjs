// Checks the AI use case finder's ranking (public/tools/embed/ai-use-case-finder.html) against the Zavient method in
// tools/research/ai-use-case-finder.research.md: the worked examples, the high-risk rule, and that every cited
// source exists. Runs the page's own data and engine scripts, so the test and the page cannot drift apart.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../public/tools/embed/ai-use-case-finder.html', import.meta.url), 'utf8');
const block = (id) => html.match(new RegExp(`<script id="${id}">([\\s\\S]*?)</script>`))[1];
const ctx = { module: { exports: {} } };
vm.runInNewContext(`${block('data')}\n${block('engine')}\nmodule.exports.DATA = DATA;`, ctx);
const { DATA, rank, score, peerTier, fitLabel } = ctx.module.exports;
const r1 = (n) => Math.round(n * 10) / 10;
// JSON round trip: arrays made inside the vm context fail deepEqual against arrays made here.
const top = (ind, team, size) => JSON.parse(JSON.stringify(rank(DATA, ind, team, size).list.map((x) => [x.id, r1(x.s)])));
const SIZES = ['40-99', '100-249', '250-500'];

test('worked examples match the research', () => {
  // Insurance, underwriting and claims, 100-249 people (research section 4).
  assert.deepEqual(top('insurance', 'core', '100-249'), [
    ['claim-letters', 44.8], ['guideline-answers', 43.5], ['claims-intake', 20], ['underwriting-intake', 20]]);
  // Manufacturing operations at 40-99: predictive maintenance is a build, so 33.0 x 0.8 = 26.4, below work instructions.
  const mfg = top('manufacturing', 'operations', '40-99');
  assert.deepEqual(mfg.find((x) => x[0] === 'predictive-maintenance'), ['predictive-maintenance', 26.4]);
  assert.ok(mfg.findIndex((x) => x[0] === 'work-instructions') < mfg.findIndex((x) => x[0] === 'predictive-maintenance'));
  // Hand checks of the formula: support assist 1.0 x 1.0 x 1.0 x 1.0 x 0.85 = 85; month-end close 0.9 x 0.9 x 0.8 x 0.8 x 1.0 = 51.8.
  assert.equal(r1(score(DATA.uc['support-agent-assist'], '100-249')), 85);
  assert.equal(r1(score(DATA.uc['close-reconciliation'], '100-249')), 51.8);
  assert.equal(r1(score(DATA.uc['phone-answering'], '100-249')), 19.2);
});

test('every pick gives 3 to 5 uses and never puts a high-risk use first', () => {
  for (const ind of DATA.industries) for (const t of DATA.teams) for (const s of SIZES) {
    const r = rank(DATA, ind.id, t.id, s);
    assert.ok(r.list.length >= 3 && r.list.length <= 5, `${ind.id}|${t.id}: ${r.list.length} uses`);
    assert.notEqual(r.list[0].u.risk, 'high', `${ind.id}|${t.id}|${s}: high-risk use ranked first`);
    for (let k = 1; k < r.list.length; k++) if (!r.list[k].held && !r.list[0].held) assert.ok(r.list[k - 1].s >= r.list[k].s);
  }
  // A made-up cell where the high-risk use scores highest: it moves to second place and is marked as held back.
  const D = { ...DATA, cells: { 'x|y': { ids: ['credit-scoring', 'claim-letters'] } },
    uc: { ...DATA.uc, 'credit-scoring': { ...DATA.uc['credit-scoring'], ev: 'rct', sz: 'large', eff: 'buy' } } };
  const r = rank(D, 'x', 'y', '100-249');
  assert.deepEqual(JSON.parse(JSON.stringify(r.list.map((x) => x.id))), ['claim-letters', 'credit-scoring']);
  assert.ok(r.list[1].held);
});

test('cards show a plain fit label set against the top pick, never a score out of 100', () => {
  // Insurance core at 100-249: 44.8 top, 43.5 close behind, two at 20 (under half the top).
  const r = rank(DATA, 'insurance', 'core', '100-249');
  const top = r.list[0].s;
  assert.deepEqual(JSON.parse(JSON.stringify(r.list.map((x, k) => fitLabel(x, k, top).text))),
    ['Best first pick', 'Strong option', 'Later', 'Later']);
  assert.equal(fitLabel({ s: 30 }, 2, 50).text, 'Good option');
  // Every pick's first card is the best first pick, whatever its raw score.
  for (const ind of DATA.industries) for (const t of DATA.teams) for (const s of SIZES) {
    const q = rank(DATA, ind.id, t.id, s);
    assert.equal(fitLabel(q.list[0], 0, q.list[0].s).text, 'Best first pick');
  }
  assert.ok(!/out of 100/.test(html), 'a raw score out of 100 is shown');
});

test('peer tiers follow the cut points', () => {
  assert.equal(peerTier({ ads: 1509, srch: 760 }), 0.9);
  assert.equal(peerTier({ ads: 911, srch: 164000 }), 1);
  assert.equal(peerTier({ ads: 0, srch: 0 }), 0.7);
});

test('every cited source exists and has a link, except Zavient data', () => {
  const ids = new Set(['S26', 'S29', 'S39', 'S40', 'S41', 'S30', 'S33', 'S82', 'S84', 'Z1', 'Z2', 'Z5']);
  for (const u of Object.values(DATA.uc)) [...u.gsrc, ...u.rsrc].forEach((i) => ids.add(i));
  for (const c of Object.values(DATA.cells)) c.nsrc.forEach((i) => ids.add(i));
  for (const i of DATA.industries) i.ssrc.forEach((x) => ids.add(x));
  for (const id of ids) {
    assert.ok(DATA.sources[id], `missing source ${id}`);
    if (!id.startsWith('Z')) assert.match(DATA.sources[id].u, /^https:\/\//, `${id} has no https link`);
  }
});
