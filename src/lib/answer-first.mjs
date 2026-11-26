// Answer-first rule (Russell, 26 Nov 2026: "MAKE SURE TO ANSWER THE QUESTIONS ... Rule").
// Every heading that asks a question is answered in the first sentence under it, in plain words, before any
// example, table or list. The example and the detail come after, as proof. Shared by the page check
// (scripts/check-page.mjs) and the built-site test (tests/answer-first.test.mjs).
//
// A machine can check the shape of the answer, not whether it is right. So it checks:
// 1. a paragraph comes straight after the heading (not a table, list or example);
// 2. a yes/no question gets Yes or No as the first word (an either/or question is exempt);
// 3. a cost question gets a number in the first sentence;
// 4. a "how" question gets the steps or the mechanism, not "Bring", "See" or "Here's";
// 5. the first sentence is short enough to be quoted whole: 30 words or fewer, so it reads as a complete answer when
//    lifted out by a skimmer, a search snippet or an AI answer;
// 6. it stands on its own: no opening It/This/That/They/These, and no filler opening ("In this section", "There are many");
// 7. it is not a source or method note ("Prices are US list prices, read 26 Nov 2026", "From each vendor's help pages",
//    "On 26 Nov 2026 we read...", "Each study defines success differently"). Those go after the answer, never first.
//    Dates and years don't count as the number a cost question needs.
// 8. a two-part heading ("What is X, and what does it change?") gets at least 2 sentences, one per part;
// 9. a difference heading ("What is the real difference?", "What is the difference between...") states the contrast in
//    the first sentence (while, but, whereas, unlike, than, instead), not one side or a shared trait;
// 10. a "How much ... cost" or "What does ... cost" heading gets a figure ($ or a number that is not a date) in the first
//    two sentences: "publish no price, so expect a quote" alone is not an answer.
// 11. the first sentence is at least 6 words: a bare "Yes." or "Not yet." must carry its reason in the same sentence.
// Rules 8-10 come from a semantic audit of 26 Nov 2026 that found answers passing 1-7 while dodging the question.
// Research behind these (26 Nov 2026): NN/g inverted pyramid and first-2-words studies; GOV.UK and Australian
// Style Manual (answer must make sense with the heading removed); Microsoft Bing guidance on AI answers (1-2 sentence
// answer, numbers for quantity questions); Portent and Semrush snippet-length studies (40-60 word first paragraph).
// Whether the sentence truly answers the heading is the reviewers' job: every page is read heading by heading.

import { splitSentences } from './sentences.mjs';

