# Zavient AI-work site: master plan

25 Nov 2026 · The master plan for zavient.com's AI-work database and data stories. Current state, code and next steps live in `TRUTH.md` at the repository root; this file owns strategy, page lists, revenue lines and the data map.

## Site rules (apply to every page and every build)

1. **Goal of every page,** in Russell's words (26 Nov): "Optimize for education trust and getting me leads." Each page teaches, earns trust and wins Zavient leads.
2. **Augmentation, not replacement,** in his words (26 Nov): "our focus and the focus of the site is on augmentation, not replacement." Show where people stay in the loop and what AI takes off their plate. Never frame AI as cutting headcount.
3. **Sourcing,** in his words (26 Nov): "make sure that everything is well sourced and with footnotes" and "we always source and we use multiple sources where possible." Every claim gets a numbered footnote, two or more sources where they exist, and every number matches its source. The build fails if an indexed page's verdict, summary, key numbers or warnings lack one.
4. **Research before every build,** in his words (26 Nov): "always do research on what's out there to make it the absolute best it can be." Research and build are done by separate agents.
5. **The call to action** on every page is the free 30-minute diagnostic. Benchmarks are proof inside the page, not the sell.
6. **Page order:** the answer and verdict first. "When to pick something else" sits near the end, after "Buy or build" and just above the free diagnostic.
7. **No pages about other consulting firms,** rivals or partners, and never rate or list rival consulting firms. Pages on software and tools are fine.
8. **Never on the site:** low-end Upwork-style freelancer content, meaning no freelancer rates, listings or price comparisons.
9. **Words:** say "benchmark", never "test", for Zavient's own measurements.
10. **Publishing:** nothing goes live on zavient.com without Russell's yes.

**Your requests (25 Nov):**
- 10:15: "think thru a plan to make a cmpoeting sitewith data that includes but supersedes them with more valuable data. research ideas"
- 10:23: "add in kw resarch arouhnd highest value AI and ML work that a company might do or buy, for all the idndustries you can think of . it mihbgt be better to do a db of ai types of work and best resoruces for each, in addition to model info."
- 10:27: "should be by type of work and also by indstury and the product of both"
- About 10:42: "goal of site is to get me LEADS"
- 14:03: "Mine jobs data for trends and put up very linkable data charts and trends like priceonomics articles"

**Decided on 25 Nov:** the site is zavient.com, not a new brand; it never rates rival consulting firms; Zarlent stays separate; the business model is EDS-style (benchmark, then build and run); no $20-a-month product; the engine is the site's existing Astro build on Vercel.

## Update 26 Nov 2026

**Your requests (26 Nov):**
- "I don't think booking a benchmark is necessarily the thing. I think it's more about AI consulting services."
- The vision, in your words from a voice note: "the most comprehensive site I can, to help me get work". Types of work crossed with industries. Mine every AI job ad for trends: which models and tools are gaining, the top 3 open-source models in use, the most common finance AI work. Not SEO bait but "really, really useful". A search like "AI for lending scoring" should get a condensed how-to, the tools, the models and the rules.
- The offer: "get a quick diagnostic of how to approach this, contact me, a really easy intro offer". It is free.

**Decided on 26 Nov:**
- **Site rules:** all page and build rules now live in one place, the "Site rules" section at the top of this plan.
- **First cluster:** the 10 pages below did not hang together, so the first batch is 5 finance pages: the ai consulting services hub plus ai credit scoring, ai underwriting, ai document processing and ai invoice processing.
- **Every page covers four things:** how to do the work, the tools, the models and the regulations.
- **Publish gate:** a page is indexed only with a verdict, 3 or more Zavient numbers and 3 or more sources. The site build refuses an indexed page without them. Everything else stays noindexed.

**Proposed, yours to decide:** three data engines feed the pages: demand (job ads), supply (a catalog of tools and models) and proof (benchmarks and rules). On top of them sit playbooks, trend charts, a monthly State of AI Work report and industry leaderboards. A self-serve diagnostic tool could later stand in for the call.

**Status:** the 5 finance pages are built on the `feature/finance-pages` branch with a preview. They are not live until you say publish.

## Boss summary

