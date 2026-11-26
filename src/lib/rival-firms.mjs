// Rival consulting firms (26 Nov 2026). Launch dropped an Accenture marketplace listing from the insurance cost FAQ
// by hand, and a research doc proposed showing specialist firms' fee and retainer ranges. Russell's rules: the site
// wins him leads (it never sends buyers to a rival or prices a rival's service) and has no low-end rate content.
// Made structural (Russell: "Make it so every fix is structual to templates so it doesnt reoccur"): the page check
// fails a rival firm offered as an option or priced, and a fee range quoted for consultants, agencies or retainers.
// A firm's survey or study, cited as evidence ("Gartner expects", "in Deloitte's survey"), stays allowed: whether to
// keep big-firm sources at all is Russell's call (open as of 26 Nov 2026), not this check's.
// 26 Nov 2026 (PE batch): outsourced credit-analysis firms (Anaptyss, Evalueserve) and loan-review service firms added.
export const FIRMS = /\b(?:Accenture|Deloitte|McKinsey|BCG|Boston Consulting Group|Bain(?: & Company)?|PwC|PricewaterhouseCoopers|EY|Ernst & Young|KPMG|Capgemini|Cognizant|Infosys|Wipro|TCS|Tata Consultancy(?: Services)?|IBM Consulting|Genpact|Slalom|Booz Allen(?: Hamilton)?|Grant Thornton|RSM|BDO|Protiviti|Huron|Oliver Wyman|West Monroe|Thoughtworks|EPAM|Globant|HCLTech|Kearney|Alvarez & Marsal|Guidehouse|Anaptyss|Evalueserve)\b/;
const MONEY = /[$€£]\s?\d/;
const FEE = /\b(?:fees?|rates?|charges?|bills?|billing|retainers?|per (?:hour|day|month)|an hour|a day|day rate|engagements?|quotes?|priced?|costs?)\b/i;
// A fee range: $X to $Y, $X-$Y, $Xk-$Yk.
const RANGE = /[$€£]\s?\d[\d,.]*\s?[kKmM]?\s?(?:-|–|to)\s?[$€£]?\s?\d/;
// Who sells the service. "Firm" alone is left out: on this site it usually means the buyer's firm.
const SELLER = /\b(?:consultanc(?:y|ies)|consultants?|consulting firms?|ai (?:firms?|agenc(?:y|ies)|shops?)|agenc(?:y|ies) (?:fees?|rates?|retainers?)|development shops?|dev shops?|boutiques?|retainers?|specialist firms?|systems integrators?|integrators?|loan review (?:firms?|providers?|vendors?|services?|outsourcers?)|outsourced (?:credit|loan) (?:analysis|analysts?|review)(?: firms?| providers?| services?)?|credit analysis (?:firms?|providers?|outsourcers?))\b/i;
// Published government price-list ceilings are allowed, labelled as caps (memory: cost answers use them).
const GOV_CAP = /\b(?:price list|ceilings?|caps?|GSA|schedule|BLS|Bureau of Labor)\b/i;
const HIRE = new RegExp(String.raw`\b(?:hire|engage|retain|call in|bring in|go with|try|use|consider|ask)\s+(?:a firm like |firms like |firms such as |such as )?` + FIRMS.source);
const STUDY = /\b(?:19|20)\d\d\b|survey|study|report|index|pulse|trends|outlook|benchmark|research|panel|case|example/i;

const tidy = (t) => String(t).replace(/\[\^\d+\]/g, '').replace(/\s+/g, ' ').trim();
const sentences = (t) => tidy(t).split(/(?<=[.!?])\s+(?=[A-Z0-9"“(])/).filter(Boolean);
function* strings(x, path = '') {
  if (typeof x === 'string') yield [path, x];
  else if (Array.isArray(x)) for (let i = 0; i < x.length; i++) yield* strings(x[i], `${path}[${i}]`);
  else if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) if (k !== 'url') yield* strings(v, path ? `${path}.${k}` : k);
}

export function rivalProblems(d) {
  const out = [];
  // sourceCheck is the source-claim log ("fixed: cut the Anaptyss price"), not page text: it never counts (round 5).
  const { sources, reviews, keyword, sourceCheck, figureCheck, ...page } = d;
  for (const [where, text] of strings(page)) {
    for (const s of sentences(text)) {
      const firm = s.match(FIRMS)?.[0];
      if (firm && MONEY.test(s) && FEE.test(s)) out.push(`${where}: prices a rival firm (${firm}): drop it; the site never quotes a rival's fees: "${s.slice(0, 90)}"`);
      if (HIRE.test(s)) out.push(`${where}: sends the buyer to a rival firm: "${s.slice(0, 90)}"`);
      if (SELLER.test(s) && RANGE.test(s) && !GOV_CAP.test(s)) out.push(`${where}: quotes a fee range for consultants, agencies or retainers (rival or low-end rate content): "${s.slice(0, 90)}"`);
    }
  }
  // A table row or vendor row named after a rival firm is the firm offered as an option, unless it is labelled as
  // that firm's study ("McKinsey (2018)", "KPMG Global AI in Finance, 2026").
  (d.tables || []).forEach((t, i) => (t.rows || []).forEach((r, j) => {
    const firm = String(r.name || '').match(FIRMS)?.[0];
    if (firm && !STUDY.test(r.name)) out.push(`table ${i + 1} row ${j + 1} lists ${firm} as an option: a rival firm is never a row; cite its study instead, labelled with its year`);
  }));
  (d.pickElse || []).forEach((x, i) => {
    const s = tidy(x);
    if (FIRMS.test(s.split(/[:.]/)[0])) out.push(`pick-else ${i + 1} opens with a rival firm: the alternatives list never sends buyers to one`);
  });
  return out;
}
