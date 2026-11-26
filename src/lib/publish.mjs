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
  return gate(d, { slug: page.id, siblings }).fail.length === 0;
}
