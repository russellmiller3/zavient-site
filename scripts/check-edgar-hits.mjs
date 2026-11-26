// Check an EDGAR own-data hit list against its page's method (src/lib/edgar-hits.mjs). Round 5, 26 Nov 2026.
// Usage: node scripts/check-edgar-hits.mjs <slug | path.json>
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { edgarProblems, hitListProblems } from '../src/lib/edgar-hits.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = process.argv[2];
if (!arg) { console.error('usage: node scripts/check-edgar-hits.mjs <slug | path.json>'); process.exit(1); }
const file = arg.endsWith('.json') ? arg : join(root, 'src/content/ai-work', `${arg}.json`);
const slug = file.split('/').pop().replace(/\.json$/, '');
const d = JSON.parse(readFileSync(file, 'utf8'));
const out = [...edgarProblems(d, slug)];
const list = d.ownData?.hitList && join(root, d.ownData.hitList);
if (list) out.push(...(existsSync(list) ? hitListProblems(readFileSync(list, 'utf8'), d.ownData.method) : [`${d.ownData.hitList} not found`]));
console.log(`${slug}: ${out.length ? `FAIL (${out.length})` : 'PASS'}`);
for (const p of out) console.log(`  ✗ ${p}`);
process.exit(out.length ? 1 : 0);
