// No Zavient price or price range on any built page (Russell, 26 Nov 2026). Runs on dist/ after `astro build`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ownPriceProblems } from '../src/lib/no-own-price.mjs';

const dist = new URL('../dist/', import.meta.url).pathname;
const files = (dir) => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? files(p) : /\.(html|txt)$/.test(p) ? [p] : []; });
const plain = (html) => html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<sup[\s\S]*?<\/sup>/gi, '').replace(/<\/(p|li|h\d|td|th|div)>/gi, '. ').replace(/<[^>]+>/g, ' ').replace(/&#36;|&dollar;/g, '$').replace(/&[a-z#0-9]+;/gi, ' ');

test('no Zavient price or range on any page', { skip: !existsSync(dist) && 'no build' }, () => {
  const bad = [];
  for (const f of files(dist)) {
    const html = readFileSync(f, 'utf8');
    if (/http-equiv="refresh"/i.test(html)) continue;
    for (const p of ownPriceProblems(plain(html))) bad.push(`${relative(dist, f)} · ${p}`);
  }
  assert.equal(bad.length, 0, `${bad.length} Zavient prices found:\n${bad.join('\n')}`);
});

test('the price check catches our old prices and leaves market prices alone', () => {
  assert.ok(ownPriceProblems('30-day AI Sprint: $10,000, fixed scope.').length);
  assert.ok(ownPriceProblems('Ongoing advisory: $5,000 to $10,000 a month.').length);
  assert.ok(ownPriceProblems("Zavient's Sprint is $10,000 fixed for 30 days.").length);
  assert.equal(ownPriceProblems('Microsoft 365 Copilot Business is $21 per user a month.').length, 0);
  assert.equal(ownPriceProblems('Start with a free 30-minute diagnostic.').length, 0);
});
