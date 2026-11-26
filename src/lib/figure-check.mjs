// Live figure-check record (round 5, 26 Nov 2026). The build thread found figures that passed the note check but were
// not in the source (an Ivans 98% on the page for another claim, an Accenture case figure cited as a survey figure,
// a count taken from an exhibit). Russell: "Make it so every fix is structual to templates so it doesnt reoccur".
// The live check needs the network, so the build can't run it; instead `scripts/check-source-figures.mjs --write`
// records its result on the page as figureCheck, and the page check reads that record:
// - the record exists and is no older than the page's updated date (rerun it after any edit);
// - no figure is listed as not found, and no cited URL redirects;
// - every figure the script couldn't confirm (unreadable source, or found but not near the claim) carries the
//   source's own sentence in byHand[].quote, with the figure in it, copied by the person who opened it.
// Pages written before this rule are in FIGURE_CHECK_PENDING (with the 4 that went live while it was built, 0c55992). That list only shrinks: take a page off when its
// record is in; never add one.
export const FIGURE_CHECK_PENDING = new Set(('account-reconciliation-automation accounting-firms ai-adoption-change-management ai-credit-memo-spreading ai-due-diligence ai-loan-review ' +
  'ai-agent-development-services ai-automation-consulting ai-claims-processing ai-collections ai-credit-scoring ai-construction-estimating ' +
  'ai-consulting-services ai-consulting-small-business ai-demand-forecasting ai-document-processing ai-for-operations-leaders ' +
  'ai-governance-consulting ai-implementation-services ai-integration-services ai-inventory-management ai-invoice-processing ' +
  'ai-policy-generator ai-post-merger-integration ai-predictive-maintenance ai-procurement ai-production-scheduling ' +
  'ai-project-cost-estimator ai-roadmap-builder ai-roi-calculator ai-strategy-consulting ai-training-for-employees ' +
  'ai-training-plan ai-underwriting ai-use-case-finder ai-value-creation-plan build-vs-buy-ai ' +
  'chatgpt-plus-vs-business-vs-enterprise chatgpt-vs-claude-vs-copilot-for-work community-banks-credit-unions construction ' +
  'custom-ai-solutions data-analytics-consulting fractional-chief-ai-officer generative-ai-consulting ' +
  'generative-ai-vs-predictive-ai hire-ai-engineer holding-companies-roll-ups insurance insurance-agencies law-firms machine-learning-consulting ' +
  'manufacturing multi-entity-close private-credit-portfolio-monitoring private-equity professional-services ' +
  'rpa-vs-agentic-automation sales-analytics supply-chain-logistics wealth-management zapier-vs-make-vs-workato').split(' '));

const norm = (s) => String(s).toLowerCase().replace(/[\s,]+/g, '');
export function figureCheckProblems(d, slug) {
  const fc = d.figureCheck;
  if (!fc) return FIGURE_CHECK_PENDING.has(slug) ? [] : ['no live figure check: run NODE_USE_ENV_PROXY=1 node scripts/check-source-figures.mjs <page> --write'];
  const out = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fc.date || '') || (d.updated && fc.date < d.updated)) out.push(`live figure check (${fc.date}) is older than the page (${d.updated}): run it again with --write`);
  for (const n of fc.notFound || []) out.push(`figure not on its source's page: ${n}: fix the figure or the source`);
  for (const r of fc.redirects || []) out.push(`source URL redirects (${r}): cite the page it lands on`);
  for (const b of fc.byHand || []) {
    const fig = String(b.figure).replace(/^(?:about|nearly|over|more than|under|up to)\s+/i, '');
    if (!b.quote) out.push(`${b.where}: ${b.figure} needs the source's own sentence in figureCheck.byHand quote (${b.why})`);
    else if (!/twice|times|double|triple|to 1/i.test(fig) && !norm(b.quote).includes(norm(fig).replace(/^(?:[$€£])/, '')) && !norm(b.quote).includes(norm(fig).replace(/%$/, ''))) out.push(`${b.where}: the quote given for ${b.figure} doesn't contain it`);
  }
  return out;
}
