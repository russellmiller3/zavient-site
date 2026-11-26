// Golden templates (26 Nov 2026). One definition per page type: the order of its blocks, which blocks it must have,
// the default question heading of each block, and the research brief a writer agent fills each block from.
// Everything else reads this file: the content schema (src/content/config.ts), the page renderer
// (src/pages/ai-work/[slug].astro), the publish gate (scripts/check-page.mjs) and the skeleton maker
// (scripts/new-page.mjs). Change a template here and every page of that type follows.
//
// Site rules baked in (Drive master plan, "Site rules"; Russell, 26 Nov 2026):
// - BLUF top: bottom line as 3-5 bullets, then "On this page". No headline numbers at the top.
// - Titles and section headings are the buyer's real question.
// - Every claim footnoted [^n], with several sources where possible.
// - Augmentation, not replacement: every page says where the team stays in charge.
// - No Upwork, freelancer or low-end rate content anywhere.
// - Teach, then earn trust, then win the lead: teaching blocks first, proof next, then buy-or-build,
//   alternatives last, just above the free diagnostic.
// - Zarlent look in blue (public/ai-work/ai-work.css).
// - ICP review in order before publishing: COO, head of ops, GM, division head, owner-CEO last.

// Blocks every v1 page carries, whatever its type.
export const COMMON_REQUIRED = ['verdict', 'summary', 'humanRole', 'faq', 'stats', 'sources', 'offer'];

// ICP review order (Russell, 26 Nov 2026). No CFO ("Nix cfo").
export const REVIEWERS = ['COO', 'Head of operations', 'GM', 'Division head', 'Owner-CEO'];

// Minimums for a publishable (index: true) page.
export const MIN = { verdict: [3, 5], onPage: 3, sources: 10, toolSources: 5, glossarySources: 3, domains: 4, stats: 3, faq: 3, verdictFootnotes: 2 };

// Words that break the augmentation rule or the no-low-end-market rule. Matched case-insensitively.
export const BANNED = [
  { re: /\bupwork\b|\bfiverr\b|\bfreelancer\.com\b|\btoptal\b/i, why: 'no Upwork or freelancer-marketplace content (Russell, 26 Nov)' },
  { re: /\$\s?\d+\s?(?:-|to)\s?\$?\d+\s?(?:\/|per\s)h(?:ou)?r/i, why: 'no hourly rate ranges (low-end rate content)' },
  { re: /\breplac\w*\s+(?:your\s+|the\s+)?(?:staff|team|people|workers|employees|underwriters|analysts|clerks|accountants)\b/i, why: 'augmentation, not replacement' },
  { re: /\b(?:cut|reduce|slash|eliminate)\w*\s+(?:head ?count|jobs|staff|fte)/i, why: 'augmentation, not replacement' },
  { re: /\blay ?offs?\b|\bfewer (?:people|staff|employees)\b|\bwithout (?:hiring|humans)\b/i, why: 'augmentation, not replacement' },
  { re: /\bdelve\b|\bleverage\b|\bunlock\b|\bseamless\b|\btransformative\b|\bgame[- ]chang/i, why: 'banned filler word' },
];

