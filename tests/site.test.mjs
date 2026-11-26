// Checks the built site (run `npm test`, which builds first): every AI-work and data-story page carries the
// custom-benchmark offer and cited sources; every data story ships an embeddable SVG and a CSV that match its JSON;
// and the content schema refuses a page with no sources (checked on a throwaway copy of the site).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync, mkdtempSync, cpSync, symlinkSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { indexed } from '../src/lib/publish.mjs';
import { urlFor } from '../src/lib/page-types.mjs';

const root = new URL('..', import.meta.url).pathname;
// The built file of an AI-work page at its address (src/lib/page-types.mjs routeFor).
const aiWorkFile = (s) => { const d = JSON.parse(readFileSync(join(root, 'src/content/ai-work', `${s}.json`), 'utf8')); return join(root, 'dist', urlFor(d, s)); };
const dist = join(root, 'dist');
const slugs = (dir) => readdirSync(join(root, 'src/content', dir)).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));

test('every AI-work page is built with the offer and at least one source link', () => {
  // Indexed pages (index: true) sell AI consulting and must be in the sitemap and not noindexed; the rest keep the
  // benchmark offer and noindex (26 Nov 2026: Russell asked for the offer to sell consulting, not a benchmark booking).
  const sitemap = readFileSync(join(dist, 'sitemap.xml'), 'utf8');
  // Golden-template pages always carry the free diagnostic, and are indexed only when they also pass the publish gate.
  const all = slugs('ai-work').map((s) => ({ id: s, data: JSON.parse(readFileSync(join(root, 'src/content/ai-work', `${s}.json`), 'utf8')) }));
  for (const s of slugs('ai-work')) {
    const data = all.find((p) => p.id === s).data;
    const html = readFileSync(aiWorkFile(s), 'utf8');
    if (data.templateVersion) assert.match(html, /data-cta="consulting"/, `${s}: free diagnostic missing on a template page`);
    if (indexed({ id: s, data }, all)) {
      assert.match(html, /data-cta="consulting"/, `${s}: consulting offer missing`);
      assert.match(html, /href="mailto:rmiller@zavient\.com"/, `${s}: offer email missing`);
      assert.doesNotMatch(html, /name="robots" content="noindex/, `${s}: indexed page is marked noindex`);
      assert.ok(sitemap.includes(urlFor(data, s)), `${s}: indexed page missing from sitemap`);
    } else {
      if (!data.templateVersion) assert.match(html, /data-cta="consulting"/, `${s}: offer block missing`);
      assert.match(html, /name="robots" content="noindex/, `${s}: unpublished page is not noindex`);
      assert.ok(!sitemap.includes(urlFor(data, s)), `${s}: noindex page listed in sitemap`);
    }
    assert.match(html, /href="\/ai-readiness-assessment\.html"/, `${s}: readiness check link missing`);
    assert.doesNotMatch(html, /Russell/, `${s}: names Russell; only the About page may`);
    const sources = html.split(/<h2[^>]*>Sources<\/h2>/)[1] || '';
    assert.match(sources, /<a href="https?:\/\//, `${s}: no source link`);
  }
});

test('every data story has its chart, embed code, CSV and SVG, and they match the data', () => {
  for (const s of slugs('data-stories')) {
    const data = JSON.parse(readFileSync(join(root, 'src/content/data-stories', `${s}.json`), 'utf8'));
    const html = readFileSync(join(dist, 'data', `${s}.html`), 'utf8');
    assert.match(html, /<svg[^>]*role="img"/, `${s}: chart missing`);
    assert.ok(html.includes(`https://zavient.com/data/${s}.svg`), `${s}: embed code missing`);
    assert.match(html, /data-cta="consulting"/, `${s}: offer block missing`);
    const svg = readFileSync(join(dist, 'data', `${s}.svg`), 'utf8');
    assert.ok(svg.includes(`zavient.com/data/${s}.html`), `${s}: SVG credit link missing`);
    // Borrowed data (Indeed's is CC BY 4.0) must be credited on the chart itself, which travels without the page.
    if (data.chart.creditSource) assert.ok(svg.includes(data.chart.creditSource.replace(/&/g, '&amp;')), `${s}: SVG lacks credit to ${data.chart.creditSource}`);
    for (const b of data.chart.bars) assert.ok(svg.includes(b.label.replace(/&/g, '&amp;')), `${s}: SVG missing bar ${b.label}`);
    const csv = readFileSync(join(dist, 'data', `${s}.csv`), 'utf8').trim().split('\n');
    assert.equal(csv.length - 1, data.chart.bars.length, `${s}: CSV row count differs from chart`);
    data.chart.bars.forEach((b, i) => assert.ok(csv[i + 1].includes(`"${b.value}"`), `${s}: CSV value differs for ${b.label}`));
  }
});

test('every internal link on every built page points to a file that exists', () => {
  // Protects: menu and page links work on Vercel, which serves a page only at its exact file path (/data.html,
  // never /data). Fails if a link drops its .html or names a page that was never built (25 Nov 2026: the menu's
  // /insights, /ai-work and /data links returned 404 live).
  const pages = [];
  const walk = (dir) => readdirSync(dir, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.html') && pages.push(join(dir, e.name))));
  walk(dist);
  const broken = [];
  for (const page of pages) {
    for (const [, href] of readFileSync(page, 'utf8').matchAll(/href="(\/[^"#?]*)/g)) {
      const target = href === '/' ? '/index.html' : href.endsWith('/') ? `${href}index.html` : href;
      // A folder is not a page: dist/data/ exists, but Vercel answers /data with 404 because no file is there.
      if (!existsSync(join(dist, target)) || !statSync(join(dist, target)).isFile()) broken.push(`${page.slice(dist.length)} -> ${href}`);
    }
  }
  assert.deepEqual([...new Set(broken)], [], 'internal links to missing files');
});

test('the schema refuses a data story with no sources', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'zavient-schema-'));
  try {
    for (const p of ['src', 'public', 'astro.config.mjs', 'package.json']) cpSync(join(root, p), join(tmp, p), { recursive: true });
    symlinkSync(join(root, 'node_modules'), join(tmp, 'node_modules'));
    const good = JSON.parse(readFileSync(join(root, 'src/content/data-stories', `${slugs('data-stories')[0]}.json`), 'utf8'));
    writeFileSync(join(tmp, 'src/content/data-stories/zz-bad.json'), JSON.stringify({ ...good, sources: [] }));
    const r = spawnSync('npx', ['astro', 'sync'], { cwd: tmp, encoding: 'utf8' });
    assert.notEqual(r.status, 0, 'astro sync accepted a story with no sources');
    assert.match(r.stdout + r.stderr, /sources/i);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('the schema refuses an indexed AI-work page with no verdict', () => {
  // Protects the publish gate (26 Nov 2026): a page may drop noindex only with a verdict, 3+ Zavient numbers and
  // 3+ sources. Fails if someone flips index to true on a thin page.
  const tmp = mkdtempSync(join(tmpdir(), 'zavient-gate-'));
  try {
    for (const p of ['src', 'public', 'astro.config.mjs', 'package.json']) cpSync(join(root, p), join(tmp, p), { recursive: true });
    symlinkSync(join(root, 'node_modules'), join(tmp, 'node_modules'));
    // A real page with its verdict removed (rag-chatbot.json, the old thin example, was archived 26 Nov 2026).
    const { verdict, ...thin } = JSON.parse(readFileSync(join(root, 'src/content/ai-work/ai-credit-scoring.json'), 'utf8'));
    writeFileSync(join(tmp, 'src/content/ai-work/zz-thin.json'), JSON.stringify({ ...thin, index: true }));
    const r = spawnSync('npx', ['astro', 'sync'], { cwd: tmp, encoding: 'utf8' });
    assert.notEqual(r.status, 0, 'astro sync accepted an indexed page with no verdict');
    assert.match(r.stdout + r.stderr, /verdict/i);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('every indexed AI-work page footnotes its claims, and every footnote points at a real source', () => {
  // Rule (26 Nov 2026, Russell): always source, use several sources where possible, and show footnotes.
  // "[^n]" in page text renders as a link to source n. The verdict, the summary, every key number, every
  // "what goes wrong" line and every "pick something else" line must carry at least one.
  const marks = (t) => [...String(t).matchAll(/\[\^(\d+)\]/g)].map((m) => Number(m[1]));
  for (const s of slugs('ai-work')) {
    const data = JSON.parse(readFileSync(join(root, 'src/content/ai-work', `${s}.json`), 'utf8'));
    if (!data.index) continue;
    const n = data.sources.length;
    for (const m of marks(JSON.stringify(data))) assert.ok(m >= 1 && m <= n, `${s}: footnote [^${m}] has no source (sources: ${n})`);
    assert.equal(marks(data.title + data.description).length, 0, `${s}: footnote in title or description`);
    for (const b of data.verdict) assert.ok(marks(b).length > 0, `${s}: bottom-line bullet has no footnote: "${b.slice(0, 60)}"`);
    assert.ok(marks(data.summary).length > 0, `${s}: summary has no footnote`);
    for (const st of data.stats) assert.ok(marks(st.label + st.source).length > 0, `${s}: stat ${st.num} has no footnote`);
    for (const w of [...data.watchOuts, ...data.pickElse]) assert.ok(marks(w).length > 0, `${s}: no footnote on "${w.slice(0, 60)}"`);
    const html = readFileSync(aiWorkFile(s), 'utf8');
    // Back-to-back markers share one superscript ("8, 1"), so source 1 may not be first inside it.
    assert.match(html, /<sup class="fn">(?:(?!<\/sup>).)*?<a href="#fn-1"/, `${s}: footnotes not rendered`);
    assert.match(html, /id="fn-1"/, `${s}: numbered sources missing`);
  }
});

test('every indexed AI-work page opens with a bottom line and an On this page list, not headline numbers', () => {
  // Rule (26 Nov 2026, Russell): "the numbers at the top are kind of just clickbaity ... the top should be very BLUF
  // and tell the reader what the content is on the rest of the page."
  for (const s of slugs('ai-work')) {
    const data = JSON.parse(readFileSync(join(root, 'src/content/ai-work', `${s}.json`), 'utf8'));
    if (!data.index) continue;
    const html = readFileSync(aiWorkFile(s), 'utf8');
    const hero = html.slice(html.indexOf('<header class="article-hero"'), html.indexOf('</header>'));
    assert.match(hero, /class="bluf"/, `${s}: no bottom line at the top`);
    const bullets = (hero.match(/<div class="bluf"[\s\S]*?<\/ul>/) || [''])[0].match(/<li/g) || [];
    assert.ok(bullets.length >= 3 && bullets.length <= 5, `${s}: bottom line should be 3 to 5 bullets, found ${bullets.length}`);
    assert.match(hero, /class="on-page"/, `${s}: no On this page list at the top`);
    assert.doesNotMatch(html, /class="stats"/, `${s}: headline numbers strip is back`);
    for (const o of data.onPage) assert.match(html, new RegExp(`id="${o.to}"`), `${s}: On this page links to #${o.to}, which is not on the page`);
  }
});

test('every indexed AI-work page passes the ADHD-friendly readability check', async () => {
  // Rule (26 Nov 2026, Russell): "You have to make everything ADHD friendly, and those need to be rules."
  // Short sentences, one idea per bullet, no dense blocks. Limits live in scripts/check-readability.mjs.
  const { checkPage } = await import('../scripts/check-readability.mjs');
  for (const s of slugs('ai-work')) {
    const data = JSON.parse(readFileSync(join(root, 'src/content/ai-work', `${s}.json`), 'utf8'));
    if (!data.index) continue;
    const problems = checkPage(data);
    assert.equal(problems.length, 0, `${s}: hard to scan:\n  ${problems.join('\n  ')}`);
  }
});

test('the home, About, hub, data story and readiness pages pass the same readability check', async () => {
  // Mobile/ADHD audit (26 Nov 2026): the hand-built pages were never checked. Sentences of 25 words or fewer and
  // 3 sentences or fewer per paragraph or list item, read from the built HTML.
  const { checkHtml, HTML_PAGES } = await import('../scripts/check-readability.mjs');
  const pages = [...HTML_PAGES, ...slugs('data-stories').map((s) => `data/${s}.html`)];
  for (const page of pages) {
    const problems = checkHtml(readFileSync(join(dist, page), 'utf8'));
    assert.equal(problems.length, 0, `${page}: hard to scan:\n  ${problems.join('\n  ')}`);
  }
});

test('every data story footnotes its findings and says what they mean for the reader', () => {
  // Rule: every market number footnoted. "[^n]" in a finding links to source n.
  for (const s of slugs('data-stories')) {
    const data = JSON.parse(readFileSync(join(root, 'src/content/data-stories', `${s}.json`), 'utf8'));
    const marks = [...JSON.stringify(data).matchAll(/\[\^(\d+)\]/g)].map((m) => Number(m[1]));
    for (const m of marks) assert.ok(m >= 1 && m <= data.sources.length, `${s}: footnote [^${m}] has no source`);
    for (const f of data.findings) if (/\d/.test(f)) assert.match(f, /\[\^\d+\]/, `${s}: finding with a number has no footnote: "${f.slice(0, 60)}"`);
    assert.ok(data.soWhat, `${s}: no "What this means for you" line`);
    const html = readFileSync(join(dist, 'data', `${s}.html`), 'utf8');
    assert.match(html, /id="fn-1"/, `${s}: numbered sources missing`);
    assert.ok(html.indexOf('How we counted') < html.indexOf('Use this chart'), `${s}: embed code sits above the method`);
  }
});

test('every golden-template page offers the free diagnostic in four spots', () => {
  // Site architecture doc (26 Nov 2026), "The shared frame": under the bottom line, beside the tool or benchmark,
  // in the sticky contents and at the end.
  for (const s of slugs('ai-work')) {
    const data = JSON.parse(readFileSync(join(root, 'src/content/ai-work', `${s}.json`), 'utf8'));
    if (!data.templateVersion) continue;
    const html = readFileSync(aiWorkFile(s), 'utf8');
    const spots = [...html.matchAll(/data-diag="([a-z-]+)"/g)].map((m) => m[1]);
    assert.deepEqual(spots, ['bottom-line', 'beside-proof', 'sticky', 'end'], `${s}: diagnostic spots are ${spots.join(', ')}`);
  }
});

// The sitemap builds itself from the pages in each build (src/integrations/sitemap.mjs): every indexable page is in
// it with a lastmod, and no noindex page is. A new page needs no hand edit.
test('sitemap lists every indexable page and no noindex page', () => {
  const dist = join(process.cwd(), 'dist');
  const map = readFileSync(join(dist, 'sitemap.xml'), 'utf8');
  const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith('.html') ? [join(d, e.name)] : []);
  for (const f of walk(dist)) {
    const rel = f.slice(dist.length + 1).split('\\').join('/');
    const url = rel === 'index.html' ? 'https://zavient.com/' : `https://zavient.com/${rel}`;
    const html = readFileSync(f, 'utf8');
    if (/name="robots" content="noindex/.test(html)) assert.ok(!map.includes(`<loc>${url}</loc>`), `${rel}: noindex page in sitemap`);
    else assert.match(map, new RegExp(`<loc>${url.replace(/[.?]/g, '\\$&')}</loc><lastmod>\\d{4}-\\d{2}-\\d{2}</lastmod>`), `${rel}: missing from sitemap or no lastmod`);
  }
  assert.match(readFileSync(join(dist, 'robots.txt'), 'utf8'), /^Sitemap: https:\/\/zavient\.com\/sitemap\.xml$/m);
});

test('footnote commas only sit between back-to-back markers', () => {
  // Bug seen 26 Nov 2026: a CSS "sup + sup" comma also hit single markers with words between them ("run ,31").
  assert.ok(!/sup\.fn\s*\+\s*sup\.fn/.test(readFileSync(join(root, 'public/ai-work/ai-work.css'), 'utf8')), 'CSS adds footnote commas');
  for (const s of slugs('ai-work')) {
    const html = readFileSync(aiWorkFile(s), 'utf8');
    for (const m of html.matchAll(/<sup class="fn">((?:(?!<\/sup>).)*)<\/sup>/g)) {
      assert.match(m[1], /^<a [^>]+>\d+<\/a>(?:<span class="fn-sep">,<\/span><a [^>]+>\d+<\/a>)*$/, `${s}: odd footnote marker ${m[1].slice(0, 80)}`);
    }
  }
});

test('who-does-what flows are numbered lists, not rows of arrows', () => {
  // Russell, 26 Nov 2026: the arrow diagram "looks crap ... hard to follow".
  for (const s of slugs('ai-work')) {
    const html = readFileSync(aiWorkFile(s), 'utf8');
    assert.ok(!/class="arr"/.test(html), `${s}: arrow flow still rendered`);
    for (const m of html.matchAll(/<ol class="flow"[^>]*>((?:(?!<\/ol>).)*)<\/ol>/g)) assert.ok((m[1].match(/<li>/g) || []).length >= 2, `${s}: flow with under 2 steps`);
  }
});

// Hosting on Cloudflare (26 Nov 2026): addresses keep .html, "/" serves the home page, and the old-page redirects
// match the Vercel list (kept while Vercel is the rollback).
test('Cloudflare config keeps .html addresses, serves the home page and carries every redirect', async () => {
  const cfg = JSON.parse(readFileSync(join(root, 'wrangler.jsonc'), 'utf8').replace(/^\s*\/\/.*$/gm, ''));
  assert.equal(cfg.assets.directory, './dist');
  assert.equal(cfg.assets.html_handling, 'none', 'any other mode redirects /about.html to /about');
  assert.deepEqual(cfg.assets.run_worker_first, ['/']);
  assert.ok(cfg.previews && typeof cfg.previews === 'object', 'branch previews need a previews block');
  const { default: worker } = await import('../worker/index.js');
  const seen = [];
  const env = { ASSETS: { fetch: async (r) => { seen.push(new URL(r.url ?? r).pathname); return new Response('ok'); } } };
  await worker.fetch(new Request('https://zavient.com/'), env);
  await worker.fetch(new Request('https://zavient.com/about.html'), env);
  assert.deepEqual(seen, ['/index.html', '/about.html']);
  const cf = readFileSync(join(root, 'dist/_redirects'), 'utf8').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => l.split(/\s+/));
  const vercel = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8')).redirects;
  assert.deepEqual(cf, vercel.map((r) => [r.source.replace('/:path*', '/*'), r.destination, r.permanent ? '301' : '302']));
  for (const [, to] of cf) assert.ok(to === '/' || existsSync(join(root, 'dist', to.split('#')[0])), `redirect target missing: ${to}`);
});

test('every long page has the sticky contents with a jump link to each section', () => {
  // Russell, 26 Nov 2026: long pages need a TOC "that stays sticky and jumplinks you". The list is built in the
  // browser from the page's section headings, so check its parts and that each long page has 5+ linkable sections.
  for (const s of slugs('ai-work')) {
    const html = readFileSync(aiWorkFile(s), 'utf8');
    const ids = [...html.matchAll(/<h2 id="([^"]+)"/g)].map((m) => m[1]);
    if (ids.length < 5) continue;
    assert.match(html, /<div class="sticky-toc[^"]*" role="navigation" aria-label="Contents"/, `${s}: no sticky contents`);
    assert.match(html, /class="toc-toggle"[^>]*aria-expanded="false"/, `${s}: contents toggle missing`);
    assert.match(html, /querySelectorAll\('\.article-body h2\[id\]'\)/, `${s}: contents not built from the section headings`);
    assert.equal(new Set(ids).size, ids.length, `${s}: two sections share an id, so a jump link would land wrong`);
  }
  // A <nav> would pick up the site header's sticky styles (nav:not(.on-page)).
  assert.ok(!/<nav class="sticky-toc/.test(readFileSync(join(root, 'src/components/AiWorkPage.astro'), 'utf8')));
});

test('no built page puts a link inside a link (browsers split such cards apart)', () => {
  const pages = [];
  const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (p.endsWith('.html')) pages.push(p); } };
  walk(dist);
  for (const page of pages) {
    let depth = 0;
    for (const [, close] of readFileSync(page, 'utf8').matchAll(/<(\/?)a[\s>]/g)) {
      depth += close ? -1 : 1;
      assert.ok(depth <= 1, `${page.replace(dist, '')} has a link inside a link`);
    }
  }
});
