// One-off content fix (28 Nov 2026) for the fund acronyms added to src/lib/acronyms.mjs: each page gets the term
// explained once, in place, so the acronym check passes. Exact-string edits; fails loudly if a string has moved.
import { readFileSync, writeFileSync } from 'node:fs';
const edits = {
  'accounting-firms': [['a brokerage 1099 and a K-1, uploaded late', 'a brokerage 1099 and a K-1 partnership tax form, uploaded late']],
  'family-office-accounting': [['"name": "ILPA Capital Call & Distribution Template",', '"name": "Institutional Limited Partners Association (ILPA) Capital Call & Distribution Template",']],
  'family-office-coo': [['"Fund documents: statements, calls, distributions and K-1s"', '"Fund documents: statements, calls, distributions and K-1 tax forms"']],
  'family-offices': [['"The books lag the capital calls and K-1s"', '"The books lag the capital calls and K-1 tax forms"']],
};
for (const [slug, list] of Object.entries(edits)) {
  const f = new URL(`../src/content/ai-work/${slug}.json`, import.meta.url);
  let s = readFileSync(f, 'utf8');
  for (const [a, b] of list) { if (s.split(a).length !== 2) throw new Error(`${slug}: "${a}" found ${s.split(a).length - 1} times`); s = s.replace(a, b); }
  JSON.parse(s); writeFileSync(f, s);
  console.log(`${slug}: ${list.length} edit(s)`);
}
