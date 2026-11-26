---
title: "The Cross-Portfolio AI Playbook: Triage, Prove, Scale"
description: "How top PE firms operationalize AI across a whole portfolio — triage portcos, prove on a fraction with a control group, then turn one win into a shared asset."
dek: "Most \"portfolio AI strategies\" are a logo slide and a vendor MOU. The firms actually moving EBITDA treat the portfolio — not the portco — as the unit of value creation: triage which companies matter, prove one bet against a control group, then turn the win into a playbook every other company inherits for free."
tag: "Flagship · Portfolio Strategy"
flagship: true
order: 1
blurb: "Triage which portcos matter, prove one bet against a control group, then turn the win into a shared asset the whole book inherits."
ctaHeading: "Send me your portfolio and the metric you want to move."
ctaBlurb: "I'll tell you which companies are AI-central, where the first provable bet is, and whether an engagement is worth it."
ctaSubject: "Cross-Portfolio AI"
stats:
  - { num: "95%", label: "GenAI pilots with zero measurable P&L impact (MIT, 2025)" }
  - { num: "~20%", label: "Portcos that have operationalized GenAI (Bain, $3.2T AUM)" }
  - { num: "86%", label: "M&A orgs using GenAI in deal workflows (Deloitte)" }
  - { num: "30–40%", label: "Diligence timeline compression from AI (Bain)" }
sources:
  - { name: "Bain Global PE Report 2025", url: "https://www.bain.com/insights/field-notes-from-generative-ai-insurgency-global-private-equity-report-2025/", what: "$3.2T AUM survey; ~20% of portcos operationalized GenAI; Vista 80% deploying / 30% coding gains; diligence −30–40%", conf: "STRONG" }
  - { name: "MIT NANDA (via Fortune)", url: "https://fortune.com/2025/08/21/an-mit-report-that-95-of-ai-pilots-fail-spooked-investors-but-the-reason-why-those-pilots-failed-is-what-should-make-the-c-suite-anxious/", what: "95% of pilots zero P&L; the surviving 5% used baselining + holdouts + portfolio discipline", conf: "STRONG" }
  - { name: "Blackstone Data Science", url: "https://www.blackstone.com/data-science/", what: "Renaissance Learning 2x AOV; Liftoff +10% revenue; performative pilots never show up in EBITDA", conf: "MEDIUM" }
  - { name: "Blackstone — AI at Scale", url: "https://www.blackstone.com/insights/article/ai-at-scale-a-conversation-with-blackstones-cto-and-global-head-of-the-operating-team/", what: "Three-bucket triage; CEO ownership + clear ROI + scale-from-day-one", conf: "MEDIUM" }
  - { name: "KKR Capstone (Umbrex)", url: "https://umbrex.com/resources/private-equity-operating-partner-groups/private-equity-operating-partner-kkr-capstone/", what: "Cross-portfolio synergies mandate; 225+ businesses; codified playbooks + conversational agents", conf: "MEDIUM" }
  - { name: "Art of Procurement — KKR GPO", url: "https://artofprocurement.com/blog/podcast-gpos-value-drivers-private-equity-procurement-kkr", what: "GPO leverage across 230+ portcos / $500B+ AUM; run-rate EBITDA vs. baseline", conf: "MEDIUM" }
  - { name: "Hg — Driving AI Transformation", url: "https://hgcapital.com/approach/driving-ai-transformation", what: "100+ AI experts; 60+ portco ecosystem; shared templates and benchmarks", conf: "MEDIUM" }
  - { name: "Hg — Catalyst incubator", url: "https://hgcapital.com/insights/hg-launches-catalyst-a-new-ai-incubator", what: "Tiger teams; 100+ AI products shipped; build time 9 months to under 3", conf: "MEDIUM" }
  - { name: "Vista — Agentic AI Factory", url: "https://www.vistaequitypartners.com/insights/agentic-ai-factory/", what: "AI Factory on Azure/Google/AWS; cloud-price discounts; AI-velocity scoring tied to capital allocation", conf: "MEDIUM" }
  - { name: "Thoma Bravo + Google Cloud", url: "https://www.thomabravo.com/press-releases/thoma-bravo-and-google-cloud-launch-strategic-partnership-to-deliver-on-the-promise-of-ai-for-enterprise-software", what: "Firm-level vendor deal; $180B+ AUM portfolio embeds Google models", conf: "MEDIUM" }
  - { name: "EQT — Motherbrain", url: "https://eqtgroup.com/about/motherbrain", what: "First AI patent in PE; screens 50M+ companies for sourcing and bolt-ons", conf: "MEDIUM" }
  - { name: "McKinsey — GenAI in private markets", url: "https://www.mckinsey.com/industries/private-capital/our-insights/harnessing-the-power-of-gen-ai-in-private-markets", what: "Value-creation plans focus on 2–3 use cases per company", conf: "STRONG" }
  - { name: "Deloitte — 2025 M&A GenAI Study", url: "https://www.deloitte.com/us/en/what-we-do/capabilities/mergers-acquisitions-restructuring/articles/m-and-a-generative-ai-study.html", what: "86% use GenAI in M&A; 35% in target screening/diligence", conf: "STRONG" }
