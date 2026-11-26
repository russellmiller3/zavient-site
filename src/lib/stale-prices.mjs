// Prices that left the vendor's page (round 6, 26 Nov 2026). Russell: "Make it so every fix is structual to templates
// so it doesnt reoccur". The live check found Alkami's prices gone from Alkami's page and community banks cut them,
// but another page could still quote them from the same URL. When a page cuts a vendor price because the vendor's
// live page no longer shows it, add the URL here; the page check then fails every page that quotes a price from it
// (a sentence with a price citing it, or its note holding a money figure). The URL can still back non-price facts.
// Remove an entry only after the vendor's live page shows a price again, read that day.
import { urlKey } from './source-rules.mjs';

export const STALE_PRICES = [
  { url: 'https://www.alkami.com/data-marketing-solutions', vendor: 'Alkami', checked: '2026-11-26', why: 'tier prices ($23K, $47K, $77K a year) no longer on the page' },
];

// The page, not its query string: "?m-search" is the same vendor page.
const page = (url) => urlKey(url || '').replace(/[?#].*$/, '').replace(/\/+$/, '');
const keys = new Map(STALE_PRICES.map((e) => [page(e.url), e]));
export const stalePriceFor = (url) => keys.get(page(url));

const NO_PRICE = /\b(?:shows?|lists?|publish(?:es)?|gives?) no price|\bno (?:public |list |published )?price|\bnot published\b/i;
// figures and isPrice are passed in, so this file doesn't import source-numbers.mjs (which imports it).
export function stalePriceProblems(d, { citedSentences, figures, isPrice }) {
  const out = [];
  const src = d.sources || [];
  src.forEach((s, i) => {
    const e = stalePriceFor(s.url);
    if (e && figures(`${s.name || ''} ${s.what || ''}`).some((f) => /^[$€£]$/.test(f.kind))) out.push(`source ${i + 1} quotes a ${e.vendor} price that left the vendor's page (${e.why}, checked ${e.checked}; src/lib/stale-prices.mjs): cut the price from the note`);
  });
  for (const { where, sentence, cites } of citedSentences(d)) {
    if (!isPrice(sentence)) continue;
    for (const c of cites) {
      const e = stalePriceFor(src[c - 1]?.url);
      if (!e) continue;
      // A sentence can cite the vendor's page to say it shows no price ("while Alkami's bank module shows no price"):
      // only the clause that names the vendor counts, and it fails when it quotes money and doesn't say "no price".
      const plain = sentence.replace(/\[\^\d+\]/g, '');
      const named = plain.split(/[,;:]|\b(?:while|but|whereas)\b/).filter((x) => x.includes(e.vendor));
      const quotes = named.length ? named.some((x) => figures(x).some((f) => /^[$€£]$/.test(f.kind)) && !NO_PRICE.test(x)) : true;
      if (quotes) out.push(`${where}: quotes a ${e.vendor} price that left the vendor's page (checked ${e.checked}): cut it or cite a price on the live page`);
    }
  }
  return out;
}