**The goal:** One site that shows what BenchLM, Artificial Analysis, Arena, OpenRouter and Hugging Face show, adds data they lack, and turns readers into Zavient clients.

**The answer:** Build the site around a database of AI work, not around models. It has 20 types of work, 14 industries and about 20 work-by-industry pairs. Each page names the best models, tools, data sets and price for that job. Model pages become one layer underneath.

**Why:** Model scores are a crowded fight. Arena has raised about $450M, and Artificial Analysis has run over 1 trillion test tokens. Nobody ranks models by job and industry. That is also how buyers search: "ai document processing", "ai contract review", "ai underwriting".

**Where we are:** 20 AI-work pages and 5 data stories went live on zavient.com on 25 Nov 2026. One is a trend: the share of US job ads that mention AI, 2019 to October 2026 (Indeed data). A monthly store now tracks which AI models, software and skills job ads name. Zavient gets 0 Google visits, and its site strength is 8 out of 100. The rivals score 37 to 86.

**Cost:** I estimate under $1,000 to launch and about $100 a month after that, all in model calls for benchmarks. The keyword research cost $3.70.

**Risk:** Copying rivals' numbers. BenchLM's data is for non-commercial use only, and Artificial Analysis needs a contract to reuse its data. So we copy only free-to-use sources and link to the rest.

**What we need from you:** A treg top-up and a yes on the monthly job-ad pull (about $6 to $12 a month), so the model and skill trends get their second month.

## How the site is organized

```
        TYPE OF WORK (20)          e.g. reading documents
               x
        INDUSTRY (14)              e.g. insurance
               =
        WORK x INDUSTRY (~20)      e.g. AI claims processing
               |
     each page: best models (our benchmarks) · cost per task
                tools · open data sets · build or buy · price
               |
        MODEL PAGES (600+, built by script from free data)
```

**Site architecture (shown to Russell on 25 Nov 2026):** about 1,000 pages, built from one data folder.

```
zavient.com                          pages
├─ /ai-work/<job>                     165
│   └─ /ai-work/<job>/<industry>       ~20
├─ /industries/<industry>              14
├─ /software/<name>-ai                 87
├─ /ai-tools/<tool>                   ~150
│   (pricing · alternatives · vs)
├─ /models/<model>                    ~200
│   └─ /compare/<a>-vs-<b>            top 300
├─ /benchmarks/<test>                  our results
├─ /guides/  definitions, rules, costs  ~50
├─ /news/<model or rollout>            weekly
└─ /benchmark-your-documents   ← every page links here
```

```
ENGINE
data/*.json  ──►  Astro build  ──►  host (planned Cloudflare; live today on Vercel)
  ▲                 │ checks: schema, sources, links
  │                 ▼ fails → nothing ships
scheduled tasks: new models, prices, news, refresh
keyword skill: picks which pages to add next
```

Status on 25 Nov 2026: built so far are 20 /ai-work pages, 5 /data stories and /benchmark-your-documents.
Russell judged the 20 /ai-work pages low value; they are hidden from Google until the approach is decided.

## What companies search for: by type of work

These are US Google searches a month, checked 25 Nov 2026, with junk and duplicate phrases removed. Breadth is the ad value of all a group's phrases except its single biggest one. It shows whether demand is broad or rests on one phrase.

| Type of work | Searches/mo | Breadth (ad value/mo) | Biggest phrase |
|---|---|---|---|
| Customer chatbots and voice agents | 400,670 | $10.2M | conversational ai |
| AI in a named industry (general) | 85,550 | $1.5M | legal ai |
| Reading documents (invoices, forms) | 14,010 | $915K | accounts payable automation software |
| Hiring AI help (consulting) | 23,070 | $736K | ai consulting |
| Process automation | 19,810 | $348K | ai automation |
| AI agents (general) | 12,580 | $261K | ai agents for business |
| Speech, transcription, medical scribes | 15,550 | $164K | scribe ai |
| Search over company documents | 13,700 | $163K | retrieval augmented generation |
| Lead scoring, churn, targeting | 8,320 | $155K | marketing mix modeling |
| Scheduling and routing | 4,830 | $109K | route optimization |
| Risk scoring and underwriting | 52,430 | $88K | automated valuation model (likely inflated) |
| Contract and document review | 2,470 | $81K | ai contract review |
| Recommendations | 4,980 | $81K | recommender system |
| Predictive maintenance | 3,350 | $73K | predictive maintenance |
| Forecasting | 3,640 | $49K | time series forecasting |
| Fraud detection | 3,240 | $47K | ai fraud detection |