---
<!-- api-docs-read: content article — citation hyperlinks only, no external API/protocol surface -->

## The unit is the portfolio, not the company

The cheap version of "AI value creation" is 40 portcos each hiring a consultant and running a pilot. The expensive-but-real version pools the work: one team finds a bet, proves it once, and ships it across the book so company #2 through #40 pay zero discovery cost.

KKR is the cleanest example. Its Capstone operating team explicitly names cross-portfolio synergies as the mandate — codifying a win in one company into a repeatable playbook deployed across **225+ businesses**, with conversational agents that recommend pricing or lean-manufacturing tactics learned from prior engagements ([Umbrex profile of KKR Capstone](https://umbrex.com/resources/private-equity-operating-partner-groups/private-equity-operating-partner-kkr-capstone/)). Hg runs the same logic in software: **60+ portfolio companies** treated as one of the largest software ecosystems deploying AI at scale ([Hg](https://hgcapital.com/approach/driving-ai-transformation)).

The thesis is simple: **discovery is the expensive part.** A firm that pays it once and reuses it 40 times beats a firm that pays it 40 times. That arbitrage *is* the program.

## Stage 1 — Triage: not every portco gets AI, and that's the point

The first discipline is saying no. Blackstone sorts its book into **three buckets: AI is central, AI is meaningful upside, or AI is immaterial** — and only the first two get serious operating attention ([Blackstone](https://www.blackstone.com/insights/article/ai-at-scale-a-conversation-with-blackstones-cto-and-global-head-of-the-operating-team/)). Vista goes further and weaponizes the triage: it now scores every portfolio company on AI-adoption velocity and ties that score to future capital allocation ([Vista](https://www.vistaequitypartners.com/insights/agentic-ai-factory/)).

McKinsey's independent read backs the discipline: winning value-creation plans identify **two to three high-impact use cases per company**, not a sprawling "digital transformation" ([McKinsey](https://www.mckinsey.com/industries/private-capital/our-insights/harnessing-the-power-of-gen-ai-in-private-markets)). Spreading a thin AI budget across 40 companies produces 40 performative pilots and zero P&L. Concentrating it on the 8 where AI is central produces wins big enough to measure.

<div class="ask">
  <span class="ask-label">Ask your value-creation team</span>
  <p>"Show me the portfolio scored into AI-central, AI-upside, and AI-immaterial. How much of the AI budget went to the bottom bucket? If the answer is 'some,' we're funding theater."</p>
</div>

## Stage 2 — Prove on a fraction, with a control group

This is the section every "AI strategy" skips and the one that separates the 5% from the 95%. MIT's 2025 NANDA study found **95% of enterprise GenAI pilots delivered zero measurable P&L impact** despite $30–40B spent — and the surviving 5% did the unglamorous work of baselining, holdouts, total-cost transparency, and portfolio discipline ([MIT NANDA via Fortune](https://fortune.com/2025/08/21/an-mit-report-that-95-of-ai-pilots-fail-spooked-investors-but-the-reason-why-those-pilots-failed-is-what-should-make-the-c-suite-anxious/)). Holdouts means a control group. No control, no proof.

Blackstone's own examples show the shape when it works: at Renaissance Learning, a lead-gen model **doubled average order value**; at Liftoff, AI pricing and bidding drove a **10% revenue increase** — and Blackstone is blunt that "too many companies run performative pilots that never show up in EBITDA" ([Blackstone Data Science](https://www.blackstone.com/data-science/)). Bain's survey of investors managing **$3.2T AUM** found only ~20% of portfolio companies have operationalized GenAI with concrete results ([Bain Global PE Report 2025](https://www.bain.com/insights/field-notes-from-generative-ai-insurgency-global-private-equity-report-2025/)).

The discipline: baseline the metric, run the bet on a fraction of accounts, reps, or regions, hold the rest as control, read the delta. **If you can't see it against the control, it didn't happen.**

<div class="ask">
  <span class="ask-label">Ask your value-creation team</span>
  <p>"For our flagship AI bet: what was the baseline, what fraction did we run it on, and what was the held-out control? If there's no control group, the result is a vibe, not a number."</p>
</div>

## Stage 3 — Roll out: turn one proven bet into a portfolio asset

Once a bet clears the control group, the value-creation team's job is replication, not reinvention. Hg's Catalyst incubator embeds tiger teams inside portcos and has shipped **100+ AI products across the portfolio**, compressing product build time from nine months to under three ([Hg Catalyst](https://hgcapital.com/insights/hg-launches-catalyst-a-new-ai-incubator)). Hg's value-creation team is **100+ AI experts** — a shared resource no single portco could afford alone ([Hg](https://hgcapital.com/approach/driving-ai-transformation)).

Vista's Agentic AI Factory is the same move at the infrastructure layer: built on Azure, Google, and AWS partnerships, it gives portcos priority tooling and exclusive cloud-pricing discounts — Vista reports **80% of portfolio companies deploying GenAI** ([Bain](https://www.bain.com/insights/field-notes-from-generative-ai-insurgency-global-private-equity-report-2025/)). Treat the firm-reported headline numbers as exactly that — but the structural pattern is well-corroborated.

## Stage 4 — Shared leverage: the portfolio's quiet edge

The most under-discussed play isn't a model — it's buying power. KKR's Capstone uses group-purchasing organizations to consolidate demand across **230+ portcos and $500B+ AUM** ([Art of Procurement](https://artofprocurement.com/blog/podcast-gpos-value-drivers-private-equity-procurement-kkr)). Apply that to AI: one negotiated rate for the model API, the data platform, and the dev-tools license, across the whole book. Thoma Bravo's Google Cloud partnership is the explicit version — a firm-level deal letting **$180B+ AUM** of enterprise-software portcos embed Google's models at negotiated terms ([Thoma Bravo](https://www.thomabravo.com/press-releases/thoma-bravo-and-google-cloud-launch-strategic-partnership-to-deliver-on-the-promise-of-ai-for-enterprise-software)).

## Stage 5 — AI in diligence and the exit narrative

The playbook bookends the hold. On entry, Deloitte's 2025 study found **86% of M&A organizations now use GenAI in deal workflows** and 35% in target screening and diligence; Bain notes AI-assisted diligence can compress timelines 30–40% ([Deloitte](https://www.deloitte.com/us/en/what-we-do/capabilities/mergers-acquisitions-restructuring/articles/m-and-a-generative-ai-study.html)). EQT's Motherbrain platform — the firm holds the first AI patent in PE — screens **50M+ companies** to source targets and bolt-ons ([EQT](https://eqtgroup.com/about/motherbrain)).

On exit, the proven AI program becomes the story. The skeptic's caveat: a roadmap is not realized EBITDA. **A control-group-proven, replicated win underwrites the multiple; a deck of pilots does not.**

## What kills these programs

- **Performative pilots with no holdout.** No control group = no proof = it never shows up in EBITDA. The single most common killer.
- **Spreading the budget evenly.** Funding the AI-immaterial bucket starves the AI-central bucket. Triage exists to be acted on.
- **Reinventing per portco.** If the second deployment costs as much as the first, you have 40 projects, not a portfolio asset.
- **Buying tech before deciding how to capture value.** MIT's literal diagnosis — tools bought before defining the P&L line to move.
- **No CEO ownership.** Blackstone names CEO-level ownership as a precondition; delegated-to-IT pilots stall.
- **Roadmap-as-exit-story with nothing realized.** Buyers — and diligence AI — increasingly see through a deck of pilots.
