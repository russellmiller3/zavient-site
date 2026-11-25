# User complaints and survey data, part 2 (leaderboards, providers, languages, reliability, buying)

Scope: sourced quotes and facts, 2025 to 25 November 2026. No recommendations in this file.
Searches used: 12 of 12 (Parallel, via `scripts/parallel_search.mjs`). Raw results are in `/private/tmp/claude-501/-Users-russellmiller-Desktop-Personal-Consulting/91029586-71ff-4691-88ac-9e4326cd66b0/scratchpad/complaints2/`.

Date rule: the date is the publish or post date in the search result. Where a page showed only a relative age ("23 days ago"), the note says so and no absolute date is given.

Labels: [vendor] = the company publishing its own product, research or survey. [indep] = independent blog, news or newsletter. [paper] = peer-reviewed paper or preprint. [aggregator] = third party summarizing other sources.

## 1. Practitioners say leaderboards do not match real use

Takeaway: Hacker News and r/LocalLLaMA commenters say single leaderboard scores do not predict what they get from a model. They cite overfitting, small question counts and wide error bars. These are forum comments, not measured studies.

- "these leaderboards have become completely meaningless for end-users to make decisions on when to use what model" - HN commenter `meander_water`, on the thread "Opus 5 is currently #1 on Artificial Analysis Intelligence Leaderboard" - https://news.ycombinator.com/item?id=49040741 - relative age only (thread about 3 months old at index time).
- "there is often a perceived difference of quality between benchmarks and real-world use" - HN commenter `hobofan`, who notes the coding benchmark uses about 200 questions and science about 150 - https://news.ycombinator.com/item?id=50268868 - relative age only ("23 days ago").
- "quietly redacted several open-weight models from the new benchmark" - HN commenter `peri-cl`, on the Artificial Analysis Intelligence Index v5 write-up - https://news.ycombinator.com/item?id=50268868 - relative age only.
- "Ranks #5 through #25 are statistically indistinguishable" - HN commenter on a leaderboard with about 95% confidence intervals of plus or minus 15 to 20 points on a pass rate - https://news.ycombinator.com/item?id=48993626 - thread dated 2026-07-21 in search metadata.
- "benchmarks don't mean much these days" - HN commenter `bluegatty`, on the Real-SWE thread (private enterprise codebases) - https://news.ycombinator.com/item?id=49676820 - relative age only ("68 days ago").
- Reddit post "LMArena's leaderboard can be misleading": new models with few votes can top the chart before scores settle. Paraphrase. - https://www.reddit.com/r/LocalLLaMA/comments/1mrm7oz/lmarenas_leaderboard_can_be_misleading - 2025-08-16.
- Reddit reply: models can be tuned to score well on benchmarks without better real-world performance. Paraphrase. - https://www.reddit.com/r/LocalLLaMA/comments/1o71qm0/is_ai_benchmark_website_trustworthy - 2025-10-15.
- Background, outside the window: Reddit r/LocalLLaMA "LLM Leaderboards are Bullshit - Goodhart's Law Strikes Again" says leaderboards push researchers to "overfit to the quirks and flaws of the benchmarks themselves" - https://www.reddit.com/r/LocalLLaMA/comments/1bjvjaf/llm_leaderboards_are_bullshit_goodharts_law - 2024-03-21.
- Vendor claim, read as a commenter quote: HN commenter `salmacodes` on the TinyFish Show HN: WebVoyager "only agreeing with humans 62% of the time." - https://news.ycombinator.com/item?id=46991520 - relative age only (74 days). TinyFish is [vendor]; its own post is the source of the 62% figure, and its claim is not independently checked here.
- What people say they wish existed: the aggregator "Still Unbuilt" (AI-classified from 63,300 HN comments, 2008 to 2026) lists ask #55 "LLM tests on real work": tests of models on real work, tool-use reliability and destructive actions. [aggregator] - https://stillunbuilt.shiptiffin.app/ - item date not given.

Gaps: No 2025 or 2026 HN or Reddit thread found that names one specific leaderboard feature people want, beyond the aggregator's ask list. Forum quotes are opinions, not measured study results.

## 2. Rate limits, uptime and latency differ by API provider

Takeaway: Measured uptime among the big providers differs by hundredths of a percent. Latency differs by region and provider. Rate-limit tables for the newest models are not published.

