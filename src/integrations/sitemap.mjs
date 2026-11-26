// Self-updating sitemap (Russell, 26 Nov 2026: "make sitemap auto updateing when new page publishd").
// After every build, this walks the built HTML and writes dist/sitemap.xml from what actually shipped:
//   - every .html page is listed unless it carries <meta name="robots" content="noindex"> or a canonical that
//     points to another address (so noindex hubs and drafts stay out by themselves);
//   - lastmod comes from <meta property="article:modified_time">, which Base.astro writes from a page's `updated` prop.
// A new page needs nothing extra: build it, and it is in the sitemap. The IndexNow workflow
// (.github/workflows/indexnow.yml) then tells Bing and other engines which URLs are new or changed.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

async function htmlFiles(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await htmlFiles(p)));
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

export function pageEntry(html, url) {
  if (/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html)) return null;
  const canon = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1];
  if (canon && canon !== url) return null;
  const lastmod = html.match(/<meta[^>]+property=["']article:modified_time["'][^>]+content=["'](\d{4}-\d{2}-\d{2})/i)?.[1];
  return { loc: url, lastmod };
}

export async function buildSitemap(distDir, site) {
  const entries = [];
  for (const f of (await htmlFiles(distDir)).sort()) {
    const rel = relative(distDir, f).split(sep).join('/');
    if (rel === '404.html') continue;
    const url = rel === 'index.html' ? `${site}/` : `${site}/${rel}`;
    const e = pageEntry(await readFile(f, 'utf8'), url);
    if (e) entries.push(e);
  }
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<!-- Built automatically from the pages in this build. Do not edit by hand. -->\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries.map((e) => `  <url><loc>${e.loc}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''}</url>`).join('\n') +
    `\n</urlset>\n`;
  await writeFile(join(distDir, 'sitemap.xml'), body);
  return entries;
}

export default function sitemap({ site }) {
  return {
    name: 'zavient-sitemap',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const entries = await buildSitemap(fileURLToPath(dir), site.replace(/\/$/, ''));
        logger.info(`sitemap.xml: ${entries.length} indexable pages`);
      },
    },
  };
}
