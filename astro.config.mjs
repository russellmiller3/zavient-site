import { defineConfig } from 'astro/config';

// zavient.com is served by Vercel, which auto-detects Astro and runs `astro build`.
// `format: 'file'` outputs /insights/slug.html (not /insights/slug/) so the
// already-indexed URLs and sitemap.xml keep resolving.
export default defineConfig({
  site: 'https://zavient.com',
  build: { format: 'file' },
});