- Uptime, 18 Sep to 17 Oct 2026, four regions: Meta Llama API 99.986%, Anthropic 99.985%, OpenRouter 99.985%, Google Gemini 99.983%, OpenAI 99.930%. [indep] Author's own method; affiliation not stated. - http://dev.to/max_bob/ai-api-uptime-comparison-last-30-days-openai-anthropic-google-and-43-more-measured-from-4-4m41 - 2026-10-18.
- "The spread among the big providers is a few hundredths of a percent" - same source - 2026-10-18.
- Latency, median time to first byte over 24 hours: fastest in Germany was Fireworks at 16 ms, in Tokyo Fireworks 19 ms, in US Central Fireworks 30 ms, in Sao Paulo OpenRouter 62 ms. [indep] - https://dev.to/max_bob/there-is-no-fastest-ai-api-100-days-of-probing-44-providers-from-4-regions-4oc9 - 2026-11-07.
- "The same endpoint can be ten times slower from another continent" - same source - 2026-11-07.
- SLA: four clouds publish a legal LLM uptime SLA with service credits (Bedrock, Azure, OCI at 99.9%, Gemini at 99.5%). OpenAI publishes one only for reserved capacity. Anthropic's direct API is best-effort. [indep news] - https://inferencetribune.com/story/which-llm-api-providers-offer-an-uptime-sla-bedrock-azure-and-oci-at-999-gemini - undated (the page header shows the crawl day).
- SLA comparison table: OpenAI Scale Tier lists 99.9% published uptime; its latency cell reads "99% > 50 TPS on GPT-5.5, varies by model"; credit schedule not public. The cell is not explained in the snippet. [indep newsletter] - https://www.beri.net/article/llm-api-sla-comparison-openai-azure-bedrock-vertex-anthropic-latency-service-credits - 2026-11-01.
- Rate limits: "Rate limit tables for most models introduced since August 2026 remain unpublished" - [indep] Stochastic Sandbox - https://stochasticsandbox.com/posts/api-rate-limits-compared/ - 2026-11-10. Per-provider limit figures were not read in full.

Gaps: No per-provider rate-limit numbers read. Latency and uptime figures come from single blogs using their own methods, and were not checked against the providers' status pages. No p95 or tokens-per-second comparison read beyond the SLA table.

## 3. Non-English performance gaps

Takeaway: Frontier models score close to English in about a dozen major languages. Quality falls fast below that. Leaderboards report per-language scores without explaining the gaps.

- "Frontier LLMs score 95 to 98% of their English level in about a dozen major languages." Same post: Claude Sonnet 4.5 stays near 97% of its English score until Swahili; Haiku 4.5 falls to 53% in Yoruba. [indep] - https://capitalandcompute.net/blog/which-languages-do-llms-support-well/ - 2026-10-06. The post's underlying test data was not read.
- AURORA, a multilingual leaderboard, uses "localized benchmarks designed and verified by native-language experts, rather than translated tests." [vendor: LILT sells multilingual data services] - https://aurora.lilt.com/blog/aurora-multilingual-ai-leaderboard - 2026-10-02.
- "leaderboards report per-language accuracy but rarely explain why disparities emerge." Microsoft Research India, DEPART, EMNLP 2026 Findings. [paper] - https://aclanthology.org/2026.findings-emnlp.2328.pdf - 2026-10-20.
- Paper title as finding: "Mind the Gap... or Not? How Translation Errors and Evaluation Details Skew Multilingual Results" (Google). [paper] - https://aclanthology.org/2026.gem-main.22.pdf - 2026 (the search result gives no exact date).
- Paper abstract: benchmarks eight LLMs in English, Kazakh and Mongolian across five conditions; a low-resource gap study. [paper] - https://arxiv.org/html/2603.21036 - 2026-03-22 (arXiv v1 stamp).

Gaps: No current frontier model table with non-English scores read. AURORA's per-model results were not read. The Capital & Compute 95 to 98% figure is the blog's own summary.

## 4. Long-context and agent/tool-use reliability not shown on leaderboards

Takeaway: Long-context scores fall before the advertised window limit. Agents that pass a task once often fail when the same task is repeated. Standard leaderboards report one pass rate.

- Long context: "even when models can perfectly retrieve all relevant information, their performance still degrades substantially (13.9%–85%) as input length increases." [paper] EMNLP 2025 Findings, "Context Length Alone Hurts LLM Performance Despite Perfect Retrieval" - https://aclanthology.org/2025.findings-emnlp.1264.pdf - 2025-10-30.
- Background, April 2024: RULER finds "large performance degradation in all models as we increase input length," and defines effective context as the longest length that still passes a threshold. [paper] - https://arxiv.org/html/2404.06654v2 - 2024-04 (arXiv 2404 stamp; outside the window, background only).
- "The advertised figure is a serving and billing quantity, not a measurement." [indep report, publisher not identified in snippet] - https://lumisonde.com/reports/effective-context-gap - 2026-08-20. Its own finding: no published work measures the usable share of a 1M-token window for the latest models.
- Usable performance "collapsing well before the advertised limit," citing Llama 4 Scout's 10M claim and 22% NoLiMa accuracy at 32K. [indep blog] - https://edufabtech.com/blog/long-context-windows-benchmarks-versus-vendor-claims - 2026-09-16. The 22% figure is cited secondhand here.
- Tool-use reliability: tau-bench "are quite inconsistent (passˆ8 < 25% in retail)"; agents succeed on under 50% of tasks. [paper] ICLR 2025 - https://proceedings.iclr.cc/paper_files/paper/2025/file/1b126cc38b8638e07bef37e7b2bb72bf-Paper-Conference.pdf - 2025-02-28 (search metadata). Tested models include gpt-4o.
- Definition: pass^k is "the probability that an agent succeeds on all k trials of the same task." [vendor: Cekura, an agent-testing company] - https://www.cekura.ai/blogs/tau-bench - 2026-11-03.
- "Success once and success reliably are very different numbers." [indep] - https://personalagentbench.com/benchmarks/tau-bench - undated.
- The tau-bench site's tau3-Banking text leaderboard shows only pass^1: Qwen 3.8 Max 55.2%, Claude Opus 5 48.7%, Grok 4.5 47.9%. [benchmark site] - http://taubench.com/ - undated.
- Princeton HAL reliability dashboard reports Accuracy, Consistency, Predictability, Robustness and Safety in separate columns for tau-bench (airline). [paper-linked dashboard] - https://hal.cs.princeton.edu/reliability/compare/taubench/ - undated.

