# Incumbent AI model comparison sites: sourced facts (25 Nov 2026)

Gathered on the main thread. Traffic = DataForSEO bulk traffic estimate, US Google organic, monthly (estimate, not visits). Strength = Moz Domain Authority 0-100. Registration = whois creation date of the domain.

| Site | US Google visits/mo (est.) | Ranking phrases | Moz DA | Domain registered |
|---|---|---|---|---|
| huggingface.co | 417,217 | 93,744 | 86 | 2016-07-18 |
| openrouter.ai | 59,265 | 7,554 | 56 | 2023-04-17 |
| arena.ai | 48,715 | 1,766 | 58 | 2017-12-15 (domain older than Arena; likely bought, unconfirmed) |
| artificialanalysis.ai | 34,127 | 6,806 | 59 | 2023-12-29 |
| lmarena.ai | 10,221 | 18 | 58 | 2024-06-21 |
| benchlm.ai | 8,820 | 3,760 | 37 | 2025-08-12 |
| zavient.com | 0 | 5 | 8 | — |

## BenchLM (benchlm.ai)
- Publishes rankings, benchmark results and prices; homepage (Nov 2026): 216 ranked models among 1,036 tracked, 837 benchmark records, 6 core categories, 9 specialist vertical boards. Source: https://benchlm.ai/
- Aggregates published scores; labels "Supported" vs "Estimated" rankings. Source: https://benchlm.ai/
- Sells data access: Free account (REST API + MCP, current data only); Data Pro $49/month after 7-day trial, 25,000 reads/month, 60 req/min, full history; commercial display/redistribution needs separate permission. Source: https://benchlm.ai/data
- License CC BY-NC 4.0: non-commercial reuse free with credit; commercial use needs a license. Source: https://benchlm.ai/data
- Traffic: Similarweb says 75.78% of desktop visits are organic search, 0% paid, ~11.9K ranking keywords; top keywords "ai benchmark", "llm benchmark", "llm leaderboard". Source: https://www.similarweb.com/website/benchlm.ai (Sep 2026)

## Artificial Analysis (artificialanalysis.ai)
- Runs its own evaluations: 765 models listed, 46 evaluations, Intelligence Index v5.0.2; covers speed, price and providers. About page: 100+ inference providers, 1,000+ endpoints, 1T+ evaluation tokens. Sources: https://artificialanalysis.ai/ , https://artificialanalysis.ai/about
- Also runs image/video/3D arenas with a recruited panel, a Legal Index, a non-hallucination rate measure, and products named Optima, MicroEvals, Model Recommender, Data Playground. Source: https://artificialanalysis.ai/
- Pricing: Pro $417/month per seat (yearly saves $984), API and data export; Enterprise custom, invoice billing. Customer logos include Bank of England and Baseten. Source: https://artificialanalysis.ai/pricing
- Funding: AI Grant / Build Club $250K seed Jan 2023 (Dealroom); a full seed round from Nat Friedman and Daniel Gross reported 8 Jan 2026; Andrew Ng also backed it. Amount of the 2026 round not public. Sources: https://app.dealroom.co/companies/artificial_analysis , https://latent.space/wiki/artificial-analysis-28355378/ , https://aiwiki.ai/wiki/artificial_analysis

## LMArena / Arena (arena.ai)
- Crowd votes between two anonymous model answers; text, vision, video, agent mode.
- Revenue: Sacra estimates $100M annualized revenue June 2026, up from $30M in 2025; first paid product Sept 2025. Source: https://sacra.com/c/lmarena (estimate)
- Business: "AI Evaluations": labs and enterprises run paid private evaluation campaigns against Arena's user base, priced by volume of battles, votes and prompts; early revenue concentrated in frontier labs and large enterprises. Source: https://sacra.com/c/lmarena
- Audience: monthly visitors doubled from 5M (Jan 2026) to 10M (Jun 2026). Source: https://sacra.com/c/lmarena
- Funding: $100M seed May 2025 (a16z, UC Investments); $150M Series A Jan 2026 (Felicis, UC Investments) at $1.7B post-money; $250M total. Source: https://sacra.com/c/lmarena
- Trust problem: Leaderboard Illusion (NeurIPS 2025) found one provider tested 27 private variants before launch; top two providers received 19.2% and 20.4% of arena data vs 29.7% for 83 open-weight models together. Source: https://proceedings.neurips.cc/paper_files/paper/2025/file/70a93f260a51123b3c0e33ecd1b4de97-Paper-Datasets_and_Benchmarks_Track.pdf

## OpenRouter (openrouter.ai)
- One API to 400+ models from many providers; publishes public rankings of token usage by model and app.
- Revenue: Sacra estimates $160M annualized revenue Aug 2026, up from $50M end of 2025; charges about 5% on inference spend. Source: https://sacra.com/c/openrouter (estimate)
- Funding: $113M Series B led by CapitalG, May 2026; $1.3B valuation (TechCrunch, 26 May 2026). Total raised >$150M. Sources: https://openrouter.ai/blog/announcements/series-b , https://sacra.com/c/openrouter
- Stripe reported to be acquiring OpenRouter for more than $7B; neither company confirmed. Source: https://sacra.com/c/openrouter (reported, unconfirmed)
- Contrary Research: founded 2023, NYC, ~100 employees. Source: https://research.contrary.com/company/openrouter

## Hugging Face Open LLM Leaderboard
- v1 archived June 2024; v2 launched 26 Jun 2024; retirement announced 13 Mar 2025; Space remains with "Archived" label. Sources: https://huggingface.co/docs/leaderboards/en/open_llm_leaderboard/archive , https://aiwiki.ai/wiki/open_llm_leaderboard , https://huggingface.co/collections/OpenEvals/archived-open-llm-leaderboard-2024-2025

## Epoch AI Benchmarking Hub
- Tracks 432 models (pricing, architecture, training) across benchmarks. Source: https://epoch.ai/benchmarks
- License: Creative Commons Attribution (CC BY 4.0): commercial reuse allowed with credit; third-party benchmark data keeps its own license. Source: https://epoch.ai/benchmarks/use-this-data

## Vals AI
- Industry benchmarks: Legal Index, Harvey's Legal Agent Benchmark, Finance Agent v2, multimodal index. Reports accuracy plus cost per test, tokens per test and duration per test (e.g. Legal Index #1 77.86% at $3.72/test). Sources: http://www.vals.ai/benchmarks , http://www.vals.ai/benchmarks/legal_index
- Funding: $40M Series A at $400M valuation led by a16z, 13 Aug 2026 (8VC led seed); team tripled in six months. Sources: https://www.vals.ai/blogs/series-a , https://www.wsgr.com/en/insights/wilson-sonsini-advises-vals-ai-on-dollar40-million-series-a-led-by-andreessen-horowitz.html
- Pricing: not listed publicly (not found).

## Our own related work
- Coding-model bake-off (~/Desktop/code/coding-model-bakeoff, Oct 2026): 26 models, 4 tasks on Russell's private repos, $2.04 total; GLM-5.3-Flash passed the hard fix at $0.0021 vs Claude Opus 5.5 at $0.1456 with a lower thinking score. Shows private-task testing can reverse public rankings. Source: HANDOFF.md in that repo.
