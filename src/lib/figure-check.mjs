import { wordsToNumbers } from './source-numbers.mjs';
// Live figure-check record (round 5, 26 Nov 2026). The build thread found figures that passed the note check but were
// not in the source (an Ivans 98% on the page for another claim, an Accenture case figure cited as a survey figure,
// a count taken from an exhibit). Russell: "Make it so every fix is structual to templates so it doesnt reoccur".
// The live check needs the network, so the build can't run it; instead `scripts/check-source-figures.mjs --write`
// records its result on the page as figureCheck, and the page check reads that record:
// - the record exists and is no older than the page's updated date (rerun it after any edit);
// - no figure is listed as not found, and no cited URL redirects;
// - every figure the script couldn't confirm (unreadable source, or found but not near the claim) carries the
//   source's own sentence in byHand[].quote, with the figure in it, copied by the person who opened it.
// Pages written before this rule are in FIGURE_CHECK_PENDING (with the 4 that went live while it was built, 0c55992). That list only shrinks: take a page off when its
// record is in; never add one.
export const FIGURE_CHECK_PENDING = new Set(('account-reconciliation-automation accounting-firms ai-adoption-change-management ai-credit-memo-spreading ai-due-diligence ai-loan-review ' +
  'ai-agent-development-services ai-automation-consulting ai-claims-processing ai-collections ai-credit-scoring ai-construction-estimating ' +
  'ai-consulting-services ai-consulting-small-business ai-demand-forecasting ai-document-processing ai-for-operations-leaders ' +
  'ai-governance-consulting ai-implementation-services ai-integration-services ai-inventory-management ai-invoice-processing ' +
  'ai-policy-generator ai-post-merger-integration ai-predictive-maintenance ai-procurement ai-production-scheduling ' +
  'ai-project-cost-estimator ai-roadmap-builder ai-roi-calculator ai-strategy-consulting ai-training-for-employees ' +
  'ai-training-plan ai-underwriting ai-use-case-finder ai-value-creation-plan build-vs-buy-ai ' +
  'chatgpt-plus-vs-business-vs-enterprise chatgpt-vs-claude-vs-copilot-for-work community-banks-credit-unions construction ' +
  'custom-ai-solutions data-analytics-consulting fractional-chief-ai-officer generative-ai-consulting ' +
  'generative-ai-vs-predictive-ai hire-ai-engineer holding-companies-roll-ups insurance insurance-agencies law-firms machine-learning-consulting ' +
  'manufacturing multi-entity-close private-credit-portfolio-monitoring private-equity professional-services ' +
  'rpa-vs-agentic-automation sales-analytics supply-chain-logistics wealth-management zapier-vs-make-vs-workato').split(' '));

const norm = (s) => String(s).toLowerCase().replace(/[\s,]+/g, '');
export function figureCheckProblems(d, slug) {
  const fc = d.figureCheck;
  if (!fc) return FIGURE_CHECK_PENDING.has(slug) ? [] : ['no live figure check: run node scripts/check-source-figures.mjs <page> --write'];
  const out = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fc.date || '') || (d.updated && fc.date < d.updated)) out.push(`live figure check (${fc.date}) is older than the page (${d.updated}): run it again with --write`);
  // A figure the script couldn't find is cleared by a hand-copied quote logged for the same figure and one of the URLs
  // it searched (28 Nov 2026: script-rendered pages); the quote is then held to the figure below, like any byHand entry.
  for (const n of fc.notFound || []) {
    const m = String(n).match(/^(.*?): (.+?) not found in (.+)$/);
    if (m && m[3].split(', ').some((u) => quoteByUrl(fc.byHand, m[2], u))) continue;
    out.push(`figure not on its source's page: ${n}: fix the figure or the source, or open it and log the source's sentence in figureCheck.byHand (figure, url, quote)`);
  }
  for (const p of fc.padded || []) out.push(`footnote doesn't state this figure: ${p}`);
  for (const r of fc.redirects || []) out.push(`source URL redirects (${r}): cite the page it lands on`);
  for (const b of fc.byHand || []) {
    // A footnote group with several figures logs them as "54% / 23%": the source's sentence holds one of them.
    const figs = String(b.figure).split(' / ').map((f) => f.replace(/^(?:about|nearly|over|more than|under|up to)\s+/i, ''));
    const q = norm(wordsToNumbers(b.quote)); // "Seventy-three percent" holds 73%
    const inQuote = (fig) => /twice|times|double|triple|to 1/i.test(fig) || q.includes(norm(fig).replace(/^(?:[$€£])/, '')) || q.includes(norm(fig).replace(/%$/, ''));
    if (!b.quote) out.push(`${b.where}: ${b.figure} needs the source's own sentence in figureCheck.byHand quote (${b.why})`);
    else if (!figs.some(inQuote)) out.push(`${b.where}: the quote given for ${b.figure}${b.footnote ? ` (footnote [^${b.footnote}])` : ''} doesn't contain it: each footnote's own source must state the figure, else move or drop the footnote`);
  }
  return out;
}

