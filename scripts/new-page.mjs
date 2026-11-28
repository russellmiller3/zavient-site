// Start a new page from its golden template (26 Nov 2026).
// Usage: node scripts/new-page.mjs --type usecase --slug ai-account-reconciliation --topic "AI account reconciliation"
//          --job "account reconciliation" [--industry "any industry"] [--reader "controller"]
// Writes three files in drafts/ (git-ignored):
//   <slug>.json         the page skeleton: every block of the type, in order, with TODO slots
//   <slug>.research.md  the research skeleton: one heading per slot, one line per finding with its URL and read date
//   <slug>.brief.md     the research brief: what to find for each slot, the rules, the ICP review order, the gate
// A writer agent researches and fills the JSON, runs `node scripts/check-page.mjs drafts/<slug>.json` until it
// passes, then moves it into src/content/ai-work/. Research and writing are done by separate agents (Russell's rule).
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TYPES, BLOCKS, COMMON_REQUIRED, REVIEWERS, MIN, DEMAND, ANSWER_FIRST_BRIEF } from '../src/lib/page-types.mjs';
import { LIMITS } from './check-readability.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, def) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : def; };
const type = arg('type', 'usecase'); const slug = arg('slug'); const topic = arg('topic'); const job = arg('job', topic);
const industry = arg('industry', 'any industry'); const reader = arg('reader', '');
if (!TYPES[type] || !slug || !topic) { console.error(`usage: --type ${Object.keys(TYPES).join('|')} --slug x --topic "Y" [--job z]`); process.exit(1); }
const t = TYPES[type];
const T = (what) => `TODO: ${what}`;
const today = new Date().toISOString().slice(0, 10);

// Skeleton slots per block field, sized to the minimums so the writer sees the shape.
const SLOT = {
  summary: T('2-3 sentences: what it is, what AI does, what makes or breaks it [^1][^2]'),
  humanRole: [T('decision people keep, and who checks AI output [^n]'), T('who signs off [^n]')],
  teamAfter: [T('work people move to once AI takes the first pass [^n]'), T('what they check or decide now [^n]')],
  walkAway: [1, 2, 3].map(() => T('what a buyer should hold at the end [^n]')),
  forward: [T('top workflow and what it saves [^n]'), T('risk and who checks it [^n]'), T('first step [^n]'), T('cost range [^n]')],
  applies: [1, 2, 3].map(() => ({ if: T('yes/no condition from the rule text'), then: T('what follows [^n]') })),
  spokes: [{ slug: T('guide-slug'), why: T('why it pays first [^n]') }],
  ranked: Array.from({ length: 4 }, () => ({ name: T('job'), slug: T('guide slug or delete this key'), why: T('cost or time today [^n]'), payoff: T('the number to measure') })),
  decisions: Array.from({ length: 3 }, () => ({ decision: T('decision this role owns'), know: T('what they need to know [^n]') })),
  tool: { embed: `/tools/embed/${slug}.html`, steps: [T('step 1'), T('step 2'), T('step 3')], method: [T('default + source [^n]'), T('formula + source [^n]'), T('limit [^n]')] },
  timeline: [{ date: T('date'), what: T('what happens [^n]') }, { date: T('date'), what: T('what happens [^n]') }],
  ownData: { title: T('question the own data answers?'), intro: T('what we checked, how, when [^n]'), headers: [T('col')], rows: [[T('cell [^n]')]], note: T('source, date pulled, limits') },
  example: { input: T('real inputs a reader would recognise'), output: T('real output') },
  recipes: [1, 2].map((i) => ({ name: T(`${i}. who it suits`), when: T('when to pick it [^n]'), flow: [T('Role: step'), T('Role: step')], cost: T('cost with sources, no hourly rates [^n]') })),
  tables: [{ title: T('table question?'), intro: T('what the table shows [^n]'), headers: [T('Name'), T('What it does'), T('Price'), T('Worth knowing')], rows: [{ name: T('vendor'), url: 'https://example.com/', cells: [T('cell'), T('price or Not published [^n]'), T('fact [^n]')] }] }],
  rules: [{ name: T('rule'), url: 'https://example.com/', status: T('In force | Withdrawn | Starts <date>'), what: T('what it means for you [^n]') }],
  howToTest: [T('record today\'s numbers'), T('hold-out set'), T('compare'), T('price the lift in dollars')],
  watchOuts: [T('failure mode + what to do [^n]'), T('failure mode [^n]'), T('failure mode [^n]')],
  faq: [1, 2, 3].map(() => ({ q: T('real buyer question, where seen?'), a: T('answer first, 1-3 sentences [^n]') })),
  buyVsBuild: { buy: T('when to buy [^n]'), build: T('when to build [^n]') },
  pickElse: [T('situation → alternative [^n]'), T('situation → alternative [^n]')],
  resources: [{ name: T('resource'), url: 'https://example.com/', what: T('one line on why it helps') }],
  stats: [1, 2, 3].map(() => ({ num: T('number'), label: T('what it measures [^n]'), source: T('source name, year') })),
  sources: [{ name: T('source name'), url: 'https://example.com/', what: T('what it says (date read for prices)') }],
  related: [],
};

