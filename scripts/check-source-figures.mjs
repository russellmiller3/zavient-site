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
// Usage: NODE_USE_ENV_PROXY=1 node scripts/check-source-figures.mjs <slug | path.json> [--prices] [--write]
//   --prices: only price sentences.  --write: save the result on the page as figureCheck (keeps quotes already given).
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { citedSentences, figures, isPrice } from '../src/lib/source-numbers.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = process.argv[2];
if (!arg) { console.error('usage: node scripts/check-source-figures.mjs <slug | path.json> [--prices] [--write]'); process.exit(1); }
const file = arg.endsWith('.json') ? arg : join(root, 'src/content/ai-work', `${arg}.json`);
const raw = readFileSync(file, 'utf8');
const d = JSON.parse(raw);
const onlyPrices = process.argv.includes('--prices');

// The ways a source might print one figure: 51%, 51 percent, $1,200, $1.2K, 3x, three times.
const WORD = { 2: ['twice', 'double', 'two times'], 3: ['three times', 'triple', 'threefold'], 4: ['four times', 'fourfold'], 5: ['five times', 'fivefold'], 10: ['ten times', 'tenfold'] };
export const variants = (f) => {
  const n = String(f.value);
  const withCommas = Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
  const out = [f.raw, withCommas, `${n} percent`, `${n}%`, `${n} %`, `${n}x`, `${n} times`, `${n}-fold`];
  if (f.kind === 'x') out.push(...(WORD[f.value] || []), `${n}:1`, `${n} to 1`);
  if (/^[$€£]$/.test(f.kind)) for (const [u, m] of [['billion', 1e9], ['million', 1e6], ['k', 1e3]]) if (f.value >= m) { const v = +(f.value / m).toPrecision(6); out.push(`${f.kind}${v} ${u}`, `${f.kind}${v}${u[0]}`, `${v} ${u}`); }
  if (/^[$€£]$/.test(f.kind)) out.push(`${f.kind}${withCommas}`);
  return [...new Set(out.map((v) => v.toLowerCase()))].filter((v) => v.length > 1);
};
const text = (html) => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&#8217;|&rsquo;/g, "'").replace(/\s+/g, ' ').toLowerCase();

// The claim's own words, to test that the figure sits near them on the source's page (not elsewhere on it).
const STOP = new Set('about after also among because before being between both could each from have into just more most other over same some such than that their them then there these they this those through under very what when where which while will with would your said says percent firms companies company'.split(' '));
const claimWords = (s) => [...new Set((s.toLowerCase().replace(/\[\^\d+\]/g, '').match(/[a-z]{4,}/g) || []).filter((w) => !STOP.has(w)).map((w) => w.replace(/(?:ies|es|s|ing|ed)$/, '').slice(0, 7)))];
const near = (body, v, words) => {
  for (let i = body.indexOf(v); i >= 0; i = body.indexOf(v, i + 1)) {
    const win = body.slice(Math.max(0, i - 300), i + v.length + 300);
    if (words.filter((w) => win.includes(w)).length >= Math.min(2, words.length)) return true;
  }
  return false;
};

const pages = new Map();
async function read(url) {
  if (!pages.has(url)) pages.set(url, (async () => {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (source check)' }, signal: AbortSignal.timeout(25000) });
      const type = r.headers.get('content-type') || '';
      const moved = r.redirected && (() => { const a = new URL(url); const b = new URL(r.url); return a.hostname.replace(/^www\./, '') !== b.hostname.replace(/^www\./, '') || a.pathname.replace(/\/+$/, '') !== b.pathname.replace(/\/+$/, ''); })();
      if (!r.ok) return { err: `status ${r.status}`, moved: moved && r.url };
      if (!/html|text/.test(type)) return { err: `not a web page (${type.split(';')[0]})`, moved: moved && r.url };
      return { body: text(await r.text()), moved: moved && r.url };
    } catch (e) { return { err: e.cause?.code || e.cause?.message || e.name }; }
  })());
  return pages.get(url);
}

const old = d.figureCheck || {};
const quoteFor = (where, fig) => (old.byHand || []).find((b) => b.where === where && b.figure === fig)?.quote;
const notFound = []; const byHand = []; const redirects = new Set();
let checked = 0;
for (const { where, sentence, cites, own } of citedSentences(d)) {
  if (own) continue;
  if (onlyPrices && !isPrice(sentence)) continue;
  const figs = figures(sentence);
  if (!figs.length) continue;
  const urls = cites.map((c) => d.sources?.[c - 1]?.url).filter((u) => u && !u.startsWith('/'));
  const reads = await Promise.all(urls.map(async (u) => ({ u, ...(await read(u)) })));
  for (const r of reads) if (r.moved) redirects.add(`${r.u} -> ${r.moved}`);
  const bodies = reads.filter((r) => r.body);
  const words = claimWords(sentence);
  const short = sentence.replace(/\[\^\d+\]/g, '').slice(0, 90);
  for (const f of figs) {
    checked++;
    const vs = variants(f);
    const hits = bodies.filter((r) => vs.some((v) => r.body.includes(v)));
    if (hits.some((r) => vs.some((v) => near(r.body, v, words)))) continue;
    if (hits.length) {
      byHand.push({ where, figure: f.raw, url: hits[0].u, why: 'found on the page, but not near the claim\'s words: confirm it backs this claim', quote: quoteFor(where, f.raw) });
      console.log(`  ~ ${where}: ${f.raw} is on ${hits[0].u} but not near the claim: "${short}"`);
      continue;
    }
    if (!bodies.length) {
      const why = reads.map((r) => r.err).join(', ') || 'no web source';
      byHand.push({ where, figure: f.raw, url: reads[0]?.u || '', why: `couldn't read the source (${why}): open it and copy its sentence`, quote: quoteFor(where, f.raw) });
      console.log(`  ? ${where}: ${f.raw}: couldn't read ${reads.map((r) => `${r.u} (${r.err})`).join(', ') || 'a source'}`);
      continue;
    }
    notFound.push(`${where}: ${f.raw} not found in ${bodies.map((r) => r.u).join(', ')}`);
    console.log(`  ✗ ${where}: ${f.raw} not found in ${bodies.map((r) => r.u).join(', ')}: "${short}"`);
  }
}
// Every cited web source, figure or not: a redirect means the URL on the page is not the page that was read.
for (const s of d.sources || []) if (s.url && !s.url.startsWith('/')) { const r = await read(s.url); if (r.moved) redirects.add(`${s.url} -> ${r.moved}`); }
for (const r of redirects) console.log(`  ✗ redirects: ${r}: cite the page it lands on`);

const open = byHand.filter((b) => !b.quote).length;
console.log(`${checked} figures checked; ${notFound.length} not found; ${redirects.size} redirects; ${byHand.length} to open by hand (${open} without the source's quote)`);
if (process.argv.includes('--write') && !onlyPrices) {
  d.figureCheck = { date: new Date().toISOString().slice(0, 10), checked, notFound, byHand: byHand.map(({ quote, ...b }) => (quote ? { ...b, quote } : b)), redirects: [...redirects] };
  const ind = (raw.match(/\n( +)"/) || [, '  '])[1];
  writeFileSync(file, JSON.stringify(d, null, ind) + (raw.endsWith('\n') ? '\n' : ''));
  console.log(`wrote figureCheck to ${file}`);
}
process.exit(notFound.length || redirects.size ? 1 : 0);