## What companies search for: by industry

| Industry | Searches/mo | Breadth (ad value/mo) |
|---|---|---|
| Accounting and finance teams | 7,290 | $680K |
| Legal | 26,160 | $377K |
| Healthcare | 33,700 | $312K |
| Manufacturing | 9,170 | $253K |
| Logistics and supply chain | 11,510 | $156K |
| Real estate | 56,100 | $118K |
| Banking and lending | 4,060 | $94K |
| Retail and ecommerce | 7,150 | $83K |
| Insurance | 3,870 | $72K |
| Private equity and investing | 1,930 | $40K |
| Energy and utilities | 610 | $1K |

## What the numbers mean

1. **Private equity barely searches.** At 1,930 searches a month, PE buyers won't come through Google. Reach them by email, as now. The site's search traffic will come from operating companies: legal, healthcare, manufacturing and logistics.
2. **Your predictive work is small in search but high in price.** Underwriting, credit scoring and fraud each get hundreds of searches a month, not thousands. But "ai credit scoring" costs $99.51 a click and "insurance underwriting ai" costs $70.19. Few searchers, valuable ones.
3. **Chatbots and voice agents are the giant, but they belong to software sellers.** "ai call center" costs $216.98 a click. Software companies win those clicks, so a consulting site ranks there only with neutral "which one is best" comparisons.
4. **"ai consulting services" is the best single phrase for Zavient.** It gets 1,600 searches at $94.77 a click, with a difficulty of 8 out of 100. That is unusually easy for that price.

## The first 10 pages, ranked by expected value

Superseded on 26 Nov: the first batch is the 5-page finance cluster in the update above.

Expected value = searches × price per click × the chance of ranking, plus how well the page fits work you sell.

| # | Page (main phrase) | Searches/mo | $/click | Difficulty |
|---|---|---|---|---|
| 1 | ai consulting services | 1,600 | $94.77 | 8 |
| 2 | ai underwriting (lenders and insurers) | 390 + 210 | $65 to $70 | 3 to 9 |
| 3 | ai document processing | 2,400 | $55.19 | 27 |
| 4 | ai contract review | 880 | $118.51 | 17 |
| 5 | rag chatbot (search over company documents) | 3,600 | $29.68 | 3 |
| 6 | marketing mix modeling | 2,900 | $47.81 | 23 |
| 7 | predictive maintenance (manufacturing) | 1,900 | $33.92 | 24 |
| 8 | ai agents for business | 3,600 | $44.89 | 21 |
| 9 | route optimization software (logistics) | 720 | $98.26 | 23 |
| 10 | ai consulting companies | 2,400 | $52.49 | 21 |

Difficulty is DataForSEO's 0-to-100 estimate. I have not yet read Google's real first page for these 10. That is step 1 below, because on 25 Nov the paid data got page one wrong for 3 of 18 phrases.

## The four kinds of data we add on top of the rivals'

1. **Benchmarks by job, on private questions, with cost per correct answer.** The first benchmark is finance documents. Vals AI benchmarks legal and finance analyst work, but nobody we found benchmarks fund reports or deal documents. Results feed pages 2 and 3.
2. **Same model, different host.** Only 50 of 137 OpenRouter hosting options say how far they compress the model. One study found a 7x price gap for the same model. Caution: only 11% of companies switched AI providers in the past year (Menlo Ventures, mid-2025).
3. **Cost per finished task.** In one study, a model listed 25% cheaper billed 2.6x more, because of its hidden thinking steps. This goes on every work page.
4. **Drift: did a model get worse this week?** This comes last now. AI Stupid Level already re-tests 26 models every 4 hours with proper statistics.

## Where your idea is weak

"Supersede them" can't be won on general scores, so we win by job and industry instead. And private equity, your best-paying buyer, barely searches. This site feeds the consulting through operating companies, and the email outreach to PE firms stays.

