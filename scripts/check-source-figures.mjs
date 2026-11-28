// Live source-figure check (26 Nov 2026). The build thread's source-claim check on the 5 PE pages found 78 claims the
// sources did not back (KPMG 56% for 51%, MIT 2x for 3x) and stale vendor prices (DealRoom, Midaxo). The page check
// can only compare a figure with the source's note; this opens each cited source and looks for the figure in the
// source's own text today. It needs the network, so the build doesn't run it; instead --write records the result on
// the page as figureCheck, and the page check fails a page whose record is missing, older than the page, or lists a
// figure not found (src/lib/figure-check.mjs). Never check against a cached or archived copy: the live page is the source.
//
// Round 5 (26 Nov 2026, the build thread's flagged-figure checkers). Russell: "Make it so every fix is structual to
// templates so it doesnt reoccur". The note check passed an Ivans 98% that was on the page for another claim, an
// Accenture case figure cited as a survey figure, and a count taken from an exhibit. So:
// - a figure found on the page but nowhere near the claim's own words goes to byHand ("found, not near the claim"),
//   and so does a page that can't be read (PDF, robot check, sign-in): a person opens it and copies the source's own
//   sentence into byHand[].quote, which the page check requires;
// - a cited URL that redirects to another page fails: cite the page it lands on (a vendor's moved pricing page);
// - ranges, hedges and word figures ("twice as") come from src/lib/source-numbers.mjs, as in the page check.
// Usage: node scripts/check-source-figures.mjs <slug | path.json> [--prices] [--write]
//   --prices: only price sentences.  --write: save the result on the page as figureCheck (keeps quotes already given).
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { citedSentences, figureGroups, isPrice, wordsToNumbers } from '../src/lib/source-numbers.mjs';
import { findQuote, judgeGroup, claimWords } from '../src/lib/figure-check.mjs';
import { fetchSource } from '../src/lib/fetch-source.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = process.argv[2];
if (!arg) { console.error('usage: node scripts/check-source-figures.mjs <slug | path.json> [--prices] [--write]'); process.exit(1); }
const file = arg.endsWith('.json') ? arg : join(root, 'src/content/ai-work', `${arg}.json`);
const raw = readFileSync(file, 'utf8');
const d = JSON.parse(raw);
const onlyPrices = process.argv.includes('--prices');

// Numbers in words read as digits ("seventy-three percent" holds 73%), as in the page check.
const text = (html) => wordsToNumbers(html).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&#8217;|&rsquo;/g, "'").replace(/\s+/g, ' ').toLowerCase();

// One source at a time, through the proxy with retries (src/lib/fetch-source.mjs): before 28 Nov 2026 every source
// went out at once through Node's fetch, and a proxy refusal read as "Request was cancelled.".
const pages = new Map();
const stats = { ok: 0, blocked: [], failed: [] };
async function read(url) {
  if (!pages.has(url)) {
    const r = await fetchSource(url, { log: (m) => console.log(m) });
    const moved = r.finalUrl && (() => { const a = new URL(url); const b = new URL(r.finalUrl); return a.hostname.replace(/^www\./, '') !== b.hostname.replace(/^www\./, '') || a.pathname.replace(/\/+$/, '') !== b.pathname.replace(/\/+$/, ''); })();
    const out = r.text != null ? { body: text(r.text), moved: moved && r.finalUrl } : { err: r.err, moved: moved && r.finalUrl };
    if (r.text != null) stats.ok++; else if (r.blocked) stats.blocked.push(new URL(url).hostname); else stats.failed.push(`${url} (${r.err})`);
    pages.set(url, out);
  }
  return pages.get(url);
}

const old = d.figureCheck || {};
// Matched on figure + source URL, then position, so moving a block keeps the quote (src/lib/figure-check.mjs).
const quoteFor = (where, fig, url, urls) => findQuote(old.byHand, { where, figure: fig, url, urls });
const notFound = []; const padded = []; const byHand = []; const redirects = new Set();
let checked = 0;
for (const { where, sentence, own } of citedSentences(d)) {
  if (own) continue;
  if (onlyPrices && !isPrice(sentence)) continue;
  const short = sentence.replace(/\[\^\d+\]/g, '').slice(0, 90);
  const words = claimWords(sentence);
  for (const g of figureGroups(sentence)) {
    const sources = [];
    for (const c of g.cites) {
      const u = d.sources?.[c - 1]?.url;
      if (!u || u.startsWith('/')) continue;
      const r = await read(u);
      if (r.moved) redirects.add(`${u} -> ${r.moved}`);
      sources.push({ c, u, body: r.body ?? null, err: r.err });
    }
    const urls = sources.map((s) => s.u);
    const j = judgeGroup({ where, figs: g.figs, sources, words });
    checked += j.checked;
    for (const b of j.byHand) {
      byHand.push({ ...b, quote: quoteFor(where, b.figure, b.url, urls) });
      // A host the egress proxy refuses is a policy, not a fault: said once at the end, not on every figure.
      if (/egress proxy/.test(b.why)) continue;
      console.log(`  ${/not near/.test(b.why) ? '~' : '?'} ${where}: ${b.figure}: ${b.url}: ${b.why}: "${short}"`);
    }
    for (const n of j.notFound) { notFound.push(n); console.log(`  ✗ ${n}: "${short}"`); }
    for (const p of j.padded) { padded.push(p); console.log(`  ✗ ${p}: "${short}"`); }
  }
}
// Every cited web source, figure or not: a redirect means the URL on the page is not the page that was read.
for (const s of d.sources || []) if (s.url && !s.url.startsWith('/')) { const r = await read(s.url); if (r.moved) redirects.add(`${s.url} -> ${r.moved}`); }
for (const r of redirects) console.log(`  ✗ redirects: ${r}: cite the page it lands on`);

const webSources = new Set((d.sources || []).map((x) => x.url).filter((u) => u && !u.startsWith('/'))).size;
const refused = [...new Set(stats.blocked)];
console.log(`sources read: ${stats.ok} of ${webSources}` + (stats.failed.length ? `; failed: ${stats.failed.join('; ')}` : ''));
if (refused.length) console.log(`proxy refused ${refused.length} hosts: use a fetch tool by hand (${refused.join(', ')}), then copy each source's sentence into figureCheck.byHand quote`);
// A quote someone copied by hand is never dropped silently: list any that no longer match a figure on the page.
const kept = new Set(byHand.map((b) => b.quote).filter(Boolean));
for (const b of old.byHand || []) if (b.quote && ![...kept].some((q) => q.includes(b.quote))) console.log(`  ! hand-checked quote no longer matched (${b.where}, ${b.figure}, ${b.url}): copy it back if the claim is still on the page: "${b.quote.slice(0, 120)}"`);
const open = byHand.filter((b) => !b.quote).length;
console.log(`${checked} figures checked; ${notFound.length} not found; ${padded.length} footnotes that don't state their figure; ${redirects.size} redirects; ${byHand.length} to open by hand (${open} without the source's quote)`);
if (process.argv.includes('--write') && !onlyPrices) {
  d.figureCheck = { date: new Date().toISOString().slice(0, 10), checked, notFound, padded, byHand: byHand.map(({ quote, ...b }) => (quote ? { ...b, quote } : b)), redirects: [...redirects] };
  const ind = (raw.match(/\n( +)"/) || [, '  '])[1];
  writeFileSync(file, JSON.stringify(d, null, ind) + (raw.endsWith('\n') ? '\n' : ''));
  console.log(`wrote figureCheck to ${file}`);
}
process.exit(notFound.length || padded.length || redirects.size ? 1 : 0);
