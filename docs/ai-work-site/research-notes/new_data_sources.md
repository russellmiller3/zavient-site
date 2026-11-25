<!-- PLAIN_ENGLISH_DOC_GUARD_OK=1 -->
# New data sources for AI model comparison sites (as of 25 Nov 2026)

Method: 24 Parallel searches (about $0.024). Facts read from search-result page text, not full-page fetches. Raw results are saved in the folder `/private/tmp/claude-501/-Users-russellmiller-Desktop-Personal-Consulting/91029586-71ff-4691-88ac-9e4326cd66b0/scratchpad/datasrc/`, in files named s1 to s12 and t1 to t11. Items older than 2026 carry their date. No recommendations here, facts only. The search for other "is Claude dumber" trackers failed to save, so only AI Stupid Level was verified.

## 1. Quality drift over time

### Takeaway
At least one live monitor (AI Stupid Level) re-tests models on a fixed schedule with change-point detection. Collection is own test runs only; there is no provider-published drift data.

### Cited Findings
- AI Stupid Level re-tests every board model on fixed schedules: coding every 4 h (7 tasks, 7 attempts each, graded by running the project's own tests), reasoning daily (4 multi-turn sessions), tool use daily (9 agentic tasks in a sandbox), plus an hourly canary of 2 fixed probes. — [AI Stupid Level drift page](https://aistupidlevel.info/ai-drift-detection)
- Detection method: Page-Hinkley change detector per suite (never blended); canary uses Welch's t-test over the last 6 and 24 h vs the prior 7 days, raising an incident at a 12-point fall with p < 0.01. Scores are published with standard errors. — [AI Stupid Level drift page](https://aistupidlevel.info/ai-drift-detection)
- Covers OpenAI, Anthropic, Google, DeepSeek, Moonshot, Z.ai. Free tier watches 3 models and emails when a watched model's coding score drops 5 points in a week. It has an API docs page. — [AI Stupid Level drift page](https://aistupidlevel.info/ai-drift-detection), [API docs](https://aistupidlevel.info/api-docs)
- Cost to collect: no published figure found. Cost scales with calls: 7 tasks x 7 attempts x 6 runs/day = 294 coding calls/day/model (my arithmetic from the page's schedule, not published).
- License: no published license for the data found (gap).

### Inferences
- Drift data can only come from own repeated runs against the same model ID; the cost is the run count times price per run.

### Gaps
- Other "is Claude dumber" trackers: not verified (search failed to save). The page's measured false-alarm rates are on a separate methodology page I did not read.

## 2. Uptime, error rates, rate limits per provider

### Takeaway
Three layers exist: OpenRouter's own status page, an independent MIT-licensed OpenRouter per-model uptime registry, and a paid-probe monitor (llmstatus.io) with a free keyless API and MCP server.

### Cited Findings
- OpenRouter status page shows per-API uptime (e.g. Chat 99.99%, Video 99.96%). — [OpenRouter status](https://status.openrouter.ai/)
- dthinkr/openrouter-uptime: independent registry for every OpenRouter model, polled every 30 min (hourly at best until 2026-08-06; 21.6% duty cycle for the 30-min window early), keyless using only OpenRouter's public API, raw + derived + incident files, MIT license, created 2026-07-04. — [GitHub repo](https://github.com/dthinkr/openrouter-uptime)
- OpenRouter's public endpoint object carries `latency_last_30m` percentile stats. — [OpenRouter docs](https://openrouter.ai/docs/client-sdks/python/components/publicendpoint)
- llmstatus.io: probes each provider from 7 locations; light inference every 60 s (primary uptime signal), medium (~200-token) every 5 min (latency). Uses dedicated paid accounts. 429 rate-limit errors count in the error rate. Raw data kept 90 days; hourly and daily aggregates and incidents permanent. — [llmstatus methodology](https://llmstatus.io/methodology)
- llmstatus.io REST API and MCP server are free, no authentication. — [llmstatus API page](https://llmstatus.io/api)
- UpButler runs your own key against OpenAI/Anthropic/OpenRouter endpoints measuring time to first token and 429 vs 529; Free plan allows 1 monitor, Starter 5, Pro 25, Business 100. — [UpButler](https://upbutler.com/llm-api-monitoring)

### Inferences
- Per-endpoint uptime for OpenRouter providers is collectable free from the public API; rate-limit data needs authenticated probes (own keys).

### Gaps
- No data on rate-limit tiers per provider as a structured catalog. llmstatus.io license terms not read.

## 3. Industry evals (finance, legal, medical, tax, support)

### Takeaway
Vals AI is the main publisher of industry boards, and shows cost, tokens and duration per test. Open datasets exist but several carry noncommercial or licensed-only terms.

### Cited Findings
- Vals index lists legal (Vals Legal Index, HLAB-Vals-1.1 with 35 models, LegalBench 151 models, Immigration Bench), finance (Finance Agent v2.1, 37 models; CorpFin v2 private; MortgageTax; TaxEval v2; Excel Modeling) and healthcare benchmarks. Several are labeled Proprietary or Private. — [Vals benchmarks](http://www.vals.ai/benchmarks)
- Vals Finance Index leaderboard columns: Accuracy, Cost/Test, Tokens/Test, Duration/Test (e.g. rank 1 Gemini 4 Carbon 67.05%, $6.46; Claude Opus 5.5 65.59%, $11.67). Date Nov 05, 2026. — [Vals Finance Index](http://www.vals.ai/benchmarks/finance_index)
- FinanceBench: 10,231 questions; an open 150-question sample is free on GitHub/Hugging Face for noncommercial use only; the full set must be licensed from Patronus AI. Published 2023-11. — [Patronus FinanceBench](https://www.patronus.ai/research/financebench)
- HealthBench (OpenAI, 2025-05-12): 5,000 conversations, built with 262 physicians in 60 countries, rubric-graded. — [OpenAI HealthBench](https://openai.com/index/healthbench)
- tau-bench (Sierra): airline and retail environments, MIT license, includes historical trajectories and accepts contributed ones. — [tau-bench repo](https://github.com/sierra-research/tau-bench)
- Insurance, customer-support boards: none found in these searches.

### Inferences
- Reusing others' held-out sets legally depends on each license; MIT (tau-bench) is permissive, FinanceBench sample is noncommercial.

### Gaps
- HealthBench license text not read. No insurance-specific board found. Cost to build a private industry set: no figure found.

## 4. Real usage data

### Takeaway
OpenRouter exposes token share and top-apps via public pages and a Data API; Ramp publishes spend-based adoption; Hugging Face downloads are available via public API and are already mirrored by third parties; job-post data is sold by API vendors.

### Cited Findings
- OpenRouter rankings: tokens processed through its API, daily UTC buckets, per model variant; private requests excluded. Example week to 22 Nov 2026: DeepSeek V4.1 Flash 1017 at 65T tokens. — [OpenRouter rankings](https://openrouter.ai/rankings?view=month)
- OpenRouter documents a Data API endpoint for top apps by token usage (prompt + completion; hidden/private apps excluded). — [OpenRouter docs](https://openrouter.ai/docs/api/api-reference/datasets/top-apps-by-token-usage)
- Ramp AI Index: 85,000+ US businesses, card/invoice/ACH transactions; Oct 2026 adoption 56.8% (Anthropic 44.8%, OpenAI 40.6%); week ending 15 Nov 2026 Anthropic 58.7% of token spend. Access via FRED, Claude connector, ChatGPT app. — [Ramp AI Index](https://ramp.com/data/ai-index?check=20261124-0600)
- Hugging Face Hub public models API gives 30-day and all-time downloads, likes, trending score, license, gated flag; witan.markets snapshots it every 6 hours into a time series. — [witan.markets](https://witan.markets/datasets/hf-trending-models)
- HF downloads per model: llmbenchmark.ai already publishes 30-day downloads for open-weight models. — [llmbenchmark.ai trending](https://llmbenchmark.ai/trending)
- Job posts: jobdata API reports "LLM" in 0.7% of posts (42,502 in 90 days) and "large language models" in 0.3% (15,320), sourced from company career sites; paid API ("View pricing"). Model names in posts: a Sept 2026 sample of 753 HN "Who is hiring" posts plus Remotive and Arbeitnow feeds found Anthropic/Claude in 49 ads (16%). — [jobdataapi](https://jobdataapi.com/skill-demand/llm/), [square1ai](https://www.square1ai.com/research/what-ai-job-ads-ask-for-2026)

### Gaps
- OpenRouter Data API terms of use and rate limits not read. Ramp data license not read. Job-post API price not captured.

## 5. Fresh uncontaminated tests

### Takeaway
Three anti-gaming designs exist: rolling new questions (LiveBench), automated monthly instance harvesting (SWE-bench-Live), and fully private sets (Scale SEAL). OpenAI reports contamination in SWE-bench Verified.

### Cited Findings
- LiveBench (ICLR 2025): questions drawn from recent math competitions, arXiv papers and datasets, updated monthly; the newest monthly set is withheld and released one month later so some questions are always private; all questions, code and outputs open-source. — [ICLR 2025 paper](https://proceedings.iclr.cc/paper_files/paper/2025/file/e4a46394ba5378b3f9a186a5b4c650d1-Paper-Conference.pdf)
- SWE-bench-Live (Microsoft, MIT license): automatically updating multi-language SWE task set built by the RepoLaunch agent; leaderboard tightened submission checks Aug 2026. — [SWE-bench-Live repo](https://github.com/microsoft/SWE-bench-Live), [project site](https://swe-bench-live.github.io/)
- Scale SEAL (2024-05-29): private curated datasets "that can't be gamed", scored by verified domain experts. — [Scale blog](https://scale.com/blog/leaderboard)
- OpenAI (2026-02-23): SWE-bench Verified "increasingly contaminated"; recommends SWE-bench Pro. — [OpenAI](https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified?lid=10VVSV5qiFlzOKhuA)
- A 2026 arXiv paper argues contamination is at least five distinct failures and a private held-out set addresses one; "acquired contamination" cannot be certified at release. — [arXiv paper](https://arxiv.org/html/2608.29463v1)

### Gaps
- Cost to refresh a private set not found.

## 6. Hallucination, refusal, compliance attributes

### Takeaway
Hallucination has an Apache-2.0 leaderboard with a private dataset. Refusal rate has no first-party measurements yet at refusalrate.com. Compliance data is cataloged only in scattered vendor-comparison pages.

### Cited Findings
- Vectara leaderboard: repo Apache-2.0; HHEM-2.3 (commercial) scores; dataset not public (to avoid overfitting), 7,700+ articles; reports hallucination rate, factual consistency, answer rate and average summary length; last updated 22 Oct 2026. Open variant HHEM-2.1-Open on Hugging Face and Kaggle. — [Vectara repo](https://github.com/vectara/hallucination-leaderboard)
- refusalrate.com (page 2026-10-29): "has not published any measurements yet"; summarizes OR-Bench (80,000 over-refusal prompts, 32 models; ICML 2025) and RefusalBench (22 models, 141 prompts). Its Nov 10 2026 leaderboard page states it has not run its own tests; it cites UGI and SpeechMap numbers. — [refusalrate benchmarks](https://refusalrate.com/llm-refusal-rate-benchmarks), [uncensored board](https://refusalrate.com/uncensored-llm-leaderboard)
- Compliance: prisme.ai table (verified 26 June 2026) lists ZDR by default or on request, scope, and hosting region for providers (e.g. Mistral keeps data 30 days by default, ZDR only on Scale plan; Anthropic direct "No, but minimal retention", ZDR on approval; Bedrock per chosen region). It warns terms must be confirmed in the contract. — [prisme.ai](https://docs.prisme.ai/resources/security/llm-provider-data-retention)
- Other catalogs: llmgateway.io provider legal page, openagreements.org ZDR cross-provider comparison. — [llmgateway](https://llmgateway.io/legal/providers), [openagreements](https://openagreements.org/practice-guides/ai-vendors/zdr-cross-provider-comparison)
- Open-model license terms (9to5ai, 2026-10-09): Apache 2.0 (gpt-oss, Gemma 4, Mistral Small 4, Qwen3.8-27B) and MIT (DeepSeek-V4.1-Flash) permit commercial use; Llama 4 adds 700M-MAU cap, acceptable-use policy, "Built with Llama" branding, and withholds multimodal rights from EU-based companies. — [9to5ai](https://9to5ai.tech/open-weight-licenses-compared)

### Gaps
- No structured, machine-readable compliance dataset found; the sources are articles that carry their own accuracy risk. SOC 2 status per provider only appears as individual statements.

## 7. Price history

### Takeaway
Several free, openly licensed price-history datasets already exist, so price history is a commodity to ingest, not collect.

### Cited Findings
- tokencanopy/price: MIT, refreshed every 6 hours, 12,351 price points, 1,125 models, 85 platforms, updated 2026-11-19, history since 2026-09. — [tokencanopy repo](https://github.com/tokencanopy/price)
- apipriceindex.com: one JSON file of all offers plus a price-history CSV (a row only when a price changes); includes Epoch Capabilities Index under CC BY 4.0. — [apipriceindex](https://apipriceindex.com/use-this-data/)
- Hugging Face modelpricewatch/llm-token-price-history: daily-snapshotted series, 326 models. — [Hugging Face dataset](https://huggingface.co/datasets/modelpricewatch/llm-token-price-history)
- API Tracker: daily OpenRouter quotes for 24 reviewed series; backfill from llm-pricing-history dataset (CC BY 4.0). — [API Tracker](http://apitracker.io/llm-prices)
- simonw/llm-prices (2025-04-24) and aicostbudget/ai-api-pricing-data (daily snapshots, archived price-change pages 2024-2026) also exist. — [simonw repo](https://github.com/simonw/llm-prices), [aicostbudget repo](https://github.com/aicostbudget/ai-api-pricing-data)

### Gaps
- Licenses of apipriceindex and modelpricewatch main data not read.

## 8. Published cost of running broad test suites

### Takeaway
Published numbers range from $0.12 to $2,829 for one agent run on one benchmark (HAL), about $100,000 aggregate for HELM's 30 models (2022), and about $40,000 for HAL's 21,730 rollouts. Artificial Analysis publishes a per-model cost to run its Intelligence Index.

### Cited Findings
- HELM (2022-11-17): 30 models, 42 scenarios, 12.17B tokens, 17.4M queries; $38,001 for commercial APIs and about 19,500 GPU hours. — [HELM paper](https://arxiv.org/html/2211.09110), [Stanford CRFM](https://crfm.stanford.edu/2022/11/17/helm.html)
- EvalEval (2026-04-29): HELM aggregate cost plus compute about $100,000; per-model API $85 to $10,926; HAL spent about $40,000 on 21,730 rollouts, 9 models, 9 benchmarks. — [EvalEval](https://evalevalai.com/research/2026/04/29/eval-costs-bottleneck)
- HAL (ICLR 2026): "$40,000" compute, evaluation time cut from weeks to hours. — [ICLR 2026 paper](https://proceedings.iclr.cc/paper_files/paper/2026/file/a0928f924a344aaebbb7f6cd8d56e34c-Paper-Conference.pdf)
- Rillor (2026-11-14): HAL per-run cost ranged $0.12 to $2,829 (April 2026); HAL note dated 5 Oct 2026 says costs and tokens overstated by exactly 2x for affected models; 8 reruns would raise $40,000 to about $320,000 (EvalEval estimate). — [Rillor report](https://rillor.com/insights/what-agent-evaluation-costs/report)
- Epoch AI (arXiv 2511.23455, 2025-11-28): price of running benchmarks computed from tokens x Artificial Analysis prices; cost to reach a fixed performance fell about 5-10x per year, yet cost of running frontier models rose about 3-18x per year. — [Epoch paper](https://arxiv.org/html/2511.23455v2)
- Artificial Analysis shows "Cost (USD) to run all evaluations in the Artificial Analysis Intelligence Index" per model, split by output, reasoning, cache write, cache read, input. — [Artificial Analysis](https://artificialanalysis.ai/evaluations/artificial-analysis-intelligence-index?eval-cost=intelligence-vs-total-cost)
- Epoch benchmark data: free CSV zip (updated 21 Nov 2026), CC BY 4.0; benchmark questions remain property of creators; external-run data keeps its own license. — [Epoch data page](https://epoch.ai/benchmarks/use-this-data)
- HELM efficient benchmarking cuts cost ("upward of $10,000" per run cited by IBM); HELM efficient tutorial works only for HELM Classic v0.3.0. — [IBM](https://research.ibm.com/blog/efficient-llm-benchmarking), [HELM docs](https://crfm-helm.readthedocs.io/en/latest/efficient_benchmarking)

### Gaps
- No published total for a suite across about 100 models; Artificial Analysis's dollar totals sit in chart data not extracted here.
