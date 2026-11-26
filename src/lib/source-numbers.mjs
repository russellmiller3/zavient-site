// Source-number check (26 Nov 2026). The build thread's source-claim check on the 5 private equity pages found 78
// claims the cited source did not back: KPMG 56% that should be 51%, MIT 2x that should be 3x, FinTagging 17% that
// should be 19%, and one study's two figures (54% on its landing page, 46% in its release) used for one claim.
// Russell: "Make it so every fix is structual to templates so it doesnt reoccur". So every percentage, multiple and
// money figure in a sentence that carries a footnote must appear in the cited source's own note (its name or "what"),
// which the researcher writes from the source itself. A number the page works out itself (Zavient's own math) says
// so in the same sentence ("by our math", "we divided"), and the example block is illustrative. The page check also
// fails one source backing two different figures for the same claim on one page.
import { splitSentences } from './sentences.mjs';

// 56%, 56 percent, 3x, 3-fold, $1.2M, $205,000, €15,000, £40k, $1.5 billion
const NUM = /(?:[$€£]\s?\d[\d,]*(?:\.\d+)?(?:\s?(?:[kKmMbB]n?|million|billion|thousand|trillion)\b)?|\b\d[\d,]*(?:\.\d+)?\s?(?:%|x\b|-fold\b|-times\b|\s?per ?cent\b|\s?percent\b))/g;
const MULT = { k: 1e3, thousand: 1e3, m: 1e6, million: 1e6, b: 1e9, bn: 1e9, billion: 1e9, trillion: 1e12 };

// One figure as a comparable key: "pct:56", "x:3", "$:205000". Currency signs count as one kind, so a source in
// dollars backs the same figure written in dollars only; a converted figure belongs in the note too.
export function figure(raw) {
  const s = String(raw).toLowerCase().replace(/,(?=\d{3})/g, '').replace(/\s+/g, ' ').trim();
  const cur = s.match(/^([$€£])\s?(\d+(?:\.\d+)?)\s?([a-z]+)?/);
  if (cur) return `${cur[1]}:${+(+cur[2] * (MULT[cur[3]] || 1)).toPrecision(12)}`;
  const n = parseFloat(s);
  if (/%|percent|per cent/.test(s)) return `pct:${n}`;
  if (/x$|-fold|-times/.test(s)) return `x:${n}`;
  return null;
}
export const figures = (text) => (String(text).replace(/\[\^\d+\]/g, '').match(NUM) || []).map((raw) => ({ raw: raw.trim(), key: figure(raw) })).filter((f) => f.key);

