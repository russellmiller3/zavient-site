// Start a new page from its golden template (26 Nov 2026).
// Usage: node scripts/new-page.mjs --type usecase --slug ai-account-reconciliation --topic "AI account reconciliation"
//          --job "account reconciliation" [--industry "any industry"] [--reader "controller"]
// Writes two files in drafts/ (git-ignored):
//   <slug>.json      the page skeleton: every block of the type, in order, with TODO slots
//   <slug>.brief.md  the research brief: what to find for each slot, the rules, the ICP review order, the gate
// A writer agent researches and fills the JSON, runs `node scripts/check-page.mjs drafts/<slug>.json` until it
// passes, then moves it into src/content/ai-work/. Research and writing are done by separate agents (Russell's rule).
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TYPES, BLOCKS, COMMON_REQUIRED, REVIEWERS, MIN } from '../src/lib/page-types.mjs';

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
  spokes: [{ slug: T('guide-slug'), why: T('why it pays first [^n]') }],
  ranked: Array.from({ length: 4 }, () => ({ name: T('job'), slug: T('guide slug or delete this key'), why: T('cost or time today [^n]'), payoff: T('the number to measure') })),
  decisions: Array.from({ length: 3 }, () => ({ decision: T('decision this role owns'), know: T('what they need to know [^n]') })),
  tool: { embed: `/tools/${slug}.html`, steps: [T('step 1'), T('step 2'), T('step 3')], method: [T('default + source [^n]'), T('formula + source [^n]'), T('limit [^n]')] },
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
  ...(type === 'crossing' ? { differs: t.differsFrom.map((k) => ({ what: k, how: T(`how ${k} differs from the parent page, or delete this row`) })) } : {}),
};
for (const f of fields) if (SLOT[f] !== undefined) page[f] = SLOT[f];
Object.assign(page, {
  offer: { heading: T('free-diagnostic heading in the buyer\'s words'), body: T('what the 30 minutes gets them, 1-2 sentences') },
  keyword: { phrase: T('main search phrase'), searches: 0, cpc: 0, difficulty: null },
  reviews: [],
  updated: today,
});

const brief = `# Research brief: ${topic} (${t.label})

Page: \`${slug}\` · type \`${type}\` · made ${today} from the golden template in \`src/lib/page-types.mjs\`.
Reader: lower-middle-market firm, 40-500 staff. Division head for this page: ${reader || t.division}.

## How to work
1. **Research agent** (separate from the writer): fill \`drafts/${slug}.research.md\` with findings for every slot below,
   each with source name, URL and date read. Primary sources first. Then stop.
2. **Writer agent**: fill \`drafts/${slug}.json\` from the research only. Footnote every claim as [^n], where n is
   the source's 1-based place in \`sources\`. Delete optional blocks you can't source; never pad.
3. Run \`node scripts/check-page.mjs drafts/${slug}.json\` and fix until it says PASS (the ICP reviews are the last FAILs).
4. **ICP review**, in this order, one pass each, fixes applied between passes: ${REVIEWERS.join(' → ')}.
   Each reviewer reads as that buyer and logs \`{reader, notes}\` in \`reviews\`. Persona notes: docs/steve-persona.md.
5. Move the JSON to \`src/content/ai-work/${slug}.json\`, run \`npm test\`. Set \`index: true\` only on Russell's yes.

## Rules baked into this template
- **Title** is the buyer's real question (People Also Ask, Reddit, Quora, vendor FAQs). Shape: "${t.titleShape}". Example: "${t.example}".
- **Bottom line first**: ${MIN.verdict[0]}-${MIN.verdict[1]} bullets, one idea each, each with ${MIN.verdictFootnotes}+ different sources. No number at the start of the title or a bullet.
- **Sources**: ${MIN[t.minSources || 'sources']}+ sources from ${MIN.domains}+ different sites; every claim footnoted; several sources per claim where they exist. Vendor claims are labelled as the vendor's.
- **Augmentation, not replacement**: the "Where does your team stay in charge?" block is required. No headcount-cut language.
- **No Upwork, freelancer marketplaces, hourly rates or rival consulting firms.**
- **Teach, then trust, then the lead**: the block order below is fixed. "When to pick something else" sits after "Buy or build", just above the free diagnostic.
- **Own data** (except tool and glossary pages): one table only Zavient has (a benchmark, a dated price check, a registry or package count).
- **ADHD-friendly**: sentences 25 words max, bullets 2 sentences max, paragraphs 3 max.
${t.differsFrom ? `- **Crossing guard**: list in \`differs\` how this page differs from its parent on ${t.differsFrom.join(', ')}. Under 4 of 6 → don't build it; add a section to the parent instead.\n` : ''}${t.minInbound ? `- **Inbound links**: publish only when ${t.minInbound}+ site pages link here.\n` : ''}
## Block order and what to research for each slot
${t.order.map((id, i) => `${i + 1}. **${((t.headings && t.headings[id]) || BLOCKS[id].h || id).replaceAll('{topic}', topic)}** (\`${BLOCKS[id].field}\`${[...COMMON_REQUIRED, ...t.required].includes(BLOCKS[id].field) ? ', required' : ', optional'})\n   ${BLOCKS[id].brief}`).join('\n')}

Then the free diagnostic (rendered on every page): write \`offer.heading\` and \`offer.body\` in the buyer's words.
`;

mkdirSync(join(root, 'drafts'), { recursive: true });
const jp = join(root, 'drafts', `${slug}.json`);
if (existsSync(jp)) { console.error(`${jp} exists; not overwriting`); process.exit(1); }
writeFileSync(jp, JSON.stringify(page, null, 2) + '\n');
writeFileSync(join(root, 'drafts', `${slug}.brief.md`), brief);
console.log(`wrote drafts/${slug}.json and drafts/${slug}.brief.md`);