// Every block the renderer knows. `h` is the default heading; {topic} is the page's topic (title text before the
// colon, lower-cased where it reads better). `brief` is what the writer agent researches to fill it.
export const BLOCKS = {
  'what-it-is': {
    field: 'summary', h: 'What is {topic}, and what does it change?',
    brief: '2-3 sentences, plain words. What the work is, what AI does in it, and the part that makes or breaks it. 2+ sources: one neutral explainer (regulator, standards body, academic or analyst), one practitioner source.',
  },
  'human-role': {
    field: 'humanRole', h: 'Where does your team stay in charge?',
    brief: '2-4 bullets: the decisions people keep, who checks AI output, who signs off. Name roles (underwriter, controller, ops lead). Source each to a regulator rule, standard or published case where one exists. Augmentation, never headcount cuts.',
  },
  spokes: {
    field: 'spokes', h: 'Where does AI pay first in {topic}?',
    brief: '4-8 linked guides, ranked by payoff for a 40-500 person firm. For each: one sentence on why it pays first, with a source (adoption survey, cost benchmark).',
  },
  ranked: {
    field: 'ranked', h: 'Where does AI pay first for {topic}?',
    brief: '4-8 jobs ranked by payoff then effort. For each: the job, why it pays (cost or time today, sourced), the payoff to measure, and the guide slug if one exists. Sources: industry cost benchmarks (APQC, Ardent, trade bodies), adoption surveys with sample sizes, regulator data.',
  },
  decisions: {
    field: 'decisions', h: 'Which AI decisions does a {topic} own?',
    brief: '3-6 decisions this role owns (what to fix first, buy or build, who checks output, how to measure). For each, what they need to know to decide, sourced. Use surveys of that role (Vistage, McKinsey, Gartner, trade bodies) with sample sizes.',
  },
  tool: {
    field: 'tool', h: 'Use the {topic}',
    brief: 'The tool itself (an HTML file in public/tools/), 3-5 steps to use it, and 3-6 method lines: every default and formula with its source. No made-up defaults.',
  },
  timeline: {
    field: 'timeline', h: 'When does each part of {topic} apply?',
    brief: 'Dated milestones (in force, proposed, withdrawn, start dates), each from the official text or the regulator page. Primary sources only.',
  },
  'own-data': {
    field: 'ownData', h: 'What did our own check find?',
    brief: 'The number only Zavient has: a benchmark we ran, a price check of N vendor pages on a date, a count from public registries or package stats. Table of 4-10 rows with method, date pulled and a note on limits. This is the publish gate: no own data, no index.',
  },
  example: {
    field: 'example', h: 'What does {topic} look like in practice?',
    brief: 'One concrete before-and-after: the real inputs (documents, fields, data) and the real output (decision, draft, flag) a reader in a 40-500 person firm would recognise. Mark it illustrative.',
  },
  recipes: {
    field: 'recipes', h: 'Which way to build {topic} fits your firm?',
    brief: '2-3 builds sized to the firm (small team, mid-size, document-heavy, etc.). For each: who it suits, a step flow where every step names the role doing it ("Controller: approve matches"), and the cost with sources. No hourly rates.',
  },
  tables: {
    field: 'tables', h: null,
    brief: '1-3 tables: tools and vendors (what it does, price or "not published", one fact worth knowing, vendor claims marked as such), public datasets or benchmarks, published study results. Every cell with a number gets a footnote.',
  },
  rules: {
    field: 'rules', h: 'Which rules apply to {topic}?',
    brief: 'Each law, rule or guidance that shapes the build: official link, status (in force, withdrawn, starts on a date) and what it means for the reader in 2-3 sentences. Primary sources (eCFR, Federal Register, regulator, EUR-Lex). Not legal advice.',
  },
  benchmark: {
    field: 'howToTest', h: 'How do you test {topic} before you trust it?',
    brief: '4-10 steps to benchmark on the reader\'s own data: record today\'s numbers, hold-out set, what to compare, how to price the lift in dollars. Source any method claim.',
  },
  'what-goes-wrong': {
    field: 'watchOuts', h: 'Where does {topic} go wrong?',
    brief: '3-6 failure modes from incidents, enforcement actions, studies or vendor post-mortems. Each says what to do about it. Sourced.',
  },
  faq: {
    field: 'faq', h: 'Questions buyers ask about {topic}',
    brief: '3-6 real questions from People Also Ask, Reddit, Quora, vendor FAQs and forums. Answer each in 1-3 sentences, answer first, sourced. Record where each question was seen in the draft notes.',
  },
  'buy-or-build': {
    field: 'buyVsBuild', h: 'Should you buy {topic} or build it?',
    brief: 'When to buy (no team, standard process, vendor data) and when to build (own data is the edge, rules need control). 2-3 sentences each, sourced (Menlo Ventures, MIT NANDA, Gartner, vendor pricing).',
  },
  'something-else': {
    field: 'pickElse', h: 'When should you pick something else?',
    brief: '2-4 situations where another approach beats this one, naming the alternative product or method. No rival consulting firms, no freelancer marketplaces. Sits just above the free diagnostic.',
  },
  resources: { field: 'resources', h: 'Useful resources', brief: '2-5 free tools, datasets or official guides, each with one line on why it helps.' },
  'key-numbers': { field: 'stats', h: 'Key numbers on this page', brief: '3-6 numbers used on the page, each with what it measures and its source. Never shown at the top.' },
  sources: { field: 'sources', h: 'Sources', brief: 'Numbered list: name, URL, what it says. 10+ sources from 4+ different sites. Prefer primary sources. Date read in the what line for prices.' },
  related: { field: 'related', h: null, brief: 'Slugs of 2-5 related pages (parent hub, sibling guides, the industry page).' },
};

