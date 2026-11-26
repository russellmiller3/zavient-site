// Lead-sentence rules (26 Nov 2026). Russell: "Make it so every fix is structual to templates so it doesnt reoccur".
// The answer-first check (src/lib/answer-first.mjs) only looks at question headings. Launch then hand-fixed a recipe
// "when" that opened with a meta pointer ("The work takes one of three shapes; start with this one when..."), and the
// build thread hand-split three table answers that joined two answers with a semicolon. These rules check every lead
// text a reader meets first, whatever its heading: answers[blockId], the summary, own-data intro, table intros, recipe
// "when" and "cost", and the offer body. Used by the page check (scripts/check-page.mjs), so a miss stops the deploy.
//
// What fails:
// 1. a meta pointer or filler opening: the text talks about the section instead of saying the thing
//    ("The work takes three shapes", "There are several options", "Below is", "As noted above", "In short");
// 2. a pointer elsewhere ("See", "Read", "Click", "Here's"); the offer body may say "Bring" or "Book", since that is the offer;
// 3. a first paragraph that leans on its heading ("It", "This", "They", "These" as the first word);
// 4. an answers[...] first sentence that joins two answers with a semicolon, or runs over 30 words (one idea per sentence);
// 5. a first sentence that only restates its heading: no content word the heading doesn't already have.
import { firstSentence } from './answer-first.mjs';
import { headingFor } from './page-types.mjs';

export const POINTERS = [
  [/^(?:the )?(?:work|answer|choice|options?|approach|process|projects?|setups?|paths?|routes?|plans?|ways?|engagements?) (?:takes?|comes? in|falls? into|splits? into|has|have|is one of|are) (?:one of )?(?:two|three|four|five|six|several|\d)\b/i, 'a meta pointer ("the work takes three shapes"): say which one fits whom'],
  [/\b(?:start|begin) with this one\b/i, 'a meta pointer ("start with this one"): name the case it fits'],
  [/^(?:the following|below|above|here (?:is|are))\b/i, 'a pointer to what comes next: say the thing itself'],
  [/^there (?:are|is|'s) (?:many|several|a few|a number of|two|three|four|five|six|\d+)\b/i, 'a "there are several" opening: name them'],
  [/\bas (?:noted|shown|mentioned|discussed|covered|explained) (?:above|below|earlier|later)\b/i, 'a pointer to another section: say it here'],
  [/^(?:in short|in summary|to summari[sz]e|simply put|put simply|in a nutshell|at a glance|great question|in this (?:section|guide|page|table)|when it comes to|before we|let'?s|let us)\b/i, 'filler opening: start with the answer'],
  [/\b(?:in|on) (?:several|many|a few|a number of|various) (?:ways|factors|things)\b/i, 'vague "in several ways": name them'],
];
const ELSEWHERE = /^(?:see|read|click|scroll|jump|here'?s|bring|book)\b/i;
const LEANS = /^(?:it|this|that|they|these|those)\b/i;
const MAX_WORDS = 30;

// Words that carry no new content, so a sentence of only these plus the heading's words says nothing new.
const STOP = new Set(('a an the and or of to for in on at by with is are be been does do did can could should will would what how which who why when ' +
  'where your you our we it this that these those from as into than then their its my more most much many any per vs versus about one two three ' +
  'there here also just very really several various some way ways thing things factor factors lot lots number key important main different depend ' +
  'depends depending matter matters case cases kind kinds type types use used using help helps make makes get gets go goes work works').split(' '));
const stem = (w) => w.replace(/ies$/, 'y').replace(/(?:ing|ed|es|s|e)$/, '');
const contentWords = (s) => (String(s).toLowerCase().replace(/\[\^\d+\]/g, '').match(/[a-z0-9$%]+/g) || []).filter((w) => w.length > 2 && !STOP.has(w)).map(stem);

// Rule 5: the sentence has 3+ content words and every one of them is already in the heading.
export function restatesHeading(heading, sentence) {
  if (!heading) return false;
  const h = new Set(contentWords(heading));
  const s = contentWords(sentence);
  return s.length >= 3 && s.every((w) => h.has(w));
}

// Every lead text on a page, with the heading it sits under and whether it is the first paragraph there.
export function pageLeads(d) {
  const A = d.answers || {};
  const out = [];
  for (const [id, text] of Object.entries(A)) {
    const m = id.match(/^table-(\d+)$/);
    const heading = m ? d.tables?.[m[1] - 1]?.title : headingFor(d, id);
    out.push({ where: `answers.${id}`, heading, text, first: true, answer: true });
  }
  if (d.summary) out.push({ where: 'summary', heading: headingFor(d, 'what-it-is'), text: d.summary, first: !A['what-it-is'] });
  if (d.ownData?.intro) out.push({ where: 'ownData.intro', heading: headingFor(d, 'own-data'), text: d.ownData.intro, first: !A['own-data'] });
  (d.tables || []).forEach((t, i) => t.intro && out.push({ where: `table ${i + 1} intro`, heading: t.title, text: t.intro, first: !A[`table-${i + 1}`] }));
  (d.recipes || []).forEach((r, i) => {
    if (r.when) out.push({ where: `recipe ${i + 1} when`, heading: r.name, text: r.when, first: true });
    if (r.cost) out.push({ where: `recipe ${i + 1} cost`, heading: r.name, text: r.cost, first: false });
  });
  if (d.offer?.body) out.push({ where: 'offer body', heading: d.offer.heading, text: d.offer.body, first: true, offer: true });
  return out;
}

export function leadProblems({ heading, text, first, answer, offer }) {
  const s = firstSentence(text);
  if (!s) return [];
  const out = [];
  for (const [re, why] of POINTERS) if (re.test(s)) out.push(`${why}: "${s.slice(0, 90)}"`);
  if (ELSEWHERE.test(s) && !(offer && /^(?:bring|book)\b/i.test(s))) out.push(`points elsewhere instead of saying the thing: "${s.slice(0, 90)}"`);
  if (first && LEANS.test(s)) out.push(`leans on the heading (starts "${s.split(' ')[0]}"): name the subject so it stands alone`);
  if (answer && s.includes(';')) out.push(`two answers joined by a semicolon in the first sentence: split them, one idea per sentence: "${s.slice(0, 90)}"`);
  const words = s.split(/\s+/).filter(Boolean).length;
  if (answer && words > MAX_WORDS) out.push(`first sentence is ${words} words (max ${MAX_WORDS})`);
  if (restatesHeading(heading, s)) out.push(`only restates its heading "${heading}": add the answer: "${s.slice(0, 90)}"`);
  return out;
}

export function pageLeadProblems(d) {
  return pageLeads(d).flatMap((l) => leadProblems(l).map((p) => `${l.where}: ${p}`));
}
