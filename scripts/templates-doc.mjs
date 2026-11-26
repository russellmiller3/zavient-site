// Writes docs/golden-templates.md from src/lib/page-types.mjs, so the readable spec never drifts from the code.
// Usage: node scripts/templates-doc.mjs [out.md]
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TYPES, BLOCKS, COMMON_REQUIRED, REVIEWERS, MIN } from '../src/lib/page-types.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] || join(root, 'docs/golden-templates.md');
const head = (t, id) => ((t.headings && t.headings[id]) || BLOCKS[id].h || (id === 'tables' ? 'Tables (one heading each)' : 'Related links')).replaceAll('{topic}', '<topic>');

const md = `# Golden page templates

One template per page type. Each fixes the block order, the required blocks, the question headings and a research
brief for every slot, so a new page is research plus fill-in. Source of truth: \`src/lib/page-types.mjs\`
(this file is generated from it by \`node scripts/templates-doc.mjs\`).

## Make a page
1. \`node scripts/new-page.mjs --type <type> --slug <slug> --topic "<topic>" --job "<job>"\` writes a skeleton JSON and a research brief to \`drafts/\`.
2. A research agent fills \`drafts/<slug>.research.md\` from the brief. A separate writer agent fills the JSON from it.
3. \`node scripts/check-page.mjs drafts/<slug>.json\` until PASS.
4. ICP review, in order: ${REVIEWERS.join(' → ')}.
5. Move the JSON to \`src/content/ai-work/\`, \`npm test\`. \`index: true\` only on Russell's yes.

## Rules every template enforces
- Bottom line first: ${MIN.verdict[0]}-${MIN.verdict[1]} bullets, each with ${MIN.verdictFootnotes}+ sources. No number leading the title or a bullet.
- Title and headings are the buyer's question; the title ends in "?".
- Every claim footnoted; ${MIN.sources}+ sources from ${MIN.domains}+ sites (tool pages ${MIN.toolSources}, terms ${MIN.glossarySources}).
- "Where does your team stay in charge?" on every page. No headcount-cut wording.
- No Upwork, freelancer marketplaces, hourly rates or rival consulting firms.
- Teach, then trust, then the lead: alternatives sit after "Buy or build", just above the free diagnostic.
- A number only Zavient has on every page except tools and terms.
- ADHD-friendly: 25-word sentences, 2-sentence bullets, 3-sentence paragraphs.
- Zarlent look in blue (\`public/ai-work/ai-work.css\`).
- Required on every page: ${COMMON_REQUIRED.join(', ')}.

${Object.entries(TYPES).map(([name, t]) => `## ${t.label} (\`${name}\`)
- Title shape: "${t.titleShape}". Example: "${t.example}".
- Division-head reviewer: ${t.division}.
${t.differsFrom ? `- Build only if it differs from its parent on 4 of: ${t.differsFrom.join(', ')}. Otherwise add a section to the parent.\n` : ''}${t.minInbound ? `- Publish only when ${t.minInbound}+ site pages link to it.\n` : ''}- Required beyond the common set: ${t.required.join(', ')}.

Block order:
${t.order.map((id, i) => `${i + 1}. ${head(t, id)}`).join('\n')}
${t.order.length + 1}. Free diagnostic
`).join('\n')}
## What to research for each block
${Object.entries(BLOCKS).map(([id, b]) => `- **${id}** (\`${b.field}\`): ${b.brief}`).join('\n')}
`;
writeFileSync(out, md);
console.log(`wrote ${out}`);