// The order a page's blocks render in, per type. Teach first, then proof, then buy-or-build, then alternatives,
// then the reference matter, then the free diagnostic (rendered after every page).
export const TYPES = {
  usecase: {
    label: 'Use-case guide',
    titleShape: 'AI {job}: {the buyer\'s real question}?',
    example: 'AI credit scoring: how do lenders keep it fair and explainable?',
    order: ['what-it-is', 'human-role', 'own-data', 'example', 'recipes', 'tables', 'rules', 'benchmark', 'what-goes-wrong', 'faq', 'buy-or-build', 'something-else', 'resources', 'key-numbers', 'sources', 'related'],
    required: ['ownData', 'example', 'recipes', 'tables', 'howToTest', 'watchOuts', 'buyVsBuild', 'pickElse'],
    division: 'the head of the team that does this work (e.g. head of lending, chief underwriter, controller)',
  },
  crossing: {
    label: 'Industry use case',
    titleShape: 'AI {job} for {industry}: {question}?',
    example: 'AI underwriting for credit unions: what should you automate first?',
    order: ['what-it-is', 'human-role', 'own-data', 'example', 'recipes', 'tables', 'rules', 'benchmark', 'what-goes-wrong', 'faq', 'buy-or-build', 'something-else', 'resources', 'key-numbers', 'sources', 'related'],
    required: ['ownData', 'example', 'recipes', 'tables', 'rules', 'howToTest', 'watchOuts', 'buyVsBuild', 'pickElse'],
    division: 'the head of that work in that industry',
    // Scaled-content guard (research, 26 Nov 2026): build a crossing only when at least 4 of these 6 change from the
    // parent use-case page. Otherwise it is a section of the parent. The gate checks the page's `differs` list.
    differsFrom: ['problem', 'jobs', 'workflow', 'evidence', 'objections', 'conversion'],
  },
  hub: {
    label: 'Guide hub',
    titleShape: '{Work type}: {question}?',
    example: 'AI consulting for finance teams: where does AI pay first?',
    order: ['what-it-is', 'human-role', 'spokes', 'own-data', 'tables', 'recipes', 'rules', 'faq', 'buy-or-build', 'something-else', 'resources', 'key-numbers', 'sources', 'related'],
    required: ['spokes', 'buyVsBuild', 'pickElse'],
    division: 'the head of the function the hub covers',
  },
  industry: {
    label: 'Industry guide',
    titleShape: 'AI in {industry}: {question}?',
    example: 'AI in credit unions: where does it pay first?',
    order: ['what-it-is', 'human-role', 'ranked', 'own-data', 'tables', 'rules', 'what-goes-wrong', 'faq', 'buy-or-build', 'something-else', 'resources', 'key-numbers', 'sources', 'related'],
    required: ['ranked', 'tables', 'rules', 'watchOuts', 'buyVsBuild', 'pickElse'],
    division: 'the division heads of that industry (e.g. head of lending, chief underwriter)',
  },
  role: {
    label: 'For your role',
    titleShape: 'AI for {role}s: {question}?',
    example: 'AI for COOs: which process do you fix first?',
    order: ['what-it-is', 'human-role', 'decisions', 'ranked', 'recipes', 'own-data', 'benchmark', 'what-goes-wrong', 'faq', 'buy-or-build', 'something-else', 'resources', 'key-numbers', 'sources', 'related'],
    required: ['decisions', 'ranked', 'recipes', 'howToTest', 'watchOuts', 'buyVsBuild', 'pickElse'],
    division: 'the role itself is the main reader; the division-head review checks it from a peer function',
    headings: { recipes: 'What does a 90-day start look like?', benchmark: 'How do you show it worked?' },
  },
  glossary: {
    label: 'Term',
    titleShape: 'What is {term}?',
    example: 'What is reject inference in credit scoring?',
    // One term per page; publish only when 5+ site pages link to it (research, 26 Nov 2026). The gate counts links.
    order: ['what-it-is', 'example', 'human-role', 'something-else', 'faq', 'resources', 'key-numbers', 'sources', 'related'],
    required: ['example'],
    minSources: 'glossarySources',
    minInbound: 5,
    division: 'the person who would use the term at work',
    headings: { 'something-else': 'What is {topic} not?' },
  },
  tool: {
    label: 'Free tool',
    titleShape: '{Tool name}: {question it answers}?',
    example: 'AI readiness check: is your firm ready to use AI on real work?',
    order: ['tool', 'what-it-is', 'human-role', 'own-data', 'faq', 'something-else', 'resources', 'key-numbers', 'sources', 'related'],
    required: ['tool'],
    minSources: 'toolSources',
    division: 'the person most likely to run the tool',
  },
  regulation: {
    label: 'Rules guide',
    titleShape: '{Rule}: {what it means for the buyer}?',
    example: 'EU AI Act and credit scoring: what do US lenders have to do?',
    order: ['what-it-is', 'timeline', 'rules', 'human-role', 'benchmark', 'what-goes-wrong', 'faq', 'buy-or-build', 'something-else', 'resources', 'key-numbers', 'sources', 'related'],
    required: ['timeline', 'rules', 'howToTest', 'watchOuts'],
    division: 'the compliance or risk owner for that work',
    headings: { benchmark: 'How do you check you comply?' },
  },
};

