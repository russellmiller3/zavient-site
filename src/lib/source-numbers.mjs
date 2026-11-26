// Source-number check (26 Nov 2026). The build thread's source-claim check on the 5 private equity pages found 78
// claims the cited source did not back: KPMG 56% that should be 51%, MIT 2x that should be 3x, FinTagging 17% that
// should be 19%, and one study's two figures (54% on its landing page, 46% in its release) used for one claim.
// Russell: "Make it so every fix is structual to templates so it doesnt reoccur". So every percentage, multiple and
// money figure in a sentence that carries a footnote must appear in the cited source's own note (its name or "what"),
// which the researcher writes from the source itself. A number the page works out itself (Zavient's own math) says
// so in the same sentence ("by our math", "we divided"), and the example block is illustrative. The page check also
// fails one source backing two different figures for the same claim on one page.
import { splitSentences } from './sentences.mjs';
import { mirrorProblems } from './source-rules.mjs';

// 56%, 56 percent, 3x, 3-fold, $1.2M, $205,000, €15,000, £40k, $1.5 billion
const NUM = /(?:[$€£]\s?\d[\d,]*(?:\.\d+)?(?:\s?(?:[kKmMbB]n?|million|billion|thousand|trillion)\b)?|\b\d[\d,]*(?:\.\d+)?\s?(?:%|x\b|-fold\b|-times\b|\s?per ?cent\b|\s?percent\b))/g;
const MULT = { k: 1e3, thousand: 1e3, m: 1e6, million: 1e6, b: 1e9, bn: 1e9, billion: 1e9, trillion: 1e12 };

// Round 5 (26 Nov 2026, the build thread's flagged-figure checkers). Russell: "Make it so every fix is structual to
// templates so it doesnt reoccur".
// - Ranges ("20-50%", "10–15%", "$10-50k", "between 20 and 50%") count as two figures, so the low end is checked too.
// - Word figures count: "twice as", "doubled", "three times as", "2 to 1", "3:1" are multiples (x:2, x:3).
// - A hedge word sets the tolerance (see backs()): "about 32%" is backed by a note's 32.6%; a bare "32%" is not,
//   because 32.6 rounds to 33. "More than", "nearly", "under" and "up to" each say which side the source's figure is on.
const UNIT = '(%|\\s?percent\\b|\\s?per ?cent\\b|x\\b|-fold\\b|\\s?times\\b)';
const RANGE = new RegExp(`\\b(\\d[\\d,]*(?:\\.\\d+)?)\\s?(?:-|–|—|to)\\s?(\\d[\\d,]*(?:\\.\\d+)?)${UNIT}`, 'gi');
const BETWEEN = new RegExp(`\\bbetween (\\d[\\d,]*(?:\\.\\d+)?) and (\\d[\\d,]*(?:\\.\\d+)?)${UNIT}`, 'gi');
const MONEY_RANGE = /([$€£])\s?(\d[\d,]*(?:\.\d+)?)\s?(?:-|–|—|to)\s?(?:[$€£]\s?)?(\d[\d,]*(?:\.\d+)?)\s?([kKmMbB]n?\b|million\b|billion\b|thousand\b|trillion\b)?/g;
const WORDNUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twice: 2, double: 2, doubled: 2, triple: 3, tripled: 3, quadruple: 4, quadrupled: 4 };
const WORD_X = /\b(?:(twice|double|triple|quadruple)\s+(?=as\b|the\b|that\b|what\b)|(doubled|tripled|quadrupled)\b|(one|two|three|four|five|six|seven|eight|nine|ten|\d+(?:\.\d+)?)\s+times\s+(?=as\b|more\b|less\b|fewer\b|faster\b|slower\b|higher\b|lower\b|greater\b|larger\b|bigger\b|the\b|over\b|what\b|that\b))|\b(\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten)\s?(?:to|:)\s?1\b(?!\s?(?:%|million|billion|thousand)|[.,]\d|\d)/gi;
const HEDGE = /(about|around|roughly|approximately|approx\.?|~|some|nearly|almost|close to|just under|just over|over|more than|at least|above|upwards of|under|less than|below|fewer than|up to)\s*$/i;
const HEDGES = { about: 'approx', around: 'approx', roughly: 'approx', approximately: 'approx', 'approx.': 'approx', approx: 'approx', '~': 'approx', some: 'approx',
  nearly: 'below', almost: 'below', 'close to': 'approx', 'just under': 'below', 'just over': 'over', over: 'over', 'more than': 'over', 'at least': 'least', above: 'over', 'upwards of': 'over',
  under: 'under', 'less than': 'under', below: 'under', 'fewer than': 'under', 'up to': 'upto' };

