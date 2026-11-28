// Build step (28 Nov 2026): put every rendered footnote after its punctuation, on every built page, hand-written ones
// included (src/lib/footnotes.mjs). Runs after astro build writes dist, before the tests read it.
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { placeRenderedFootnotes } from '../lib/footnotes.mjs';

function* htmlFiles(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) yield* htmlFiles(p);
    else if (f.endsWith('.html')) yield p;
  }
}
export default function footnotes() {
  return {
    name: 'zavient-footnotes',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        let n = 0;
        for (const p of htmlFiles(fileURLToPath(dir))) {
          const html = readFileSync(p, 'utf8');
          const out = placeRenderedFootnotes(html);
          if (out !== html) { writeFileSync(p, out); n++; }
        }
        logger.info(`footnotes placed after punctuation on ${n} page(s)`);
      },
    },
  };
}
