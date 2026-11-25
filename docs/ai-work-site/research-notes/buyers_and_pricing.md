# Who pays for AI model evaluation, comparison and selection data (as of 2026-11-25)

Fact sheet only, no recommendations. Skipped as already known to the coordinator: LMArena est. $100M revenue (Sacra, Jun 2026); OpenRouter est. $160M revenue (Sacra, Aug 2026) and reported Stripe acquisition; Artificial Analysis Pro $417/month per seat. 30 searches used in total. Not searched or not found: Arize pricing, Unify, Martian revenue, Portkey funding, Ramp/Menlo data price (none found), hedge fund purchases of AI-usage data (only a survey found), Glassdoor standalone revenue.

## 1. Evaluation companies: pricing, revenue, funding

### Takeaway
Dev-tool evals sell as $0 to $250/month self-serve tiers plus custom enterprise contracts. The big money sits in lab-facing and benchmark-authority businesses (Scale, Arena). Two eval start-ups changed shape: Humanloop sold its team to Anthropic, Patronus moved away from its eval platform.

### Cited Findings
- Scale AI: 2025 was its biggest revenue year, with over $1B in new business across data and applications; the data business is profitable. SEAL published 15 benchmarks and 450+ evaluations across 50+ models in 2025. No dollar revenue stated. — [Scale blog, 2026-01-22](https://scale.com/blog/scales-next-era-building-for-2026)
- Scale AI contracts with the DoD CDAO to build a test-and-evaluation framework for LLMs (2024-02-20; no value stated). — [Scale](https://www.scale.com/blog/scale-partners-with-cdao-to-test-and-evaluate-llms)
- Patronus AI: Series A $17M, total $20M (May 2024), led by Notable Capital, with Lightspeed and Datadog. — [PR Newswire](https://www.prnewswire.com/news-releases/patronus-ai-raises-17-million-to-detect-llm-mistakes-at-scale-302152825.html). A seedtable page shows "70.0M USD total raised", which conflicts with $20M and is unreconciled. — [Seedtable](https://seedtable.com/companies/patronus-ai/funding-rounds/series-a-2024-05)
- Patronus pricing page: Free; Base $25/month; Enterprise custom; API $10 per 1k small-evaluator calls, $20 per 1k large-evaluator calls. — [Patronus pricing](https://patronus.ai/pricing). A third-party directory (2026-11-19) says the LLM evaluation platform is retired and the company now sells training data and RL environments (secondary source, verify). — [AI Compliance Vendors](https://aicompliancevendors.com/vendors/patronus-ai)
- Galileo: $45M Series B (Oct 2024) led by Scale Venture Partners; revenue up 834% since Jan 2024; six Fortune 50 customers; named customers Twilio, Comcast, HP, ServiceTitan. — [Galileo blog](https://galileo.ai/blog/announcing-our-series-b)
- Galileo pricing: Free $0 (5k traces/month); Pro $100/month billed yearly (50k traces, scales with traces); Enterprise custom. — [Galileo pricing](https://galileo.ai/pricing?sa=X)
- Braintrust: raised $80M Series B (2026-02-17) led by ICONIQ, with a16z, Greylock, Elad Gil. — [Braintrust blog](https://www.braintrust.dev/blog/announcing-series-b)
- Braintrust pricing: Starter $0; Pro $249/month (5 GB data, 50k scores; $3/GB and $1.50 per 1k scores above that); Enterprise custom. — [Braintrust pricing](https://www.braintrust.dev/pricing)
- Arize AI: Forge lists total funding $230.37M, Series D post-money $741.84M (Apr 2026), and says it became public via "M&A on 10/01/2026" (acquirer not stated; unverified). — [Forge](https://forgeglobal.com/arize-ai_ipo). Pricing not retrieved.
- Humanloop: team joined Anthropic and the platform was sunset (TechCrunch 2025-08-13). Investors: Albion, Index, YC, Local Globe. — [Humanloop](https://humanloop.com/) ; [TechCrunch](https://techcrunch.com/2025/08/13/anthropic-nabs-humanloop-team-as-competition-for-enterprise-ai-talent-heats-up)
- Confident AI (DeepEval): $2.2M seed (dated 12 Mar 2025 by Caplight), YC W25. Plans Free, Starter $200/month, Team $2,000/month, Enterprise custom (secondary wiki, self-reported claims). — [datacatalog.wiki](https://datacatalog.wiki/wiki/vendor/confident-ai/)
- Vals AI: $40M Series A at $400M valuation led by a16z (2026-08-13); revenue up 8x vs all of 2025; customer base doubled; results cited in model cards from OpenAI, Anthropic, Google, Meta, xAI; supported the Department of Commerce. — [Vals blog](https://www.vals.ai/blogs/series-a)
- Haize Labs: homepage lists OpenAI, Anthropic, Air Canada, Epic Games, Deloitte, GovTech, Gránit Bank as customers. No funding or price found. — [Haize Labs](https://www.haizelabs.com/)
- Arena (formerly LMArena): AI Evaluations launched Sep 2025; $30M annualised run rate by Dec 2025 (cites TechCrunch); Series A $150M at $1.7B (Jan 2026); Series B $200M at $3.1B (Oct 2026); $450M total; annualised revenue over $100M. — [FactsLedger, 2026-11-10](https://factsledger.com/organizations/lmarena/). CONFLICT: coordinator brief says $250M raised and $1.7B valuation; this source shows a later Series B. Secondary source, verify against TechCrunch.
- Artificial Analysis: Pro $417/month per seat; Enterprise custom, for 150+ employee organizations (API limits, advisory, custom benchmarking, compute market forecasts). Data redistribution needs a separate contract. Publicly referenced by Amazon, Google, Microsoft, Citi, Deutsche Bank, BCG, Databricks. — [Artificial Analysis pricing](https://artificialanalysis.ai/pricing?from=%2F&source=nav)
- Epoch AI (nonprofit) funders: Coefficient Giving $8.5M (Apr 2025), $4.13M (Apr 2024), $6.92M (Apr 2023); Jaan Tallinn $600k; Likith Govindaiah $400k; Leopold Aschenbrenner $200k; Sentinel Bio $85k; Schmidt Sciences (Dec 2025). Paid engagements include Google DeepMind (model evaluations, 2025) and EU AI Office (technical consultations, 2026). — [Epoch funding](https://epoch.ai/our-funding)

### Inferences
- Self-serve eval tiers run $25 to $417/month; real revenue is in enterprise and lab contracts.
- Arena's $100M+ shows labs and enterprises pay for crowd-based comparison data.

### Gaps
- Revenue for Galileo, Braintrust, Arize, Confident AI, Haize: not found. Arize pricing and acquirer not confirmed.

## 2. Routers and gateways

### Takeaway
Routers charge a thin per-token fee or platform fee; none of the pricing found is sold as "selection data".

### Cited Findings
- Not Diamond: $0.05 per million tokens routed (pay-as-you-go); Enterprise volume discounts. Funding not retrieved. — [Not Diamond pricing](https://www.notdiamond.ai/pricing)
- Martian: $23M seed (17 Sep 2024) per PitchBook; Accenture Ventures invested and plans to integrate the router. — [PitchBook](https://pitchbook.com/profiles/company/527089-51) ; [Accenture](https://newsroom.accenture.com/news/2024/accenture-invests-in-martian-to-bring-dynamic-routing-of-large-language-queries-and-more-effective-ai-systems-to-clients)
- Portkey: Free; Production $49/month (100k logs; +$9 per extra 100k requests); Enterprise custom. — [Portkey pricing](https://portkey.ai/pricing). The page's upgrade link points to paloaltonetworks.com/ai-security, suggesting a Palo Alto Networks tie (unverified).
- OpenRouter: platform fee 5.5% (Standard), 8% (Business), Enterprise discounts; BYOK free to $25,000/month then 5%; 600+ models, 80+ providers. Revenue and Stripe deal as given by coordinator. — [OpenRouter pricing](https://openrouter.ai/pricing)

### Inferences
- OpenRouter's fee model (5.5% of spend) is the highest-revenue model in this group.

### Gaps
- Unify not searched. Martian revenue, Not Diamond funding, Portkey funding not found.

## 3. Who buys

### Takeaway
Buyers with documented spend: governments (US NIST contracts), labs (cite Vals, Scale; fund Arena), enterprises (Galileo, Vals customers), and finance data buyers (Neudata survey, no AI-usage purchase figures).

### Cited Findings
- US NIST awarded Basic Ordering Agreements for AI chemical and biological capability evaluations and benchmarks; Battelle Memorial Institute award, $3,000,000 total value (award date 2025-08-14). Notice is multi-award; CAISI is not named in the excerpt read. — [SAM.gov](https://sam.gov/opp/978fe1e0d010451fbf9eb2092e4faff8/view)
- UK AI Security Institute grants: Alignment Project up to £1M per project; Challenge Fund up to £200k per project; programmes include a >£15M Alignment Fund; currently closed. These are grants, not purchases of eval data. — [AISI grants](http://www.aisi.gov.uk/grants)
- Neudata survey (Sep 2026): 97% of data buyers use AI or LLMs; 17% credit AI with improved investment performance; 73% use LLMs. No evidence found of funds buying AI-usage datasets. — [Alternative Fund Insight](https://alternativefundinsight.com/hedge-funds-struggle-to-turn-ai-adoption-into-alpha)

### Gaps
- No contract notice found for CAISI naming a price; no public figure for lab spend on third-party evals; no hedge fund buyer of model-usage data named.

## 4. Adjacent data sellers

### Takeaway
Usage and share data is mostly published free by sellers who monetise elsewhere (Ramp sells cards, Menlo is an investor).

### Cited Findings
- Ramp AI Index: free; data from 85,000+ firms; Oct 2026 adoption 56.8% of US businesses; Anthropic 44.8% vs OpenAI 40.6%; week to 15 Nov 2026 Anthropic had 58.7% of token spend. Available on FRED, a Claude connector and a ChatGPT app. — [Ramp](https://ramp.com/data/ai-index?view=adoption&breakdown=sector)
- Menlo Ventures (2025-12-09): enterprise AI spend $37B in 2025; foundation model APIs $12.5B; Anthropic 40% of enterprise LLM spend vs OpenAI 27%. Free report. — [Menlo](https://menlovc.com/perspective/2025-the-state-of-generative-ai-in-the-enterprise/)

### Gaps
- No price found for either; both appear free.

## 5. Review sites that became paid data businesses

### Cited Findings
- G2: est. $162.9M revenue in 2024 (GetLatka estimate); $1.1B valuation at June 2021 Series D; $257.6M raised. — [GetLatka](https://getlatka.com/blog/g2-revenue)
- PitchBook: Morningstar reported $664.5M PitchBook licence revenue in 2025 across 113,451 users (~$5,900 per user); US federal orders at $8,000 and $10,500 per user per year (DoE, DoJ NSD). — [Hyperresearch](https://hyperresearch.ai/alternatives/pitchbook-pricing) (secondary; check Morningstar filing).
- Gartner: 2025 revenue $6.5B; Insights segment $5.1B; contract value $5.2B; bills upfront, 75%+ multi-year contracts. Peer Insights revenue not broken out. — [Gartner 2025 annual report](https://www.sec.gov/Archives/edgar/data/749251/000074925126000161/gartnerinc2025annualreport.pdf)
- Glassdoor: owned by Recruit Holdings since 2019 (FYE Mar 2026 group revenue ¥3.70tn); no Glassdoor-only revenue found. — [The Shashi](https://the-shashi.com/en/tse/6098/financials)

### Gaps
- G2 vendor pricing mechanics, Glassdoor employer fees, Gartner Peer Insights revenue: not found.