Gaps: No source read gives pass^k or long-context figures for the newest models (Opus 5, Fable 5.x, Sonnet 5.5). The taubench page shows pass^1 only in the snippet. The 2026 long-context sources are secondary.

## 5. Survey data on how companies choose and switch models

Takeaway: Surveys say most companies upgrade within their current vendor rather than switch. Stated selection criteria shifted from price-led to capability and security-led. Retool's reports found here give no model-selection numbers.

- Menlo Ventures, 2025 Mid-Year update, [vendor: VC firm's own survey]: "Only 11% of teams report changing model providers in the past year." "66% upgraded to newer models from their existing vendor, while 23% made no changes or upgrades at all." - https://menlovc.com/perspective/2025-mid-year-llm-market-update/ - 2025-07-31. Sample size not in snippet.
- Same report: "Switching between vendors is relatively easy, but increasingly rare." - same URL - 2025-07-31.
- Menlo Ventures, 2024 State of GenAI, [vendor]: selection criteria were measurable value (30%), understanding the work's context (26%), and "lowest price tag (1%)." - https://menlovc.com/2024-the-state-of-generative-ai-in-the-enterprise/ - 2024-11-20.
- Same report: Anthropic's enterprise share rose from 12% to 24% "as some enterprises switched from GPT-4 to Claude 3.5 Sonnet." - same URL - 2024-11-20. The snippet cuts off the sentence on why buyers switch ("security and saf...").
- Menlo Ventures, 2026 State of Enterprise AI, [vendor]: "buyers continue to prioritize capability over cost in model selection." Frontier models' share of enterprise AI spend rose from 35% (Q3 2025) to 63% (Q3 2026); token share from 18% to 42%. - https://menlovc.com/perspective/2026-the-state-of-enterprise-ai - 2026-11-03.
- a16z, "How 100 Enterprise CIOs Are Building and Buying Gen AI in 2025," [vendor: VC firm]: "for simpler or internal tasks, model choice often comes down purely to cost." Enterprises now use "disciplined evaluation frameworks"; security and cost "have gained ground." - https://a16z.com/ai-enterprise-2025/ - 2025-06-10.
- a16z, "Leaders, gainers and unexpected winners in the Enterprise AI arms race," [vendor]: "We surveyed 100 verified VPs and C-level executives in the Global 2000." 88% of them had revenue over $1B. - https://a16z.com/leaders-gainers-and-unexpected-winners-in-the-enterprise-ai-arms-race/ - 2026-01-30.
- Second-hand, [aggregator]: rainvent.ai reports that a16z's January 2026 survey finds 81% of large enterprises use three or more model families. The a16z page was not read for this figure. - https://rainvent.ai/the-state-of-enterprise-ai-late-2026-what-the-reports-agree-on-and-where-they-contradict-each-other - 2026-10-04.
- Mindset AI blog, [vendor]: "37% of enterprises are using five or more models in production," up from 29%. The original survey is not named in the snippet. - https://www.mindset.ai/blogs/in-the-loop-ep21-how-enterprise-cios-build-and-buy-ai-in-2025 - 2025-06-25.
- Retool, H1 2024 report, [vendor], survey of 730 people in April 2024: average trust in model output 6.1 out of 10. No model-selection or switching figure in the text read. - https://retool.com/blog/state-of-ai-h1-2024 - 2024-06-17.
- Retool 2023 report as summarized by MongoDB, [vendor summary]: model accuracy, security and hallucinations top the pain points; 1,500+ respondents. - https://www.mongodb.com/company/blog/atlas-vector-search-commands-highest-developer-nps-retool-state-ai-2023-survey - 2023-11-13.

Gaps: The a16z criteria ranking (the "KPC" chart) is an image, not in the text read. The Menlo 2025 year-end report (https://menlovc.com/perspective/2025-the-state-of-generative-ai-in-the-enterprise, PDF https://menlovc.com/wp-content/uploads/2025/12/menlo_ventures_enterprise_ai_report-2025-121525.pdf) showed no selection or switching numbers in the snippets; the full text was not read. No Retool 2025 or 2026 report with model-selection data was found.

Searches used: 12 of 12. Stop condition met (search budget). Self-check: this is a gathering pass with no analysis; figures are as printed in each source.