// Hand-checked quotes survive a reorder (28 Nov 2026). byHand entries were matched on rerun by position and figure
// ("watchOuts[1]" + "30%"), so moving a block or a bullet dropped the quote a person had copied from the source. Now
// a quote is found by figure + source URL first (the claim cites the same source wherever it sits on the page), then
// by position + figure as before. Among several matches the one at the same position wins.
const sameFig = (a, b) => norm(a) === norm(b);
const sameUrl = (a, b) => String(a || '').replace(/^https?:\/\/(?:www\.)?/, '').replace(/\/+$/, '') === String(b || '').replace(/^https?:\/\/(?:www\.)?/, '').replace(/\/+$/, '');
export function findQuote(byHand, { where, figure, url, urls = [] }) {
  // Several figures logged together: one quote per figure, joined, so no hand-copied sentence is dropped.
  const many = String(figure).split(' / ');
  if (many.length > 1) {
    const qs = [...new Set(many.map((f) => findQuote(byHand, { where, figure: f, url, urls })).filter(Boolean))];
    return qs.length ? qs.join(' … ') : undefined;
  }
  // A footnote group's figures are logged together ("70% / 80%"); an older entry for any one of them carries over.
  const parts = (f) => String(f).split(' / ');
  const all = (byHand || []).filter((b) => b.quote && parts(b.figure).some((x) => parts(figure).some((y) => sameFig(x, y))));
  const cited = [url, ...urls].filter(Boolean);
  const byUrl = all.filter((b) => cited.some((u) => sameUrl(b.url, u)));
  const pick = byUrl.find((b) => b.where === where) || byUrl.find((b) => sameUrl(b.url, url)) || byUrl[0] || all.find((b) => b.where === where);
  return pick?.quote;
}

// A hand-copied quote keyed by figure and source URL only (no position fallback): what may clear a figure the script
// read the page without finding. One entry may log several figures together ("54% / 23%").
export function quoteByUrl(byHand, figure, url) {
  const b = (byHand || []).find((x) => x.quote && sameUrl(x.url, url) && String(x.figure).split(' / ').some((y) => sameFig(y, figure)));
  return b?.quote;
}

// Moved here from scripts/check-source-figures.mjs (28 Nov 2026) so the per-footnote judgement below can be tested.
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
// The claim's own words, to test that the figure sits near them on the source's page (not elsewhere on it).
const STOP = new Set('about after also among because before being between both could each from have into just more most other over same some such than that their them then there these they this those through under very what when where which while will with would your said says percent firms companies company'.split(' '));
export const claimWords = (s) => [...new Set((s.toLowerCase().replace(/\[\^\d+\]/g, '').match(/[a-z]{4,}/g) || []).filter((w) => !STOP.has(w)).map((w) => w.replace(/(?:ies|es|s|ing|ed)$/, '').slice(0, 7)))];
export const near = (body, v, words) => {
  for (let i = body.indexOf(v); i >= 0; i = body.indexOf(v, i + 1)) {
    const win = body.slice(Math.max(0, i - 300), i + v.length + 300);
    if (words.filter((w) => win.includes(w)).length >= Math.min(2, words.length)) return true;
  }
  return false;
};


