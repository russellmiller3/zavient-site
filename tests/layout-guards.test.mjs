// Layout fixes of 26 Nov 2026 live in the shared stylesheet and layout, so every page gets them. These tests fail if a
// later edit drops one: nested bullets that overlapped numbered items, ranked numbers that overlapped headings, and the
// phone menu and contents bar that covered the text.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('../', import.meta.url).pathname;
const css = readFileSync(root + 'public/ai-work/ai-work.css', 'utf8');
const base = readFileSync(root + 'src/layouts/Base.astro', 'utf8');

test('a bullet list inside a numbered item keeps room for its marker', () => {
  assert.match(css, /\.article-body ol li ul > li \{[^}]*padding-left:\s*2\dpx/);
});

test('ranked list numbers outrank the generic article list rules', () => {
  assert.match(css, /\.article-body ol\.ranked > li::before/);
  assert.match(css, /\.article-body ol\.ranked > li[^:{]*\{[^}]*padding:[^;]*46px/);
});

test('on phones the top menu slides away on scroll down and the contents bar is one sticky row', () => {
  assert.match(base, /nav-away/, 'Base layout lost the slide-away menu script');
  assert.match(css, /nav:not\(\.on-page\)\.nav-away:not\(:focus-within\)\s*\{\s*transform:\s*translateY\(-100%\)/);
  assert.match(css, /\.sticky-toc \{ position: sticky; bottom: 0;[^}]*min-height: 44px/);
});

test('every built page carries the slide-away menu script', { skip: !existsSync(root + 'dist/index.html') && 'no build' }, () => {
  for (const f of ['dist/index.html', 'dist/about.html']) if (existsSync(root + f)) assert.match(readFileSync(root + f, 'utf8'), /nav-away/, f);
});