const fields = [...new Set(t.order.map((id) => BLOCKS[id].field))];
const page = {
  title: T(`${t.titleShape} (max 70 chars, ends in ?)`),
  description: T('50-160 chars: what the reader gets'),
  type, templateVersion: 1, topic, job, industry,
  index: false,
  verdict: [1, 2, 3].map(() => T('one idea, 30 words max, 2+ sources, no number first [^n][^n]')),
  onPage: [],
  headings: {},
  ...(type === 'crossing' ? { parent: T('work playbook slug'), industrySlug: T('industry slug, e.g. insurers'), differs: t.differsFrom.map((k) => ({ what: k, how: T(`how ${k} differs from the parent page, or delete this row`) })) } : {}),
};
for (const f of fields) if (SLOT[f] !== undefined) page[f] = SLOT[f];
// Answer-first rule (26 Nov 2026): one answer slot per block whose heading is a question, rendered straight under it.
// No slot for what-it-is (the summary is that answer, so a slot rendered it twice) or for a heading that is not a
// question, like "Questions buyers ask about X" (the slot rendered as a stray paragraph). The page check fails both.
const isQuestion = (id) => String((t.headings && t.headings[id]) || BLOCKS[id]?.h || '').trim().endsWith('?');
page.answers = Object.fromEntries(t.order.filter((id) => id === 'own-data' || (id !== 'what-it-is' && isQuestion(id)))
  .map((id) => [id, T('one sentence, 6-30 words, that answers the heading outright and gives the reason [^n]')]));
Object.assign(page, {
  offer: { heading: T('free-diagnostic heading in the buyer\'s words'), body: t.offer ? t.offer.replaceAll('{job}', job).replaceAll('{handoffTo}', 'CEO') : T('what the 30 minutes gets them, 1-2 sentences') },
  keyword: { phrase: T('main search phrase from docs/ai-work-site/keyword-research'), searches: 0, cpc: 0, difficulty: null },
  reviews: [],
  updated: today,
});

