// Writes /sitemap-ai.xml: the data stories and the offer page, with their last update dates, so search engines find
// pages added by the content pipeline without hand-editing the static public/sitemap.xml. The AI-work pages are left
// out and marked noindex (25 Nov 2026): Russell judged them low-value, and Google's scaled-content policy penalizes
// many AI-written pages that add no value. Addresses name the .html file because Vercel serves only exact paths.
import { getCollection } from 'astro:content';

export async function GET() {
  const site = 'https://zavient.com';
  const urls = [
    { loc: `${site}/data.html`, lastmod: null },
    { loc: `${site}/benchmark-your-documents.html`, lastmod: null },
    ...(await getCollection('datastory')).map((p) => ({ loc: `${site}/data/${p.id}.html`, lastmod: p.data.updated })),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n') + `\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
}
