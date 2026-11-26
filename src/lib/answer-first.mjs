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
// 6. it stands on its own: no opening It/This/That/They/These, and no filler opening ("In this section", "There are many").
// Research behind these (26 Nov 2026): NN/g inverted pyramid and first-2-words studies; GOV.UK and Australian
// Style Manual (answer must make sense with the heading removed); Microsoft Bing guidance on AI answers (1-2 sentence
// answer, numbers for quantity questions); Portent and Semrush snippet-length studies (40-60 word first paragraph).
// Whether the sentence truly answers the heading is the reviewers' job: every page is read heading by heading.

const YES_NO = /^(is|are|am|can|could|does|do|did|should|will|would|has|have|was|were|must|may)\b/i;
const COST = /\b(how much|what does .* cost|what do .* cost|cost\b|price|pricing)\b/i;
const HOW = /^how\b(?! much| many| long| often| accurate| big| fast| soon)/i;
export const MAX_WORDS = 30;

// The first sentence of a paragraph's text, with footnote numbers and markers taken out.
export function firstSentence(text) {
  const t = String(text).replace(/\[\^\d+\]/g, '').replace(/\s+([.,;:!?])/g, '$1').replace(/\s+/g, ' ').trim();
  const m = t.match(/^.*?[.!?](?=\s+[A-Z0-9"“(]|$)/);
  return (m ? m[0] : t).trim();
}

// Problems with one question heading and the paragraph text straight under it ('' when no paragraph follows).
export function answerProblems(heading, text) {
  const q = String(heading).trim();
  if (!q.endsWith('?')) return [];
  if (!text || !String(text).trim()) return ['no answer: the first thing under the heading is not a sentence'];
  const s = firstSentence(text);
  const out = [];
  const words = s.split(/\s+/).filter(Boolean).length;
  if (words > MAX_WORDS) out.push(`first sentence is ${words} words (max ${MAX_WORDS}): "${s.slice(0, 80)}..."`);
  if (YES_NO.test(q) && !/\bor\b/i.test(q) && !/^(yes|no|not|only)\b/i.test(s)) out.push(`yes/no question, but the answer doesn't start with Yes or No: "${s.slice(0, 80)}"`);
  if (COST.test(q) && !/[\d$€£]|\b(no (public |list )?price|not published|quote only|free)\b/i.test(s)) out.push(`cost question, but the first sentence has no number: "${s.slice(0, 80)}"`);
  if (/^(it|this|that|they|these|those)\b/i.test(s)) out.push(`the first sentence leans on the heading (starts "${s.split(' ')[0]}"); name the subject so it stands alone`);
  if (/^(great question|in this (section|guide|page)|there are (many|several|a few)|when it comes to|before we|let's|let us)\b/i.test(s)) out.push(`filler opening instead of the answer: "${s.slice(0, 80)}"`);
  if (/^(bring|see|here'?s|read|click|book)\b/i.test(s)) out.push(`the first sentence points elsewhere instead of answering: "${s.slice(0, 80)}"`);
  if (HOW.test(q) && /^(it depends|that depends)\b/i.test(s)) out.push(`"how" question answered with "it depends": "${s.slice(0, 80)}"`);
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
  if (d.offer?.heading) out.push({ where: 'offer', q: d.offer.heading, a: A.offer || d.offer.body || '' });
  return out.filter((x) => String(x.q).trim().endsWith('?'));
}
export function pageAnswerProblems(d) {
  return pageQuestions(d).flatMap(({ where, q, a }) => answerProblems(q, a).map((p) => `${where} "${q}": ${p}`));
}
