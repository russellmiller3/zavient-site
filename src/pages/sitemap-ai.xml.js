// Writes /sitemap-ai.xml: every AI-work page and data story, with its last update date, so search engines find
// pages added by the content pipeline without hand-editing the static public/sitemap.xml.
import { getCollection } from 'astro:content';

export async function GET() {
  const site = 'https://zavient.com';
  const urls = [
    { loc: `${site}/ai-work`, lastmod: null },
    { loc: `${site}/data`, lastmod: null },
    { loc: `${site}/benchmark-your-documents.html`, lastmod: null },
    ...(await getCollection('aiwork')).map((p) => ({ loc: `${site}/ai-work/${p.id}.html`, lastmod: p.data.updated })),
    ...(await getCollection('datastory')).map((p) => ({ loc: `${site}/data/${p.id}.html`, lastmod: p.data.updated })),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n') + `\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
}
