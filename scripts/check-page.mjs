// Publish gate for golden-template pages (26 Nov 2026). Run before a page gets index: true.
// Usage: node scripts/check-page.mjs [slug | path/to/page.json ...]   No args = every page; --indexed = every page with
// index: true (what `npm run build` runs, so a failing indexed page stops the deploy). Exits 1 on any FAIL.
// Checks every Site rule a machine can check: BLUF bullets, question title, footnotes on every claim with 2+ sources
// on the bottom line, enough sources from enough sites, own data, the type's required blocks, augmentation and
// no-low-end wording, no leftover TODOs, readability, crossing-page difference test, glossary inbound links, and the
// ICP review log in order, lead sentences, superseded rules, rival firms, own-site links, search-result sources,
// undefined acronyms and page structure (description, key-number footnotes, real slugs, headings, answer slots). What it can't check (is the question real, is the source honest) is the reviewers' job.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TYPES, COMMON_REQUIRED, REVIEWERS, MIN, BANNED, BLOCKS, DEMAND } from '../src/lib/page-types.mjs';
import { checkPage as readability } from './check-readability.mjs';
import { pageAnswerProblems } from '../src/lib/answer-first.mjs';
import { ownPriceProblems, strings } from '../src/lib/no-own-price.mjs';
import { sourceProblems, searchResultProblems } from '../src/lib/source-rules.mjs';
import { pageLeadProblems } from '../src/lib/lead-rules.mjs';
import { staleProblems } from '../src/lib/stale-rules.mjs';
import { rivalProblems } from '../src/lib/rival-firms.mjs';
import { acronymProblems } from '../src/lib/acronyms.mjs';
import { structureProblems } from '../src/lib/structure-rules.mjs';
import { claimProblems } from '../src/lib/source-numbers.mjs';
import { figureCheckProblems } from '../src/lib/figure-check.mjs';
import { edgarProblems } from '../src/lib/edgar-hits.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = join(root, 'src/content/ai-work');
const fns = (t) => [...String(t).matchAll(/\[\^(\d+)\]/g)].map((m) => Number(m[1]));
// Logs (sourceCheck, figureCheck) are never page text (round 5: the rival check hit sourceCheck.fixed lines).
const allText = (d) => JSON.stringify({ ...d, sources: undefined, reviews: undefined, keyword: undefined, sourceCheck: undefined, figureCheck: undefined });

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
  // A root-relative link is our own page: it counts as one site, zavient.com, however many of them there are.
  const domains = new Set((d.sources || []).map((s) => { if (String(s.url).startsWith('/')) return 'zavient.com'; try { return new URL(s.url).hostname.replace(/^www\./, ''); } catch { return s.url; } }));
  if (domains.size < Math.min(MIN.domains, minSrc)) fail.push(`sources come from only ${domains.size} sites (want ${MIN.domains}+)`);
  const used = new Set(fns(allText(d)));
  for (const k of used) if (k < 1 || k > n) fail.push(`footnote [^${k}] points at no source`);
  const unused = (d.sources || []).map((_, i) => i + 1).filter((k) => !used.has(k));
  if (unused.length) fail.push(`sources never cited: ${unused.join(', ')}; cite each source on the page or drop it from the list`);
  // No forum threads, rival consulting firms or content farms as sources (26 Nov 2026 fixes, made structural)
  for (const p of sourceProblems(d.sources)) fail.push(p);
  for (const p of searchResultProblems(d.sources)) fail.push(p);
  // Every sentence-bearing prose field should carry a footnote
  const prose = [['summary', d.summary], ...(d.humanRole || []).map((x, i) => [`humanRole ${i + 1}`, x]),
    ...(d.watchOuts || []).map((x, i) => [`watchOut ${i + 1}`, x]), ...(d.pickElse || []).map((x, i) => [`pick-else ${i + 1}`, x]), ...(d.faq || []).map((x, i) => [`faq ${i + 1}`, x.a]),
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
  // Every lead text says the thing: no meta pointers, no two answers joined by a semicolon, no restated heading (26 Nov 2026)
  for (const p of pageLeadProblems(d)) fail.push(`lead: ${p}`);
  // Superseded rules (SR 11-7, withdrawn CFPB circulars) never cited as current (26 Nov 2026)
  for (const p of staleProblems(d)) fail.push(`stale rule: ${p}`);
  // No rival consulting firm offered or priced, no consultant fee ranges (26 Nov 2026)
  for (const p of rivalProblems(d)) fail.push(`rival firm: ${p}`);
  // Links to our own pages are root-relative ("/about.html"), so previews and a domain move keep working (26 Nov 2026)
  const own = JSON.stringify(d).match(/https?:\/\/(?:www\.)?zavient\.com[^"\s]*/i);
  if (own) fail.push(`absolute link to our own site (${own[0]}): use the root-relative path, e.g. "/about.html"`);

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

  // Page structure: description length, footnotes on key numbers, real slugs, headings, answer slots (26 Nov 2026)
  const slugs = siblings.length ? new Set(siblings.map((x) => x._slug)) : null;
  for (const p of structureProblems(d, slugs)) fail.push(`structure: ${p}`);
  // No undefined shorthand: every business-jargon acronym is spelled out on the page (src/lib/acronyms.mjs)
  for (const p of acronymProblems(d)) fail.push(`acronym: ${p}`);

  // ICP review log, in order
  const readers = (d.reviews || []).map((r) => r.reader);
  if (readers.join('|') !== REVIEWERS.join('|')) fail.push(`ICP reviews must be ${REVIEWERS.join(' → ')}; log has ${readers.join(' → ') || 'none'}`);
  // Source-claim check (26 Nov 2026): a reviewer opens each cited source and confirms it says what the footnote claims.
  // A warning, not a fail, until the pages built before the rule have a log.
  if (!d.sourceCheck) warn.push('no source-claim check logged: open each cited source, confirm it states the claim it backs, and log sourceCheck {date, by, checked, fixed}');
  // Every footnoted figure in its source's note, survey figures with their group, one figure per claim, dated prices
  // (src/lib/source-numbers.mjs, 26 Nov 2026). Round 6 (26 Nov 2026): every page was fixed to zero, so the baseline
  // that let older pages keep their count is gone. Any claim problem fails, on every page.
  for (const p of claimProblems(d)) fail.push(`claim: ${p}`);
  // Round 5 (26 Nov 2026): the live figure check's record (src/lib/figure-check.mjs) and EDGAR hit lists
  // (src/lib/edgar-hits.mjs). Pages built before each rule are listed there, and those lists only shrink.
  for (const p of figureCheckProblems(d, slug)) fail.push(`figure check: ${p}`);
  for (const p of edgarProblems(d, slug)) fail.push(`own data: ${p}`);

  return { fail, warn };
}

const here = fileURLToPath(import.meta.url);
if (process.argv[1] === here) {
  const siblings = readdirSync(contentDir).filter((f) => f.endsWith('.json')).map((f) => ({ ...JSON.parse(readFileSync(join(contentDir, f), 'utf8')), _slug: f.replace(/\.json$/, '') }));
  // No slugs used to mean no pages were checked, so a bare run "passed" while checking nothing. Now it checks every page.
  const named = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const onlyIndexed = process.argv.includes('--indexed');
  const args = named.length ? named : siblings.filter((s) => !onlyIndexed || (s.index && s.templateVersion)).map((s) => s._slug);
  if (!args.length) { console.log('no pages to check'); process.exit(1); }
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
  console.log(`${args.length} pages checked, ${bad ? `${bad} failures` : 'all pass'}`);
  process.exit(bad ? 1 : 0);
}
export { BLOCKS };