const brief = `# Research brief: ${topic} (${t.label})

Page: \`${slug}\` · type \`${type}\` · address \`/${t.path}.html\` · made ${today} from the golden template in \`src/lib/page-types.mjs\`.
Reader: lower-middle-market firm, 40-500 staff. Division head for this page: ${reader || t.division}.

## How to work
1. **Research agent** (separate from the writer): fill \`drafts/${slug}.research.md\`, one line per finding under its slot:
   \`- finding | Source: name | URL: https://... | Read: YYYY-MM-DD\`. Every finding needs its URL and read date; a slot
   with nothing says \`- no source found\` and the searches run. Primary sources first. Copy each figure exactly as
   the source prints it, with its group and unit ("51% of 300 finance leaders", "hours a week"), and a survey's sample
   ("Survey of 200 PE leaders", or "Survey, sample size not published"; never leave the word survey out to dodge the
   check); if one study prints two figures for one claim, note both and which release each is in. Note both ends of a
   range, and a word figure as the source prints it ("about 2x", "67% vs 33%"). Cite the publisher's own copy of a
   report, never a third-party host (ictworks.org, Scribd, a vendor's mirror). Where a URL carries a date, note the
   document's own date and say "URL dated ..." if the two differ. EDGAR own data: save one row per counted document
   in data/own-data/${slug}.csv (accession,form,filed,file,kind) and say in ownData.method whether exhibits count;
   check it with \`node scripts/check-edgar-hits.mjs drafts/${slug}.json\`.
   Prices come from the vendor's live page, read today; never a cached or archived copy. The writer copies these into
   each source's \`what\` note, and the page check fails any footnoted figure that isn't there. In this sandbox, curl
   and Node's fetch can't reach some sites through the proxy (sec.gov, efts.sec.gov, the FDIC's API and many vendor
   pages): read those with the web fetch tool or Treg instead, and don't record a site as down because curl failed. Run
   \`node scripts/check-research.mjs drafts/${slug}.research.md\` until it says PASS. Then stop.
2. **Writer agent**: fill \`drafts/${slug}.json\` from the research only. Footnote every claim as [^n], where n is
   the source's 1-based place in \`sources\`. Delete optional blocks you can't source; never pad.
3. Run \`node scripts/check-page.mjs drafts/${slug}.json\` and fix until it says PASS (the ICP reviews are the last FAILs).
4. **Source-claim check** (a separate agent from the writer): open every cited source and confirm it states the claim
   its footnote backs, with the same number, date and scope (the group surveyed, the unit, the region). Start with
   \`NODE_USE_ENV_PROXY=1 node scripts/check-source-figures.mjs drafts/${slug}.json\`, which looks for each footnoted
   figure on its source's live page, near the claim's own words, and fails a cited URL that redirects. Fix or cut what
   it doesn't back, then rerun it with \`--write\`: it records \`figureCheck\` on the page. For every figure it lists
   under byHand (a page it couldn't read, or a figure found away from the claim), open the source and copy its own
   sentence into that entry's \`quote\`; the page check fails a page without the record, with a record older than
   \`updated\`, or with an unquoted byHand figure. Then log \`sourceCheck: {date, by, checked, fixed}\`.
5. **ICP review**, in this order, one pass each, fixes applied between passes: ${REVIEWERS.join(' → ')}.
   Each reviewer reads as that buyer and logs \`{reader, notes}\` in \`reviews\`. Persona notes: docs/steve-persona.md.
6. Move the JSON to \`src/content/ai-work/${slug}.json\`, run \`npm test\`. Set \`index: true\` only on Russell's yes.

## Rules baked into this template
- **Title** is the buyer's real question (People Also Ask, Reddit, Quora, vendor FAQs). Shape: "${t.titleShape}". Example: "${t.example}".
- **Answer every question heading first** (Russell, 26 Nov 2026): ${ANSWER_FIRST_BRIEF} Check with \`node scripts/check-answers.mjs drafts/... --show\` after moving the page in, and read every line: the machine checks shape, you check that it truly answers.
- **Bottom line first**: ${MIN.verdict[0]}-${MIN.verdict[1]} bullets, one idea each, each with ${MIN.verdictFootnotes}+ different sources. No number at the start of the title or a bullet. A bullet can carry at most ${LIMITS.verdictFootnotes} footnotes, so a figure worked out from several inputs says "by our math" in the bullet, cites its two main inputs there, and footnotes every other input where the sum is shown (the table or section it comes from).
- **Sources**: ${MIN[t.minSources || 'sources']}+ sources from ${MIN.domains}+ different sites; every claim footnoted; several sources per claim where they exist. Vendor claims are labelled as the vendor's.
- **Augmentation, not replacement**: the "Where does your team stay in charge?" block is required. No headcount-cut language.
- **No Upwork, freelancer marketplaces, hourly rates or rival consulting firms.**
- **No forum threads (Reddit, Quora, community forums), rival consulting firms or content farms as sources.** Note where a buyer's question was seen in the draft notes, not the source list. The page check fails these (src/lib/source-rules.mjs).
- **Every lead says the thing.** No meta pointers ("The work takes three shapes", "There are several options", "Below is"), no first paragraph opening "It" or "These", no first sentence that only restates its heading, and no answers[...] first sentence joining two answers with a semicolon. Checked in recipe "when" and "cost", table intros, the summary and the offer body too (src/lib/lead-rules.mjs).
- **Superseded rules name their replacement.** SR 11-7 and FIL-27-2021 were replaced or rescinded with SR 26-2 (17 Apr 2026); CFPB circulars 2022-03 and 2023-03 were withdrawn (12 May 2025); the OCC's 1998 Loan Portfolio Management booklet was rescinded (25 Jun 2026); the 2023 third-party guidance (FIL-29-2023) has a proposed replacement, FIL-58-2026 (comments due 16 Dec 2026). Say so wherever they appear; add new cases to src/lib/stale-rules.mjs.
- **No rival consulting firm as an option or with a price, and no consultant, agency or retainer fee ranges.** A firm's survey, cited as evidence, is fine (src/lib/rival-firms.mjs).
- **Links to our own pages are root-relative** ("/about.html"), never https://zavient.com/...
- **Answers carry their reason**: a first sentence under 6 words ("No.", "Not yet.") fails; write "No, because ...".
- **Spell out every acronym** the first time: "enterprise resource planning (ERP)". Jargon the page check knows is in src/lib/acronyms.mjs; add new ones there.
- **Description** is 50-160 characters. No footnote markers in the title or description; every key number carries one.
- **Slugs are real pages**: every ranked, spoke and related slug exists in src/content/ai-work. Related: ${MIN.related[0]}-${t.relatedMax || MIN.related[1]} links for this type.
- **Headings don't repeat words**: if the topic repeats a template word ("AI ... AI"), set \`headings[blockId]\`.
- **No search-results pages as sources** (Google, Bing, a site's /search?q=): cite the page the result leads to.
- **Every footnoted figure is in its source's note.** Each %, multiple and price in a footnoted sentence appears in the cited source's \`what\` note, copied from the source; a figure we work out ourselves says so in the sentence ("by our math"). A survey figure names its group in the note's words, one study gives one figure per claim, and a price's source note carries the date it was read (within 120 days of \`updated\`). Both ends of a range are checked, and word figures ("twice as", "3 to 1") too. A bare figure is the source's, rounded (32.6% is "33%", or "about 32%"); "more than", "nearly", "under" say which side the source's figure is on. "Most" or "the majority" never sits on a share under 50%. A table column headed "our math" is our math. No cached or archived copies, no third-party copies of a report, no stat aggregators, and no source listed twice. A survey's size can come from a companion page that cites the same survey: write it in the note as "Survey of 951 contractors (N from <companion page or methodology page>)" and cite that page among the sources. A report many pages cite has one canonical URL and note (src/lib/canonical-sources.mjs); a vendor price taken off its page goes in src/lib/stale-prices.mjs and fails every page that still quotes it. A cost question whose vendor publishes no price is answered "<Vendor> publishes no price and quotes each deal", then the nearest public figure (a seat minimum, a listing) with its source. Figures inside a tool (public/tools/embed) carry a link, a footnote or a Zavient-judgment marker (src/lib/tool-claims.mjs). Checked by src/lib/source-numbers.mjs and src/lib/source-rules.mjs; a new page must be clean.
- **Save the JSON at the file's own indent**, JSON.stringify(data, null, n) plus a newline, so a fix stays a small diff.
- **Every fix goes into the template or the page check, never just the page.** If you fix a page, add the rule or test that stops the same mistake on every page.
- **Teach, then trust, then the lead**: the block order below is fixed. "When to pick something else" sits after "Buy or build", just above the free diagnostic.
- **Own data** (except tool pages, where the tool is the fact): one table only Zavient has (a benchmark, a job-ad count, a dated price check, a worked example). It must differ from every sibling page's.
- **Measured demand**${t.skipDemand ? ' (skipped: this type is navigation)' : ''}: \`keyword\` from the keyword pull, with ${DEMAND.searches}+ US searches a month, or ${DEMAND.nicheSearches}+ at $${DEMAND.nicheCpc}+ a click. No demand, no index.
- **Updated** is the real date of the last real change. Never fake freshness.
- **ADHD-friendly**: sentences 25 words max, bullets 2 sentences max, paragraphs 3 max.
${t.differsFrom ? `- **Crossing guard**: list in \`differs\` how this page differs from its parent on ${t.differsFrom.join(', ')}. Under 4 of 6 → don't build it; add a section to the parent instead.\n` : ''}${t.minInbound ? `- **Inbound links**: publish only when ${t.minInbound}+ site pages link here.\n` : ''}
## Block order and what to research for each slot
${t.order.map((id, i) => `${i + 1}. **${((t.headings && t.headings[id]) || BLOCKS[id].h || id).replaceAll('{topic}', topic)}** (\`${BLOCKS[id].field}\`${[...COMMON_REQUIRED, ...t.required].includes(BLOCKS[id].field) ? ', required' : ', optional'})\n   ${BLOCKS[id].brief}`).join('\n')}

