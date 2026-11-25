# What already exists for mining job ads (sweep of 25 Nov 2026)

Why this file exists: Russell, 25 Nov 2026: "mine the job ads themselves for what they mention and use that to build
trends over time of skills tech models etc. Do lit sweep for data journalism and extraction tools ... on any task always
sweep internal and external tools first to see whats out there to make job easier." This is that sweep, and what each
finding changed. Every line was read this session; links are the source.

## The decisions it led to

| Question | Decision | Why |
|---|---|---|
| Where does a long AI-in-job-ads trend come from? | Indeed Hiring Lab's AI Tracker | Free, daily, 2019 to now, 11 countries, CC BY 4.0. Our own job index keeps only about 4 months. |
| Should we chart Hacker News "Who is hiring?" mentions? | No | Four sites already do it monthly (below). A fifth copy earns no links. We cite them instead. |
| How do we pull general skills out of each ad? | Use the tags the job-data provider already puts on each ad | jobspipe tags every ad with ESCO skills (the EU's standard skills list) and technology names. That is the same list Nesta's extractor maps to, so installing Nesta would repeat work. |
| How do we spot named AI models and software? | Our own word patterns in `job-data/terms.py` | No skills list carries new product names such as Claude Code or MCP (Model Context Protocol) yet. Each pattern is hand-checked; known traps are written next to it. |
| How do we build a trend for those names? | A monthly snapshot (`fetch_sample.py`), recounted by `mentions.py` into `mentions/windows.json` | The provider's free count endpoint filters by job title, not by words in the ad, so it cannot count mentions. Paid pulls can. |

## Trend data that already exists

- **Indeed Hiring Lab, AI Tracker** — https://github.com/hiring-lab/ai-tracker. Daily share of Indeed postings that
  mention AI terms ("machine learning", "artificial intelligence", "generative AI", "large language models"), 7-day
  trailing average, 2019 to the latest month, 11 countries. CC BY 4.0: free to reuse with credit. Only `AI_posting.csv`
  is in the repository; a separate generative-AI file named in its readme returned 404 on 25 Nov 2026.
  Caveat: Ontario's AI-disclosure law (from January 2026) took Ontario's AI-mention share from 9% to 28% by May 2026,
  so Canada's figure is inflated (Post Labor Economics, 13 Nov 2026:
  https://postlaboreconomics.com/posts/ai-in-job-ads-what-the-count-measures).
- **Hacker News "Who is hiring?" trackers** (all count top-level comments in the monthly thread, through the free
  HN Algolia API):
  - Hacker News Hiring Trends, Ryan Williams — https://www.hntrends.com/2026/november.html. Every thread since 2011,
    re-analysed each run; AI in 51.6% of November 2026 postings; tracks AI Agents, LLM, MCP, RAG, LangChain, Anthropic.
  - Reacit — https://reacit.com/hiring/trends. 2018 to 2026, CSV and JSON download; AI or ML in 59% of postings.
  - Solheim Solutions — https://www.solheimsolutions.no/notes/hn-who-is-hiring. 12 months of AI terms (MCP, evals,
    Claude Code, agentic coding), patterns published, CC BY.
  - mljar — https://mljar.com/blog/remote-python-data-job-hacker-news. 88,975 postings, 2012 to 2026, notebook published.
  - Limit for all of them: Hacker News is a startup-heavy slice, not the job market.

## Extraction software

- **Nesta `ojd_daps_skills`** (MIT, `pip install ojd-daps-skills`): pulls skill phrases out of job-ad text and maps
  them to ESCO or Lightcast Open Skills. Install failed on this Mac on 25 Nov 2026: its spaCy dependency would not
  build on Python 3.14. Not needed now, because the provider's ads already carry ESCO tags. Revisit if we ever mine ads
  from a source with no tags (then use Python 3.11).
- **Lightcast Skills API**: a maintained skills list with new terms added often. Free only for nonprofit and
  public-good use, so not for us without a paid licence.
- **SkillSpan** (MIT data set): job-ad sentences labelled with skill spans, for training or checking an extractor.
  Useful only if we build our own extractor.
- **Reading each ad with a language model** (published methods such as the NLP4HR 2024 workshop papers and SkiLLMo):
  the model lists the skills in each ad. Handles new names, but costs a model call per ad and needs its own accuracy
  check against hand-labelled ads. Our word patterns cost nothing per ad; this is the next step only if the patterns
  start missing terms that matter.
- **TheirStack**: sells technology-use data built from job ads (which companies use which software). A possible paid
  source for company-level data later; not needed for the trend charts.

## Chart publishing software

- **Datawrapper** and **Flourish**: what most newsrooms use for embeddable charts. We already ship our own: each data
  story has an SVG chart (with a credit and link back), a CSV, and copy-paste embed code, built by
  `src/lib/barChart.js` and `src/lib/lineChart.js`. Ours keeps the link back to zavient.com on every embed, which is
  the point of publishing the charts.

## What this sweep found wrong in our own work

- The published stories said the 3,000-ad sample covered "the 30 days to 25 Nov 2026". `mentions.py` reports each
  pull's posted dates: the ads were all posted 21 to 25 Nov 2026. The pages were corrected the same day.
- The top-paying pull (1,000 ads) said "last 30 days"; it covers 19 to 25 Nov 2026. Corrected in the plan.
