// Should a page be indexed? (26 Nov 2026)
// Pages built before the golden templates (no templateVersion) keep their own index flag.
// Golden-template pages are indexed only when index is true AND they pass the publish gate in scripts/check-page.mjs
// (the site architecture doc's gate: measured demand, a fact only Zavient has, a fact its siblings lack, 10+ sources,
// a verdict, the ICP reviews in order). A page that fails renders noindex, follow and stays out of the sitemap.
import { gate } from '../../scripts/check-page.mjs';

// pages: the aiwork collection entries ({ id, data }).
export function indexed(page, pages) {
  const d = page.data;
  if (!d.index) return false;
  if (!d.templateVersion) return true;
  const siblings = pages.map((p) => ({ ...p.data, _slug: p.id }));
  // Round 6 (26 Nov 2026): a page marked index that fails the gate here used to render noindex in silence, and once
  // passed scripts/check-page.mjs while failing here (ai-procurement). Now the build stops and names the reasons, so
  // the page check and the build can never disagree without a red build.
  const { fail } = gate(d, { slug: page.id, siblings });
  if (fail.length) throw new Error(`${page.id} is marked index but fails the publish gate in the build:\n  - ${fail.join('\n  - ')}\nRun node scripts/check-page.mjs ${page.id} --indexed; if it passes there, the two disagree: fix the check so they match.`);
  return true;
}
