// Writes docs/golden-templates.md from src/lib/page-types.mjs, so the readable spec never drifts from the code.
// Usage: node scripts/templates-doc.mjs [out.md]
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TYPES, BLOCKS, COMMON_REQUIRED, REVIEWERS, MIN, DEMAND, ONE_OFFS } from '../src/lib/page-types.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] || join(root, 'docs/golden-templates.md');
const head = (t, id) => ((t.headings && t.headings[id]) || BLOCKS[id].h || (id === 'tables' ? 'Tables (one heading each)' : 'Related links')).replaceAll('{topic}', '<topic>');

const md = `# Golden page templates

Page types are named as in the site architecture doc (26 Nov 2026). Built once by hand, with no template: ${ONE_OFFS.join(', ')}.

One template per page type. Each fixes the block order, the required blocks, the question headings and a research
brief for every slot, so a new page is research plus fill-in. Source of truth: \`src/lib/page-types.mjs\`
(this file is generated from it by \`node scripts/templates-doc.mjs\`).

## Make a page
1. \`node scripts/new-page.mjs --type <type> --slug <slug> --topic "<topic>" --job "<job>"\` writes a skeleton JSON, a research skeleton and a research brief to \`drafts/\`.
2. A research agent fills \`drafts/<slug>.research.md\`, one line per finding with its URL and read date, until \`node scripts/check-research.mjs\` passes. A separate writer agent fills the JSON from it.
3. \`node scripts/check-page.mjs drafts/<slug>.json\` until PASS.
4. Source-claim check: a separate agent opens every cited source, confirms it states the claim, and logs \`sourceCheck\` (the page check warns until it does).
5. ICP review, in order: ${REVIEWERS.join(' → ')}.
6. Move the JSON to \`src/content/ai-work/\`, \`npm test\`. \`index: true\` only on Russell's yes.
7. Look at it in a live browser. Screenshot the built page at 1280px and 390px wide and check every block by eye: flows, tables, footnotes, the sticky box, buttons. A visual change is not done until those screenshots look right, and they go with the report (Russell's rule, 26 Nov 2026).

## Rules every template enforces
- Bottom line first: ${MIN.verdict[0]}-${MIN.verdict[1]} bullets, each with ${MIN.verdictFootnotes}+ sources. No number leading the title or a bullet.
- Title and headings are the buyer's question; the title ends in "?".
- Every claim footnoted; ${MIN.sources}+ sources from ${MIN.domains}+ sites (tool pages ${MIN.toolSources}).
- Measured demand: ${DEMAND.searches}+ US searches a month, or ${DEMAND.nicheSearches}+ at $${DEMAND.nicheCpc}+ a click (role pages skip it: they are navigation).
- One fact its siblings don't have, and a real updated date.
- A page that fails any check renders noindex, follow and stays out of the sitemap, even with \`index: true\`.
- "Where does your team stay in charge?" on every page. No headcount-cut wording.
- No Upwork, freelancer marketplaces, hourly rates or rival consulting firms.
- No forum threads, rival consulting firms or content farms as sources; the page check fails them.
- Every fix is structural: it goes into the template or a failing page check, so it can't come back on any page.
- Every lead text says the thing: no meta pointers, no restated heading, no semicolon joining two answers (src/lib/lead-rules.mjs).
- Superseded rules (SR 11-7, withdrawn CFPB circulars) always name their replacement or say withdrawn (src/lib/stale-rules.mjs).
- No rival consulting firm offered or priced, and no consultant fee ranges (src/lib/rival-firms.mjs).
- Own-site links are root-relative; page JSON keeps its own indent and ends in a newline.
- A question's first sentence is 6 words or more: a bare "No." carries its reason ("No, because ...").
- Every jargon acronym is spelled out on the page (src/lib/acronyms.mjs). No search-results pages as sources.
- Description 50-160 characters; no footnote in the title or description; a footnote on every key number.
- Every ranked, spoke and related slug is a real page; related ${MIN.related[0]}-${MIN.related[1]} links (industry hubs 10, role and tool pages 8). No heading repeats a template word ("AI ... AI"). No answer slot on what-it-is or under a heading that is not a question (src/lib/structure-rules.mjs).
- \`npm run build\` runs the page check and every test, so a failing indexed page stops the deploy.
- Teach, then trust, then the lead: alternatives sit after "Buy or build", just above the free diagnostic.
- The free diagnostic shows in four spots, worded for the page type: under the bottom line, beside the tool or own data, in a sticky contents box, and at the end.
- Every long page (5+ sections) gets the sticky contents automatically: a side rail at 1300px and wider, a bottom bar below that naming the section you're in, a jump link to every section, the current one marked. Nothing to fill in; it reads the page's own headings (Russell, 26 Nov 2026).
- One folder per page type; pages built before the templates stay at \`/ai-work/<slug>.html\`.
- A fact only Zavient has on every page except tools (the tool is the fact).
- ADHD-friendly: 25-word sentences, 2-sentence bullets, 3-sentence paragraphs.
- Zarlent look in blue (\`public/ai-work/ai-work.css\`).
- Required on every page: ${COMMON_REQUIRED.join(', ')}.

${Object.entries(TYPES).map(([name, t]) => `## ${t.label} (\`${name}\`)
- Address: \`/${t.path}.html\`${name === 'consulting' ? ' (the hub, slug `ai-consulting`, is `/ai-consulting.html`)' : ''}.
- Title shape: "${t.titleShape}". Example: "${t.example}".
- Division-head reviewer: ${t.division}.
- Free diagnostic offer: "${t.offer}"${t.skipDemand ? '\n- Skips the demand check (navigation page).' : ''}
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