## What happens next

1. Read Google's real first page for the 10 phrases above, then drop any page where only big brands rank.
2. Write the 10 pages. Each says what the work is, shows a sample input and output, names the best models, tools and open data sets with sources, compares building it with buying it, and gives a typical price.
3. Build the 30-question finance document benchmark, check every answer by hand, run it on 20 models through Runner, and put the results on pages 2 and 3.
4. Generate the industry and model pages by script from free sources.
5. Pitch the first surprising benchmark result to the reporters on the Zarlent list.

## Extra pages: detailed work types and software add-ons (measured 25 Nov 2026)

| Page set | Measured | Worth a page |
|---|---|---|
| Detailed AI work types (e.g. loan application scoring, seismic interpretation, AI red teaming) | 216 | 165 |
| AI for a named software product (e.g. NetSuite AI) | 330 | 87 (174 at a niche bar of 20+ searches; 9 look-alike names removed after a recheck) |
| Popular AI software: pricing, alternatives, review (e.g. Cursor pricing) | 267 | about 150 (162 before removing look-alike names such as Ada and Upstart) |
| Other categories: definitions, developer tools, AI rules, cost calculators, hiring help | 124 sample phrases | 330,000 searches a month from the sample alone |

- A page is worth building at 100+ US searches a month, or 30+ searches at $20+ a click.
- Highest value: AI voice agents (164,000 searches at $98 a click, crowded with vendors), invoice processing ($274 a click), account reconciliation ($193), contract review ($114), production scheduling ($110).
- Older software gets almost no AI searches: SAP ECC, AS/400, JD Edwards and Dynamics GP all fall under the bar. Their owners need the work but don't search for it, so reach them by outreach, not pages.
- Deep technical work barely appears in search: seismic interpretation gets 10 searches a month, and reservoir modeling and well-log analysis get 0. Build those pages for AI-assistant answers and credibility, not traffic.
- **Traffic you can get (US Google, measured 25 Nov 2026):** 2,710 phrases with 1,535,860 searches a month, all categories above included. At AWR's July 2026 US desktop click rates (20.0% at #1, 3.9% at #3), that's about 29,000 visits a month in year 1 (easy phrases at #3), 60,000 at #3 everywhere and 307,000 at #1 everywhere. Duplicates, app names, look-alike software names and "what is" questions are removed.
- **What top-paying AI job ads show (1,000 US ads, 281 employers, posted 19 to 25 Nov 2026):** the highest pay is at AI labs (Anthropic and OpenAI, up to $500,000 minimum), Netflix, Roblox and Capital One. The most common work, counted by employers to stop repeated templates inflating it: AI agents (157 employers), forecasting and experimentation (139), evaluation and benchmarks (114), search and RAG (113), recommendations (101), AI governance (88), AI safety (79), post-training (75). Industry-specific jobs such as seismic interpretation or lease abstraction almost never appear. Operating companies buy that work rather than hire for it, which is the consulting opening. EY (167 ads) and Deloitte (83) post a quarter of the ads, so the big firms are staffing up to sell AI work.
- Job-ad counts matched single words rather than whole phrases, so they serve only as a rough tie-breaker.
- Files: the ranked lists of work types and software, and the traffic script, are in `ai-work-site/keyword-research/ai-work-taxonomy-11-25-2026/`.

## Data map: what we combine (25 Nov 2026)

| Group | Sources | Reuse |
|---|---|---|
| Models | OpenRouter model list and usage; Epoch AI (CC BY 4.0); price history from tokencanopy and modelpricewatch (MIT); uptime from openrouter-uptime (MIT) and llmstatus.io; Vectara hallucination leaderboard (Apache); LiveBench, SWE-bench-Live, tau-bench | open, with credit |
| Link only | Vals AI, BenchLM (non-commercial license), Artificial Analysis (contract needed) | never copy |
| Demand and buyers | Google search data via DataForSEO (cents); job ads via jobspipe (about $3 per 1,000, with the provider's ESCO skill and technology tags); Indeed Hiring Lab AI Tracker (AI share of job ads, 2019 on, CC BY 4.0); SEC filings; news; government contracts; Ramp AI Index | bought or public |
| Job-ad trends | monthly snapshot of 3,000 ads, counted by `ai-work-site/job-data/mentions.py` into `ai-work-site/job-data/mentions/windows.json`; what already exists and why we built only this: `ai-work-site/research-notes/extraction-tools-sweep.md` | ours |
| Practitioners | Reddit, Hacker News, GitHub, Hugging Face | quote briefly |
| Ours alone | our benchmarks by job, practitioner reports on the site, Zarlent's deal database | the edge |

## How the site earns (lessons from the biggest network sites)

| Site | Who pays | How | Revenue |
|---|---|---|---|
| NerdWallet | banks, card issuers | per signup | $836.6M (2025, filing) |
| PitchBook | investors | data subscription | $671.8M (2025), 31% margin |
| Capterra | software sellers | per click, from $2 | sold to G2 for $110.0M (Gartner 10-K) |
| G2 | software sellers | profile plans, $2,999–$34,000 a year | not public |
| Axial | deal sellers | success fee, 5% falling to 1% | not public |

1. **Zavient consulting first:** keep the leads that fit (PE-backed, finance, mid-sized companies).
2. **Sell the other leads** to AI software sellers and firms, and say which listings are paid. Advertisers pay about $1,160 per lead today for "ai consulting services": a $94.77 click divided by the 8.18% median rate at which ad clicks become leads (WordStream, 13,474 campaigns).
3. **Later, a data subscription** on the benchmark data, as PitchBook does.

## The lead-in product: a free industry harness that runs on the client's own documents

A harness is a packaged AI setup: skills, connectors to the firm's data, and dashboards, installed into Claude in one step.

| Step | What the client gets | Price |
|---|---|---|
| 1 Install | One harness for one job, e.g. portfolio-company quoting or pipeline | free |
| 2 Prove it | We benchmark it on 50 of their documents and tune it to their format | from $3,500 (sample price) |
| 3 Expand | More jobs, their own data connected, dashboards, seats | per seat; Rogo charges about $3,300 a seat a year (Sacra estimate) |
| 4 Keep it right | Re-checked as models change, new skills added | monthly retainer |

- **Why free, not $20 a month:** Anthropic gives away its own finance harness: agents for banking, equity research and fund administration, installable as Claude plugins (github.com/anthropics/financial-services). SkillHQ sells 1,326+ skills at €2 to $50 one-time. A paid generic harness races to zero.
- **Where ours differs:** Anthropic's harness covers banks, research and fund administration. Ours covers the portfolio companies, the operating businesses PE firms own, which fits the top-line-growth pitch.
- **Historical parallel:** Palantir's AIP Bootcamp promises "From 0 to use case in 5 days" on the customer's own data, and its large contracts follow from there.

💡 Not yet considered: sell the job-specific benchmarks to AI labs, the way Vals AI does. Labs cite Vals results in their own model descriptions, and Vals reached a $400M valuation in August 2026.

---

# Technical part

## Phase Order (load-bearing)

**Default track:** Phase 1, then 2, then 3. Phases 4 to 6 follow on results.
**Why:** The pages bring the traffic, and the finance benchmark is what makes them worth linking to. Both are needed before the pitch.

| Phase | Depends on | Gate |
|---|---|---|
| 1 Check page one, write the first 10 pages | none | Real page one read for each phrase |
| 2 Finance document benchmark | none (can run alongside 1) | Pass mark written before the run |
| 3 Database skeleton and scripted pages | 1 | Copy-rights check |
| 4 Host benchmark | 2 question set | none |
| 5 Press pitch | 2 or 4 finding | A finding worth a headline |
| 6 Paid offer page | 2 live | none |

## Phase 1: first 10 pages

**In plain words:** Check who ranks today, then write 10 pages that answer "how do I get this AI job done, and with what."

- Page-one check: keyword-research skill step 8 (`browser_serp_batch.py` in Chrome), for the 10 phrases. Drop a page if all of the top 5 are brands with site strength above 70.
- Each page: what the work is, a sample input and output, the best models (from our benchmarks where we have them, otherwise cited public scores), tools (named, never linked if they buy data from Zarlent), open data sets and benchmarks with licenses, build vs buy, a typical price band, and the offer. Since 26 Nov that is a free 30-minute diagnostic, with the benchmark as proof on the page.
- Follow docs/writing-for-ai-search-guidelines.md and the agentify-website skill so AI answer engines can cite each section.

## Phase 2: finance document benchmark

**In plain words:** We ask 20 models the same 30 finance questions and record who got each right and what it cost.

- 30 questions from public fund quarterly reports and SEC 10-K filings: extraction, calculation and judgment. Answers checked by hand first (golden-path skill).
- 10 of the 30 stay private forever, and published scores use only those 10.
- Runs go through Runner, reusing ~/Desktop/code/coding-model-bakeoff, which already builds a leaderboard page.
- Pass mark, set before the run: at least 1 model ranks 5 or more places away from its Artificial Analysis Intelligence Index rank. If none does, lead with the host benchmark instead.
- Cost estimate: the bake-off cost $2.04 for 26 models on 4 tasks, about $0.02 per model per task. Finance documents are longer, and Vals legal tests cost $0.41 to $13.94 per test. At $0.05 to $1 per call, 600 calls come to $30 to $600.

## Phase 3: database skeleton and scripted pages

**In plain words:** One data file holds every work type, industry, pair, model and resource, and a script builds the pages from it.

- The keyword grid is the starting row list: research/keywords/ai-work-by-industry-11-25-2026/matrix/ (by_row.csv, by_col.csv, cells.csv, phrases_tagged.csv).
- Pair pages only where the pair has 300 or more searches a month, or 50 or more at $50 or more a click. That is about 20 pairs today.
- Model data from free sources only: OpenRouter's public model list; Epoch AI (CC BY 4.0, commercial use allowed with credit); price history from tokencanopy (MIT license, 1,125 models, refreshed every 6 hours); uptime from dthinkr/openrouter-uptime (MIT).
- Link only, never copy: BenchLM (CC BY-NC 4.0), Artificial Analysis (contract needed), Arena, and FinanceBench (non-commercial sample).
- Legal check before launch: single facts are likely not protected in the US, but site terms still apply. That is a guess for a lawyer to confirm.

## Phase 4: host benchmark

**In plain words:** The same open model, run at each company that hosts it, compared on accuracy, speed and price.

- 5 open models × 5+ hosts × the 30 finance questions, plus a fixed speed prompt. That is 750 calls, under $50 at open-model prices (estimate).

## Phases 5 and 6: press and paid offer

- Press: lead with the story the reporter gets, per the house pitch rule.
- Paid offer: "your own leaderboard, on your documents, in a week". The price band of $3,500 to $15,000 comes from published solo-consultant prices (research, 18 Nov 2026).

## Success measures, set before any build

- By 31 Jan 2027: 20 or more sites linking to the pages (Moz), 1,000 or more US Google visits a month (DataForSEO estimate), and 3 or more inbound requests for custom benchmarks.
- Kill rule: by 28 Feb 2027, 0 requests and fewer than 5 linking sites means stop adding owned data and keep the pages.
- Comparison: BenchLM reached 8,820 US visits a month about 15 months after its domain was registered.

## How far to trust the keyword numbers

- Google rounds its monthly averages and lumps close variants together. I counted 14 lumped phrases (205,890 searches) once.
- 266 phrases (48,940 searches) were left out as junk or not from buyers: "free", "what is", brand names, courses and jobs.
- "automated valuation model" at 49,500 searches and "accounts payable automation software" at $435 a click look inflated, so the breadth column leaves each group's biggest phrase out.
- Most questions asked of AI assistants match no search phrase (65% to 85% in one study), so small B2B needs are under-counted.

## Sources

- Rivals: research_notes/AI model comparison site plan/incumbents.md
- Who pays for benchmarks: research_notes/AI model comparison site plan/buyers_and_pricing.md
- What users complain about: user_complaints.md and user_complaints_part2.md in the same folder
- New data sources: new_data_sources.md in the same folder
- Keywords: research/keywords/ai-work-by-industry-11-25-2026/ and research/keywords/ai-work-types-11-25-2026/ (Google Ads volumes, ad prices and difficulty via DataForSEO through treg, 25 Nov 2026)

The analysis, rankings and estimates are mine. Each estimate is labelled where it appears.
