// Acronym rule (26 Nov 2026). Russell's standing rule: no undefined shorthand; spell out every acronym on first use.
// The build thread hand-fixed "EPM suite" on multi-entity-close. This makes it structural: a page that uses one of
// these business-jargon acronyms must spell it out somewhere on the page, as "Full name (ACR)", "ACR (full name)"
// or the full name itself. Add new jargon here when a page uses it; the page check then holds every page to it.
// Organisation and product names (NIST, KPMG, SAP) are names, not jargon, and are left to the reviewers.
export const KNOWN = new Set('AI US UK EU CEO CFO COO IT HR PDF FAQ ID GB MB NYC DC UN TV PC'.split(' '));

export const JARGON = {
  ADMT: 'automated decision-making technology', AML: 'anti-money laundering', AP: 'accounts payable', API: 'application programming interface',
  AR: 'accounts receivable', AUC: 'area under the curve', B2B: 'business-to-business', BI: 'business intelligence',
  CCPA: 'California Consumer Privacy Act', CIO: 'chief information officer', CMO: 'chief marketing officer',
  CNC: 'computer numerical control', CPA: 'certified public accountant', CRM: 'customer relationship management', DLP: 'data loss prevention',
  EPM: 'enterprise performance management', ERP: 'enterprise resource planning', GDPR: 'General Data Protection Regulation', GM: 'general manager',
  HIPAA: 'Health Insurance Portability and Accountability Act', KPI: 'key performance indicator', KYC: 'know your customer',
  LLM: 'large language model', MAPE: 'mean absolute percentage error', MGA: 'managing general agent', ML: 'machine learning',
  MRO: 'maintenance, repair and operations', MRP: 'material requirements planning', NLP: 'natural language processing',
  OCR: 'optical character recognition', 'O&M': 'operations and maintenance', 'P&L': 'profit and loss', PO: 'purchase order',
  QA: 'quality assurance', 'R&D': 'research and development', RFP: 'request for proposal',
  RMF: 'Risk Management Framework', ROI: 'return on investment', RPA: 'robotic process automation', 'S&OP': 'sales and operations planning',
  SIEM: 'security information and event management', SLA: 'service-level agreement', SOC: 'System and Organization Controls',
  SOX: 'Sarbanes-Oxley', TPA: 'third-party administrator', UI: 'user interface', VAT: 'value-added tax', WAPE: 'weighted absolute percentage error',
  // Added 26 Nov 2026 from the build thread's insurance and PE batches
  AMS: 'agency management system', DFS: 'Department of Financial Services', 'E&O': 'errors and omissions',
  FCC: 'Federal Communications Commission', NAIC: 'National Association of Insurance Commissioners',
  SEC: 'Securities and Exchange Commission', TCPA: 'Telephone Consumer Protection Act',
  // Added 28 Nov 2026: the OCC (Bulletin 2026-54) and NCUA now call AI "super intelligence (SI)". Four bank pages used
  // SI with its only spelling-out in a source note, which a reader of the page never sees next to the text.
  SI: 'super intelligence',
};

const esc = (s) => s.replace(/[&]/g, '\\&');
// Product names that contain a jargon acronym but are names, not shorthand.
const PRODUCTS = /\bPower BI\b/g;
// Body text: what a reader sees in the page itself. Not body text (28 Nov 2026, the "SI" miss): the source list and
// footnotes, the source note under each key number, and the logs and planning data that never render (reviews,
// keyword, sourceCheck, figureCheck, differs, ownData.method and ownData.hitList). An acronym spelled out only in
// one of these is still undefined where the reader meets it. URLs are dropped too.
export function readerText(d) {
  const { sources, reviews, keyword, sourceCheck, figureCheck, differs, ...rest } = d;
  if (rest.stats) rest.stats = rest.stats.map(({ source, ...s }) => s);
  if (rest.ownData) { const { method, hitList, ...o } = rest.ownData; rest.ownData = o; }
  return JSON.stringify(rest).replace(/https?:\/\/[^"\s]+/g, '').replace(/\\"/g, '"').replace(PRODUCTS, '');
}

export function acronymProblems(d) {
  const t = readerText(d);
  const out = [];
  for (const [a, full] of Object.entries(JARGON)) {
    // A hyphen-joined name ("UI-CUBE") is a name, not the acronym on its own.
    if (!new RegExp(`(?<![A-Za-z0-9&-])${esc(a)}s?(?![A-Za-z0-9&-])`).test(t)) continue;
    // Spelled out: "full name (ACR)" or "(ACR, ...)" after it, "ACR (full name)", or "ACR measures / means / stands for / , a ..." in a defining phrase.
    const defined = new RegExp(`\\(${esc(a)}s?[),]|(?<![A-Za-z0-9&])${esc(a)}s? \\([a-z]|(?<![A-Za-z0-9&])${esc(a)}s?(?:,? (?:measures|means|is short for|stands for)\\b|, an? [a-z])`);
    const spelled = defined.test(t) || t.toLowerCase().includes(full.toLowerCase());
    if (!spelled) out.push(`"${a}" is never spelled out on the page: write "${full} (${a})" the first time`);
  }
  return out;
}
