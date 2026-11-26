// Publish gate for golden-template pages (26 Nov 2026). Run before a page gets index: true.
// Usage: node scripts/check-page.mjs <slug | path/to/page.json> [...]   Exits 1 on any FAIL.
// Checks every Site rule a machine can check: BLUF bullets, question title, footnotes on every claim with 2+ sources
// on the bottom line, enough sources from enough sites, own data, the type's required blocks, augmentation and
// no-low-end wording, no leftover TODOs, readability, crossing-page difference test, glossary inbound links, and the
// ICP review log in order. What it can't check (is the question real, is the source honest) is the reviewers' job.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TYPES, COMMON_REQUIRED, REVIEWERS, MIN, BANNED, BLOCKS, DEMAND } from '../src/lib/page-types.mjs';
import { checkPage as readability } from './check-readability.mjs';
import { pageAnswerProblems } from '../src/lib/answer-first.mjs';
import { ownPriceProblems, strings } from '../src/lib/no-own-price.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = join(root, 'src/content/ai-work');
const fns = (t) => [...String(t).matchAll(/\[\^(\d+)\]/g)].map((m) => Number(m[1]));
const allText = (d) => JSON.stringify({ ...d, sources: undefined, reviews: undefined, keyword: undefined });

export function gate(d, { slug = '', siblings = [] } = {}) {
  const fail = []; const warn = [];
  const t = TYPES[d.type || 'usecase'];
  if (!d.templateVersion) fail.push('templateVersion missing: not a golden-template page');
  if (!t) { fail.push(`unknown type ${d.type}`); return { fail, warn }; }

  // Leftover skeleton text
  const todo = allText(d).match(/TODO[^"]{0,60}/g);
  if (todo) fail.push(`${todo.length} TODO slots left, e.g. "${todo[0]}"`);

  // Title: the buyer's real question, no number up front
  if (!/\?$/.test(d.title || '')) fail.push('title must be the buyer\'s question and end with "?"');
  if (/^\s*[\d$]/.test(d.title || '')) fail.push('title starts with a number (clickbait rule)');
  if ((d.title || '').length > 70) fail.push('title over 70 characters');

  // BLUF
  const v = d.verdict || [];
  if (v.length < MIN.verdict[0] || v.length > MIN.verdict[1]) fail.push(`bottom line needs ${MIN.verdict[0]}-${MIN.verdict[1]} bullets, has ${v.length}`);
  v.forEach((b, i) => {
    if (/^\s*[\d$]/.test(b)) fail.push(`bottom line ${i + 1} opens with a number (clickbait rule)`);
    if (new Set(fns(b)).size < MIN.verdictFootnotes) fail.push(`bottom line ${i + 1} needs ${MIN.verdictFootnotes}+ different sources`);
  });

  // Required blocks
  for (const f of [...COMMON_REQUIRED, ...t.required]) {
    const x = d[f];
    if (x === undefined || x === null || (Array.isArray(x) && x.length === 0)) fail.push(`missing required block: ${f}`);
  }
  if ((d.faq || []).length < MIN.faq) fail.push(`FAQ needs ${MIN.faq}+ questions`);
  if ((d.stats || []).length < MIN.stats) fail.push(`key numbers need ${MIN.stats}+`);
  (d.faq || []).forEach((x, i) => { if (!/\?$/.test(x.q)) fail.push(`faq ${i + 1} is not a question`); });

  // Sources and footnotes
  const n = (d.sources || []).length;
  const minSrc = MIN[t.minSources || 'sources'];
  if (n < minSrc) fail.push(`needs ${minSrc}+ sources, has ${n}`);
  const domains = new Set((d.sources || []).map((s) => { try { return new URL(s.url).hostname.replace(/^www\./, ''); } catch { return s.url; } }));
  if (domains.size < Math.min(MIN.domains, minSrc)) fail.push(`sources come from only ${domains.size} sites (want ${MIN.domains}+)`);
  const used = new Set(fns(allText(d)));
  for (const k of used) if (k < 1 || k > n) fail.push(`footnote [^${k}] points at no source`);
  const unused = (d.sources || []).map((_, i) => i + 1).filter((k) => !used.has(k));
  if (unused.length) fail.push(`sources never cited: ${unused.join(', ')}; cite each source on the page or drop it from the list`);
  // Every sentence-bearing prose field should carry a footnote
  const prose = [['summary', d.summary], ...(d.humanRole || []).map((x, i) => [`humanRole ${i + 1}`, x]),
    ...(d.watchOuts || []).map((x, i) => [`watchOut ${i + 1}`, x]), ...(d.faq || []).map((x, i) => [`faq ${i + 1}`, x.a]),
    ...(d.ranked || []).map((x, i) => [`ranked ${i + 1}`, x.why]), ...(d.decisions || []).map((x, i) => [`decision ${i + 1}`, x.know]),
    ['buy', d.buyVsBuild?.buy], ['build', d.buyVsBuild?.build]];
  for (const [where, text] of prose) if (text && fns(text).length === 0) fail.push(`${where} has no footnote`);

  // Publish gate from the site architecture doc (26 Nov 2026): measured demand, one fact only Zavient has, one fact
  // its siblings don't have, a real updated date. A page that fails any check renders noindex and stays out of the
  // sitemap (src/pages/ai-work/[slug].astro, src/integrations/sitemap.mjs).
  const k = d.keyword || {};
  if (!t.skipDemand && !((k.searches || 0) >= DEMAND.searches || ((k.searches || 0) >= DEMAND.nicheSearches && (k.cpc || 0) >= DEMAND.nicheCpc)))
    fail.push(`no measured demand: "${k.phrase || '?'}" has ${k.searches || 0} searches at $${k.cpc || 0}; need ${DEMAND.searches}+, or ${DEMAND.nicheSearches}+ at $${DEMAND.nicheCpc}+ a click`);
  if (d.type !== 'tool' && !d.ownData) fail.push('no own-data block: a page needs a fact only Zavient has (benchmark, job-ad count, dated check, worked example)');
  if (d.ownData) {
    const mine = JSON.stringify(d.ownData.rows);
    const twin = siblings.find((s) => s._slug && s._slug !== slug && s.ownData && JSON.stringify(s.ownData.rows) === mine);
    if (twin) fail.push(`own data is the same as ${twin._slug}'s: a page needs one fact its siblings don't have`);
  }
  const today = new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.updated || '') || d.updated > today) fail.push('updated must be a real date, not in the future (never fake freshness)');

  // Banned wording
  const text = allText(d);
  for (const b of BANNED) { const m = text.match(b.re); if (m) fail.push(`"${m[0]}": ${b.why}`); }

  // Answer-first rule (Russell, 26 Nov 2026): every question heading answered in the first sentence under it
  for (const p of pageAnswerProblems(d)) fail.push(`answer first: ${p}`);

  // No Zavient price or range anywhere (Russell, 26 Nov 2026); market prices with a source stay
  for (const str of strings(d)) for (const p of ownPriceProblems(str)) fail.push(p);

  // Readability (ADHD rule)
  for (const p of readability({ ...d, verdict: v })) fail.push(`readability: ${p}`);

  // Crossing pages must differ from their parent on 4 of 6 dimensions
  if (d.type === 'crossing') {
    const dims = new Set((d.differs || []).map((x) => x.what));
    const hits = t.differsFrom.filter((k) => dims.has(k));
    if (hits.length < 4) fail.push(`crossing differs from its parent on ${hits.length} of 6 (${t.differsFrom.join(', ')}); need 4, else make it a section of the parent`);
  }
  // Glossary pages publish only when 5+ pages link to them
  if (t.minInbound) {
    const inbound = siblings.filter((s) => (s.related || []).includes(slug) || (s.spokes || []).some((x) => x.slug === slug)).length;
    if (inbound < t.minInbound) fail.push(`only ${inbound} pages link here; a ${d.type} page needs ${t.minInbound}+`);
  }

  // ICP review log, in order
  const readers = (d.reviews || []).map((r) => r.reader);
  if (readers.join('|') !== REVIEWERS.join('|')) fail.push(`ICP reviews must be ${REVIEWERS.join(' → ')}; log has ${readers.join(' → ') || 'none'}`);

  return { fail, warn };
}

const here = fileURLToPath(import.meta.url);
if (process.argv[1] === here) {
  const args = process.argv.slice(2);
  const siblings = readdirSync(contentDir).filter((f) => f.endsWith('.json')).map((f) => ({ ...JSON.parse(readFileSync(join(contentDir, f), 'utf8')), _slug: f.replace(/\.json$/, '') }));
  let bad = 0;
  for (const a of args) {
    const path = a.endsWith('.json') ? a : join(contentDir, `${a}.json`);
    if (!existsSync(path)) { console.log(`${a}: not found`); bad++; continue; }
    const slug = path.split('/').pop().replace(/\.json$/, '');
    const { fail, warn } = gate(JSON.parse(readFileSync(path, 'utf8')), { slug, siblings });
    console.log(`${slug}: ${fail.length ? `FAIL (${fail.length})` : 'PASS'}${warn.length ? `, ${warn.length} warnings` : ''}`);
    for (const f of fail) console.log(`  ✗ ${f}`);
    for (const w of warn) console.log(`  ! ${w}`);
    bad += fail.length;
  }
  process.exit(bad ? 1 : 0);
}
export { BLOCKS };
