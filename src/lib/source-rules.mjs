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
};
export const host = (url) => { try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; } };
// One problem per bad source, numbered as the page numbers its footnotes.
export function sourceProblems(sources = []) {
  const out = [];
  sources.forEach((s, i) => {
    const h = host(s.url);
    if (FORUM.test(h)) out.push(`source ${i + 1} is a forum thread (${h}): back the claim with a regulator, study, analyst or the vendor's own page, or cut it`);
    const weak = Object.keys(WEAK).find((d) => h === d || h.endsWith(`.${d}`));
    if (weak) out.push(`source ${i + 1} is a ${WEAK[weak]} (${h}): use a neutral source`);
  });
  return out;
}