// Pages built before the golden templates (no templateVersion) keep the order they shipped with.
export const LEGACY_ORDER = ['what-it-is', 'spokes', 'own-data', 'example', 'recipes', 'tables', 'rules', 'benchmark', 'what-goes-wrong', 'buy-or-build', 'something-else', 'resources', 'key-numbers', 'sources', 'related'];
export const LEGACY_HEADINGS = {
  'what-it-is': 'What it is', spokes: 'Where AI pays first in finance work', example: 'What it looks like', rules: 'Rules that apply',
  'what-goes-wrong': 'What goes wrong', 'buy-or-build': 'Buy or build', 'something-else': 'When to pick something else',
  resources: 'Useful resources', 'key-numbers': 'Key numbers on this page', sources: 'Sources', 'human-role': 'Where your team stays in charge',
  faq: 'Questions buyers ask', decisions: 'Decisions you own', ranked: 'Where AI pays first', timeline: 'Timeline', tool: 'Use the tool',
};

// The heading a block shows on a page: the page's own override, else the type's, else the template default.
export function headingFor(d, id) {
  if (d.headings && d.headings[id]) return d.headings[id];
  if (!d.templateVersion) return id === 'recipes' ? d.recipesTitle : id === 'benchmark' ? d.testTitle : id === 'own-data' ? d.ownData?.title : LEGACY_HEADINGS[id];
  const t = TYPES[d.type] || TYPES.usecase;
  const topic = (d.topic || d.title.split(':')[0]).trim();
  if (id === 'own-data' && d.ownData?.title) return d.ownData.title;
  const base = (t.headings && t.headings[id]) || BLOCKS[id]?.h;
  return base ? base.replaceAll('{topic}', topic) : null;
}

// Is a block's content present on this page?
export function hasBlock(d, id) {
  const f = BLOCKS[id]?.field;
  const v = f ? d[f] : undefined;
  if (v === undefined || v === null) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'object') return Object.keys(v).length > 0;
  return String(v).trim().length > 0;
}

export function orderFor(d) {
  return d.templateVersion ? (TYPES[d.type] || TYPES.usecase).order : LEGACY_ORDER;
}
