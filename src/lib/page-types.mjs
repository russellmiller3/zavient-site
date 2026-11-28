// Golden templates (26 Nov 2026). One definition per page type: the order of its blocks, which blocks it must have,
// the default question heading of each block, and the research brief a writer agent fills each block from.
// Everything else reads this file: the content schema (src/content/config.ts), the page renderer
// (src/pages/ai-work/[slug].astro), the publish gate (scripts/check-page.mjs) and the skeleton maker
// (scripts/new-page.mjs). Change a template here and every page of that type follows.
//
// Site rules baked in (Drive master plan, "Site rules"; Russell, 26 Nov 2026):
// - BLUF top: bottom line as 3-5 bullets, then "On this page". No headline numbers at the top.
// - Titles and section headings are the buyer's real question.
// - Answer first (Russell, 26 Nov 2026, "MAKE SURE TO ANSWER THE QUESTIONS"): every question heading is answered in
//   the first sentence under it, 30 words or fewer, before any example, table or list (answers[blockId]).
//   Checked by src/lib/answer-first.mjs in the publish gate and on the built site.
// - Every claim footnoted [^n], with several sources where possible, each one supporting the claim it is attached to.
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
export const MIN = { verdict: [3, 5], onPage: 3, sources: 10, toolSources: 5, domains: 4, stats: 3, faq: 3, verdictFootnotes: 2, related: [2, 5] };
// Hubs link out more than one guide does (build thread, 26 Nov 2026): a type may raise the related-links cap with relatedMax.
export const relatedRange = (type) => [MIN.related[0], TYPES[type]?.relatedMax || MIN.related[1]];
// A page's description is its search snippet: 50-160 characters (the schema enforces it at build; the gate says it first).
export const DESCRIPTION = [50, 160];

// Measured demand (architecture doc, "Publish gate"): 100+ US searches a month, or 30+ at $20+ a click.
export const DEMAND = { searches: 100, nicheSearches: 30, nicheCpc: 20 };

