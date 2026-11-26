// Superseded rules and guidance (26 Nov 2026). Pages cited SR 11-7 and two CFPB circulars as if current; the build
// thread fixed them by hand. Russell: "Make it so every fix is structual to templates so it doesnt reoccur". So the page
// check now fails any mention of a superseded document unless the same item (sentence, table row, source, FAQ) also
// names its replacement or says it was withdrawn. Add a line here whenever a cited rule is replaced or withdrawn.
export const STALE = [
  {
    name: 'SR 11-7 and the 2011 model risk guidance',
    re: /\bSR ?11-7\b|\bOCC Bulletin 2011-12\b|\bFIL-22-2017\b|\bSR ?21-8\b|\bOCC Bulletin 1997-24\b/i,
    ok: /\bSR ?26-2\b|\b2026-13\b|\bFIL-15-2026\b|\breplac|\bsupersed|\brescind|\bwithdr|\bretired\b|\bno longer\b/i,
    why: 'replaced on 17 Apr 2026 by SR 26-2 (OCC Bulletin 2026-13, FDIC FIL-15-2026)',
    source: 'https://www.federalreserve.gov/supervisionreg/srletters/SR2602.htm',
  },
  {
    name: 'CFPB circulars 2022-03, 2023-03 and 2024-06',
    re: /\bcirculars?\b[^.]{0,40}\b20(?:22-03|23-03|24-06)\b/i,
    ok: /\bwithdr|\brescind|\brevoked\b|\bno longer\b/i,
    why: 'withdrawn by the CFPB on 12 May 2025 (90 FR 20084)',
    source: 'https://www.federalregister.gov/documents/2025/05/12/2025-08286/interpretive-rules-policy-statements-and-advisory-opinions-withdrawal',
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
      if (m && !s.ok.test(text)) out.push(`${where} cites ${m[0]} as current: ${s.name} was ${s.why}; name the replacement or say it was withdrawn`);
    }
  }
  return out;
}
