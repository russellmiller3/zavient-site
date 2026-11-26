// Research-file check (26 Nov 2026). The build thread found research notes with findings but no link, so the writer
// could not footnote them and a reviewer could not check them. Russell's rule: always source, several sources where
// possible. Every finding in drafts/<slug>.research.md is a bullet under the heading of the slot it fills:
// "- finding | Source: name | URL: https://... | Read: YYYY-MM-DD". The source, URL and read date may sit on the same
// line or on lines under the bullet (the build thread wrote them that way, and the check failed them; fixed 26 Nov
// 2026). This fails any finding without an http(s) URL or a read date, and any slot heading with no finding.
// Usage: node scripts/check-research.mjs drafts/<slug>.research.md
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function researchProblems(md) {
  const out = [];
  let slot = null; let count = 0; let finding = null;
  const closeFinding = () => {
    if (!finding) return;
    const { line, text } = finding; finding = null;
    if (/^[-*]\s+no source found\b/i.test(text)) return;
    if (!/\bhttps?:\/\/\S+/.test(text)) out.push(`line ${line}: finding has no URL: "${text.slice(0, 80)}"`);
    if (!/\bRead:\s*\d{4}-\d{2}-\d{2}\b/.test(text)) out.push(`line ${line}: finding has no read date (Read: YYYY-MM-DD): "${text.slice(0, 80)}"`);
  };
  const closeSlot = () => { closeFinding(); if (slot && count === 0) out.push(`slot "${slot}" has no finding: research it, or write "- no source found" with the searches you ran`); };
  for (const [i, raw] of String(md).split('\n').entries()) {
    const line = raw.trim();
    if (/^#{1,6}\s/.test(line)) { closeSlot(); slot = /^##\s/.test(line) ? line.replace(/^##\s+/, '') : null; count = 0; continue; }
    if (!slot) continue;
    if (/^[-*]\s/.test(line) && !/^\s{2,}/.test(raw)) { closeFinding(); count++; finding = { line: i + 1, text: line }; continue; }
    // A line under a bullet (indented, a sub-bullet, or a "URL:" / "Read:" line) belongs to that finding.
    if (finding && line) finding.text += ` ${line}`;
  }
  closeSlot();
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
