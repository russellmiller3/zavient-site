# User and practitioner complaints about AI model leaderboards and comparison sites (2024 to Nov 2026)

Scope: sourced quotes and facts only; no recommendations. Quotes are under 15 words; everything else is a paraphrase. "Vendor" = the page is written by a company that sells evals, routing, cost tooling or a competing leaderboard, so it is not a neutral source. Dates are the search tool's published date; "approx" means derived from a relative date ("4 months ago") on a page fetched around 25 Nov 2026. Frequency counts ("seen in N sources") count only the sources collected in this run (about 30 searches, search excerpts, most pages not read in full), so they are a floor, not a market measure.

Method note: the search tool returned excerpts. I did not open full pages. Reddit and Hacker News thread contents are comment excerpts as shown by the search tool.

---

## Q1. Benchmark trust: contamination, saturation, gaming, scores that do not match real use

### Takeaway
Distrust of leaderboard scores is the most common theme (about 14 sources here). Specific complaints: arena rank bought with private variants, style over substance in human-vote arenas, public test sets leaking, saturation, and LLM-judged scores with no ground truth.

### Cited Findings

**C1. Arena gaming: undisclosed private variants and the Llama 4 "experimental" submission** (seen in 4 sources)
- LMArena said Meta's entry "Llama-4-Maverick-03-26-Experimental" did not match what it expects from providers; the public checkpoint re-ranked from 2nd to about 32nd. — [Absolute Digital Publishers, secondary](https://absolutedigitalpublishers.com/articles/measuring-meta-llama-and-open-weight-ai-evidence-benchmarks-and-uncertainty) (2026-10-12); [Nomad, vendor/consultancy](https://nomad.sc/resources/research/reading-the-leaderboard-may-2025) (2025-05-05)
- The same sources say Meta later acknowledged part of its Llama 4 benchmark table mixed results from different internal variants (reported secondhand, not verified against a primary source).
- Leaderboard Illusion (NeurIPS 2025, Cohere Labs et al.): one provider tested 27 private variants before launch; Meta 27, Google 10, Amazon 7, OpenAI 2 private models tracked Jan to Mar 2025. — [NeurIPS paper](https://proceedings.neurips.cc/paper_files/paper/2025/file/70a93f260a51123b3c0e33ecd1b4de97-Paper-Datasets_and_Benchmarks_Track.pdf) (2025-10-24)
- Same paper: top two providers received 19.2% and 20.4% of arena data; 83 open-weight models together received 29.7%. Nomad (vendor/consultancy) summarizes it as testing ten private variants is worth about 100 Elo points. — NeurIPS paper above; [Nomad](https://nomad.sc/resources/research/reading-the-leaderboard-may-2025)
- Reddit r/LocalLLaMA: "it's become more of a style benchmark than anything" (about LMArena). — [r/LocalLLaMA](https://www.reddit.com/r/LocalLLaMA/comments/1o71qm0/is_ai_benchmark_website_trustworthy) (2025-10-15)

**C2. "Benchmaxxing" and benchmarks that do not match real work** (seen in 6 sources)
- r/LocalLLaMA: "everybody is benchmaxxing rather than benchmarking" (lists leakage, selective reporting, noisy metrics, private leaderboards). — [r/LocalLLaMA](https://www.reddit.com/r/LocalLLaMA/comments/1ow277f/fire_in_the_hole_benchmarking_is_broken) (2025-11-13)
- r/LocalLLaMA poster re-ran Aider Polyglot on only Rust and C++ because public scores did not match his use case. — [r/LocalLLaMA](https://www.reddit.com/r/LocalLLaMA/comments/1jxk8rx/anyone_else_find_benchmarks_dont_match_their) (2025-04-12)
- r/LocalLLaMA: title "LLM Benchmarks are Bullshit"; poster found Claude 3 Opus far ahead of GPT-4 for coding despite near-equal scores. — [r/LocalLLaMA](https://www.reddit.com/r/LocalLLaMA/comments/1b933of/llm_benchmarks_are_bullshit) (2024-03-07)
- HN: "We've seen plenty of models with great benchmark scores flop" once people use them (comment on a Claude release thread, approx Jul 2026). — [HN](https://news.ycombinator.com/item?id=48472095)
- Menlo Ventures (investor report; one of its 2025 or 2026 pieces, excerpt did not show which): benchmarks saturate but "will fail to completely capture real-world efficacy". — [Menlo 2026 State of Enterprise AI](https://menlovc.com/perspective/2026-the-state-of-enterprise-ai/) (2026-11-03) or [Menlo 2025 mid-year](https://menlovc.com/perspective/2025-mid-year-llm-market-update) (2025-07-31); verify before quoting.
- LangChain (vendor): public benchmarks are "someone else's tests for someone else's program" (paraphrase of its framing). — [LangChain](https://langchain.com/resources/how-to-evaluate-llms) (2026-06-23)

**C3. Contamination** (seen in 3 sources)
- Review of 55 studies: on the Open LLM Leaderboard, all top-ranked 7B models showed significant contamination on analyzed benchmark pairs (ConStat); inflation of roughly 6 to 40% in selected settings. — [ACL GEM 2026 review](https://aclanthology.org/2026.gem-main.50.pdf) (2026-06-02)
- Same review: 6.5% of MMLU questions contain ground-truth errors. — same link
- r/LocalLLaMA thread cites data leakage as one of several problems. — [r/LocalLLaMA](https://www.reddit.com/r/LocalLLaMA/comments/1ow277f/fire_in_the_hole_benchmarking_is_broken) (2025-11-13)

**C4. Saturation** (seen in 4 sources)
- Study of 60 LLM benchmarks: older benchmarks show higher saturation; private test sets do not show a robust protective association once age is controlled. — [arXiv 2602.16763](https://arxiv.org/html/2602.16763)
- Kiro (vendor): on fixed task sets the remaining pass-rate gaps are "noise in the benchmark as much as" model performance. — [Kiro](https://kiro.dev/blog/1m-evals-lessons/) (2026-11-17)
- LangChain (vendor): GSM8K now scores 99% for top models and "no longer separates good models from great ones". — [LangChain](https://langchain.com/resources/how-to-evaluate-llms) (2026-06-23)
- Kili Technology (vendor): general benchmarks have saturated; the field fragmented into vertical benchmarks. — [Kili](https://kili-technology.com/blog/domain-specific-llm-benchmarks-guide) (2026-05-21)

**C5. Weak grading: LLM judges, scoring against no ground truth, broken agent benchmarks** (seen in 4 sources)
- HN on a vendor code-review benchmark: judge model ranks outputs, so "no ground truth". — [HN](https://news.ycombinator.com/item?id=44833929) (2025-08-08)
- HN thread "AI agent benchmarks are broken" (185 points, 86 comments); one commenter objects that a do-nothing agent passes 38% of tests. — [HN](https://news.ycombinator.com/item?id=44531697) (2025-07-11)
- A person who works on benchmarks and human evals for a living called the field "the Wild West and a total disaster" (paraphrase of the quote). — [HN](https://news.ycombinator.com/item?id=45857030) (2025-11-08)
- arXiv: agent benchmark scores mix model capability with scaffold; proposes de-scaffolding and ground-truth scoring. — [arXiv 2609.09218](https://arxiv.org/html/2609.09218) (2026-09-06)

**C6. Run-to-run noise: the winner changes between identical runs** (seen in 1 source, vendor)
- A routing-gateway vendor ran the same three models on 164 HumanEval+ problems twice an hour apart; rank 1 and 3 swapped. — [DEV Community, vendor](https://dev.to/tom_jones_230c4659491adcd/we-stopped-choosing-models-and-started-choosing-what-to-measure-77k) (2026-08-07)

**C7. Vibes instead of measurement** (seen in 2 sources)
- HN: "Why are we treating LLM evaluation like a vibe check rather than an engineering problem?" (2026, approx Mar to Apr; "6 months ago"). — [HN](https://news.ycombinator.com/item?id=47417020)
- HN: "These comparisons are all gut feelings." — [HN](https://news.ycombinator.com/item?id=48472095) (approx Jul 2026)

**C8. Benchmarks test models people do not run (quantized, hosted variants)** (seen in 1 source plus Q2 provider items)
- r/LocalLLaMA: "we benchmark models nobody actually runs" (model-card scores are for unquantized weights; asks for quant benchmarks). — [r/LocalLLaMA](https://www.reddit.com/r/LocalLLaMA/comments/1vr643w/we_benchmark_models_nobody_actually_runs) (2026-08-17)

### Inferences
- Complaints split into five distinct failure types (gaming, style bias, leakage and saturation, weak grading, run-to-run noise); a comparison site would be judged on which of these it addresses.
- Vendor blogs make up a large share of the contamination, saturation and noise evidence, which is a bias toward "buy our evals".

### Gaps
- No primary-source confirmation of Meta's admission about mixing variants in the benchmark table (only secondary sources seen).
- No X (Twitter) posts retrieved; the search tool returned none.

---

## Q2. Missing data

### Takeaway
Practitioners and vendors repeatedly say what leaderboards omit: per-provider quality and precision, cost per completed task, drift tracking, long-context effective length, non-English results, agent reliability. Some of these now have supplier pages (all small or vendor-run), which shows the need but also that no single trusted source exists.

### Cited Findings

**M1. Quality differs between providers serving the same open model** (seen in 5 sources)
- Of 137 OpenRouter provider endpoints (snapshot 2026-10-17), 50 label quantization and none label bf16. — [cdnping, vendor](http://cdnping.org/blog/llm-quantization-fp8-fp4-providers) (2026-10-17)
- Nine OpenRouter providers of Llama 3.3 70B: GSM8K accuracy 94 to 98% (statistically indistinguishable), decode speed 19 to 347 tokens/s, output price varied 7x; a naive first pass wrongly scored two providers at 0% and 44%. — [Tokenwatt, vendor](https://www.tokenwatt.io/blog/lab-notes-3-openrouter-llama-70b-providers.html) (2026-10-07). Note this single test did NOT find an accuracy gap.
- Surelio article titled "the hidden cost of OpenRouter's provider lottery". — [Surelio, vendor](https://www.surelio.com/insights/research/openrouter-same-model-different-behaviour) (2026-07-29)
- Academic measurement study of hosted open-weight APIs (price, context window, quantization, latency differ by provider). — [arXiv 2605.02821](https://arxiv.org/html/2605.02821v3)
- OpenRouter's own post on fp8 and fp4 quality and price. — [OpenRouter](https://openrouter.ai/blog/llm-quantization/) (2026-11-11)

**M2. Model quality drift ("did it get dumber")** (seen in 5 sources)
- r/ClaudeAI: "Quality has dipped so much in last 2 weeks" (poster says instructions are ignored; replies split, one says "complete opposite", another blames prompting habits). — [r/ClaudeAI](https://www.reddit.com/r/ClaudeAI/comments/1xt1asu/quality_has_dipped_so_much_in_last_2_weeks/) (2026-11-10)
- r/ChatGPTCoding: "Did Codex Get Dumber?" (poster: great first month, frustrating weeks since). — [r/ChatGPTCoding](https://www.reddit.com/r/ChatGPTCoding/comments/1y2coig/did_codex_get_dumber/) (no date shown, about Nov 2026)
- Anthropic postmortem: three infrastructure bugs degraded Claude between Aug and early Sep 2025; early reports were "difficult to distinguish from normal variation". — [Anthropic](https://www.anthropic.com/engineering/a-postmortem-of-three-recent-issues) (2025-09-17); also [Simon Willison](https://simonwillison.net/2025/Sep/17/anthropic-postmortem)
- Commentary (small site) says Anthropic's own evaluations did not catch the bugs. — [Trust Boundary Studio](https://trustboundarystudio.com/posts/anthropic-three-bugs-2025) (2026-10-20); the postmortem itself should be checked for this claim.
- cdnping (vendor) suggests checking which provider and precision served a request before concluding the model got dumber. — [cdnping](http://cdnping.org/blog/llm-quantization-fp8-fp4-providers)
- Existing drift trackers (supply side, vendor/hobby): AI Stupid Level (26 models, coding every four hours); model-drift on GitHub (17 models, 5 labs, daily frozen suite). — [AI Stupid Level](https://aistupidlevel.info/is-ai-getting-worse); [egnaro9/model-drift](https://github.com/egnaro9/model-drift)

**M3. Cost per completed task, not per token** (seen in 6 sources, all vendors)
- Three models with the same listed price billed $0.079, $0.111 and $0.303 on the same 82 tasks; the cheapest failed 10 tasks. Another model listed 25% cheaper per token and billed 2.6x more because of reasoning tokens. — [AI//COST](https://aicost.tools/blog/llm-cost-per-task/) (2026-11-18)
- Arize and Fireworks: 10 models, 2,400 agent runs; argue cost per successful task beats token price. — [Arize](https://arize.com/blog/cost-per-successful-task-ai-model-benchmark) (2026-07-23)
- Same argument: [MindsHub](https://mindshub.ai/blog/llm-cost-per-task-vs-price-per-token) (2026-09-23), [Metergraph](https://www.metergraph.dev/blog/cost-per-task) (2026-09-08), [DoiT](https://www.doit.com/blog/cost-per-task-vs-cost-per-token) (2026-08-11); Galtea (vendor) lists "cost per successful task" as a service limit to set. — [Galtea](https://www.galtea.ai/blog/how-to-compare-llms-for-an-ai-application) (2026-11-02)
- Caveat: all are vendors selling cost tooling; no end-user complaint quote found.

**M4. Domain results (legal, finance, medical, support)** (seen in 4 sources)
- Legal exists: Vals AI Legal Research Bench (top score 56.25% on 2026-11-19) and Artificial Analysis Legal Index. — [Vals AI](https://www.vals.ai/benchmarks/legal_research); [Artificial Analysis](https://artificialanalysis.ai/indexes/legal)
- Kili (vendor): even the strongest domain benchmarks leave production teams exposed without expert human review. — [Kili](https://kili-technology.com/blog/domain-specific-llm-benchmarks-guide) (2026-05-21)
- LILT AURORA (vendor): customer support and coding results rank models differently by language and task. — [LILT](https://lilt.com/blog/aurora-multilingual-ai-leaderboard) (2026-10-01)
- Not found: end-user complaints about missing finance, medical or customer-support results.

**M5. Long-context real performance** (seen in 5 sources, mostly small blogs)
- Advertised vs usable context: Llama 4 Scout's 10M claim, 22% NoLiMa accuracy at 32K (EduFabTech, small site). — [EduFabTech](https://edufabtech.com/blog/long-context-windows-benchmarks-versus-vendor-claims) (2026-09-16)
- "Every vendor's headline context number is a lie" (personal blog, opinion). — [s-batman](https://sbatman.com/posts/2026-06-14-context-weight/) (2026-06-14)
- Nadir (vendor): BenchLM tracks 322 models with published context windows; almost none publish how much works; the 2026 field "mostly stopped publishing" quality-at-length scores. — [Nadir](https://getnadir.com/blog/ruler-gap-context-window-advertised-effective) (2026-08-20)
- TMLS and Lumisonde papers/briefs: needle tests pass above 99% but real long tasks degrade far earlier. — [TMLS](https://www.tmls.nyc/research/context-rot-mechanistic) (2026-06-17); [Lumisonde](https://lumisonde.com/reports/effective-context-gap) (2026-08-20)

**M6. Non-English performance** (seen in 4 sources)
- Position paper over 2,000 multilingual benchmarks: English remains overrepresented despite tens of millions of dollars spent. — [arXiv 2504.15521](https://arxiv.org/html/2504.15521)
- EMNLP 2026: asks whether translated benchmarks measure language, knowledge or locality. — [ACL Anthology](https://aclanthology.org/2026.emnlp-main.32.pdf) (2026-10-20)
- European benchmarking taxonomy: using LLMs in non-English languages "remains a little-charted landscape". — [arXiv 2510.24450](https://arxiv.org/html/2510.24450)
- LILT AURORA (vendor): rankings flip by language and task. — [LILT](https://lilt.com/blog/aurora-multilingual-ai-leaderboard)

**M7. Agent and tool-use reliability** (seen in 4 sources)
- 14 models adopted corrupted tool outputs at over one third mean rate; 68.0% for web search. — [arXiv 2609.05587](https://arxiv.org/html/2609.05587v2) (2026-09-26)
- Of 400 MCP servers tried, 205 trials ended before a model could choose a tool (newsletter summarizing one researcher's protocol). — [Goodfoot](https://goodfoot.io/newsletter/what-a-tool-use-benchmark-leaves-out) (2026-09-13)
- ToolBench-X paper evaluates 12 LLMs under tool-environment unreliability. — [arXiv 2606.25819](https://arxiv.org/html/2606.25819v2)
- HN: local model "surprisingly often gets the edit tool call wrong". — [HN](https://news.ycombinator.com/item?id=48542100) (2026-06-15)

**M8. Uptime and rate limits by provider** (seen in 5 sources)
- None of five inference providers offers a published uptime SLA on standard self-serve pricing (APIStatusCheck, vendor). — [APIStatusCheck](https://apistatuscheck.com/blog/llm-inference-api-uptime-comparison) (2026-07-25)
- 90-day status-page read: OpenAI model APIs had an incident open 72.7 hours, Claude API 76.5 hours. Different providers write incidents differently. — [DevToolLab, vendor](https://devtoollab.com/blog/llm-api-outages) (2026-10-12)
- Aggregators exist: Frontier Terminal incident counts (OpenAI 24 incidents in 30 days to 2026-11-24); Compute Comparison rate limits for 18 providers. — [Frontier Terminal](https://frontierterm.com/incidents); [Compute Comparison](https://computecomparison.com/llm-rate-limits)
- Frontier Terminal itself notes a count is "what the vendor chose to post, not an SLA".
- Not found: end-user complaint quotes about rate limits.

### Inferences
- Items M1, M2, M3, M5, M8 each already have small single-purpose trackers; none is shown combining them.
- Provider accuracy gap evidence is mixed (Tokenwatt found none on one task; others report quantization labeling gaps).

### Gaps
- No quantified drift incident rates across providers beyond the Anthropic postmortem.
- No finance, medical or support complaints from practitioners found.
- X posts not retrieved.

---

## Q3. What teams do instead (own evals, vibe checks, golden sets) and cost

### Takeaway
Teams build their own evals on their own data; public benchmarks are used as an initial shortlist filter. Cost data in time or dollars was thin: the best figures are about eval size, not spend.

### Cited Findings
- a16z CIO survey (100 Global 2000 CIOs, Jun 2025): enterprises compare fine-tuned models against "their own internal sets of benchmarks"; external benchmarks like LM Arena serve as a quasi-"Magic Quadrant" initial filter; "you still need" internal evals. — [a16z](https://a16z.com/ai-enterprise-2025/) (2025-06-10)
- a16z (Mar 2024): changing models needs engineering time because assurance for agents "is not super easy". — [a16z](https://a16z.com/generative-ai-enterprise-2024) (2024-03-21) (quote from CIO interview in the 2025 piece, position per excerpt; verify page)
- Razorpay (user, engineering blog): built coding and non-coding eval frameworks; says it can measure any model "on your own work in an afternoon". — [Razorpay](https://razorpay.com/blog/the-winner-doesnt-take-it-all) (2026-08-04)
- LangChain (vendor): sources evals from dogfooding, adapted external benchmarks and hand-written tests. — [LangChain](https://blog.langchain.com/how-we-build-evals-for-deep-agents/) (2026-03-26)
- Vendor guides recommend 20 to 30 curated examples to start (Nearform) or 30 to 100 real examples (MasterDexter). — [Nearform](https://nearform.com/digital-community/from-ai-prototype-to-production-how-to-build-evals-for-reliable-agents) (2026-03-30); [MasterDexter](https://www.masterdexter.io/docs/llm-fundamentals/choosing-a-model) (2026-10-16)
- Morvion field report (not a survey, own estimates): about half of reviewed systems sit at "Level 0 vibe". — [Morvion](https://morvion.com/state-of-eval-2026) (2026-05-18)
- r/LocalLLaMA: "testing models myself is exhausting and time consuming" (a commenter). — [r/LocalLLaMA](https://www.reddit.com/r/LocalLLaMA/comments/1o71qm0/is_ai_benchmark_website_trustworthy) (2025-10-15)
- r/ClaudeAI poster says he spends more time rewriting prompts than working on some days (adjacent: prompt rework, not evals). — [r/ClaudeAI](https://www.reddit.com/r/ClaudeAI/comments/1xt1asu/quality_has_dipped_so_much_in_last_2_weeks/) (2026-11-10)
- Menlo Ventures mid-2025: 11% of teams changed model provider in the past year; 66% upgraded within the same vendor. — [Menlo](https://menlovc.com/perspective/2025-mid-year-llm-market-update) (2025-07-31). Context for switching cost, not a stated eval cost.
- Frequency: own-eval advice or practice appears in 8 sources.

### Inferences
- The only quantified time statement found is "an afternoon" (Razorpay) and "exhausting" (Reddit); no dollar or engineer-week figures for eval upkeep were found.

### Gaps
- No Retool State of AI figures retrieved: I did not run a Retool-specific search that returned its report (one combined search, result not read before the budget ended). Not covered.
- No data on money or hours teams spend on evals.

---

## Q4. What do people say they wish existed?

### Takeaway
Few explicit "I wish" statements were found. Wishes appear as asks inside complaints.

### Cited Findings
- HN commenter: "I'm missing objective unbiased measurements" to compare models and generations. — [HN](https://news.ycombinator.com/item?id=48472095) (approx Jul 2026)
- r/LocalLLaMA poster asks for good benchmarks of how quantized versions perform on tasks (not just KL divergence). — [r/LocalLLaMA](https://www.reddit.com/r/LocalLLaMA/comments/1vr643w/we_benchmark_models_nobody_actually_runs) (2026-08-17)
- Leaderboard Illusion recommends a cap on private variants and disclosure of total variants tested; asks for transparent arena sampling. — [NeurIPS paper](https://proceedings.neurips.cc/paper_files/paper/2025/file/70a93f260a51123b3c0e33ecd1b4de97-Paper-Datasets_and_Benchmarks_Track.pdf) (2025-10-24)
- Provider-side asks in vendor content: tracking cost per successful task (M3), disclosing effective context (M5), labeling quantization (M1).
- A DEV Community author asks how teams choose models "in practice", and notes a good choice "may only stay good for a few months". — [DEV Community, vendor](https://dev.to/sarahpan/how-do-you-choose-which-llm-to-use-in-production-id-love-to-hear-your-process-14c0) (2026-08-11)

### Gaps
- No direct "I wish there was a site that..." posts found in the searches run.

---

## Source mix and limits
- Searches used: about 30 (4 + 8 + 6 + 5 + 1 plus earlier). Time and budget stopped here.
- Vendor-labelled items are marked inline. Quotes taken from search excerpts, not full-page reads.
- Not covered: X posts, Retool report, LMArena response threads on X, Reddit r/MachineLearning, r/OpenAI.