Then the free diagnostic (rendered on every page): write \`offer.heading\` and \`offer.body\` in the buyer's words.
`;

mkdirSync(join(root, 'drafts'), { recursive: true });
const jp = join(root, 'drafts', `${slug}.json`);
if (existsSync(jp)) { console.error(`${jp} exists; not overwriting`); process.exit(1); }
// One-space indent, the house format for new pages (the format test then holds each file to its own indent).
writeFileSync(jp, JSON.stringify(page, null, 1) + '\n');
const research = `# Research: ${topic}\n\nOne line per finding: \`- finding | Source: name | URL: https://... | Read: YYYY-MM-DD\`.\n` +
  `The source, URL and read date may go on indented lines under the finding. Copy figures exactly, with their group and unit.\n` +
  `curl and Node's fetch can't reach some sites through this sandbox's proxy (sec.gov, efts.sec.gov, the FDIC's API): use the web fetch tool or Treg.\n` +
  `Check: node scripts/check-research.mjs drafts/${slug}.research.md\n\n` +
  t.order.filter((id) => !['sources', 'related'].includes(id)).map((id) => `## ${((t.headings && t.headings[id]) || BLOCKS[id].h || id).replaceAll('{topic}', topic)}\n`).join('\n');
writeFileSync(join(root, 'drafts', `${slug}.research.md`), research);
writeFileSync(join(root, 'drafts', `${slug}.brief.md`), brief);
console.log(`wrote drafts/${slug}.json, drafts/${slug}.research.md and drafts/${slug}.brief.md`);
