# Golden page templates

One template per page type. Each fixes the block order, the required blocks, the question headings and a research
brief for every slot, so a new page is research plus fill-in. Source of truth: `src/lib/page-types.mjs`
(this file is generated from it by `node scripts/templates-doc.mjs`).

## Make a page
1. `node scripts/new-page.mjs --type <type> --slug <slug> --topic "<topic>" --job "<job>"` writes a skeleton JSON and a research brief to `drafts/`.
2. A research agent fills `drafts/<slug>.research.md` from the brief. A separate writer agent fills the JSON from it.
3. `node scripts/check-page.mjs drafts/<slug>.json` until PASS.
4. ICP review, in order: COO → Head of operations → GM → Division head → Owner-CEO.
5. Move the JSON to `src/content/ai-work/`, `npm test`. `index: true` only on Russell's yes.

## Rules every template enforces
- Bottom line first: 3-5 bullets, each with 2+ sources. No number leading the title or a bullet.
- Title and headings are the buyer's question; the title ends in "?".
- Every claim footnoted; 10+ sources from 4+ sites (tool pages 5, terms 3).
- "Where does your team stay in charge?" on every page. No headcount-cut wording.
- No Upwork, freelancer marketplaces, hourly rates or rival consulting firms.
- Teach, then trust, then the lead: alternatives sit after "Buy or build", just above the free diagnostic.
- A number only Zavient has on every page except tools and terms.
- ADHD-friendly: 25-word sentences, 2-sentence bullets, 3-sentence paragraphs.
- Zarlent look in blue (`public/ai-work/ai-work.css`).
- Required on every page: verdict, summary, humanRole, faq, stats, sources, offer.

## Use-case guide (`usecase`)
- Title shape: "AI {job}: {the buyer's real question}?". Example: "AI credit scoring: how do lenders keep it fair and explainable?".
- Division-head reviewer: the head of the team that does this work (e.g. head of lending, chief underwriter, controller).
- Required beyond the common set: ownData, example, recipes, tables, howToTest, watchOuts, buyVsBuild, pickElse.

Block order:
1. What is <topic>, and what does it change?
2. Where does your team stay in charge?
3. What did our own check find?
4. What does <topic> look like in practice?
5. Which way to build <topic> fits your firm?
6. Tables (one heading each)
7. Which rules apply to <topic>?
8. How do you test <topic> before you trust it?
9. Where does <topic> go wrong?
10. Questions buyers ask about <topic>
11. Should you buy <topic> or build it?
12. When should you pick something else?
13. Useful resources
14. Key numbers on this page
15. Sources
16. Related links
17. Free diagnostic

## Industry use case (`crossing`)
- Title shape: "AI {job} for {industry}: {question}?". Example: "AI underwriting for credit unions: what should you automate first?".
- Division-head reviewer: the head of that work in that industry.
- Build only if it differs from its parent on 4 of: problem, jobs, workflow, evidence, objections, conversion. Otherwise add a section to the parent.
- Required beyond the common set: ownData, example, recipes, tables, rules, howToTest, watchOuts, buyVsBuild, pickElse.

Block order:
1. What is <topic>, and what does it change?
2. Where does your team stay in charge?
3. What did our own check find?
4. What does <topic> look like in practice?
5. Which way to build <topic> fits your firm?
6. Tables (one heading each)
7. Which rules apply to <topic>?
8. How do you test <topic> before you trust it?
9. Where does <topic> go wrong?
10. Questions buyers ask about <topic>
11. Should you buy <topic> or build it?
12. When should you pick something else?
13. Useful resources
14. Key numbers on this page
15. Sources
16. Related links
17. Free diagnostic

## Guide hub (`hub`)
- Title shape: "{Work type}: {question}?". Example: "AI consulting for finance teams: where does AI pay first?".
- Division-head reviewer: the head of the function the hub covers.
- Required beyond the common set: spokes, buyVsBuild, pickElse.

Block order:
1. What is <topic>, and what does it change?
2. Where does your team stay in charge?
3. Where does AI pay first in <topic>?
4. What did our own check find?
5. Tables (one heading each)
6. Which way to build <topic> fits your firm?
7. Which rules apply to <topic>?
8. Questions buyers ask about <topic>
9. Should you buy <topic> or build it?
10. When should you pick something else?
11. Useful resources
12. Key numbers on this page
13. Sources
14. Related links
15. Free diagnostic

