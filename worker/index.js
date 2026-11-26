// Cloudflare Worker in front of the static site (dist/). Static files are served by Cloudflare directly; this
// script only runs for "/" (run_worker_first in wrangler.jsonc). It exists because html_handling is "none":
// that keeps our .html addresses as they are (every other mode 307-redirects /about.html to /about, which
// would break the canonical URLs and the sitemap), but "none" does not map "/" to index.html by itself.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/') {
      url.pathname = '/index.html';
      return env.ASSETS.fetch(new Request(url, request));
    }
    return env.ASSETS.fetch(request);
  },
};
