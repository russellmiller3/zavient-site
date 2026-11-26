// Source quality (26 Nov 2026). Today's fixes cut forum threads, rival consulting firms and content farms from the
// pages by hand (Reddit, Quora, Make's forum; rival AI consultancies quoting prices; SEO blogs). Russell: "Make it so
// every fix is structual to templates so it doesnt reoccur". So the page check now fails any listed source from these
// sites. Where a buyer's question was first seen goes in the draft notes, not in the source list (FAQ brief).
// Add a domain here the moment a fix removes it, so it can't come back.
export const FORUM = /(^|\.)(reddit\.com|quora\.com|stackexchange\.com|stackoverflow\.com)$|^(community|forum|forums)\./;
export const WEAK = {
  // Rival consulting firms and agencies, used for prices or definitions (never a neutral source on our own market)
  'ivconsulting.in': 'rival consulting firm', 'launchdayadvisors.com': 'rival consulting firm',
  'avolis.ai': 'rival consulting firm', 'thedataprism.com': 'rival consulting firm', 'opsiocloud.com': 'rival consulting firm',
  'dooza.ai': 'rival AI agency', 'morsa.ai': 'rival AI agency', 'ordana.ai': 'rival AI agency', 'slipperdigital.com': 'rival AI agency',
  // Content farms and SEO blogs
  'skillmammoth.com': 'content farm', 'meetalog.com': 'content farm', 'automationatlas.io': 'content farm',
  'learnsignal.com': 'SEO blog', 'corporatefinanceinstitute.com': 'SEO blog', 'genguardx.ai': 'SEO blog', 'risqly.io': 'SEO blog',
  'structify.ai': 'SEO blog',
  // Stat aggregators that list figures without a traceable origin (26 Nov 2026, PE batch): cite the study itself
  'brokerageaudit.com': 'stat aggregator with no traceable origin',
};
// A cached or archived copy is not the source (26 Nov 2026, PE batch: stale DealRoom and Midaxo prices). It shows the
// page as it once was, so a price or claim from it may be gone. Cite the live page, or drop the claim.
export const CACHE = /(^|\.)(web\.archive\.org|archive\.org|archive\.ph|archive\.today|archive\.is|archive\.li|webcache\.googleusercontent\.com|cachedview\.nl|cachedview\.com|ghostarchive\.org)$/;
// Round 5 (26 Nov 2026, build thread's flagged-figure checkers). Russell: "Make it so every fix is structual to
// templates so it doesnt reoccur".
// - A third-party copy of a report (an MIT report hosted on ictworks.org) is not the publisher's: cite the publisher's
//   own page. MIRROR lists hosts that re-host other people's documents; PUBLISHERS names a publisher and its domains,
//   so a source named for that publisher but on another site fails.
export const MIRROR = /(^|\.)(ictworks\.org|scribd\.com|slideshare\.net|docplayer\.net|studocu\.com|yumpu\.com|issuu\.com|dokumen\.pub|pdfcoffee\.com|documents\.pub|vdocuments\.(?:net|mx)|fliphtml5\.com|readkong\.com|coursehero\.com)$/;
export const PUBLISHERS = [
  [/^(?:MIT\b|Massachusetts Institute of Technology)/, ['mit.edu', 'edx.org']],
  [/^McKinsey\b/, ['mckinsey.com']], [/^(?:BCG|Boston Consulting Group)\b/, ['bcg.com']], [/^Bain\b/, ['bain.com']],
  [/^Deloitte\b/, ['deloitte.com']], [/^PwC\b/, ['pwc.com']], [/^KPMG\b/, ['kpmg.com']], [/^(?:EY|Ernst & Young)\b/, ['ey.com']],
  [/^Accenture\b/, ['accenture.com']], [/^Gartner\b/, ['gartner.com']], [/^Forrester\b/, ['forrester.com']],
  [/^Stanford\b/, ['stanford.edu']], [/^(?:Harvard Business Review|HBR)\b/, ['hbr.org']], [/^NBER\b|^National Bureau of Economic Research/, ['nber.org']],
  [/^(?:Federal Reserve Board|Board of Governors of the Federal Reserve)/, ['federalreserve.gov']], [/^FDIC\b/, ['fdic.gov']], [/^OCC\b|^Office of the Comptroller/, ['occ.gov', 'occ.treas.gov']],
  [/^(?:SEC|Securities and Exchange Commission)\b/, ['sec.gov']], [/^(?:CFPB|Consumer Financial Protection Bureau)\b/, ['consumerfinance.gov', 'cfpb.gov']],
  [/^(?:US Census Bureau|Census Bureau)\b/, ['census.gov']], [/^(?:BLS|Bureau of Labor Statistics|US Bureau of Labor Statistics)\b/, ['bls.gov']],
  [/^NIST\b/, ['nist.gov']], [/^OECD\b/, ['oecd.org']], [/^(?:IMF|International Monetary Fund)\b/, ['imf.org']], [/^World Bank\b/, ['worldbank.org']],
  [/^NAIC\b/, ['naic.org']], [/^AICPA\b/, ['aicpa-cima.com', 'aicpa.org']],
];
// A name that says the copy is someone else's is fine only when the note says why the publisher's own copy isn't used.
const OWN_COPY_GONE = /\b(?:commissioned by|publisher (?:no longer|does not|doesn't) (?:host|publish)|no publisher copy|only copy online|as reported by|reported by|via\b)/i;
export function mirrorProblems(sources = []) {
  const out = [];
  sources.forEach((s, i) => {
    const h = host(s.url);
    if (!h || String(s.url).startsWith('/')) return;
    if (MIRROR.test(h)) { out.push(`source ${i + 1} is a third-party copy (${h}): cite the publisher's own page`); return; }
    const pub = PUBLISHERS.find(([re]) => re.test(String(s.name || '').trim()));
    // The publisher's own site in any country (deloitte.nl, bain.cn), or a government host (a filing on regulations.gov).
    const own = (d) => h === d || h.endsWith(`.${d}`) || h.split('.').slice(-2)[0] === d.split('.')[0] || h.split('.').slice(-3)[0] === d.split('.')[0];
    if (pub && !pub[1].some(own) && !/\.gov$|\.mil$/.test(h) && !OWN_COPY_GONE.test(`${s.name} ${s.what || ''}`)) out.push(`source ${i + 1} is named for ${String(s.name).match(pub[0])[0]} but is on ${h}: cite the publisher's own copy, or name the site that wrote it`);
  });
  return out;
}

// - The same page listed twice (build thread found duplicate source URLs): one source per page, cited where needed.
export const urlKey = (url) => {
  try {
    const u = new URL(url);
    for (const k of [...u.searchParams.keys()]) if (/^(?:utm_\w+|gclid|fbclid|ref|source)$/i.test(k)) u.searchParams.delete(k);
    return `${u.hostname.replace(/^www\./, '').toLowerCase()}${u.pathname.replace(/\/+$/, '')}${u.search}`;
  } catch { return String(url).trim(); } // our own pages ("/industries/x.html#own-data") keep their anchor
};
export function duplicateProblems(sources = []) {
  const seen = new Map(); const out = [];
  sources.forEach((s, i) => { if (String(s.url).startsWith('/')) return; // two of our own datasets may sit on one page
    const k = urlKey(s.url); if (seen.has(k)) out.push(`sources ${seen.get(k) + 1} and ${i + 1} are the same page (${k}): list it once and cite that one`); else seen.set(k, i); });
  return out;
}

// - A URL that carries one date and a note that prints another (a map's URL says 14 Nov, the document says 13 Nov):
//   say which is the document's own date. Read dates ("Read 26 Nov 2026") don't count.
const MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
export function urlDate(url) {
  const m = String(url).match(/(?:^|[^\d])(20\d\d)[/_-]?(0[1-9]|1[0-2])[/_-]?(0[1-9]|[12]\d|3[01])(?!\d)/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}
export function printedDates(text) {
  const t = String(text).replace(/\bRead:?\s*(?:on\s)?(?:\d{4}-\d{2}-\d{2}|\d{1,2}\s[A-Za-z]{3,9}\.?\s\d{4})/gi, ' ');
  const out = [];
  for (const m of t.matchAll(/\b(20\d\d)-(0[1-9]|1[0-2])-([0-2]\d|3[01])\b/g)) out.push(`${m[1]}-${m[2]}-${m[3]}`);
  for (const m of t.matchAll(/\b(\d{1,2})\s([A-Za-z]{3})[a-z]*\.?,?\s(20\d\d)\b/g)) if (MON[m[2].toLowerCase()]) out.push(`${m[3]}-${String(MON[m[2].toLowerCase()]).padStart(2, '0')}-${m[1].padStart(2, '0')}`);
  for (const m of t.matchAll(/\b([A-Za-z]{3})[a-z]*\.?\s(\d{1,2}),\s(20\d\d)\b/g)) if (MON[m[1].toLowerCase()]) out.push(`${m[3]}-${String(MON[m[1].toLowerCase()]).padStart(2, '0')}-${m[2].padStart(2, '0')}`);
  return out;
}
export function dateProblems(sources = []) {
  const out = [];
  sources.forEach((s, i) => {
    const u = urlDate(s.url);
    if (!u) return;
    const printed = printedDates(`${s.name || ''} ${s.what || ''}`);
    const near = printed.filter((p) => Math.abs(Date.parse(p) - Date.parse(u)) <= 31 * 864e5);
    if (near.length && !near.includes(u) && !/\bURL (?:date|dated|says)\b/i.test(s.what || '')) out.push(`source ${i + 1}'s URL is dated ${u} but its note prints ${near[0]}: check the document's own date, use it, and say "URL dated ${u}" if they differ`);
  });
  return out;
}

export const host = (url) => { try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; } };
// One problem per bad source, numbered as the page numbers its footnotes.
export function sourceProblems(sources = []) {
  const out = [];
  sources.forEach((s, i) => {
    const h = host(s.url);
    if (FORUM.test(h)) out.push(`source ${i + 1} is a forum thread (${h}): back the claim with a regulator, study, analyst or the vendor's own page, or cut it`);
    const weak = Object.keys(WEAK).find((d) => h === d || h.endsWith(`.${d}`));
    if (weak) out.push(`source ${i + 1} is a ${WEAK[weak]} (${h}): use a neutral source`);
    if (CACHE.test(h)) out.push(`source ${i + 1} is a cached or archived copy (${h}): cite the live page, or drop the claim if the live page no longer says it`);
  });
  return [...out, ...duplicateProblems(sources), ...dateProblems(sources)];
}

// A search-results page is not a source (26 Nov 2026 hand fix, made structural): it shows whatever ranks today, not the
// claim. Cite the page the result leads to. Government price-list queries (GSA's buy.gsa.gov pricing tool) are the
// data itself, not a search engine, so only search engines and site-search paths fail.
const SEARCH_ENGINE = /(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com|search\.yahoo\.com|yandex\.[a-z]+|baidu\.com|perplexity\.ai)$/;
export function searchResultProblems(sources = []) {
  const out = [];
  sources.forEach((s, i) => {
    let u;
    try { u = new URL(s.url); } catch { return; }
    const h = u.hostname.replace(/^www\./, '').toLowerCase();
    const engine = SEARCH_ENGINE.test(h) && (/\/search\b/.test(u.pathname) || u.searchParams.has('q'));
    const siteSearch = /\/search\/?$|\/search\.(?:html?|aspx?|php)$/i.test(u.pathname) && [...u.searchParams.keys()].some((k) => /^(q|query|s|search|keywords?|term)$/i.test(k));
    if (engine || siteSearch) out.push(`source ${i + 1} is a search-results page (${h}${u.pathname}): cite the page the result leads to`);
  });
  return out;
}
