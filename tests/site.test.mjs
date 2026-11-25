// Checks the built site (run `npm test`, which builds first): every AI-work and data-story page carries the
// custom-benchmark offer and cited sources; every data story ships an embeddable SVG and a CSV that match its JSON;
// and the content schema refuses a page with no sources (checked on a throwaway copy of the site).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync, mkdtempSync, cpSync, symlinkSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const root = new URL('..', import.meta.url).pathname;
const dist = join(root, 'dist');
const slugs = (dir) => readdirSync(join(root, 'src/content', dir)).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));

test('every AI-work page is built with the offer and at least one source link', () => {
  for (const s of slugs('ai-work')) {
    const html = readFileSync(join(dist, 'ai-work', `${s}.html`), 'utf8');
    assert.match(html, /data-cta="benchmark"/, `${s}: offer block missing`);
    assert.match(html, /href="\/benchmark-your-documents\.html"/, `${s}: offer link missing`);
    const sources = html.split('<h2>Sources</h2>')[1] || '';
    assert.match(sources, /<a href="https?:\/\//, `${s}: no source link`);
  }
});

test('every data story has its chart, embed code, CSV and SVG, and they match the data', () => {
  for (const s of slugs('data-stories')) {
    const data = JSON.parse(readFileSync(join(root, 'src/content/data-stories', `${s}.json`), 'utf8'));
    const html = readFileSync(join(dist, 'data', `${s}.html`), 'utf8');
    assert.match(html, /<svg[^>]*role="img"/, `${s}: chart missing`);
    assert.ok(html.includes(`https://zavient.com/data/${s}.svg`), `${s}: embed code missing`);
    assert.match(html, /data-cta="benchmark"/, `${s}: offer block missing`);
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