// Every footnote on a figure is checked (28 Nov 2026). Independent source checks kept finding a figure with two
// footnotes where the second source never states it (padding to meet "several sources"). The live check used to stop
// at the first source that held the figure. Now, for one footnote group (figureGroups in src/lib/source-numbers.mjs:
// the figures written before a run of markers, and those markers):
// - each figure must be on some cited source's page, near the claim's words (else notFound, or byHand if only far);
// - each cited source that was read must state one of the group's figures, else it is padded: "move or drop it";
// - each cited source that couldn't be read gets its own byHand entry, so a person copies that source's sentence.
// sources: [{ c, u, body }] where body is the page text, or null when it couldn't be read (err says why).
// Script-rendered source pages (28 Nov 2026, round 2). Some vendor pages fill in their prices with scripts, so the
// fetched text is empty or holds only the menu and footer. The check called the figure "not found", a hard failure
// that no hand-copied quote could clear. Now, for a figure no source page states:
// - if every page that was read is essentially empty (under THIN_WORDS words) or holds none of the claim's words (the
//   part that would hold the figure didn't render), each goes to byHand ("needs byHand"), not notFound;
// - if a person found it and logged the source's sentence (figureCheck.byHand with a quote, keyed by figure and URL:
//   quote(figure, url)), it goes to byHand with that quote, and the page check holds the quote to the figure;
// - otherwise, on a page with real text on the claim, it still fails as not found.
// An essentially empty page that doesn't state a figure another source states is sent to byHand, never called padding.
export const THIN_WORDS = 60;
const wordCount = (body) => (String(body).match(/[a-z]{2,}/gi) || []).length;
export const thinPage = (body) => body != null && wordCount(body) < THIN_WORDS;
const onTopic = (body, words) => words.filter((w) => body.includes(w)).length >= Math.min(2, words.length);
export function judgeGroup({ where, figs, sources, words, quote = () => undefined }) {
  const out = { checked: 0, byHand: [], notFound: [], padded: [] };
  const read = sources.filter((s) => s.body != null);
  const blank = (s) => thinPage(s.body) || !onTopic(s.body, words);
  const states = (s, f) => variants(f).some((v) => s.body.includes(v));
  const seen = new Set();
  const hand = (b) => { const k = `${b.figure}|${b.url}`; if (!seen.has(k)) { seen.add(k); out.byHand.push(b); } };
  for (const f of figs) {
    out.checked++;
    const hits = read.filter((s) => states(s, f));
    if (hits.some((s) => variants(f).some((v) => near(s.body, v, words)))) continue;
    if (hits.length) { hand({ where, figure: f.raw, url: hits[0].u, why: 'found on the page, but not near the claim\'s words: confirm it backs this claim' }); continue; }
    if (!read.length) continue; // no page was read: each source gets its own byHand entry below
    const quoted = read.find((s) => quote(f.raw, s.u));
    if (quoted) { hand({ where, figure: f.raw, url: quoted.u, footnote: quoted.c, why: 'not in the page text the script read: checked by hand, with the source\'s own sentence quoted' }); continue; }
    if (read.every(blank)) {
      for (const s of read) hand({ where, figure: f.raw, url: s.u, footnote: s.c, why: thinPage(s.body)
        ? `needs byHand: the page reads as empty (${wordCount(s.body)} words; likely filled in by script): open it and copy the sentence that states the figure`
        : 'needs byHand: the page text read holds none of the claim\'s words (likely filled in by script): open it and copy the sentence that states the figure' });
      continue;
    }
    out.notFound.push(`${where}: ${f.raw} not found in ${read.map((s) => s.u).join(', ')}`);
  }
  const figList = figs.map((f) => f.raw).join(' / ');
  for (const s of sources) {
    if (s.body == null) { hand({ where, figure: figList, url: s.u, footnote: s.c, why: `couldn't read the source (${s.err || 'unreadable'}): open it and copy the sentence that states the figure` }); continue; }
    if (figs.some((f) => states(s, f)) || !figs.some((f) => read.some((o) => o !== s && states(o, f)))) continue;
    if (thinPage(s.body)) hand({ where, figure: figList, url: s.u, footnote: s.c, why: `needs byHand: the page reads as empty (${wordCount(s.body)} words; likely filled in by script): open it and copy the sentence that states the figure` });
    else out.padded.push(`${where}: footnote [^${s.c}] (${s.u}) doesn't state ${figList}: move or drop it`);
  }
  return out;
}
