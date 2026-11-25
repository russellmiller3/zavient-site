# Zavient site — technical truth

The agent's reference for zavient.com: what the site is for, where the work stands, how it is built, what
breaks, and what to do next. The master plan (strategy, numbers, page lists) is `docs/ai-work-site/plan.md`.
Last reconciled 25 Nov 2026, on branch `feature/ai-work-pages`.

<!-- truth:generated:toc START -->
**Contents** — generated from the `##` headings by `repo-truth-doc`. The core stays on top; everything else goes below it.

**Core — read this first**

1. [Purpose](#purpose)
2. [Where we are](#where-we-are)
3. [The ladder](#the-ladder)
4. [Do this next](#do-this-next)

**Details**

- [How it works](#how-it-works)
- [Code owners](#code-owners)
- [How results are judged](#how-results-are-judged)
- [How the data is made](#how-the-data-is-made)
- [Results history](#results-history)
- [Known defects and open questions](#known-defects-and-open-questions)
- [Infrastructure traps](#infrastructure-traps)
- [Money](#money)
- [Rules that bind this work](#rules-that-bind-this-work)
- [Document owners](#document-owners)
- [Where everything lives](#where-everything-lives)
- [The code map — the parts and where they live](#the-code-map--the-parts-and-where-they-live)
- [What is in flight](#what-is-in-flight)
- [Recent work](#recent-work)
- [Maintaining this guide](#maintaining-this-guide)
- [Notes by hand — the compiler never edits below this line](#notes-by-hand--the-compiler-never-edits-below-this-line)
<!-- truth:generated:toc END -->
<!-- truth:core max-lines=95: Purpose | Where we are | The ladder | Do this next -->

## Purpose

- **What it does:** zavient.com brings consulting leads to Russell Miller. It answers "which AI does this job
  best, and what does it cost?" by job, by industry and by software, and ends every page with one offer: a
  custom benchmark of AI models on the reader's own documents, then building and running the winner.
- **Russell's words (25 Nov 2026):** "goal of site is to get me LEADS"; "a db of ai types of work and best
  resources for each ... by type of work and also by industry and the product of both"; "Mine jobs data for
  trends and put up very linkable data charts ... like priceonomics articles".
- **Invariants:** every AI-work page and data story cites at least one source and carries the offer block;
  the build refuses a page without sources; the site never rates or lists rival consulting firms; numbers on
  pages trace to a file in `docs/ai-work-site/`.
- **The hard part:** earning trust and links from zero. Zavient's site strength is 8 out of 100 (Moz, 25 Nov
  2026) against 37 to 86 for the model-comparison sites. Original data (job-ad stories, our own benchmarks)
  is the lever; copied general scores are not.

## Where we are

- **Live on zavient.com since 25 Nov 2026 (Vercel, from `master`):** home page, AI offer page, 10 Insights
  articles, 20 AI-work pages, 5 data stories with embeddable SVG charts and CSVs (4 bar charts, 1 trend line),
  hubs at /ai-work.html and /data.html, menu links, a second sitemap. All 56 built files answered 200 live.
  Checks: 4 site tests, 4 mention-counter tests, a source-link checker. All pass.
- **Trend story:** the share of US job postings that mention AI, monthly from January 2019 to October 2026,
  from Indeed Hiring Lab's free data (CC BY 4.0): 2.74% in January 2025, 7.60% in October 2026.
  Evidence: `docs/ai-work-site/job-data/indeed/monthly.json`.
- **Mention trend store:** `job-data/mentions.py` counts, per monthly snapshot of job ads, the employers that
  name each AI model, platform and kind of work, plus the provider's skill and technology tags. One snapshot
  so far (pulled 25 Nov 2026); the second needs a treg top-up. Evidence: `job-data/mentions/windows.json`.
- **Data stories (2,046 US AI job ads posted 21 to 25 Nov 2026):** Claude and OpenAI each named in 268 ads
  (206 vs 192 employers); forward deployed engineer 304 ads vs machine learning engineer 306; median posted
  minimum pay from $130,000 (data scientist) to $220,600 (head of AI); MCP in 193 ads. Evidence:
  `docs/ai-work-site/job-data/stories.json`.
- **Demand measured:** 2,710 search phrases, 1,535,860 US Google searches a month; about 29,000 visits a
  month estimated for year 1. Evidence: `docs/ai-work-site/keyword-research/ai-work-taxonomy-11-25-2026/`.
- **Not done:** the 15 agent-written pages are live and link-checked but not checked sentence by sentence;
  the sitemap is not yet submitted to Google or Bing; no own benchmark has been run yet.

## The ladder

```
1 Research: rivals, buyers, demand, job ads ........ done
2 Plan and decisions (docs/ai-work-site/plan.md) .... done
3 Engine + first 20 pages + 5 data stories ......... done
4 Publish to zavient.com ............................ done (25 Nov 2026)
5 Hand-check agent pages; submit sitemap ............ <- YOU ARE HERE
6 Monthly job-ad snapshot -> real trend charts ...... store built, 1 of 2 snapshots
7 First own benchmark (finance documents) ........... not started
8 Scale pages: 165 work types, 87 software, ~150 AI software products
```

## Do this next

Ordered by what blocks what: checking before publishing, publishing before trends.

1. **Hand-check the 15 agent pages.** For each file in `src/content/ai-work/` written by agents (all except
   ai-consulting-services, ai-underwriting, ai-document-processing, ai-contract-review, rag-chatbot), open each
   source and confirm every sentence that states a fact. Done means: each claim matches its source or is cut.
2. **Submit `https://zavient.com/sitemap-ai.xml`** in Google Search Console and Bing Webmaster Tools (needs
   Russell's sign-in). Done means: both consoles list the sitemap as read, with 25 pages found.
3. **Top up treg** (balance $5.05; a snapshot costs about $6 to $12), then each month run
   `python3 fetch_sample.py ~/Desktop/Personal/Consulting/research/job-pulls/<date>` and
   `python3 mentions.py --add <date> <that folder>` in `docs/ai-work-site/job-data/`. Needs Russell's yes
   for the money and the schedule. Done means: two snapshots in `mentions/windows.json` and a data story
   showing the change for each AI model.
4. **Read Google's real first page** for the 10 first-target phrases (keyword-research skill, step 8) and
   drop any page where only big brands rank.
5. **Run the first own benchmark:** 30 finance-document questions, answers checked by hand, 20 models via
   Runner, pass mark set before the run (master plan, Phase 2).

---

## How it works

```
docs/ai-work-site/keyword-research  -> which pages to build (demand, ad prices, difficulty)
docs/ai-work-site/job-data          -> stories.json (counts from pulled job ads)
  terms.py (word patterns) -> mentions.py -> mentions/windows.json (one row per monthly snapshot)
  indeed_monthly.py + indeed_story.py -> data-stories/ai-in-us-job-postings.json (Indeed trend)
          |                                   |
          v                                   v
src/content/ai-work/*.json         src/content/data-stories/*.json
          |  checked by the schema in src/content/config.ts (build fails on a bad file)
          v
src/pages/ai-work/[slug].astro     src/pages/data/[slug].astro  + [slug].svg.js + [slug].csv.js
          |                                   |   (chart: src/lib/barChart.js, or lineChart.js when kind is 'line')
          v                                   v
dist/ (astro build, format: file)  ->  Vercel  ->  zavient.com
every page -> src/components/BenchmarkCta.astro -> /benchmark-your-documents.html (mailto)
```

## Code owners

| File | Owns |
|---|---|
| `src/content/config.ts` | the schemas: insights, aiwork, datastory (sources required) |
| `src/pages/ai-work/[slug].astro`, `index.astro` | AI-work page template and hub |
| `src/pages/data/[slug].astro`, `.svg.js`, `.csv.js`, `index.astro` | data-story page, embeddable chart, CSV, hub |
| `src/lib/barChart.js`, `src/lib/lineChart.js`, `src/lib/storyChart.js` | the SVG bar and line charts, number format, credit line |
| `docs/ai-work-site/job-data/terms.py` | the word patterns for AI models, platforms, kinds of work and titles (one copy, versioned) |
| `docs/ai-work-site/job-data/mentions.py`, `test_mentions.py` | the monthly mention store and its 4 tests |
| `docs/ai-work-site/job-data/fetch_sample.py` | one paid snapshot pull of the newest 3,000 US AI/ML ads |
| `docs/ai-work-site/job-data/indeed_monthly.py`, `indeed_story.py` | Indeed's daily data to monthly, then the trend story JSON |
| `src/components/BenchmarkCta.astro` | the offer block on every new page |
| `src/pages/benchmark-your-documents.astro` | the offer page |
| `src/pages/sitemap-ai.xml.js` | sitemap of AI-work pages and data stories |
| `tests/site.test.mjs` | the 4 site tests |
| `scripts/check-links.mjs` | opens every cited source link |
| `public/index.html` | the home page (hand-written HTML, not Astro) |

## How results are judged

- `npm test` builds the site and runs 4 tests: offer block and a source link on every AI-work page; every
  data story's SVG and CSV match its JSON; every internal link on every page names a real file (Vercel
  serves only exact file paths, so /data is a 404 and /data.html works; this test failed on 3 menu links
  before the fix); the schema refuses a story with no sources (checked on a throwaway
  copy). Proven 25 Nov 2026: renaming the offer block's marker made tests 1 and 2 fail; restoring it passed.
- Tests run through Runner (Russell's rule). From `~/Desktop/code/runner`:
  `node ~/.claude/scripts/quiet-py.mjs -m runner.bounded_shell test --app-root ~/Desktop/code/zavient-site-live --app-entrypoint src/lib/lineChart.js -- npm test`
  and the same with `--app-entrypoint docs/ai-work-site/job-data/mentions.py -- python3 -m pytest docs/ai-work-site/job-data/test_mentions.py -q`.
  The entry-point file must be tracked by git (`git add` it first). Proven 25 Nov 2026: removing the
  maker exclusion made the Claude-count test fail; restoring it passed.
- A data story with `creditSource` must show that credit inside its SVG (test 2), because CC BY data needs
  credit wherever the chart travels.
- `node scripts/check-links.mjs`: 0 broken required. ftc.gov, jamanetwork.com and dl.acm.org block
  automated checkers and are reported, not failed.
- Browser check: desktop and 390-pixel width, no sideways scroll (25 Nov 2026).

## How the data is made

- **Job ads:** `fetch_sample.py OUT` pulls the newest 3,000 US ads with AI or ML job titles (jobspipe,
  through treg, $0.002 to $0.004 per ad). 3,000 ads reach back only about 5 days (posted 21 to 25 Nov 2026
  in the first pull). `analyze_sample.py` and `mentions.py` remove reposts (same company and title), then
  count distinct employers by the patterns in `terms.py`, excluding each AI maker's own ads from its count.
  General skills and technologies come from the provider's own tags on each ad (ESCO skills,
  `technology_slugs`), not from our patterns; see `research-notes/extraction-tools-sweep.md`.
  `spot_check.py <regex>` prints matches for a hand check.
- **Per-ad data stays on this Mac, never in git:** raw pulls in `~/Desktop/Personal/Consulting/research/`
  (they contain recruiters' email addresses); per-ad mention records in `job-data/mentions/ads/` (written
  through the shared Logger); `jobs.csv` and `employers.json` (ignored by git). Only counts are committed.
- **AI-mention trend:** `indeed/AI_posting.csv` from github.com/hiring-lab/ai-tracker (CC BY 4.0, credit
  Indeed Hiring Lab). `indeed_monthly.py` averages days into months; `indeed_story.py` writes the story JSON
  from those numbers. Refresh monthly: download the CSV again, run both.
- **Search demand:** `~/.claude/skills/keyword-research/scripts/kw_research.py` (a plan with `"expand": false`
  measures a fixed phrase list) and `kw_matrix.py` (two-axis grids). Click rates for visit estimates: AWR
  July 2026 US desktop study (20.02% at #1, 3.89% at #3).

## Results history

- 25 Nov 2026: first 3,000-ad pull ($5.38). Limit: a 5-day snapshot (posted 21 to 25 Nov 2026), first
  published wrongly as "30 days" and corrected the same day; titles grouped by first match in a fixed order.
- 25 Nov 2026: 1,000 high-paying-ad pull (about $3), posted 19 to 25 Nov 2026. Limit: the pay filter matched
  the top of pay ranges, and EY (167 ads) and Deloitte (83) dominated; used for direction only.
- 25 Nov 2026: Indeed trend story, 94 months. Limit: counts postings that mention AI anywhere (including
  company descriptions), not AI jobs.

## Known defects and open questions

- The 15 agent-written pages are not hand-checked (Do this next, item 1).
- The four job-ad stories are 5-day snapshots, not trends, until a second monthly pull exists. Only the
  Indeed story is a trend.
- Links without `.html` (`/insights`, `/ai-work`, `/data`) return 404 on zavient.com: Vercel serves only the
  exact file. Every link must name the file (`/data.html`); test 3 enforces it. Fixed 25 Nov 2026 (the
  Insights menu link had been broken on the live site before this work).

## Infrastructure traps

- The job index keeps only about 4 months of ads (actuary control: 2,146 ads at 120 days, 2,182 at 365).
  Never chart year trends from its "last N days" counts.
- The free job-count endpoint matches single words in any order and caps at 10,000, so it overcounts
  ("Meta Llama" showed 10,000). It also filters by job title only, never by words in the ad, so it cannot
  count mentions. Use pulled ads.
- The newest 3,000 ads span about 5 days, not the 30 days the search allows. Read each pull's posted range
  from `mentions/windows.json` before writing a date into a page.
- The shared Logger refuses nested objects in a record (`LOGGER_FIELD_DROPPED`): flatten fields first.
- A guard refuses scripts that write their own `.jsonl` record files; records go through Logger.
- Runner's test command refuses an entry-point file git does not track (`ACTUAL_APP_ENTRYPOINT_UNTRACKED`).
- Nesta's skill extractor does not install on Python 3.14 (spaCy fails to build); use 3.11 if ever needed.
- DataForSEO rejects a whole 1,000-phrase batch if one phrase has symbols (; & + .); `kw_research.py` now
  cleans seeds first.
- Look-alike names inflate software searches ("canvas ai", "ada", "upstart"): recheck with the product's
  full name before using a number.
- The GitHub repo is public: anything pushed is visible to anyone.

## Money

Keyword data about $5, job ads about $8.40, web searches under $1 (25 Nov 2026). treg balance $5.05.
A monthly job-ad snapshot costs about $6 to $12; Indeed's trend data is free.

## Rules that bind this work

- Zavient is the brand; Zarlent (the data-licensing broker) stays a separate site, cross-linked only.
- Never rate or list rival consulting firms; per-industry "how to choose" pages are allowed.
- Business model: benchmark first, then build and run (EDS-style), plus selling leads Zavient will not take,
  with paid listings labelled.
- No $20-a-month product (Russell rejected it); the lead-in to research is a free industry AI harness.
- Call a benchmark a benchmark, never a "test" (lesson, 25 Nov 2026).
- Show Russell look-and-feel changes before they go live.

## Document owners

| Fact | Owner |
|---|---|
| Strategy, page lists, revenue lines, data map | `docs/ai-work-site/plan.md` (master plan) |
| Rival sites, buyers, user complaints, data sources | `docs/ai-work-site/research-notes/` |
| Search demand by phrase | `docs/ai-work-site/keyword-research/` |
| Job-ad counts and pay (one snapshot) | `docs/ai-work-site/job-data/stories.json` |
| Mentions per monthly snapshot | `docs/ai-work-site/job-data/mentions/windows.json` |
| Word patterns that define a mention | `docs/ai-work-site/job-data/terms.py` |
| AI-in-job-ads trend (Indeed, 2019 on) | `docs/ai-work-site/job-data/indeed/monthly.json` |
| What tools already exist for this work | `docs/ai-work-site/research-notes/extraction-tools-sweep.md` |
| Sample pages and data-flow diagram | `docs/ai-work-site/site-mock/` |
| Site change log | `README.md` |

## Where everything lives

<!-- truth:generated:document-map START -->
Every document below has ONE job. When two files would answer the same
question, the one named here wins.

| file | what it owns |
|---|---|
| `TRUTH.md` | THIS FILE. Read first: what this project is, what it can do, and where everything else lives. |
| `README.md` | The public front door: what it is, install, use. |
| `TOOLS.md` | Every tool, with the first line of its own description (generated). Search it before building one. |
| `docs/` | Reference material. Never the entry point. |
<!-- truth:generated:document-map END -->

## The code map — the parts and where they live

<!-- truth:generated:code-map START -->
Parts describe themselves through their README, intent or manifest. `(repo)` marks separate history.
`built on` lists declared dependencies; it does not prove implemented capabilities.
Git counts tracked files. Tokei measures their recognized code lines and dominant language by code volume.
Untracked and ignored-only files are excluded. Missing measurements are unknown; unmeasured file counts are explicit.

| part | what it is | built on | language | tracked files | code lines | unmeasured files | last change |
|---|---|---|---|---|---|---|---|
| `docs/` |  |  | unknown | 100 | unknown | 100 | 2026-11-25 |
| `public/` |  |  | unknown | 12 | unknown | 12 | 2026-11-25 |
| `scripts/` |  |  | unknown | 1 | unknown | 1 | 2026-11-25 |
| `src/` |  |  | unknown | 52 | unknown | 52 | 2026-11-25 |
| `tests/` |  |  | unknown | 1 | unknown | 1 | 2026-11-25 |
| `api/` |  |  | unknown | 2 | unknown | 2 | 2026-06-28 |
<!-- truth:generated:code-map END -->

## What is in flight

<!-- truth:generated:branches START -->
**Nothing in flight.** Only `master`, no linked worktrees - every branch landed and deleted.
<!-- truth:generated:branches END -->

## Recent work

<!-- truth:generated:recent-work START -->
Read straight from git, so this can never become someone's recollection.
`wip` checkpoints and merges are omitted.

| date | what shipped |
|---|---|
| 2026-11-25 | Add AI-work pages, job-ad data stories with trends, and the site's planning record |
| 2026-11-22 | Add data evaluation section to the home page |
| 2026-08-08 | Fix internal linking: homepage to articles, and articles to each other |
| 2026-08-08 | Surface the method note across Insights |
| 2026-08-07 | Add "The pile you never open" method note and link it from the homepage |
| 2026-08-06 | Type: switch to Fraunces / Newsreader / IBM Plex Mono |
| 2026-06-28 | Add related-articles cross-link strip to each Insights page |
| 2026-06-28 | Add vercel.json to pin Astro build (framework, build command, dist output) |
| 2026-06-28 | Migrate to Astro + Decap CMS for Insights |
| 2026-06-28 | Add Insights section: 10 industry AI value-creation articles + hub |
| 2026-05-23 | Add DD positioning, AI diligence target card, and OP/carry openness |
| 2026-05-09 | Polish homepage CTAs and visual details |
| 2026-05-09 | Add Zavient favicon |
| 2026-05-09 | Launch revenue model homepage |
| 2026-03-24 | Remove open-ended retainers bullet from What I Don't Do |
| 2026-03-24 | Reframe landing page: Sprint as flagship, new CTA, advisory reframe |
| 2026-03-17 | start |
<!-- truth:generated:recent-work END -->

## Maintaining this guide

Edit the section that owns a fact; replace, never append. Run
`node ~/.claude/scripts/repo-truth-doc.mjs --repo .` after any heading change, and both `--check` commands
before committing.

## Notes by hand — the compiler never edits below this line
