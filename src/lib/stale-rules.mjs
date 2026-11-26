// Superseded rules and guidance (26 Nov 2026). Pages cited SR 11-7 and two CFPB circulars as if current; the build
// thread fixed them by hand. Russell: "Make it so every fix is structual to templates so it doesnt reoccur". So the page
// check now fails any mention of a superseded document unless the same item (sentence, table row, source, FAQ) also
// names its replacement or says it was withdrawn. Add a line here whenever a cited rule is replaced or withdrawn.
export const STALE = [
  {
    name: 'SR 11-7 and the 2011 model risk guidance',
    // FIL-27-2021, the 2021 interagency statement on models for Bank Secrecy Act and anti-money laundering compliance,
    // was rescinded by the same FDIC letter (FIL-15-2026, read 26 Nov 2026; the build thread found it cited as current).
    re: /\bSR ?11-7\b|\bOCC Bulletin 2011-12\b|\bFIL-22-2017\b|\bFIL-27-2021\b|\bSR ?21-8\b|\bOCC Bulletin 1997-24\b/i,
    ok: /\bSR ?26-2\b|\b2026-13\b|\bFIL-15-2026\b|\breplac|\bsupersed|\brescind|\bwithdr|\bretired\b|\bno longer\b/i,
    why: 'replaced or rescinded on 17 Apr 2026 by SR 26-2 (OCC Bulletin 2026-13, FDIC FIL-15-2026)',
    source: 'https://www.federalreserve.gov/supervisionreg/srletters/SR2602.htm',
  },
  {
    name: 'CFPB circulars 2022-03, 2023-03 and 2024-06',
    re: /\bcirculars?\b[^.]{0,40}\b20(?:22-03|23-03|24-06)\b/i,
    ok: /\bwithdr|\brescind|\brevoked\b|\bno longer\b/i,
    why: 'withdrawn by the CFPB on 12 May 2025 (90 FR 20084)',
    source: 'https://www.federalregister.gov/documents/2025/05/12/2025-08286/interpretive-rules-policy-statements-and-advisory-opinions-withdrawal',
  },
  {
    // Build thread, PE and lending batch (26 Nov 2026); checked on the OCC's bulletin page the same day.
    name: "the OCC's 1998 Loan Portfolio Management booklet",
    re: /\bLoan Portfolio Management\b[^.]{0,40}\b(?:booklet|handbook)\b|\b(?:Comptroller's Handbook|OCC)\b[^.]{0,60}\bLoan Portfolio Management\b/,
    ok: /\b2026-29\b|Lending and Loan Portfolio Risk Management|\breplac|\bsupersed|\brescind|\bwithdr|\bno longer\b/i,
    why: 'rescinded on 25 Jun 2026 by OCC Bulletin 2026-29, which issued the "Lending and Loan Portfolio Risk Management" booklet',
    source: 'https://occ.treas.gov/news-issuances/bulletins/2026/bulletin-2026-29.html',
  },
  {
    // Still in force, but a replacement is proposed: a page citing it says so, so the reader isn't surprised.
    name: 'the 2023 interagency third-party risk guidance (FIL-29-2023)',
    re: /\bFIL-29-2023\b|\bOCC Bulletin 2023-17\b|\bSR ?23-4\b|\binteragency guidance on third-party relationships\b/i,
    ok: /\bpropos|\b2026-18859\b|\bFIL-58-2026\b|\breplac|\bcomment/i,
    why: 'proposed for replacement on 11 Sep 2026 (FDIC FIL-58-2026, Federal Register 2026-18859; comments due 16 Dec 2026)',
    fix: 'say a replacement was proposed in Sep 2026',
    // FIL-58-2026 confirmed on the FDIC's own page, read 26 Nov 2026.
    source: 'https://www.fdic.gov/news/financial-institution-letters/2026/proposed-interagency-third-party-risk-management-guidance',
  },
  {
    // SR 14-4's loan sampling scope was widened in 2021 to banks of $10B to $100B; the old $10B-$50B range is stale.
    name: "SR 14-4's old $10B-$50B scope",
    re: /\bSR ?14-4\b[^.]{0,80}\$?\s?10\s?(?:B|bn|billion)[^.]{0,20}\$?\s?50\s?(?:B|bn|billion)/i,
    ok: /\b2021\b|\bwas\b|\bonce\b|\buntil\b/i,
    why: 'revised on 6 Dec 2021 to cover banks with $10B to $100B in assets',
    source: 'https://www.federalreserve.gov/supervisionreg/srletters/sr1404.htm',
  },
];

// Each object's own text (all its string fields together), or a bare string in a list, is one item.
function* items(x, path = '') {
  if (typeof x === 'string') { yield [path, x]; return; }
  if (Array.isArray(x)) { for (let i = 0; i < x.length; i++) yield* items(x[i], `${path}[${i}]`); return; }
  if (x && typeof x === 'object') {
    const own = Object.entries(x).filter(([k, v]) => typeof v === 'string' && k !== 'url').map(([, v]) => v);
    // The page itself is not one item: its own strings (summary, description) are checked one by one.
    if (!path) { for (const [k, v] of Object.entries(x)) if (typeof v === 'string') yield [k, v]; }
    else if (own.length) yield [path, own.join(' ')];
    for (const [k, v] of Object.entries(x)) if (typeof v !== 'string') yield* items(v, `${path}.${k}`);
  }
}

export function staleProblems(d) {
  const out = [];
  const { reviews, keyword, ...page } = d;
  for (const [where, text] of items(page)) {
    for (const s of STALE) {
      const m = text.match(s.re);
      if (m && !s.ok.test(text)) out.push(`${where} cites ${m[0]} as current: ${s.name} was ${s.why}; ${s.fix || 'name the replacement or say it was withdrawn'}`);
    }
  }
  return out;
}