const YES_NO = /^(is|are|am|can|could|does|do|did|should|will|would|has|have|was|were|must|may)\b/i;
const COST = /\b(how much|what does .* cost|what do .* cost|cost\b|price|pricing)\b/i;
const HOW = /^how\b(?! much| many| long| often| accurate| big| fast| soon)/i;
export const MAX_WORDS = 30;
// Rule 11 (26 Nov 2026, build thread): a bare "No." or "Yes." passed rule 2 with the reason left to the next sentence.
// A first sentence under 6 words is a bare answer: put the reason in the same sentence ("No, because ...").
export const MIN_WORDS = 6;
// Openings that say where the numbers came from instead of answering (a live miss on the comparison pages, 26 Nov 2026).
const SOURCE_NOTE = /^((us |listed |list )?prices? (are|come|from)\b|(us )?list prices (before|from|as|are)\b|from (each|the|our|vendor)\b|(on|as of) \d{1,2} \w+ \d{4}\b|we (read|checked|pulled|counted|logged|compared|lined up|looked|set|gathered|collected)\b|(?!.*\b(find|finds|found|show|shows|showed)\b)(peer-reviewed|government|vendor|independent|primary)\b.*\b(studies|surveys|sources|figures)\b|each (study|survey|source|vendor)\b|(figures|numbers|data|prices) (from|as of|read|are from)\b|the primary studies\b)|\bas reported by\b/i;
const DATES = /\b\d{1,2} (jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{4}\b|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{1,2},? \d{4}\b|\b(19|20)\d{2}\b/gi;

// Footnote numbers and markers taken out, spaces tidied.
const tidy = (text) => String(text).replace(/\[\^\d+\]/g, '').replace(/\s+([.,;:!?])/g, '$1').replace(/\s+/g, ' ').trim();

// The first sentence of a paragraph's text, with footnote numbers and markers taken out.
export function firstSentence(text) {
  return sentencesOf(text)[0] || '';
}

// Every sentence of a paragraph's text, split by the shared splitter (src/lib/sentences.mjs), so initials and
// abbreviations ("J.D. Power", "U.S. Census") don't end a sentence.
export function sentencesOf(text) {
  return splitSentences(tidy(text));
}

// Rule 8: two questions in one heading, joined by ", and" ("What is X, and what does it change?").
export const TWO_PART = /,\s+and\s+(what|how|who|whom|which|why|where|when|whether|is|are|does|do|did|can|could|should|will|would|has|have)\b/i;
// Rule 9: a heading that asks for the difference between options, and the words that state a contrast.
export const DIFFERENCE = /\breal difference\b|^what is the difference\b/i;
export const CONTRAST = /\b(while|but|whereas|unlike|than|instead)\b/i;
// Rule 10: a heading that asks for a cost outright.
export const COST_FIGURE_Q = /^(how much\b.*\bcosts?\b|what (does|do)\b.*\bcosts?\b)/i;
// A figure: a $ sign, or any digit left once dates and years are taken out.
export const hasFigure = (s) => /[$€£]|\d/.test(String(s).replace(DATES, ''));

// Problems with one question heading and the paragraph text straight under it ('' when no paragraph follows).
export function answerProblems(heading, text) {
  const q = String(heading).trim();
  if (!q.endsWith('?')) return [];
  if (!text || !String(text).trim()) return ['no answer: the first thing under the heading is not a sentence'];
  const s = firstSentence(text);
  const out = [];
  const words = s.split(/\s+/).filter(Boolean).length;
  if (words < MIN_WORDS) out.push(`first sentence is a bare ${words}-word answer (min ${MIN_WORDS}): give the reason in the same sentence ("No, because ..."): "${s}"`);
  if (words > MAX_WORDS) out.push(`first sentence is ${words} words (max ${MAX_WORDS}): "${s.slice(0, 80)}..."`);
  if (YES_NO.test(q) && !/\bor\b/i.test(q) && !/^(yes|no|not|only)\b/i.test(s)) out.push(`yes/no question, but the answer doesn't start with Yes or No: "${s.slice(0, 80)}"`);
  if (COST.test(q) && !/[\d$€£]|\b(no (public |list )?price|not published|quote only|free)\b/i.test(s.replace(DATES, ''))) out.push(`cost question, but the first sentence has no number: "${s.slice(0, 80)}"`);
  if (/^(it|this|that|they|these|those)\b/i.test(s)) out.push(`the first sentence leans on the heading (starts "${s.split(' ')[0]}"); name the subject so it stands alone`);
  if (/^(great question|in this (section|guide|page)|there are (many|several|a few)|when it comes to|before we|let's|let us)\b/i.test(s)) out.push(`filler opening instead of the answer: "${s.slice(0, 80)}"`);
  if (SOURCE_NOTE.test(s)) out.push(`the first sentence is a source or method note, not the answer; answer first, then say where the numbers came from: "${s.slice(0, 80)}"`);
  if (/^(bring|see|here'?s|read|click|book)\b/i.test(s)) out.push(`the first sentence points elsewhere instead of answering: "${s.slice(0, 80)}"`);
  if (HOW.test(q) && /^(it depends|that depends)\b/i.test(s)) out.push(`"how" question answered with "it depends": "${s.slice(0, 80)}"`);
  const all = sentencesOf(text);
  if (TWO_PART.test(q) && all.length < 2) out.push(`two-part question, but the answer is ${all.length} sentence; answer each part (at least 2 sentences): "${s.slice(0, 80)}"`);
  if (DIFFERENCE.test(q) && !CONTRAST.test(s)) out.push(`difference question, but the first sentence states no contrast (while, but, whereas, unlike, than, instead): "${s.slice(0, 80)}"`);
  if (COST_FIGURE_Q.test(q) && !all.slice(0, 2).some(hasFigure)) out.push(`cost question, but the first two sentences give no figure ($ or a number that is not a date): "${s.slice(0, 80)}"`);
  return out;
}

// The same check on a page's JSON, before any build: every question heading the template will render, paired with
// the first paragraph it will put under it. answers[blockId] always renders first; otherwise only blocks that open
// with a paragraph (summary, own-data intro, table intro, buy-or-build, FAQ answers, the offer body) have one.
import { headingFor, orderFor, hasBlock } from './page-types.mjs';
const OPENS_WITH_PARAGRAPH = {
  'what-it-is': (d) => d.summary,
  'own-data': (d) => d.ownData?.intro,
  'buy-or-build': (d) => d.buyVsBuild && `Buy: ${d.buyVsBuild.buy}`,
};
export function pageQuestions(d) {
  const A = d.answers || {};
  const out = [];
  for (const id of orderFor(d)) {
    if (id === 'tables') { (d.tables || []).forEach((t, i) => out.push({ where: `table-${i + 1}`, q: t.title, a: A[`table-${i + 1}`] || t.intro })); continue; }
    if (id === 'related' || id === 'sources' || !hasBlock(d, id)) continue;
    const q = headingFor(d, id);
    if (q) out.push({ where: id, q, a: A[id] || OPENS_WITH_PARAGRAPH[id]?.(d) || '' });
    if (id === 'faq') (d.faq || []).forEach((x, i) => out.push({ where: `faq ${i + 1}`, q: x.q, a: x.a }));
  }
  // The offer box renders offer.body as plain text and ignores answers.offer, so only offer.body counts here.
  if (d.offer?.heading) out.push({ where: 'offer', q: d.offer.heading, a: d.offer.body || '' });
  return out.filter((x) => String(x.q).trim().endsWith('?'));
}
export function pageAnswerProblems(d) {
  return pageQuestions(d).flatMap(({ where, q, a }) => answerProblems(q, a).map((p) => `${where} "${q}": ${p}`));
}
