---
title: "AI Value Creation in PE-Backed SaaS: Multiple, Cost-Out, and the Diligence Test"
description: "Where AI actually moves EBITDA and the multiple in PE-backed software, what real value looks like vs. a thin GPT wrapper, and the questions to ask before you bet."
dek: "Every sponsor has an \"AI thesis.\" Most are slideware. Here's where AI genuinely lifts software EBITDA and valuation, where it quietly destroys gross margin, and how to tell a real moat from a wrapper before you wire the money."
tag: "Industry · Software & SaaS"
order: 7
blurb: "Where AI lifts the multiple, where it quietly destroys gross margin, and how to spot a real moat from a thin GPT wrapper."
ctaHeading: "Send me the company and the AI thesis."
ctaBlurb: "I'll tell you whether it's multiple expansion, cost-out, or a wrapper priced like a moat — and where the inference cost is hiding. 10,000+ lines of production ML, IC presentations."
ctaSubject: "SaaS AI"
stats:
  - { num: ">80%", label: "Orgs seeing no EBIT impact from gen AI (McKinsey)" }
  - { num: "+26% / −19%", label: "Copilot PRs up (juniors) / experienced devs slower on legacy" }
  - { num: "~$230K", label: "Inference cost per $1M of AI revenue" }
  - { num: "120% NRR", label: "Usage/outcome pricing vs. ~110% subscription-only" }
sources:
  - { name: "McKinsey — State of AI 2025", url: "https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai", what: ">80% no EBIT impact; ~6% high performers; workflow redesign is #1 driver", conf: "STRONG" }
  - { name: "CACM — Copilot RCT", url: "https://cacm.acm.org/research/measuring-github-copilots-impact-on-productivity/", what: "+26% PRs across ~4,800 devs", conf: "STRONG" }
  - { name: "METR", url: "https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/", what: "Experienced devs 19% slower on mature code; 20% perceived speedup", conf: "STRONG" }
  - { name: "Klarna", url: "https://www.klarna.com/international/press/klarna-ai-assistant-handles-two-thirds-of-customer-service-chats-in-its-first-month/", what: "2/3 chats, 700 agents, $40M profit", conf: "MEDIUM" }
  - { name: "CX Dive — Klarna reversal", url: "https://www.customerexperiencedive.com/news/klarna-reinvests-human-talent-customer-service-AI-chatbot/747586/", what: "Re-hired humans; all-AI degraded quality", conf: "STRONG" }
  - { name: "Ibbaka — Intercom Fin", url: "https://www.ibbaka.com/ibbaka-market-blog/comparing-the-value-model-and-pricing-model-of-intercoms-fin-ai-agent", what: "$0.99/resolution; outcome pricing", conf: "MEDIUM" }
  - { name: "The SaaS CFO", url: "https://www.thesaascfo.com/your-ai-feature-is-quietly-destroying-your-gross-margin/", what: "~$230K inference per $1M rev; margins to 60–70%", conf: "MEDIUM" }
  - { name: "SaaS Mag", url: "https://www.saasmag.com/how-saas-companies-monetizing-ai-agents/", what: "Usage/hybrid ~120% NRR vs ~110% sub-only", conf: "MEDIUM" }
  - { name: "Private Markets Insights — Vista", url: "https://www.privatemarketsinsights.com/post/vista-s-ai-playbook-building-the-software-transformation-factory", what: "In-house low-cost inference to protect portco margin", conf: "MEDIUM" }
  - { name: "Dealsuite", url: "https://www.dealsuite.com/en/blogs/unlocking-real-ai-value-a-due-diligence-guide-for-pe-investors", what: "AI-washing to 20–40% cuts; 73% lack moat (CB Insights)", conf: "MEDIUM" }
  - { name: "Oliver Wyman", url: "https://www.oliverwyman.com/our-expertise/insights/2026/apr/how-agentic-ai-reshaping-saas-valuations.html", what: "NRR masks seat contraction; disaggregate; use GRR", conf: "MEDIUM" }
---
<!-- api-docs-read: content article — citation hyperlinks only, no external API/protocol surface -->

## The two levers, and why operators confuse them

There are exactly two ways AI creates value in a software business, and they pull different levers. **Multiple expansion:** AI features that raise pricing power, retention, and addressable market, so the business earns a higher exit multiple. **Cost-out:** AI that deflects support tickets, lifts engineering throughput, and makes go-to-market cheaper. Confusing them is the most common operating-partner error — a chatbot that deflects tickets does nothing for your multiple, and a flashy copilot nobody pays more for does nothing for EBITDA.

The brutal baseline: McKinsey's State of AI 2025 found **more than 80% of organizations report no tangible EBIT impact from generative AI**, and only ~6% achieve more than 5% EBIT impact. The single biggest differentiator wasn't buying more AI — it was redesigning the workflow rather than bolting AI on top, yet only ~21% had redesigned any workflow ([McKinsey](https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai)).

