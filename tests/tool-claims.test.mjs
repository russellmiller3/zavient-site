// Round 6: every figure a tool shows is sourced or marked as Zavient judgment (src/lib/tool-claims.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { toolClaims } from '../src/lib/tool-claims.mjs';

const dir = new URL('../public/tools/embed/', import.meta.url).pathname;

test('an unsourced figure in a tool sentence fails; a link, footnote or Zavient marker clears it', () => {
  assert.equal(toolClaims('<p>Most measured results run from about 2% to 40% of the time saved.</p>').length, 1);
  assert.equal(toolClaims('<p>Users save 2.8% of work hours in the study (<a href="https://x.org">NBER</a>).</p>').length, 0);
  assert.equal(toolClaims('const t = `76% of AI use cases are now bought, not built.${fns(["menlo"])}`;').length, 0);
  assert.equal(toolClaims('const t = `A second person checks a 10% sample of the work each month.${ZM("Review levels")}`;').length, 0);
  assert.equal(toolClaims("return r === 0 ? '$0' : 'more than this and that and other words';").length, 0);
});

test('a figure set in a data object counts as sourced where it is shown with a marker', () => {
  const html = ['const band = {', '  a: "Under $25K: seats for the pilot groups and training time.",', '};', '<p>${esc(band.a)}${ZM("Zavient bands")}</p>'].join('\n');
  assert.equal(toolClaims(html).length, 0);
  assert.equal(toolClaims(html.replace('${ZM("Zavient bands")}', '')).length, 1);
});

test('every tool figure is sourced or marked as Zavient judgment', () => {
  const bad = [];
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.html'))) for (const p of toolClaims(readFileSync(dir + f, 'utf8'))) bad.push(`${f} ${p}`);
  assert.deepEqual(bad, []);
});