## Industry guide (`industry`)
- Title shape: "AI in {industry}: {question}?". Example: "AI in credit unions: where does it pay first?".
- Division-head reviewer: the division heads of that industry (e.g. head of lending, chief underwriter).
- Required beyond the common set: ranked, tables, rules, watchOuts, buyVsBuild, pickElse.

Block order:
1. What is <topic>, and what does it change?
2. Where does your team stay in charge?
3. Where does AI pay first for <topic>?
4. What did our own check find?
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

## For your role (`role`)
- Title shape: "AI for {role}s: {question}?". Example: "AI for COOs: which process do you fix first?".
- Division-head reviewer: the role itself is the main reader; the division-head review checks it from a peer function.
- Required beyond the common set: decisions, ranked, recipes, howToTest, watchOuts, buyVsBuild, pickElse.

Block order:
1. What is <topic>, and what does it change?
2. Where does your team stay in charge?
3. Which AI decisions does a <topic> own?
4. Where does AI pay first for <topic>?
5. What does a 90-day start look like?
6. What did our own check find?
7. How do you show it worked?
8. Where does <topic> go wrong?
9. Questions buyers ask about <topic>
10. Should you buy <topic> or build it?
11. When should you pick something else?
12. Useful resources
13. Key numbers on this page
14. Sources
15. Related links
16. Free diagnostic

## Term (`glossary`)
- Title shape: "What is {term}?". Example: "What is reject inference in credit scoring?".
- Division-head reviewer: the person who would use the term at work.
- Publish only when 5+ site pages link to it.
- Required beyond the common set: example.

Block order:
1. What is <topic>, and what does it change?
2. What does <topic> look like in practice?
3. Where does your team stay in charge?
4. What is <topic> not?
5. Questions buyers ask about <topic>
6. Useful resources
7. Key numbers on this page
8. Sources
9. Related links
10. Free diagnostic

## Free tool (`tool`)
- Title shape: "{Tool name}: {question it answers}?". Example: "AI readiness check: is your firm ready to use AI on real work?".
- Division-head reviewer: the person most likely to run the tool.
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

## Rules guide (`regulation`)
- Title shape: "{Rule}: {what it means for the buyer}?". Example: "EU AI Act and credit scoring: what do US lenders have to do?".
- Division-head reviewer: the compliance or risk owner for that work.
- Required beyond the common set: timeline, rules, howToTest, watchOuts.

Block order:
1. What is <topic>, and what does it change?
2. When does each part of <topic> apply?
3. Which rules apply to <topic>?
4. Where does your team stay in charge?
5. How do you check you comply?
6. Where does <topic> go wrong?
7. Questions buyers ask about <topic>
8. Should you buy <topic> or build it?
9. When should you pick something else?
10. Useful resources
11. Key numbers on this page
12. Sources
13. Related links
14. Free diagnostic

## What to research for each block
- **what-it-is** (`summary`): 2-3 sentences, plain words. What the work is, what AI does in it, and the part that makes or breaks it. 2+ sources: one neutral explainer (regulator, standards body, academic or analyst), one practitioner source.
- **human-role** (`humanRole`): 2-4 bullets: the decisions people keep, who checks AI output, who signs off. Name roles (underwriter, controller, ops lead). Source each to a regulator rule, standard or published case where one exists. Augmentation, never headcount cuts.
- **spokes** (`spokes`): 4-8 linked guides, ranked by payoff for a 40-500 person firm. For each: one sentence on why it pays first, with a source (adoption survey, cost benchmark).
- **ranked** (`ranked`): 4-8 jobs ranked by payoff then effort. For each: the job, why it pays (cost or time today, sourced), the payoff to measure, and the guide slug if one exists. Sources: industry cost benchmarks (APQC, Ardent, trade bodies), adoption surveys with sample sizes, regulator data.
- **decisions** (`decisions`): 3-6 decisions this role owns (what to fix first, buy or build, who checks output, how to measure). For each, what they need to know to decide, sourced. Use surveys of that role (Vistage, McKinsey, Gartner, trade bodies) with sample sizes.
- **tool** (`tool`): The tool itself (an HTML file in public/tools/), 3-5 steps to use it, and 3-6 method lines: every default and formula with its source. No made-up defaults.
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
