// What a reader sees (28 Nov 2026). The page JSON also holds logs and planning data that never render: the ICP review
// log, the search keyword, the source-claim check log and the live figure check record, and the EDGAR method and hit
// list under ownData. A check on what the page says must read only what renders: the stale-rule check read the
// sourceCheck log, so a log line saying "replaced SR 11-7 with SR 26-2" failed the page for citing SR 11-7.
// tests/check-gaps-2.test.mjs fails if the page template (src/components, src/pages, src/layouts) reads any field
// listed here, so a field that starts rendering has to come off this list, and the checks then read it.
export const NOT_RENDERED = ['reviews', 'keyword', 'sourceCheck', 'figureCheck'];
export const NOT_RENDERED_OWN_DATA = ['method', 'hitList'];

// The page with its unrendered fields removed; every other field, rendered or not, stays.
export function renderedFields(d) {
  const out = { ...d };
  for (const k of NOT_RENDERED) delete out[k];
  if (out.ownData && typeof out.ownData === 'object') {
    out.ownData = { ...out.ownData };
    for (const k of NOT_RENDERED_OWN_DATA) delete out.ownData[k];
  }
  return out;
}
