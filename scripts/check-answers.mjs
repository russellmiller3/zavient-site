// Answer-first check on page JSON, no build needed (Russell, 26 Nov 2026: every question heading is answered in the
// first sentence under it). Usage: node scripts/check-answers.mjs [slug ...]   (no slugs = every page). Exits 1 on a miss.
// It also prints every question with its first sentence, so a person can read whether each one truly answers.
// Since 26 Nov 2026 it also fails two-part headings answered in one sentence, difference headings whose first sentence
// states no contrast, and "How much / What does ... cost" headings with no figure in the first two sentences (rules 8-10
// in src/lib/answer-first.mjs). --show prints every question, passing or not.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pageQuestions, answerProblems, firstSentence } from '../src/lib/answer-first.mjs';

const dir = join(dirname(fileURLToPath(import.meta.url)), '../src/content/ai-work');
const slugs = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const show = process.argv.includes('--show');
let bad = 0;
for (const slug of slugs.length ? slugs : readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5))) {
  const d = JSON.parse(readFileSync(join(dir, `${slug}.json`), 'utf8'));
  const qs = pageQuestions(d); let miss = 0;
  for (const { where, q, a } of qs) {
    const p = answerProblems(q, a); miss += p.length;
    if (p.length || show) console.log(`${p.length ? '✗' : '✓'} ${slug} · ${where} · ${q}\n    ${a ? firstSentence(a) : '(nothing: a list, table or example comes first)'}${p.map((x) => `\n    ! ${x}`).join('')}`);
  }
  console.log(`${slug}: ${qs.length} question headings, ${miss ? `${miss} misses` : 'all answered first'}`);
  bad += miss;
}
process.exit(bad ? 1 : 0);