const expand = (text) => String(text).replace(/\[\^\d+\]/g, '')
  .replace(BETWEEN, (_, a, b, u) => `${a}${u} and ${b}${u}`)
  .replace(RANGE, (m, a, b, u) => (/^(?:19|20)\d\d$/.test(a) && /^(?:19|20)?\d\d$/.test(b) ? m : `${a}${u} to ${b}${u}`))
  .replace(MONEY_RANGE, (m, c, a, b, u) => `${c}${a}${u ? ` ${u}` : ''} to ${c}${b}${u ? ` ${u}` : ''}`);

// One figure as a comparable key: "pct:56", "x:3", "$:205000". Currency signs count as one kind, so a source in
// dollars backs the same figure written in dollars only; a converted figure belongs in the note too.
function parse(raw) {
  const s = String(raw).toLowerCase().replace(/,(?=\d{3})/g, '').replace(/\s+/g, ' ').trim();
  const cur = s.match(/^([$€£])\s?(\d+(?:\.\d+)?)\s?([a-z]+)?/);
  const dec = (n) => (n.split('.')[1] || '').length;
  if (cur) { const mult = MULT[cur[3]] || 1; return { kind: cur[1], value: +(+cur[2] * mult).toPrecision(12), unit: 10 ** -dec(cur[2]) * mult }; }
  const n = s.match(/\d+(?:\.\d+)?/);
  if (!n) return null;
  if (/%|percent|per cent/.test(s)) return { kind: 'pct', value: +n[0], unit: 10 ** -dec(n[0]) };
  if (/x$|-fold|times/.test(s)) return { kind: 'x', value: +n[0], unit: 10 ** -dec(n[0]) };
  return null;
}
export function figure(raw) { const f = parse(raw); return f ? `${f.kind}:${f.value}` : null; }
export const figures = (text) => {
  const t = expand(text);
  const out = [];
  for (const m of t.matchAll(NUM)) {
    const f = parse(m[0]);
    if (!f) continue;
    const h = t.slice(Math.max(0, m.index - 14), m.index).match(HEDGE);
    out.push({ raw: m[0].trim(), key: `${f.kind}:${f.value}`, ...f, hedge: h ? HEDGES[h[1].toLowerCase()] : null });
  }
  for (const m of t.matchAll(WORD_X)) {
    const w = (m[1] || m[2] || m[3] || m[4]).toLowerCase();
    const v = WORDNUM[w] ?? +w;
    if (!v || v === 1 && m[4]) continue;
    const h = t.slice(Math.max(0, m.index - 14), m.index).match(HEDGE);
    out.push({ raw: m[0].trim(), key: `x:${v}`, kind: 'x', value: v, unit: 1, hedge: h ? HEDGES[h[1].toLowerCase()] : null, word: true });
  }
  return out;
};

// Does a figure in the source's note back the page's figure? The page's written precision sets the unit (32% → 1,
// 32.5% → 0.1, $1.2M → $0.1M). A hedge allows 5% either way ("about"), up to 20% above ("more than") or below ("under").
export function backs(p, q) {
  if (p.kind !== q.kind) return false;
  const a = p.value; const b = q.value;
  if (a === b) return true;
  const u = p.unit || 1;
  const slack = (share) => Math.max(u, Math.abs(a) * share);
  switch (p.hedge) {
    case 'approx': return Math.abs(b - a) <= slack(0.05);
    case 'over': return b > a && b - a <= slack(0.2);
    case 'least': return b >= a && b - a <= slack(0.2);
    case 'below': return b < a && a - b <= slack(0.1);
    case 'under': case 'upto': return b < a && a - b <= slack(0.2);
    default: return Math.abs(Math.round(b / u) * u - a) < u / 1000; // a bare figure is the source's figure, rounded
  }
}

