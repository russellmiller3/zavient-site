// ADHD-friendly writing check for indexed AI-work pages (26 Nov 2026).
// Russell: "In the bottom line, you have to make it bullets that are easy to scan. You have to make everything ADHD
// friendly, and those need to be rules." Short sentences, one idea per bullet, scannable blocks.
// Usage: node scripts/check-readability.mjs [slug ...]   (no slug = every indexed page, plus the built home, About,
// AI-work hub, data stories and readiness check; run after `npm run build`). Exits 1 on any problem.
// Mobile/ADHD audit (26 Nov 2026): bottom-line bullets of 20 words or fewer with at most 2 footnotes, opening
// paragraph of 50 words or fewer, and the same sentence and paragraph limits on the hand-built pages.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitSentences } from '../src/lib/sentences.mjs';

export const LIMITS = { sentenceWords: 25, bulletSentences: 2, paraSentences: 3, cellSentences: 2, verdictMin: 3, verdictMax: 5, verdictItemWords: 20, verdictFootnotes: 2, summaryWords: 50 };

const clean = (t) => String(t).replace(/\[\^\d+\]/g, '').replace(/https?:\/\/\S+/g, 'URL').trim();
// Shared splitter (src/lib/sentences.mjs): initials and abbreviations ("J.D. Power", "U.S. Census") don't end a sentence.
export const sentences = (t) => splitSentences(clean(t));
const words = (s) => s.split(/\s+/).filter(Boolean).length;

export function checkPage(d) {
  const out = [];
  const L = LIMITS;
  const sent = (where, t) => { for (const s of sentences(t)) if (words(s) > L.sentenceWords) out.push(`${where}: sentence of ${words(s)} words (max ${L.sentenceWords}): "${s.slice(0, 80)}..."`); };
  const block = (where, t, max) => { sent(where, t); const n = sentences(t).length; if (n > max) out.push(`${where}: ${n} sentences (max ${max}): "${clean(t).slice(0, 80)}..."`); };
  const v = Array.isArray(d.verdict) ? d.verdict : [];
  if (v.length < L.verdictMin || v.length > L.verdictMax) out.push(`verdict: ${v.length} bullets (want ${L.verdictMin} to ${L.verdictMax})`);
  v.forEach((b, i) => {
    block(`verdict[${i}]`, b, L.bulletSentences);
    if (words(clean(b)) > L.verdictItemWords) out.push(`verdict[${i}]: ${words(clean(b))} words (max ${L.verdictItemWords})`);
    const fns = (String(b).match(/\[\^\d+\]/g) || []).length;
    if (fns > L.verdictFootnotes) out.push(`verdict[${i}]: ${fns} footnotes (max ${L.verdictFootnotes})`);
  });
  block('summary', d.summary, L.paraSentences);
  if (words(clean(d.summary || '')) > L.summaryWords) out.push(`summary: ${words(clean(d.summary))} words (max ${L.summaryWords})`);
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

// Hand-built pages (home, About, hub, data stories, readiness check): check each paragraph and list item of the built
// HTML. Footnote superscripts, scripts, styles, tables, code, the site header and footer and the shared diagnostic
// block (ConsultingCta, a template the template owner checks) are left out.
export const HTML_PAGES = ['index.html', 'about.html', 'ai-work.html', 'ai-readiness-assessment.html'];
const decode = (t) => t.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&rarr;/g, '').replace(/&middot;/g, '·').replace(/&#39;|&rsquo;/g, "'").replace(/&quot;|&ldquo;|&rdquo;/g, '"').replace(/&[a-z#0-9]+;/g, ' ');
export function checkHtml(html) {
  const out = [];
  const L = LIMITS;
  const body = html
    .replace(/<(script|style|table|pre|header class="site|footer|nav)[\s\S]*?<\/\1>/g, ' ')
    .replace(/<section class="article-cta"[\s\S]*?<\/section>/g, ' ')
    .replace(/<sup[\s\S]*?<\/sup>/g, '');
  for (const [, tag, inner] of body.matchAll(/<(p|li)\b[^>]*>([\s\S]*?)<\/\1>/g)) {
    if (/<(ul|ol|li)\b/.test(inner)) continue; // a list item holding a nested list is checked through its children
    // A line break starts a new line of its own (e.g. a guide title, then its blurb), so each line is checked alone.
    for (const line of inner.split(/<br\s*\/?>/)) {
      const t = decode(line.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
      if (!t) continue;
      const ss = sentences(t);
      for (const x of ss) if (words(x) > L.sentenceWords) out.push(`<${tag}> sentence of ${words(x)} words (max ${L.sentenceWords}): "${x.slice(0, 80)}..."`);
      if (ss.length > L.paraSentences) out.push(`<${tag}> ${ss.length} sentences (max ${L.paraSentences}): "${t.slice(0, 80)}..."`);
    }
  }
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
  if (!process.argv.slice(2).length) {
    const dist = join(here, '..', 'dist');
    const pages = [...HTML_PAGES, ...(existsSync(join(dist, 'data')) ? readdirSync(join(dist, 'data')) : []).filter((f) => f.endsWith('.html')).map((f) => `data/${f}`)];
    for (const page of pages) {
      const p = checkHtml(readFileSync(join(dist, page), 'utf8'));
      bad += p.length;
      console.log(`${page}: ${p.length ? p.length + ' problems' : 'OK'}`);
      for (const x of p) console.log('  - ' + x);
    }
  }
  process.exit(bad ? 1 : 0);
}
