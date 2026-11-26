// Sets every page's copy of a canonical source (src/lib/canonical-sources.mjs) to its one URL, name and note.
// A page's own extra words after the canonical note are kept. Keeps each file's indent.
// Usage: node scripts/apply-canonical-sources.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalFor } from '../src/lib/canonical-sources.mjs';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src/content/ai-work');
let changed = 0;
for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
  const raw = readFileSync(join(dir, f), 'utf8');
  const d = JSON.parse(raw);
  let n = 0;
  for (const s of d.sources || []) {
    const c = canonicalFor(s);
    if (!c || (s.url === c.url && s.name === c.name && String(s.what || '').startsWith(c.what))) continue;
    s.name = c.name; s.url = c.url; s.what = c.what; n++;
  }
  if (!n) continue;
  const ind = (raw.match(/\n( +)"/) || [, '  '])[1];
  writeFileSync(join(dir, f), JSON.stringify(d, null, ind) + (raw.endsWith('\n') ? '\n' : ''));
  console.log(`${f}: ${n} source(s) set`); changed += n;
}
console.log(`${changed} sources set`);
