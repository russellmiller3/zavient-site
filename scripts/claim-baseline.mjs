// Claim baseline (26 Nov 2026). The source-number, survey-scope, two-figure and price checks (src/lib/source-numbers.mjs)
// found about 700 claims on the pages built before them whose figure, group or read date is missing from the cited
// source's note. Fixing them means rereading each source, so it can't be done by a script. Until then the page check
// holds each older page to its count here and fails any rise; a new page starts at 0, and a page with a logged
// source-claim check must be at 0. This script only ever lowers a count (after a page is fixed) or drops a page that
// is gone; it never raises one or adds a page. Usage: node scripts/claim-baseline.mjs [--write]
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { claimProblems } from '../src/lib/source-numbers.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const file = join(root, 'src/lib/claim-baseline.mjs');
const dir = join(root, 'src/content/ai-work');
const { default: base } = await import(new URL('../src/lib/claim-baseline.mjs', import.meta.url));
const next = {};
for (const [slug, n] of Object.entries(base)) {
  let d;
  try { d = JSON.parse(readFileSync(join(dir, `${slug}.json`), 'utf8')); } catch { console.log(`${slug}: page gone, dropped`); continue; }
  const now = claimProblems(d).length;
  if (now < n) console.log(`${slug}: ${n} → ${now}`);
  if (now) next[slug] = Math.min(n, now);
}
const unlisted = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, '')).filter((s) => !(s in base));
if (unlisted.length) console.log(`not in the baseline (held to 0): ${unlisted.join(', ')}`);
if (process.argv.includes('--write')) { writeFileSync(file, `// Written by scripts/claim-baseline.mjs; see the note there. Counts only ever go down.\nexport default ${JSON.stringify(next, null, 1)};\n`); console.log('written'); }