// Zavient's own math, said so in the sentence: the inputs still need their sources, the result does not.
export const OWN_MATH = /\b(?:our|we|zavient(?:'s)?)\b[^.;]{0,50}?\b(?:math|maths|arithmetic|calculat\w*|estimat\w*|divid\w*|multipl\w*|count\w*|tall\w*|check\w*|benchmark\w*|test\w*|analys\w*|review\w*|model\w*)\b|^illustrative\b/i;
const SKIP = new Set(['url', 'sources', 'reviews', 'keyword', 'sourceCheck', 'example', 'related', 'spokes', 'headings']);
function* strings(x, path = '') {
  if (typeof x === 'string') yield [path, x];
  else if (Array.isArray(x)) for (let i = 0; i < x.length; i++) yield* strings(x[i], `${path}[${i}]`);
  else if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) if (!SKIP.has(k)) yield* strings(v, path ? `${path}.${k}` : k);
}
// Every footnoted sentence on the page, with the sources it cites. A key number's num, label and source line read as one.
export function citedSentences(d) {
  const out = [];
  const { stats, ...rest } = d;
  const items = [...strings(rest), ...(stats || []).map((s, i) => [`stats[${i}]`, `${s.num} ${s.label} ${s.source || ''}`])];
  for (const [where, text] of items) for (const s of splitSentences(String(text).replace(/([.!?])((?:\[\^\d+\])+)/g, '$2$1'))) {
    const cites = [...new Set([...s.matchAll(/\[\^(\d+)\]/g)].map((m) => +m[1]))];
    if (cites.length) out.push({ where, sentence: s, cites });
  }
  return out;
}
const noteFigures = (src) => new Set(figures(`${src?.name || ''} ${src?.what || ''}`).map((f) => f.key));

export function numberProblems(d) {
  const notes = (d.sources || []).map(noteFigures);
  const out = [];
  for (const { where, sentence, cites } of citedSentences(d)) {
    if (OWN_MATH.test(sentence)) continue;
    for (const f of figures(sentence)) {
      if (!cites.some((c) => notes[c - 1]?.has(f.key))) out.push(`${where}: ${f.raw} is not in source ${cites.join(', ')}'s note: check it against the source and put the source's own figure in its "what" note, or say it is our math: "${sentence.replace(/\[\^\d+\]/g, '').slice(0, 80)}"`);
    }
  }
  return out;
}

// One source, two different percentages for the same claim (the Big "I" 54% vs 46% case): two sentences that cite the
// same source, give different percentages, and share most of their words. Pick one figure, say which release it is from.
const STOP = new Set('a an the and or of to for in on at by with is are be was were that this it its their they as from than more most less about who which what how use uses used using ai'.split(' '));
const words = (s) => new Set((s.toLowerCase().replace(/\[\^\d+\]/g, '').match(/[a-z]{3,}/g) || []).filter((w) => !STOP.has(w)).map((w) => w.replace(/(?:ies|es|s|ing|ed)$/, '')));
export function twoFigureProblems(d) {
  const out = [];
  const byCite = new Map();
  for (const c of citedSentences(d)) {
    const pcts = figures(c.sentence).filter((f) => f.key.startsWith('pct:'));
    if (pcts.length !== 1) continue;
    for (const n of c.cites) { if (!byCite.has(n)) byCite.set(n, []); byCite.get(n).push({ ...c, pct: pcts[0], w: words(c.sentence) }); }
  }
  const seen = new Set();
  for (const [n, list] of byCite) for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const a = list[i]; const b = list[j];
    if (a.pct.key === b.pct.key) continue;
    const inter = [...a.w].filter((w) => b.w.has(w)).length;
    const sim = inter / Math.min(a.w.size, b.w.size || 1);
    const key = `${n}|${[a.pct.key, b.pct.key].sort()}`;
    // Rows of one table or list are parallel facts (17% of one group, 33% of another), not one claim twice.
    const parent = (w) => w.replace(/\[\d+\](?:\.cells)?(?:\[\d+\])?$/, '').replace(/\[\d+\]$/, '');
    if (parent(a.where) === parent(b.where) || /^stats\[/.test(a.where) && /^stats\[/.test(b.where)) continue;
    if (sim >= 0.8 && a.w.size >= 4 && !seen.has(key)) { seen.add(key); out.push(`source ${n} backs two figures for one claim (${a.pct.raw} at ${a.where}, ${b.pct.raw} at ${b.where}): use one, and name which release it comes from`); }
  }
  return out;
}

// Survey scope (26 Nov 2026): the source-claim check found figures moved to the wrong group or unit (workday vs week,
// companies vs weaknesses, sponsors vs operating partners, global vs US). A survey's note names who answered
// ("Survey of 200 PE leaders"), and every sentence that cites a survey percentage names that group too, in a word
// the note uses, so the reader knows whose answer it is.
export const SURVEY = /\b(?:survey(?:ed)?|poll(?:ed)?|respondents?|questionnaire)\b/i;
const GROUP_STOP = new Set('the and of at in with from who for across their its our than more over under about some all each per firms? '.split(' '));
export function surveyGroup(note) {
  const m = String(note).match(/\b(?:of|n\s?=)\s?(\d[\d,]*)\s+((?:[A-Za-z][\w&'-]*\s?){1,5})/i);
  if (!m) return null;
  const w = m[2].trim().split(/\s+/).filter((x) => !GROUP_STOP.has(x.toLowerCase())).slice(0, 4);
  return w.length ? w : null;
}
const stemW = (w) => w.toLowerCase().replace(/(?:ies|es|s)$/, '');
export function surveyScopeProblems(d) {
  const out = [];
  const src = d.sources || [];
  src.forEach((s, i) => { if (SURVEY.test(s.what || '') && !surveyGroup(s.what)) out.push(`source ${i + 1} is a survey but its note doesn't say who answered: write "Survey of N <group>" (for example "Survey of 200 PE leaders")`); });
  for (const { where, sentence, cites } of citedSentences(d)) {
    if (!figures(sentence).some((f) => f.key.startsWith('pct:')) || OWN_MATH.test(sentence)) continue;
    const groups = cites.map((c) => src[c - 1]).filter((s) => s && SURVEY.test(s.what || '')).map((s) => surveyGroup(s.what)).filter(Boolean);
    if (!groups.length || groups.length < cites.length) continue; // a non-survey source may back the figure
    const sw = new Set((sentence.match(/[A-Za-z][\w&'-]*/g) || []).map(stemW));
    if (!groups.some((g) => g.some((w) => sw.has(stemW(w))))) out.push(`${where}: a survey figure without its group: say whose answer it is, in the note's words (${groups.map((g) => g.join(' ')).join(' / ')}): "${sentence.replace(/\[\^\d+\]/g, '').slice(0, 80)}"`);
  }
  return out;
}

// Vendor prices (26 Nov 2026): DealRoom and Midaxo prices on the PE pages were stale, and a cached copy is not the
// vendor's page. A sentence that quotes a price per seat, user, month, year or plan cites a source whose note says
// when it was read ("Read 26 Nov 2026" or "Read 2026-11-26"), within 120 days of the page's updated date. The live
// check (scripts/check-prices.mjs) opens each such source and looks for the figure on the vendor's page today.
export const PRICE = /[$€£]\s?\d[^.;]{0,40}?\b(?:per|a|an|\/)\s?(?:seat|user|month|mo|year|yr|licen[cs]e|plan|member|agent|page|document|invoice|credit|call|minute|hour)\b|\b(?:billed|plans?|pricing|subscription|list price|starts? at|from)\b[^.;]{0,30}?[$€£]\s?\d/i;
const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
export function readDate(note) {
  const s = String(note);
  let m = s.match(/\bRead:?\s*(\d{4})-(\d{2})-(\d{2})\b/i);
  if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3]);
  m = s.match(/\bRead:?\s*(?:on\s)?(\d{1,2})\s([A-Za-z]{3})[a-z]*\.?\s(\d{4})\b/i);
  if (m && MONTHS[m[2].toLowerCase()] !== undefined) return Date.UTC(+m[3], MONTHS[m[2].toLowerCase()], +m[1]);
  return null;
}
export const PRICE_MAX_AGE_DAYS = 120;
export function priceProblems(d) {
  const out = [];
  const src = d.sources || [];
  const page = /^\d{4}-\d{2}-\d{2}$/.test(d.updated || '') ? Date.parse(`${d.updated}T00:00:00Z`) : null;
  const flagged = new Set();
  for (const { where, sentence, cites } of citedSentences(d)) {
    if (!PRICE.test(sentence.replace(/\[\^\d+\]/g, '')) || OWN_MATH.test(sentence)) continue;
    for (const c of cites) {
      const s = src[c - 1];
      if (!s || flagged.has(c)) continue;
      const r = readDate(s.what);
      if (r === null) { flagged.add(c); out.push(`source ${c} backs a price (${where}) but its note has no read date: open the vendor's page, confirm the price, and add "Read D Mon YYYY"`); }
      else if (page && (page - r) / 864e5 > PRICE_MAX_AGE_DAYS) { flagged.add(c); out.push(`source ${c} backs a price (${where}) but was read over ${PRICE_MAX_AGE_DAYS} days before the page's update: check the vendor's page again`); }
    }
  }
  return out;
}

// Everything this file checks, one count per page, for the page check's ratchet (src/lib/claim-baseline.json).
export const claimProblems = (d) => [...numberProblems(d), ...twoFigureProblems(d), ...surveyScopeProblems(d), ...priceProblems(d)];