// Zavient's own math, said so in the sentence: the inputs still need their sources, the result does not.
export const OWN_MATH = /\b(?:our|we|zavient(?:'s)?)\b[^.;]{0,50}?\b(?:math|maths|arithmetic|calculat\w*|estimat\w*|divid\w*|multipl\w*|count\w*|tall\w*|check\w*|benchmark\w*|test\w*|analys\w*|review\w*|model\w*)\b|^illustrative\b/i;
const SKIP = new Set(['url', 'sources', 'reviews', 'keyword', 'sourceCheck', 'figureCheck', 'example', 'related', 'spokes', 'headings']);
function* strings(x, path = '') {
  if (typeof x === 'string') yield [path, x];
  else if (Array.isArray(x)) for (let i = 0; i < x.length; i++) yield* strings(x[i], `${path}[${i}]`);
  else if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) if (!SKIP.has(k)) yield* strings(v, path ? `${path}.${k}` : k);
}
// Every footnoted sentence on the page, with the sources it cites. A key number's num, label and source line read as one.
// A table column whose header says it is our math ("Carried at % of cost, our math") clears its cells (round 5).
const cellHeader = (d, where) => {
  const m = where.match(/^(tables\[(\d+)\]|ownData)\.rows\[\d+\](?:\.cells)?\[(\d+)\]$/);
  if (!m) return '';
  const t = m[1] === 'ownData' ? d.ownData : d.tables?.[+m[2]];
  return t?.headers?.[+m[3] + (/\.cells\[/.test(where) ? 1 : 0)] || '';
};
export function citedSentences(d) {
  const out = [];
  const { stats, ...rest } = d;
  const items = [...strings(rest), ...(stats || []).map((s, i) => [`stats[${i}]`, `${s.num} ${s.label} ${s.source || ''}`])];
  for (const [where, text] of items) {
    const ownColumn = OWN_MATH.test(cellHeader(d, where)) || /\bour math\b/i.test(cellHeader(d, where));
    for (const s of splitSentences(String(text).replace(/([.!?])((?:\[\^\d+\])+)/g, '$2$1'))) {
      const cites = [...new Set([...s.matchAll(/\[\^(\d+)\]/g)].map((m) => +m[1]))];
      if (cites.length) out.push({ where, sentence: s, cites, own: ownColumn || OWN_MATH.test(s) });
    }
  }
  return out;
}
const noteFigures = (src) => figures(`${src?.name || ''} ${src?.what || ''}`);

export function numberProblems(d) {
  const notes = (d.sources || []).map(noteFigures);
  const out = [];
  for (const { where, sentence, cites, own } of citedSentences(d)) {
    if (own) continue;
    for (const f of figures(sentence)) {
      if (!cites.some((c) => (notes[c - 1] || []).some((q) => backs(f, q)))) out.push(`${where}: ${f.raw} is not in source ${cites.join(', ')}'s note: check it against the source and put the source's own figure in its "what" note, or say it is our math: "${sentence.replace(/\[\^\d+\]/g, '').slice(0, 80)}"`);
    }
  }
  return out;
}

// "Most" or "the majority" over a share under 50% (round 5): the words and the figure must agree.
const MOST = /\b(?:the |a )?majority of\b|\bmost (?:of (?:the |their |its )?)?(?:(?!common|popular|frequent|cited|used|likely|important|often)[a-z-]+ ){0,2}?(?:firms|companies|banks|respondents|leaders|teams|businesses|executives|cfos|coos|ceos|lenders|insurers|carriers|organi[sz]ations|workers|employees|people|managers|buyers|users|funds|sponsors|owners|agencies|advisors|advisers|clients|customers|borrowers|portfolio companies|deals|projects|pilots|loans|claims|invoices)\b/i;
const CLAUSE = /;|:|—|–|,\s(?:but|and|while|so|whereas)\b|\s(?:but|while|whereas)\s/;
export function mostProblems(d) {
  const out = [];
  for (const { where, sentence, own } of citedSentences(d)) {
    if (own) continue;
    const plain = sentence.replace(/\[\^\d+\]/g, '');
    for (const clause of plain.split(CLAUSE)) {
      const m = clause.match(MOST);
      if (!m || /\bonly\b/i.test(clause)) continue;
      const pcts = figures(clause.slice(m.index)).filter((f) => f.kind === 'pct');
      if (pcts.length && Math.max(...pcts.map((f) => f.value)) < 50) out.push(`${where}: says "${m[0].trim()}" but the share it cites is under 50%: say the share, not "most": "${plain.slice(0, 80)}"`);
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
// Round 5: a survey that prints no sample size says so in these words, and the page then says it was a survey.
export const NO_SAMPLE = /\bsample size not (?:published|given|disclosed|stated)\b/i;
// A note that reads like a survey answer ("62% of CFOs say") but never says survey (agents dropped the word to dodge
// the group check, which is gaming it).
const SURVEY_LIKE = /\b\d+(?:\.\d+)?\s?(?:%|percent)\s+of\s+(?:[A-Za-z&-]+\s){0,3}?[A-Za-z&-]+\s+(?:say|said|believe[ds]?|agree[ds]?|told)\b/i;
const GROUP_STOP = new Set('the and of at in with from who for across their its our than more over under about some all each per firm firms nearly almost around roughly approximately least close to upwards'.split(' '));
const NOT_GROUP = new Set(['AI', 'ML', 'GENAI']);
// A source's whole note: its name ("..., survey of 150 operating partners") and its "what" ("951 contractors in 49 states: ...").
const noteOf = (s) => `${s?.name || ''} | ${s?.what || ''}`;
// Acronyms a sentence may spell out instead.
const SPELLED = { PE: /private equity/i, VC: /venture/i, US: /\bUnited States\b|\bAmerican\b|\bU\.S\.|\bUS\b/, UK: /\bUnited Kingdom\b|\bBritish\b|\bU\.K\.|\bUK\b/, CFO: /chief financial/i, COO: /chief operating/i, CEO: /chief executive/i, SMB: /small (?:and mid|business)/i, IT: /\bIT\b|information technology/ };
// "agency"/"agencies", "advisor"/"advisory", "respondent's" share a stem; acronyms (CFOs, US, PE) keep their case,
// so the pronoun "us" never matches "U.S.".
export function stemWord(w) {
  let x = String(w).replace(/[’']s?$/, '');
  if (/^(?:[A-Z]\.){2,}$|^[A-Z][A-Z&]+s?$/.test(x)) return x.replace(/\./g, '').replace(/([A-Z])s$/, '$1');
  x = x.toLowerCase();
  for (const suf of ['ies', 'ings', 'ing', 'ory', 'ors', 'ers', 'ed', 'es', 'or', 'er', 'y', 'e', 's']) if (x.endsWith(suf) && x.length - suf.length >= 4) return x.slice(0, -suf.length);
  return x;
}
const GROUP = /\b(?:of|n\s?=|among|polled|surveyed)\s?(?:(?:more than|over|nearly|almost|about|around|roughly|some|approximately|at least|close to|upwards of)\s)?(\d[\d,]*(?:\.\d+)?)\s?\+?\s?(?:million|thousand|k)?\s+((?:(?:[A-Z]\.){2,}\s?|[A-Za-z][\w&'’-]*\s?){1,6})/i;
const LEAD = /(?:^|[|(,;:])\s*(?!(?:19|20)\d\d\b)(\d[\d,]*(?:\.\d+)?)\s?\+?\s?(?:million|thousand|k)?\s+((?:(?:[A-Z]\.){2,}\s?|[A-Za-z][\w&'’-]*\s?){1,6})/;
export function surveyGroup(note) {
  const NOT_A_GROUP = /^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\b|^(?:waves?|days?|weeks?|months?|years?|hours?|minutes?|countries|states|markets|industries|sectors|percent|per|to|and|or)\b/i;
  const all = [...String(note).matchAll(new RegExp(GROUP.source, 'gi')), ...String(note).matchAll(new RegExp(LEAD.source, 'g'))];
  for (const m of all) {
    if (NOT_A_GROUP.test(m[2].trim())) continue;
    // Stop at the first break (a comma, colon or bracket ends the group's name).
    const all = m[2].split(/[,;:)(|]/)[0].trim().split(/\s+/).filter((x) => x && !NOT_GROUP.has(stemWord(x).toUpperCase()) && (x.length >= 3 || /^[A-Z]{2,}$|^(?:[A-Z]\.){2,}$/.test(x)));
    const w = all.filter((x) => !GROUP_STOP.has(x.toLowerCase())).slice(0, 4);
    // "1,719 respondents" doesn't say who answered: the note must name the group.
    if (w.length && w.every((x) => /^(?:respondents?|participants?|people|persons?|individuals?|distinct)$/i.test(x))) return null;
    if (w.length) return w;
    if (all.some((x) => /^firms?$/i.test(x))) return ['firms']; // "1,073 firms": firms is the group
  }
  return null;
}
export function surveyScopeProblems(d) {
  const out = [];
  const src = d.sources || [];
  src.forEach((s, i) => {
    const note = noteOf(s);
    if (SURVEY.test(note) && !surveyGroup(note) && !NO_SAMPLE.test(note)) out.push(`source ${i + 1} is a survey but its note doesn't say who answered: write "Survey of N <group>" (for example "Survey of 200 PE leaders"), or "Survey, sample size not published"`);
    if (!SURVEY.test(note) && SURVEY_LIKE.test(note)) out.push(`source ${i + 1}'s note reads like a survey answer ("${note.match(SURVEY_LIKE)[0]}") but doesn't say survey: write "Survey of N <group>", or "Survey, sample size not published"`);
  });
  for (const { where, sentence, cites, own } of citedSentences(d)) {
    if (!figures(sentence).some((f) => f.kind === 'pct') || own) continue;
    const cited = cites.map((c) => src[c - 1]).filter(Boolean);
    const surveys = cited.filter((s) => SURVEY.test(noteOf(s)));
    const plain = sentence.replace(/\[\^\d+\]/g, '');
    if (SURVEY.test(plain) && !surveys.length && cited.length) { out.push(`${where}: the page calls it a survey but source ${cites.join(', ')}'s note doesn't: write "Survey of N <group>" in the note: "${plain.slice(0, 80)}"`); continue; }
    if (!surveys.length || surveys.length < cites.length) continue; // a non-survey source may back the figure
    if (surveys.every((s) => NO_SAMPLE.test(noteOf(s)) && !surveyGroup(noteOf(s)))) {
      if (!SURVEY.test(plain)) out.push(`${where}: a survey figure with no sample size: say it was a survey ("in a survey of ...", "respondents"): "${plain.slice(0, 80)}"`);
      continue;
    }
    const groups = surveys.map((s) => surveyGroup(noteOf(s))).filter(Boolean);
    if (!groups.length) continue;
    const sw = new Set((plain.match(/(?:[A-Z]\.){2,}|[A-Za-z][\w&'’-]*/g) || []).map(stemWord));
    const hit = (w) => { const k = stemWord(w); return sw.has(k) || (SPELLED[k] && SPELLED[k].test(plain)) || k.length >= 3 && [...sw].some((x) => x.length >= 3 && (x.startsWith(k) || k.startsWith(x)) && x.toLowerCase() === x === (k.toLowerCase() === k)); };
    if (!groups.some((g) => g.some(hit))) out.push(`${where}: a survey figure without its group: say whose answer it is, in the note's words (${groups.map((g) => g.join(' ')).join(' / ')}): "${plain.slice(0, 80)}"`);
  }
  return out;
}

// Vendor prices (26 Nov 2026): DealRoom and Midaxo prices on the PE pages were stale, and a cached copy is not the
// vendor's page. A sentence that quotes a price per seat, user, month, year or plan cites a source whose note says
// when it was read ("Read 26 Nov 2026" or "Read 2026-11-26"), within 120 days of the page's updated date. The live
// check (scripts/check-prices.mjs) opens each such source and looks for the figure on the vendor's page today.
// Round 5: "up from $X", "from about $350B" and bare "from $X" are not prices; nor are fines, salaries, savings or
// market sizes quoted "a year".
export const PRICE = /[$€£]\s?\d[^.;]{0,40}?\b(?:per|a|an|\/)\s?(?:seat|user|month|mo|year|yr|licen[cs]e|plan|member|agent|page|document|invoice|credit|call|minute|hour)\b|\b(?:billed|plans?(?: start| from)?|pricing(?: starts?| from)?|subscription|list price|starts? at|starting at|prices? (?:start|from))\b[^.;]{0,30}?[$€£]\s?\d/i;
const NOT_PRICE = /\b(?:fines?|fined|penalt\w*|statutory|violations?|damages|settle\w*|salar\w*|wages?|earn\w*|pay(?:s|ing)? (?:a |an |their )?(?:staff|employees?|analysts?|engineers?)|compensation|savings?|saves?|saved|market|industry|revenue|budget\w*|spend\w*|losses|lose|lost|up from|grew|rose|fell|reached|total(?:l?ed)?)\b|[$€£]\s?\d[\d,.]*\s?(?:bn?|billion|trillion)\b/i;
export const isPrice = (sentence) => { const t = String(sentence).replace(/\[\^\d+\]/g, ''); return PRICE.test(t) && !NOT_PRICE.test(t); };
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
  for (const { where, sentence, cites, own } of citedSentences(d)) {
    if (!isPrice(sentence) || own) continue;
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
export const claimProblems = (d) => [...numberProblems(d), ...twoFigureProblems(d), ...surveyScopeProblems(d), ...priceProblems(d), ...mostProblems(d), ...mirrorProblems(d.sources)];
