// Every AI-work page with its address and render props (26 Nov 2026). Two route files build from this list:
// src/pages/ai-work/[slug].astro (one level under /ai-work/: legacy pages and work playbooks) and
// src/pages/[...route].astro (every other folder: crossings, industry hubs, role pages, consulting, rules, tools, guides).
// Addresses come from routeFor in src/lib/page-types.mjs, so links between pages always match where pages are built.
import { getCollection } from 'astro:content';
import { routeFor, urlFor } from './page-types.mjs';
import { indexed } from './publish.mjs';

export async function aiWorkRoutes() {
  const pages = await getCollection('aiwork');
  const byId = Object.fromEntries(pages.map((p) => [p.id, p.data]));
  const urls: Record<string, string> = Object.fromEntries(pages.map((p) => [p.id, urlFor(p.data, p.id)]));
  return pages.map((page) => ({
    route: routeFor(page.data, page.id),
    props: {
      page,
      urls,
      url: urls[page.id],
      isIndexed: indexed(page, pages),
      related: page.data.related.filter((r) => byId[r]).map((r) => ({ id: r, title: byId[r].title, url: urls[r] })),
      spokes: page.data.spokes.filter((s) => byId[s.slug]).map((s) => ({ ...s, title: byId[s.slug].title, url: urls[s.slug] })),
    },
  }));
}

// Routes one level under /ai-work/ are built by src/pages/ai-work/[slug].astro; everything else by [...route].astro.
export const underAiWork = (route: string) => /^ai-work\/[^/]+$/.test(route);
