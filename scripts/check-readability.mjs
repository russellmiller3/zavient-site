// ADHD-friendly writing check for indexed AI-work pages (26 Nov 2026).
// Russell: "In the bottom line, you have to make it bullets that are easy to scan. You have to make everything ADHD
// friendly, and those need to be rules." Short sentences, one idea per bullet, scannable blocks.
// Usage: node scripts/check-readability.mjs [slug ...]   (no slug = every indexed page). Exits 1 on any problem.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const LIMITS = { sentenceWords: 25, bulletSentences: 2, paraSentences: 3, cellSentences: 2, verdictMin: 3, verdictMax: 5, verdictItemWords: 30 };

const clean = (t) => String(t).replace(/\[\^\d+\]/g, '').replace(/https?:\/\/\S+/g, 'URL').trim();
export const sentences = (t) => clean(t).split(/(?<=[.!?])\s+(?=[A-Z0-9"“$(])/).filter((s) => s.trim());
const words = (s) => s.split(/\s+/).filter(Boolean).length;

export function checkPage(d) {
  const out = [];
  const L = LIMITS;
  const sent = (where, t) => { for (const s of sentences(t)) if (words(s) > L.sentenceWords) out.push(`${where}: sentence of ${words(s)} words (max ${L.sentenceWords}): "${s.slice(0, 80)}..."`); };
  const block = (where, t, max) => { sent(where, t); const n = sentences(t).length; if (n > max) out.push(`${where}: ${n} sentences (max ${max}): "${clean(t).slice(0, 80)}..."`); };
  const v = Array.isArray(d.verdict) ? d.verdict : [];
  if (v.length < L.verdictMin || v.length > L.verdictMax) out.push(`verdict: ${v.length} bullets (want ${L.verdictMin} to ${L.verdictMax})`);
  v.forEach((b, i) => { block(`verdict[${i}]`, b, L.bulletSentences); if (words(clean(b)) > L.verdictItemWords) out.push(`verdict[${i}]: ${words(clean(b))} words (max ${L.verdictItemWords})`); });
  block('summary', d.summary, L.paraSentences);
  (d.onPage || []).forEach((o, i) => block(`onPage[${i}]`, o.text, 1));
  (d.watchOuts || []).forEach((t, i) => block(`watchOuts[${i}]`, t, L.bulletSentences));
  (d.pickElse || []).forEach((t, i) => block(`pickElse[${i}]`, t, L.bulletSentences));
  (d.howToTest || []).forEach((t, i) => block(`howToTest[${i}]`, t, L.bulletSentences));
  if (d.buyVsBuild) { block('buyVsBuild.buy', d.buyVsBuild.buy, L.paraSentences); block('buyVsBuild.build', d.buyVsBuild.build, L.paraSentences); }
  (d.recipes || []).forEach((r, i) => { block(`recipes[${i}].when`, r.when, L.bulletSentences); block(`recipes[${i}].cost`, r.cost, L.bulletSentences); });
  (d.spokes || []).forEach((s, i) => block(`spokes[${i}].why`, s.why, L.bulletSentences));
  (d.rules || []).forEach((r, i) => block(`rules[${i}].what`, r.what, L.paraSentences));
  (d.stats || []).forEach((s, i) => block(`stats[${i}].label`, s.label, 1));
  if (d.ownData) { block('ownData.intro', d.ownData.intro, L.paraSentences); block('ownData.note', d.ownData.note, L.paraSentences); d.ownData.rows.forEach((r, i) => r.forEach((c, j) => block(`ownData.rows[${i}][${j}]`, c, L.cellSentences))); }
  (d.tables || []).forEach((t, k) => { block(`tables[${k}].intro`, t.intro, L.paraSentences); if (t.note) block(`tables[${k}].note`, t.note, L.paraSentences); t.rows.forEach((r, i) => r.cells.forEach((c, j) => block(`tables[${k}].rows[${i}][${j}]`, c, L.cellSentences))); });
  if (d.offer) block('offer.body', d.offer.body, L.paraSentences);
  // Golden-template blocks (26 Nov 2026)
  (d.humanRole || []).forEach((t, i) => block(`humanRole[${i}]`, t, L.bulletSentences));
  for (const f of ['teamAfter', 'walkAway', 'forward']) (d[f] || []).forEach((t, i) => block(`${f}[${i}]`, t, L.bulletSentences));
  (d.applies || []).forEach((x, i) => block(`applies[${i}].then`, x.then, L.cellSentences));
  (d.faq || []).forEach((x, i) => block(`faq[${i}].a`, x.a, L.paraSentences));
  (d.ranked || []).forEach((x, i) => { block(`ranked[${i}].why`, x.why, L.bulletSentences); block(`ranked[${i}].payoff`, x.payoff, 1); });
  (d.decisions || []).forEach((x, i) => block(`decisions[${i}].know`, x.know, L.cellSentences));
  (d.timeline || []).forEach((x, i) => block(`timeline[${i}].what`, x.what, L.cellSentences));
  if (d.tool) { d.tool.steps.forEach((t, i) => block(`tool.steps[${i}]`, t, L.bulletSentences)); d.tool.method.forEach((t, i) => block(`tool.method[${i}]`, t, L.bulletSentences)); }
  if (d.example) { block('example.input', d.example.input, L.paraSentences); block('example.output', d.example.output, L.paraSentences); }
  return out;
}

const here = dirname(fileURLToPath(import.meta.url));
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = join(here, '..', 'src/content/ai-work');
  const slugs = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));
  let bad = 0;
  for (const s of slugs) {
    const d = JSON.parse(readFileSync(join(dir, `${s}.json`), 'utf8'));
    if (!d.index) continue;
    const p = checkPage(d);
    bad += p.length;
    console.log(`${s}: ${p.length ? p.length + ' problems' : 'OK'}`);
    for (const x of p) console.log('  - ' + x);
  }
  process.exit(bad ? 1 : 0);
}
