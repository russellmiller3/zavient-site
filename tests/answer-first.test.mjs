// Answer-first rule (Russell, 26 Nov 2026): every heading on the built site that asks a question is answered in the
// first sentence under it. Fails on any question heading followed by a table, list or example instead of an answer,
// or whose first sentence fails the shape checks in src/lib/answer-first.mjs. Runs on dist/ after `astro build`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'parse5';
import { answerProblems } from '../src/lib/answer-first.mjs';

const dist = new URL('../dist/', import.meta.url).pathname;
const files = (dir) => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? files(p) : p.endsWith('.html') ? [p] : []; });
// Footnote markers (<sup>) are left out, so "journal.18,11 Next" reads as "journal. Next".
const text = (n) => n.nodeName === '#text' ? n.value : n.tagName === 'sup' ? '' : (n.childNodes || []).map(text).join('');
const cls = (n) => (n.attrs || []).find((a) => a.name === 'class')?.value || '';
const els = (n) => (n.childNodes || []).filter((c) => c.tagName);
function* walk(n) { yield n; for (const c of n.childNodes || []) yield* walk(c); if (n.content) yield* walk(n.content); }

// The question headings on a page, each with the paragraph text straight under it ('' if none).
export function questions(html) {
  const out = [];
  for (const n of walk(parse(html))) {
    if (!/^h[23]$/.test(n.tagName || '')) continue;
    const q = text(n).replace(/\s+/g, ' ').trim();
    if (!q.endsWith('?')) continue;
    let anchor = n;
    // Cards (a guide's title inside a link or a hub card) are links, not sections: skip.
    let p = n.parentNode, inCard = false;
    while (p && p.tagName) { if (p.tagName === 'a' || /\b(hub-card|card)\b/.test(cls(p))) inCard = true; if (p.tagName === 'summary') anchor = p; p = p.parentNode; }
    if (inCard) continue;
    const sibs = els(anchor.parentNode); const next = sibs[sibs.indexOf(anchor) + 1];
    out.push({ q, next: next?.tagName || 'nothing', answer: next?.tagName === 'p' ? text(next).replace(/\s+/g, ' ').trim() : '' });
  }
  return out;
}

test('every question heading is answered in the first sentence under it', { skip: !existsSync(dist) && 'no build' }, () => {
  const bad = [];
  for (const f of files(dist)) {
    const html = readFileSync(f, 'utf8');
    if (/http-equiv="refresh"/i.test(html)) continue;
    for (const { q, next, answer } of questions(html)) {
      const probs = next === 'p' ? answerProblems(q, answer) : [`followed by <${next}>, not an answer sentence`];
      for (const p of probs) bad.push(`${relative(dist, f)} · "${q}" · ${p}`);
    }
  }
  assert.equal(bad.length, 0, `${bad.length} question headings not answered first:\n${bad.join('\n')}`);
});