## Lever 1 — AI as multiple expansion: pricing power, not features

The money is in changing the unit you sell from "access" to "work done." Intercom's Fin charges **$0.99 per ticket resolved** — not per seat — and scaled to nine-figure revenue ([Ibbaka](https://www.ibbaka.com/ibbaka-market-blog/comparing-the-value-model-and-pricing-model-of-intercoms-fin-ai-agent)). Why this moves the multiple: usage- and outcome-priced SaaS runs **~120% median net revenue retention versus ~110%** for subscription-only peers ([SaaS Mag](https://www.saasmag.com/how-saas-companies-monetizing-ai-agents/)). Higher NRR and consumption that grows with the customer are exactly the inputs a buyer pays a higher multiple for — but the premium is conditional on demonstrated economics, not a press release.

## Lever 2 — AI as cost-out: real, but messier than the demos

Support deflection is the most proven play, and Klarna is the headline: its AI assistant handled **two-thirds of chats in month one**, did the work of ~700 agents, and was projected to add ~$40M in profit ([Klarna](https://www.klarna.com/international/press/klarna-ai-assistant-handles-two-thirds-of-customer-service-chats-in-its-first-month/)). But read the second chapter: by 2025 Klarna **reversed course and re-hired humans** after the all-AI model degraded quality on disputes and fraud ([CX Dive](https://www.customerexperiencedive.com/news/klarna-reinvests-human-talent-customer-service-AI-chatbot/747586/)). Model deflection as a margin on routine tickets, not headcount-to-zero.

Engineering productivity is genuinely split — distrust anyone quoting only the good number. A large RCT (~4,800 developers) found GitHub Copilot users completed **~26% more pull requests** ([CACM](https://cacm.acm.org/research/measuring-github-copilots-impact-on-productivity/)). The contrarian case: METR's 2025 RCT found experienced developers were **19% slower** with AI on mature codebases — while believing they were 20% faster ([METR](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/)). Both are true: AI accelerates greenfield and junior work, drags on senior work in complex legacy systems. The perception gap is the trap.

<div class="ask">
  <span class="ask-label">Ask your CEO</span>
  <p>"Show me support cost per ticket and engineering cost per shipped feature, before and after AI, measured — not surveyed. If your only proof is that the team 'feels faster,' you have no proof."</p>
</div>

## The hidden tax: inference COGS is eating SaaS gross margin

Classic SaaS ran 78–82% gross margin. AI features carry a variable cost per use — inference — that flat per-seat pricing doesn't recover. **For every $1M of AI product revenue, roughly $230K can walk out as inference cost**, compressing post-AI gross margins into the 60–70% range ([The SaaS CFO](https://www.thesaascfo.com/your-ai-feature-is-quietly-destroying-your-gross-margin/)). This is why usage-based pricing isn't just a revenue play — it's a margin-defense play. Vista understood this well enough to build in-house lower-cost inference infrastructure for its portfolio ([Private Markets Insights](https://www.privatemarketsinsights.com/post/vista-s-ai-playbook-building-the-software-transformation-factory)).

<div class="ask">
  <span class="ask-label">The diligence box</span>
  <p>"If OpenAI doubled its API price tomorrow, what happens to this company's product and margin? What does it own that a competitor with a ChatGPT key can't ship in a weekend — proprietary data, a re-engineered workflow, or distribution?" No durable answer means you're paying an AI multiple for a wrapper.</p>
</div>

## The diligence test: real AI value vs. a thin GPT wrapper

The stakes are concrete: **AI-washing can trigger 20–40% valuation cuts during diligence**, and CB Insights pegs ~73% of AI startups as lacking a defensible moat ([Dealsuite](https://www.dealsuite.com/en/blogs/unlocking-real-ai-value-a-due-diligence-guide-for-pe-investors)). Firms with exclusive data and embedded workflow lock-in command roughly 9–12x ARR; pure API-reliant wrappers get 3–4x. And watch the metric games: net revenue retention can mask seat contraction hidden under AI add-on expansion — disaggregate by cohort and lean on gross revenue retention for near-term defensibility ([Oliver Wyman](https://www.oliverwyman.com/our-expertise/insights/2026/apr/how-agentic-ai-reshaping-saas-valuations.html)).

## What kills these initiatives

- **No workflow redesign.** Bolting AI onto an unchanged process is the ~80% that get zero EBIT. The redesign is the value, not the model.
- **Pricing AI on flat seat fees.** Adoption grows, inference cost grows, margin shrinks. You've monetized the upside to your vendor.
- **Believing self-reported productivity.** The METR perception gap — teams feel faster while shipping slower.
- **All-AI with no quality floor.** Klarna's reversal. Complex, high-stakes tickets still need humans.
- **A wrapper priced like a moat.** No proprietary data, full exposure to a foundation-model vendor — diligence cuts 20–40%.
