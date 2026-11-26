// Live source-figure check (26 Nov 2026). The build thread's source-claim check on the 5 PE pages found 78 claims the
// sources did not back (KPMG 56% for 51%, MIT 2x for 3x) and stale vendor prices (DealRoom, Midaxo). The page check
// can only compare a figure with the source's note; this opens each cited source and looks for the figure in the
// source's own text today. Run it in the source-claim step (step 4 of the brief); it needs the network, so the build
// doesn't run it. A page it can't read (PDF, robot check, sign-in) is listed for a person to open, never skipped.
// Never check against a cached or archived copy: the live page is the source.
// Usage: node scripts/check-source-figures.mjs <slug | path.json> [--prices]   (--prices: only price sentences)
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { citedSentences, figures, OWN_MATH, PRICE } from '../src/lib/source-numbers.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = process.argv[2];
if (!arg) { console.error('usage: node scripts/check-source-figures.mjs <slug | path.json> [--prices]'); process.exit(1); }
const d = JSON.parse(readFileSync(arg.endsWith('.json') ? arg : join(root, 'src/content/ai-work', `${arg}.json`), 'utf8'));
const onlyPrices = process.argv.includes('--prices');

// The ways a source might print one figure: 51%, 51 percent, $1,200, $1.2K, 3x, three times is left to a person.
const variants = (raw) => {
  const n = raw.replace(/[^\d.]/g, '');
  const withCommas = Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
  return [raw, n, withCommas, `${n} percent`, `${n}%`, `${n}x`, `${n} times`].map((v) => v.toLowerCase());
};
const text = (html) => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').toLowerCase();

const pages = new Map();
async function read(url) {
  if (!pages.has(url)) pages.set(url, (async () => {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (source check)' }, signal: AbortSignal.timeout(25000) });
      const type = r.headers.get('content-type') || '';
      if (!r.ok) return { err: `status ${r.status}` };
      if (!/html|text/.test(type)) return { err: `not a web page (${type.split(';')[0]}): open it by hand` };
      return { body: text(await r.text()) };
    } catch (e) { return { err: e.cause?.code || e.cause?.message || e.name }; }
  })());
  return pages.get(url);
}

let missing = 0; let unread = 0;
for (const { where, sentence, cites } of citedSentences(d)) {
  if (OWN_MATH.test(sentence)) continue;
  if (onlyPrices && !PRICE.test(sentence.replace(/\[\^\d+\]/g, ''))) continue;
  const figs = figures(sentence);
  if (!figs.length) continue;
  const reads = await Promise.all(cites.map((c) => d.sources?.[c - 1]?.url).filter((u) => u && !u.startsWith('/')).map(async (u) => ({ u, ...(await read(u)) })));
  const bodies = reads.filter((r) => r.body);
  for (const f of figs) {
    if (bodies.some((r) => variants(f.raw).some((v) => r.body.includes(v)))) continue;
    if (!bodies.length) { unread++; console.log(`  ? ${where}: ${f.raw}: couldn't read ${reads.map((r) => `${r.u} (${r.err})`).join(', ') || 'a source'}`); continue; }
    missing++;
    console.log(`  ✗ ${where}: ${f.raw} not found in ${bodies.map((r) => r.u).join(', ')}: "${sentence.replace(/\[\^\d+\]/g, '').slice(0, 90)}"`);
  }
}
console.log(`${missing} figures not found on their source's page; ${unread} on pages to open by hand`);
process.exit(missing ? 1 : 0);
