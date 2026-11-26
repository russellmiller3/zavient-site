// Research-file check (26 Nov 2026). The build thread found research notes with findings but no link, so the writer
// could not footnote them and a reviewer could not check them. Russell's rule: always source, several sources where
// possible. Every finding in drafts/<slug>.research.md is one line, "- finding | Source: name | URL: https://... |
// Read: YYYY-MM-DD", under the heading of the slot it fills. This fails any finding line without an http(s) URL or a
// read date, and any slot heading with no finding. Usage: node scripts/check-research.mjs drafts/<slug>.research.md
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function researchProblems(md) {
  const out = [];
  let slot = null; let count = 0;
  const close = () => { if (slot && count === 0) out.push(`slot "${slot}" has no finding: research it, or write "- no source found" with the searches you ran`); };
  for (const [i, raw] of String(md).split('\n').entries()) {
    const line = raw.trim();
    if (/^##\s/.test(line)) { close(); slot = line.replace(/^##\s+/, ''); count = 0; continue; }
    if (!slot || !/^[-*]\s/.test(line)) continue;
    count++;
    if (/^[-*]\s+no source found\b/i.test(line)) continue;
    if (!/\bhttps?:\/\/\S+/.test(line)) out.push(`line ${i + 1}: finding has no URL: "${line.slice(0, 80)}"`);
    if (!/\bRead:\s*\d{4}-\d{2}-\d{2}\b/.test(line)) out.push(`line ${i + 1}: finding has no read date (Read: YYYY-MM-DD): "${line.slice(0, 80)}"`);
  }
  close();
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const files = process.argv.slice(2);
  if (!files.length) { console.error('usage: node scripts/check-research.mjs drafts/<slug>.research.md'); process.exit(1); }
  let bad = 0;
  for (const f of files) {
    const p = researchProblems(readFileSync(f, 'utf8'));
    console.log(`${f}: ${p.length ? `FAIL (${p.length})` : 'PASS'}`);
    for (const x of p) console.log(`  ✗ ${x}`);
    bad += p.length;
  }
  process.exit(bad ? 1 : 0);
}
