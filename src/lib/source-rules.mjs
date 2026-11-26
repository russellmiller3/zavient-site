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
  return out;
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