// Words that break the augmentation rule or the no-low-end-market rule. Matched case-insensitively.
export const BANNED = [
  { re: /\bupwork\b|\bfiverr\b|\bfreelancer\.com\b|\btoptal\b/i, why: 'no Upwork or freelancer-marketplace content (Russell, 26 Nov)' },
  { re: /\$\s?\d+\s?(?:-|to)\s?\$?\d+\s?(?:\/|per\s)h(?:ou)?r/i, why: 'no hourly rate ranges (low-end rate content)' },
  { re: /\breplac\w*\s+(?:your\s+|the\s+)?(?:staff|team|people|workers|employees|underwriters|analysts|clerks|accountants)\b/i, why: 'augmentation, not replacement' },
  { re: /\b(?:cut|reduce|slash|eliminate)\w*\s+(?:head ?count|jobs|staff|fte)/i, why: 'augmentation, not replacement' },
  { re: /\blay ?offs?\b|\bfewer (?:people|staff|employees)\b|\bwithout (?:hiring|humans)\b/i, why: 'augmentation, not replacement' },
  { re: /\breddit\b|\bquora\b|(?:^|[\s("])r\/[A-Za-z]{2,}|\bforum (?:posts?|threads?|repl(?:y|ies)|posters)\b/i, why: 'no forum threads as evidence: cite a regulator, study, analyst or the vendor\'s own page (26 Nov 2026)' },
  { re: /\bleverage\b|\bunlock\b|\bseamless\b|\btransformative\b|\bgame[- ]chang/i, why: 'banned filler word' },
  // "delve" is filler, but Delve is also a company (28 Nov 2026). Capitalised mid-sentence it reads as the name and
  // passes; lowercase, all caps or opening a sentence or string ("Delve into ...") it is still banned. Case-sensitive.
  { re: /\bdelve\b|\bDELVE\b|(?:^|["'(\u201c]|[.!?:;]\s+)Delve\b/, why: 'banned filler word ("Delve" capitalised mid-sentence, the company, is fine)' },
];

// Every brief below is filled answer-first: whatever the block holds, its first sentence answers its heading.
export const ANSWER_FIRST_BRIEF = 'First, put in answers[blockId] one plain sentence (30 words or fewer, footnoted) that answers the heading outright: yes/no questions start Yes or No, cost questions give a number, how questions give the steps, what questions give a definition. The detail below is the proof.';

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
  'team-after': {
    field: 'teamAfter', h: 'What does your team do after?',
    brief: '2-4 bullets: the work people move to once AI takes the first pass (checking exceptions, talking to customers, deeper review). Source each to a study, survey or published case. Census data: where AI changed tasks, 66% of firms only use it to help staff and 2% saw AI-related job losses (CES-26-25). Augmentation, never headcount cuts.',
  },
  'walk-away': {
    field: 'walkAway', h: 'What should you walk away with?',
    brief: '3-5 bullets: what a buyer should hold at the end of good help (a ranked workflow list, a before-and-after measure, a working pilot, a plan their team can run). Source to buyer surveys where possible.',
  },
  forward: {
    field: 'forward', h: 'The one-page brief to hand your {handoffTo}',
    brief: '4-6 short lines a reader can print or forward to the owner-CEO: the top workflow, what it saves, the risk and who checks it, the first step, the cost range. Every number footnoted. This is the role page\'s forward to Steve.',
  },
  applies: {
    field: 'applies', h: 'Does {topic} apply to you?',
    brief: '3-6 if/then lines a reader can answer yes or no to (size, state, what the AI decides, who is affected), each from the rule\'s own text. Primary sources only. Not legal advice.',
  },
  tool: {
    field: 'tool', h: 'Use the {topic}',
    brief: 'The tool itself (an HTML file in public/tools/embed/), 3-5 steps to use it, and 3-6 method lines: every default and formula with its source. No made-up defaults.',
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
    brief: '3-6 real questions from People Also Ask, Reddit, Quora, vendor FAQs and forums. Answer each in 1-3 sentences, answer first, sourced. Record where each question was seen in the draft notes, never in the source list: forum threads are not sources.',
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
  related: { field: 'related', h: null, brief: 'Slugs of related pages that exist in src/content/ai-work (parent hub, sibling guides, the industry page): 2-5, or up to the type\'s relatedMax on industry hubs, role and tool pages. The page check fails an unknown slug.' },
};

// The order a page's blocks render in, per type. Teach first, then proof, then buy-or-build, then alternatives,
// then the reference matter, then the free diagnostic (rendered after every page).
// Page types and names follow the site architecture doc "Zavient site architecture" (26 Nov 2026, "Page types and
// templates"). Its other types are built elsewhere: data stories in src/content/data-stories (/data/), and the
// one-off pages (About, Method, benchmark pages, the free diagnostic, home) by hand. It builds no glossary pages.
export const TYPES = {
  usecase: {
    eyebrow: 'AI work',
    label: 'Work playbook',
    path: 'ai-work/{slug}',
    titleShape: 'Can AI {do the work} {the way the buyer needs it}?',
    example: 'Can AI score loans fairly and explainably?',
    order: ['what-it-is', 'human-role', 'team-after', 'example', 'tables', 'recipes', 'own-data', 'rules', 'benchmark', 'what-goes-wrong', 'faq', 'buy-or-build', 'something-else', 'resources', 'key-numbers', 'sources', 'related'],
    required: ['teamAfter', 'ownData', 'example', 'recipes', 'tables', 'howToTest', 'watchOuts', 'buyVsBuild', 'pickElse'],
    division: 'the head of the team that does this work (e.g. head of lending, chief underwriter, controller)',
    offer: 'Bring us your {job} process. Leave with the first step and a before-and-after measure.',
  },
  crossing: {
    eyebrow: 'AI work',
    label: 'Work for one industry',
    path: 'ai-work/{parent}/{industrySlug}',
    titleShape: 'Can AI {do the work} for {industry} {the way they need it}?',
    example: 'Can AI underwrite for insurers without tripping the NAIC bulletin?',
    // URL order is always work, then industry (architecture doc, "URL scheme").
    order: ['what-it-is', 'human-role', 'team-after', 'example', 'tables', 'recipes', 'own-data', 'rules', 'benchmark', 'what-goes-wrong', 'faq', 'buy-or-build', 'something-else', 'resources', 'key-numbers', 'sources', 'related'],
    required: ['teamAfter', 'ownData', 'example', 'recipes', 'tables', 'rules', 'howToTest', 'watchOuts', 'buyVsBuild', 'pickElse'],
    division: 'the head of that work in that industry',
    differsFrom: ['problem', 'jobs', 'workflow', 'evidence', 'objections', 'conversion'],
    headings: { faq: 'What will your examiner or regulator ask?' },
    offer: 'Bring us your {job} process. Leave with the first step, a before-and-after measure and the questions your examiner will ask.',
  },
  industry: {
    eyebrow: 'Industries',
    label: 'Industry hub',
    relatedMax: 10,
    path: 'industries/{slug}',
    titleShape: 'What are {industry} actually using AI for?',
    example: 'What are community banks actually using AI for?',
    order: ['what-it-is', 'human-role', 'ranked', 'own-data', 'tables', 'rules', 'what-goes-wrong', 'faq', 'buy-or-build', 'something-else', 'resources', 'key-numbers', 'sources', 'related'],
    required: ['ranked', 'tables', 'rules', 'watchOuts', 'buyVsBuild', 'pickElse'],
    division: 'the division heads of that industry (e.g. head of lending, chief underwriter)',
    headings: { 'own-data': 'What are your peers hiring for?' },
    offer: 'Which of these workflows pays back first at your firm?',
  },
  role: {
    eyebrow: 'Roles',
    label: 'Role page',
    relatedMax: 8,
    path: 'for/{slug}',
    titleShape: 'Where should a {role} start with AI?',
    example: 'Where should a head of lending start with AI?',
    // A router and a forward, not a traffic bet: it skips the demand check (architecture doc, "Publish gate").
    order: ['what-it-is', 'human-role', 'decisions', 'ranked', 'faq', 'forward', 'recipes', 'own-data', 'benchmark', 'what-goes-wrong', 'buy-or-build', 'something-else', 'resources', 'key-numbers', 'sources', 'related'],
    required: ['decisions', 'ranked', 'forward', 'recipes', 'howToTest', 'watchOuts', 'buyVsBuild', 'pickElse'],
    division: 'the role itself is the main reader; the division-head review checks it from a peer function',
    headings: { faq: 'What will your {handoffTo}, board or examiner ask?', recipes: 'What does a 90-day start look like?', benchmark: 'How do you show it worked?' },
    skipDemand: true,
    offer: 'Your top 2 workflows ranked, and a one-page plan you can hand your {handoffTo}.',
  },
  consulting: {
    eyebrow: 'AI consulting',
    label: 'Consulting',
    path: 'ai-consulting/{slug}',
    titleShape: '{The kind of help}: what should you walk away with?',
    example: 'AI automation consulting: what should you walk away with?',
    // Never named rival or partner firms, or freelancer rates (Site rules). Zavient's own price ranges only on Russell's yes.
    order: ['what-it-is', 'walk-away', 'spokes', 'human-role', 'recipes', 'own-data', 'what-goes-wrong', 'benchmark', 'faq', 'something-else', 'resources', 'key-numbers', 'sources', 'related'],
    required: ['walkAway', 'recipes', 'watchOuts', 'howToTest', 'pickElse'],
    division: 'the operator who would hire the help (COO or head of operations)',
    headings: { spokes: 'Which kind of help do you need?', recipes: 'What shapes can the work take?', 'what-goes-wrong': 'Why do most AI pilots stall?', benchmark: 'How do you judge any AI advisor?', 'something-else': 'When should you not hire help?' },
    offer: 'Free, before any paid work: 30 minutes on your first workflow.',
  },
  regulation: {
    eyebrow: 'AI rules',
    label: 'Rules page',
    path: 'ai-rules/{slug}',
    titleShape: 'Does {rule} apply to {a firm like yours}?',
    example: 'Does the Colorado AI Act apply to a 200-person lender?',
    order: ['what-it-is', 'applies', 'timeline', 'rules', 'own-data', 'human-role', 'spokes', 'benchmark', 'what-goes-wrong', 'faq', 'buy-or-build', 'something-else', 'resources', 'key-numbers', 'sources', 'related'],
    required: ['applies', 'timeline', 'rules', 'howToTest', 'watchOuts'],
    division: 'the compliance or risk owner for that work',
    headings: { spokes: 'Which of your work does it touch?', benchmark: 'What is on your checklist?' },
    offer: 'Does this rule touch the AI you use? We\'ll check in 30 minutes.',
  },
  tool: {
    eyebrow: 'Free tool',
    label: 'Free tool',
    relatedMax: 8,
    path: 'tools/{slug}',
    titleShape: '{Tool name}: {question it answers}?',
    example: 'AI ROI calculator: will this workflow pay back this year?',
    // The tool is the Zavient-only fact (architecture doc: "a benchmark result, a job-ad count, a worked example or a calculator").
    order: ['tool', 'what-it-is', 'human-role', 'own-data', 'faq', 'something-else', 'resources', 'key-numbers', 'sources', 'related'],
    required: ['tool'],
    minSources: 'toolSources',
    division: 'the person most likely to run the tool',
    offer: 'Want the detailed plan behind your result? Book the free 30-minute diagnostic.',
    // Tool names read badly in the default 'What is {topic}' and 'Questions buyers ask about {topic}' (screenshot check, 26 Nov).
    headings: { 'what-it-is': 'What does the {topic} do?', faq: 'Questions leaders ask' },
  },
  compare: {
    eyebrow: 'Compare',
    label: 'Comparison',
    path: 'compare/{slug}',
    titleShape: '{A} vs {B}: which fits {a team like yours}?',
    example: 'ChatGPT Plus vs Business vs Enterprise: which plan fits a 40-500 person firm?',
    // X vs Y strategy (Drive, "X vs Y comparison strategy", 26 Nov 2026). Software, plan, model and concept pairs only:
    // never rival or partner consulting firms. Bottom line is "Pick A if... Pick B if...". The table is the extractable
    // core; own data is a dated price-and-terms check of each vendor's own pages. Teach the difference, show who each
    // fits by team size and work type, then where people stay in charge, then buy-or-build and pick-neither.
    order: ['what-it-is', 'tables', 'recipes', 'human-role', 'own-data', 'example', 'what-goes-wrong', 'faq', 'buy-or-build', 'something-else', 'resources', 'key-numbers', 'sources', 'related'],
    required: ['tables', 'recipes', 'ownData', 'watchOuts', 'buyVsBuild', 'pickElse'],
    division: 'the head of the team that would use the tool most (ops lead, controller, head of service)',
    headings: {
      'what-it-is': 'What is the real difference?',
      tables: 'How do they compare, side by side?',
      recipes: 'Which one fits your team?',
      'what-goes-wrong': 'What do teams get wrong when they choose?',
      'something-else': 'When should you pick neither?',
      example: 'What does each look like in practice?',
      'buy-or-build': 'Should you buy a tool or build your own?',
      faq: 'Questions buyers ask before they choose',
    },
    offer: 'Not sure which fits your team? Bring us your top workflow. Leave with a pick and a first step.',
  },
  guide: {
    eyebrow: 'Guides',
    label: 'Guide',
    path: 'guides/{slug}',
    titleShape: 'How do I {do the thing}?',
    example: 'How do I pick our first AI project?',
    order: ['what-it-is', 'human-role', 'benchmark', 'example', 'own-data', 'what-goes-wrong', 'faq', 'something-else', 'resources', 'key-numbers', 'sources', 'related'],
    required: ['howToTest', 'example', 'watchOuts'],
    division: 'the person who would do the steps',
    headings: { benchmark: 'What are the steps?' },
    offer: 'Want a second pair of eyes on your answer? Book the free 30-minute diagnostic.',
  },
};

// One-off pages in the architecture doc that need no template: they are built once, by hand.
export const ONE_OFFS = ['About', 'Method', 'One page per benchmark', 'Free diagnostic', 'Home', 'Data story and monthly report (src/content/data-stories)'];

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
  return base ? base.replaceAll('{topic}', topic).replaceAll('{handoffTo}', handoffFor(d)) : null;
}

// The eyebrow over every page's title (28 Nov 2026): the page type's reader-facing section, named after its URL folder
// (ai-work/, industries/, for/, ai-consulting/, ai-rules/, compare/, tools/, guides/), then a short topic. It used to
// print the whole job text and the industry, which ran to two lines on a phone on compare pages. The topic is the
// page's shortTopic if it sets one, else derived from topic: the part before any colon, no parenthetical, no leading
// "AI for", "AI in" or (when the section name already says AI) "AI", and, if still too long, no trailing "for ..."
// clause, and no leading "<section word> for". The page check fails a topic over EYEBROW_TOPIC_MAX characters (src/lib/structure-rules.mjs).
export const EYEBROW_TOPIC_MAX = 40;
export function eyebrowLabel(d) {
  const t = TYPES[d.type] || TYPES.usecase;
  return t.eyebrow || 'AI work';
}
export function eyebrowTopic(d) {
  if (d.shortTopic && d.shortTopic.trim()) return d.shortTopic.trim();
  let s = String(d.topic || d.title || '').split(':')[0].replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
  s = s.replace(/^AI\s+(?:for|in)\s+(?:the\s+)?/i, '');
  const label = eyebrowLabel(d);
  if (/\bAI\b/.test(label)) s = s.replace(/^AI\s+(?=\S)/, '');
  // "AI consulting · Consulting for small businesses" reads twice: drop the section's own word before "for".
  const last = label.split(' ').pop();
  s = s.replace(new RegExp(`^${last}\\s+for\\s+`, 'i'), '');
  if (s.length > EYEBROW_TOPIC_MAX) s = s.replace(/\s+for\s+.*$/i, '');
  return s.charAt(0).toUpperCase() + s.slice(1);
}
export const eyebrowFor = (d) => `${eyebrowLabel(d)} · ${eyebrowTopic(d)}`;

// Who a role page's reader hands the plan to (28 Nov 2026). The role template said "hand your CEO" everywhere, but a
// family office COO answers to a principal. A page sets handoffTo ("principal", "board", "managing partner"); the
// role template's offer, its forward heading and its FAQ heading all use it. Default: CEO.
export const HANDOFF_DEFAULT = 'CEO';
export const handoffFor = (d) => (d.handoffTo && d.handoffTo.trim()) || HANDOFF_DEFAULT;
// The type's offer line with the page's own job and hand-off audience filled in.
export function offerFor(d, fallback = 'Get a free 30-minute diagnostic of how to approach this with AI.') {
  const t = TYPES[d.type] || TYPES.usecase;
  return (t.offer || fallback).replaceAll('{job}', d.job).replaceAll('{handoffTo}', handoffFor(d));
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

// Where a page lives (site architecture doc, "URL scheme", 26 Nov 2026): one folder per page type, short slugs,
// work before industry for crossings, plural folders for people. Pages built before the templates stay at
// /ai-work/<slug> so nothing already built moves. The consulting hub's slug is "ai-consulting" (/ai-consulting.html).
// Vercel serves exact files, so the public address is the route plus ".html".
export function routeFor(d, id) {
  if (!d.templateVersion) return `ai-work/${id}`;
  if (d.type === 'consulting' && id === 'ai-consulting') return 'ai-consulting';
  const t = TYPES[d.type] || TYPES.usecase;
  return t.path.replaceAll('{slug}', id).replaceAll('{parent}', d.parent || id).replaceAll('{industrySlug}', d.industrySlug || id);
}
export const urlFor = (d, id) => `/${routeFor(d, id)}.html`;

export function orderFor(d) {
  return d.templateVersion ? (TYPES[d.type] || TYPES.usecase).order : LEGACY_ORDER;
}
