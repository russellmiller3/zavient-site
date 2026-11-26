# Golden page templates

Page types are named as in the site architecture doc (26 Nov 2026). Built once by hand, with no template: About, Method, One page per benchmark, Free diagnostic, Home, Data story and monthly report (src/content/data-stories).

One template per page type. Each fixes the block order, the required blocks, the question headings and a research
brief for every slot, so a new page is research plus fill-in. Source of truth: `src/lib/page-types.mjs`
(this file is generated from it by `node scripts/templates-doc.mjs`).

## Make a page
1. `node scripts/new-page.mjs --type <type> --slug <slug> --topic "<topic>" --job "<job>"` writes a skeleton JSON and a research brief to `drafts/`.
2. A research agent fills `drafts/<slug>.research.md` from the brief. A separate writer agent fills the JSON from it.
3. `node scripts/check-page.mjs drafts/<slug>.json` until PASS.
4. ICP review, in order: COO → Head of operations → GM → Division head → Owner-CEO.
5. Move the JSON to `src/content/ai-work/`, `npm test`. `index: true` only on Russell's yes.
6. Look at it in a live browser. Screenshot the built page at 1280px and 390px wide and check every block by eye: flows, tables, footnotes, the sticky box, buttons. A visual change is not done until those screenshots look right, and they go with the report (Russell's rule, 26 Nov 2026).

## Rules every template enforces
- Bottom line first: 3-5 bullets, each with 2+ sources. No number leading the title or a bullet.
- Title and headings are the buyer's question; the title ends in "?".
- Every claim footnoted; 10+ sources from 4+ sites (tool pages 5).
- Measured demand: 100+ US searches a month, or 30+ at $20+ a click (role pages skip it: they are navigation).
- One fact its siblings don't have, and a real updated date.
- A page that fails any check renders noindex, follow and stays out of the sitemap, even with `index: true`.
- "Where does your team stay in charge?" on every page. No headcount-cut wording.
- No Upwork, freelancer marketplaces, hourly rates or rival consulting firms.
- Teach, then trust, then the lead: alternatives sit after "Buy or build", just above the free diagnostic.
- The free diagnostic shows in four spots, worded for the page type: under the bottom line, beside the tool or own data, in a sticky contents box, and at the end.
- Every long page (5+ sections) gets the sticky contents automatically: a side rail at 1300px and wider, a bottom bar below that naming the section you're in, a jump link to every section, the current one marked. Nothing to fill in; it reads the page's own headings (Russell, 26 Nov 2026).
- One folder per page type; pages built before the templates stay at `/ai-work/<slug>.html`.
- A fact only Zavient has on every page except tools (the tool is the fact).
- ADHD-friendly: 25-word sentences, 2-sentence bullets, 3-sentence paragraphs.
- Zarlent look in blue (`public/ai-work/ai-work.css`).
- Required on every page: verdict, summary, humanRole, faq, stats, sources, offer.

## Work playbook (`usecase`)
- Address: `/ai-work/{slug}.html`.
- Title shape: "Can AI {do the work} {the way the buyer needs it}?". Example: "Can AI score loans fairly and explainably?".
- Division-head reviewer: the head of the team that does this work (e.g. head of lending, chief underwriter, controller).
- Free diagnostic offer: "Bring us your {job} process. Leave with the first step and a before-and-after measure."
- Required beyond the common set: teamAfter, ownData, example, recipes, tables, howToTest, watchOuts, buyVsBuild, pickElse.

Block order:
1. What is <topic>, and what does it change?
2. Where does your team stay in charge?
3. What does your team do after?
4. What does <topic> look like in practice?
5. Tables (one heading each)
6. Which way to build <topic> fits your firm?
7. What did our own check find?
8. Which rules apply to <topic>?
9. How do you test <topic> before you trust it?
10. Where does <topic> go wrong?
11. Questions buyers ask about <topic>
12. Should you buy <topic> or build it?
13. When should you pick something else?
14. Useful resources
15. Key numbers on this page
16. Sources
17. Related links
18. Free diagnostic

## Work for one industry (`crossing`)
- Address: `/ai-work/{parent}/{industrySlug}.html`.
- Title shape: "Can AI {do the work} for {industry} {the way they need it}?". Example: "Can AI underwrite for insurers without tripping the NAIC bulletin?".
- Division-head reviewer: the head of that work in that industry.
- Free diagnostic offer: "Bring us your {job} process. Leave with the first step, a before-and-after measure and the questions your examiner will ask."
- Build only if it differs from its parent on 4 of: problem, jobs, workflow, evidence, objections, conversion. Otherwise add a section to the parent.
- Required beyond the common set: teamAfter, ownData, example, recipes, tables, rules, howToTest, watchOuts, buyVsBuild, pickElse.

Block order:
1. What is <topic>, and what does it change?
2. Where does your team stay in charge?
3. What does your team do after?
4. What does <topic> look like in practice?
5. Tables (one heading each)
6. Which way to build <topic> fits your firm?
7. What did our own check find?
8. Which rules apply to <topic>?
9. How do you test <topic> before you trust it?
10. Where does <topic> go wrong?
11. What will your examiner or regulator ask?
12. Should you buy <topic> or build it?
13. When should you pick something else?
14. Useful resources
15. Key numbers on this page
16. Sources
17. Related links
18. Free diagnostic

## Industry hub (`industry`)
- Address: `/industries/{slug}.html`.
- Title shape: "What are {industry} actually using AI for?". Example: "What are community banks actually using AI for?".
- Division-head reviewer: the division heads of that industry (e.g. head of lending, chief underwriter).
- Free diagnostic offer: "Which of these workflows pays back first at your firm?"
- Required beyond the common set: ranked, tables, rules, watchOuts, buyVsBuild, pickElse.

Block order:
1. What is <topic>, and what does it change?
2. Where does your team stay in charge?
3. Where does AI pay first for <topic>?
4. What are your peers hiring for?
5. Tables (one heading each)
6. Which rules apply to <topic>?
7. Where does <topic> go wrong?
8. Questions buyers ask about <topic>
9. Should you buy <topic> or build it?
10. When should you pick something else?
11. Useful resources
12. Key numbers on this page
13. Sources
14. Related links
15. Free diagnostic

## Role page (`role`)
- Address: `/for/{slug}.html`.
- Title shape: "Where should a {role} start with AI?". Example: "Where should a head of lending start with AI?".
- Division-head reviewer: the role itself is the main reader; the division-head review checks it from a peer function.
- Free diagnostic offer: "Your top 2 workflows ranked, and a one-page plan you can hand your CEO."
- Skips the demand check (navigation page).
- Required beyond the common set: decisions, ranked, forward, recipes, howToTest, watchOuts, buyVsBuild, pickElse.

Block order:
1. What is <topic>, and what does it change?
2. Where does your team stay in charge?
3. Which AI decisions does a <topic> own?
4. Where does AI pay first for <topic>?
5. What will your CEO, board or examiner ask?
6. The one-page brief to hand your CEO
7. What does a 90-day start look like?
8. What did our own check find?
9. How do you show it worked?
10. Where does <topic> go wrong?
11. Should you buy <topic> or build it?
12. When should you pick something else?
13. Useful resources
14. Key numbers on this page
15. Sources
16. Related links
17. Free diagnostic

## Consulting (`consulting`)
- Address: `/ai-consulting/{slug}.html` (the hub, slug `ai-consulting`, is `/ai-consulting.html`).
- Title shape: "{The kind of help}: what should you walk away with?". Example: "AI automation consulting: what should you walk away with?".
- Division-head reviewer: the operator who would hire the help (COO or head of operations).
- Free diagnostic offer: "Free, before any paid work: 30 minutes on your first workflow."
- Required beyond the common set: walkAway, recipes, watchOuts, howToTest, pickElse.

Block order:
1. What is <topic>, and what does it change?
2. What should you walk away with?
3. Where does your team stay in charge?
4. What shapes can the work take?
5. What did our own check find?
6. Why do most AI pilots stall?
7. How do you judge any AI advisor?
8. Questions buyers ask about <topic>
9. When should you not hire help?
10. Useful resources
11. Key numbers on this page
12. Sources
13. Related links
14. Free diagnostic

## Rules page (`regulation`)
- Address: `/ai-rules/{slug}.html`.
- Title shape: "Does {rule} apply to {a firm like yours}?". Example: "Does the Colorado AI Act apply to a 200-person lender?".
- Division-head reviewer: the compliance or risk owner for that work.
- Free diagnostic offer: "Does this rule touch the AI you use? We'll check in 30 minutes."
- Required beyond the common set: applies, timeline, rules, howToTest, watchOuts.

Block order:
1. What is <topic>, and what does it change?
2. Does <topic> apply to you?
3. When does each part of <topic> apply?
4. Which rules apply to <topic>?
5. Where does your team stay in charge?
6. Which of your work does it touch?
7. What is on your checklist?
8. Where does <topic> go wrong?
9. Questions buyers ask about <topic>
10. Should you buy <topic> or build it?
11. When should you pick something else?
12. Useful resources
13. Key numbers on this page
14. Sources
15. Related links
16. Free diagnostic

## Free tool (`tool`)
- Address: `/tools/{slug}.html`.
- Title shape: "{Tool name}: {question it answers}?". Example: "AI ROI calculator: will this workflow pay back this year?".
- Division-head reviewer: the person most likely to run the tool.
- Free diagnostic offer: "Want the detailed plan behind your result? Book the free 30-minute diagnostic."
- Required beyond the common set: tool.

Block order:
1. Use the <topic>
2. What is <topic>, and what does it change?
3. Where does your team stay in charge?
4. What did our own check find?
5. Questions buyers ask about <topic>
6. When should you pick something else?
7. Useful resources
8. Key numbers on this page
9. Sources
10. Related links
11. Free diagnostic

## Guide (`guide`)
- Address: `/guides/{slug}.html`.
- Title shape: "How do I {do the thing}?". Example: "How do I pick our first AI project?".
- Division-head reviewer: the person who would do the steps.
- Free diagnostic offer: "Want a second pair of eyes on your answer? Book the free 30-minute diagnostic."
- Required beyond the common set: howToTest, example, watchOuts.

Block order:
1. What is <topic>, and what does it change?
2. Where does your team stay in charge?
3. What are the steps?
4. What does <topic> look like in practice?
5. What did our own check find?
6. Where does <topic> go wrong?
7. Questions buyers ask about <topic>
8. When should you pick something else?
9. Useful resources
10. Key numbers on this page
11. Sources
12. Related links
13. Free diagnostic

## What to research for each block
- **what-it-is** (`summary`): 2-3 sentences, plain words. What the work is, what AI does in it, and the part that makes or breaks it. 2+ sources: one neutral explainer (regulator, standards body, academic or analyst), one practitioner source.
- **human-role** (`humanRole`): 2-4 bullets: the decisions people keep, who checks AI output, who signs off. Name roles (underwriter, controller, ops lead). Source each to a regulator rule, standard or published case where one exists. Augmentation, never headcount cuts.
- **spokes** (`spokes`): 4-8 linked guides, ranked by payoff for a 40-500 person firm. For each: one sentence on why it pays first, with a source (adoption survey, cost benchmark).
- **ranked** (`ranked`): 4-8 jobs ranked by payoff then effort. For each: the job, why it pays (cost or time today, sourced), the payoff to measure, and the guide slug if one exists. Sources: industry cost benchmarks (APQC, Ardent, trade bodies), adoption surveys with sample sizes, regulator data.
- **decisions** (`decisions`): 3-6 decisions this role owns (what to fix first, buy or build, who checks output, how to measure). For each, what they need to know to decide, sourced. Use surveys of that role (Vistage, McKinsey, Gartner, trade bodies) with sample sizes.
- **team-after** (`teamAfter`): 2-4 bullets: the work people move to once AI takes the first pass (checking exceptions, talking to customers, deeper review). Source each to a study, survey or published case. Census data: where AI changed tasks, 66% of firms only use it to help staff and 2% cut jobs (CES-26-25). Augmentation, never headcount cuts.
- **walk-away** (`walkAway`): 3-5 bullets: what a buyer should hold at the end of good help (a ranked workflow list, a before-and-after measure, a working pilot, a plan their team can run). Source to buyer surveys where possible.
- **forward** (`forward`): 4-6 short lines a reader can print or forward to the owner-CEO: the top workflow, what it saves, the risk and who checks it, the first step, the cost range. Every number footnoted. This is the role page's forward to Steve.
- **applies** (`applies`): 3-6 if/then lines a reader can answer yes or no to (size, state, what the AI decides, who is affected), each from the rule's own text. Primary sources only. Not legal advice.
- **tool** (`tool`): The tool itself (an HTML file in public/tools/embed/), 3-5 steps to use it, and 3-6 method lines: every default and formula with its source. No made-up defaults.
- **timeline** (`timeline`): Dated milestones (in force, proposed, withdrawn, start dates), each from the official text or the regulator page. Primary sources only.
- **own-data** (`ownData`): The number only Zavient has: a benchmark we ran, a price check of N vendor pages on a date, a count from public registries or package stats. Table of 4-10 rows with method, date pulled and a note on limits. This is the publish gate: no own data, no index.
- **example** (`example`): One concrete before-and-after: the real inputs (documents, fields, data) and the real output (decision, draft, flag) a reader in a 40-500 person firm would recognise. Mark it illustrative.
- **recipes** (`recipes`): 2-3 builds sized to the firm (small team, mid-size, document-heavy, etc.). For each: who it suits, a step flow where every step names the role doing it ("Controller: approve matches"), and the cost with sources. No hourly rates.
- **tables** (`tables`): 1-3 tables: tools and vendors (what it does, price or "not published", one fact worth knowing, vendor claims marked as such), public datasets or benchmarks, published study results. Every cell with a number gets a footnote.
- **rules** (`rules`): Each law, rule or guidance that shapes the build: official link, status (in force, withdrawn, starts on a date) and what it means for the reader in 2-3 sentences. Primary sources (eCFR, Federal Register, regulator, EUR-Lex). Not legal advice.
- **benchmark** (`howToTest`): 4-10 steps to benchmark on the reader's own data: record today's numbers, hold-out set, what to compare, how to price the lift in dollars. Source any method claim.
- **what-goes-wrong** (`watchOuts`): 3-6 failure modes from incidents, enforcement actions, studies or vendor post-mortems. Each says what to do about it. Sourced.
- **faq** (`faq`): 3-6 real questions from People Also Ask, Reddit, Quora, vendor FAQs and forums. Answer each in 1-3 sentences, answer first, sourced. Record where each question was seen in the draft notes.
- **buy-or-build** (`buyVsBuild`): When to buy (no team, standard process, vendor data) and when to build (own data is the edge, rules need control). 2-3 sentences each, sourced (Menlo Ventures, MIT NANDA, Gartner, vendor pricing).
- **something-else** (`pickElse`): 2-4 situations where another approach beats this one, naming the alternative product or method. No rival consulting firms, no freelancer marketplaces. Sits just above the free diagnostic.
- **resources** (`resources`): 2-5 free tools, datasets or official guides, each with one line on why it helps.
- **key-numbers** (`stats`): 3-6 numbers used on the page, each with what it measures and its source. Never shown at the top.
- **sources** (`sources`): Numbered list: name, URL, what it says. 10+ sources from 4+ different sites. Prefer primary sources. Date read in the what line for prices.
- **related** (`related`): Slugs of 2-5 related pages (parent hub, sibling guides, the industry page).
