// Self-updating sitemap and llms.txt generator (26-27 Nov 2026).
// After every build, this walks the built HTML and writes:
//   1. dist/sitemap.xml from every indexable .html page (with lastmod from article:modified_time);
//   2. dist/llms.txt so AI assistants (ChatGPT, Claude, Perplexity) get a clean directory of all tools and guides.
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

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();

export function pageEntry(html, url) {
  if (/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html)) return null;
  const canon = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1];
  if (canon && canon !== url) return null;
  const lastmod = html.match(/<meta[^>]+property=["']article:modified_time["'][^>]+content=["'](\d{4}-\d{2}-\d{2})/i)?.[1];
  const title = decode(html.match(/<title>([^<]+)<\/title>/i)?.[1] || url).replace(/\s*\|\s*Zavient\s*$/, '');
  const description = decode(
    html.match(/<meta[^>]+name=["']description["'][^>]+content=(?:"([^"]*)"|'([^']*)')/i)?.slice(1).find((v) => v !== undefined) || ''
  );
  return { loc: url, lastmod, title, description };
}

function groupFor(loc, site) {
  const path = loc.slice(site.length);
  if (path === '/' || path === '/about.html' || path === '/ai-work.html' || path === '/privacy.html') return 'Core pages';
  if (path.startsWith('/tools/') || path === '/ai-readiness-assessment.html') return 'Free interactive tools';
  if (path.startsWith('/industries/')) return 'Industry hubs';
  if (path.startsWith('/ai-work/')) return 'Workflow playbooks';
  if (path.startsWith('/ai-consulting/')) return 'AI consulting guides';
  if (path.startsWith('/compare/')) return 'Software and approach comparisons';
  if (path.startsWith('/for/')) return 'Role guides';
  return 'Other guides';
}

export async function buildLlmsTxt(distDir, site, entries) {
  const order = [
    'Core pages',
    'Free interactive tools',
    'Industry hubs',
    'Workflow playbooks',
    'AI consulting guides',
    'Software and approach comparisons',
    'Role guides',
    'Other guides',
  ];
  const groups = Object.fromEntries(order.map((k) => [k, []]));
  for (const e of entries) {
    if (e.loc.includes('/tools/embed/')) continue;
    groups[groupFor(e.loc, site)].push(e);
  }
  const lines = [
    '# Zavient',
    '',
    '> Independent AI consulting for companies of 40 to 500 people, across every kind of work and industry. Focus: AI that augments teams rather than replacing staff. Every market claim is sourced and footnoted.',
    '',
    'Contact: hello@zavient.com | Free 30-minute diagnostic: https://zavient.com/#diagnostic',
    '',
  ];
  for (const name of order) {
    if (!groups[name].length) continue;
    lines.push(`## ${name}`, '');
    for (const e of groups[name]) {
      lines.push(`- [${e.title}](${e.loc})${e.description ? `: ${e.description}` : ''}`);
    }
    lines.push('');
  }
  await writeFile(join(distDir, 'llms.txt'), lines.join('\n'));
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
  await buildLlmsTxt(distDir, site, entries);
  return entries;
}

export default function sitemap({ site }) {
  return {
    name: 'zavient-sitemap',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const entries = await buildSitemap(fileURLToPath(dir), site.replace(/\/$/, ''));
        logger.info(`sitemap.xml + llms.txt: ${entries.length} indexable pages`);
      },
    },
  };
}
