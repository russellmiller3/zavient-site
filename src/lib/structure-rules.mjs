// Page-structure rules (26 Nov 2026). The PE / family-office / holdco batch needed 16 hand fixes; Russell's rule is
// "Make it so every fix is structual to templates so it doesnt reoccur". These are the ones about page structure, run by
// the page check (scripts/check-page.mjs) so a miss stops the deploy:
// 1. description is 50-160 characters, and no footnote marker sits in the title or description (they render bare);
// 2. every key number carries a footnote in its label or source, like every bottom-line bullet, summary,
//    "what goes wrong" and "pick something else" line (tests/site.test.mjs test 16 checked this only on the built site);
// 3. every ranked, spoke and related slug is a real page in src/content/ai-work (unknown related slugs were silently
//    dropped at build); a spoke is listed once; related has 2-5 links, or up to the type's relatedMax on hubs;
// 4. no rendered heading repeats a word the template and the topic both bring ("Where does AI pay first for AI in
//    insurance?"), and no word twice in a row ("AI AI"): set headings[blockId] instead;
// 5. answers[blockId] renders only where it should: never on what-it-is (the summary is that answer, so it would render
//    twice), and never under a heading that is not a question (it renders as a stray paragraph).
import { headingFor, orderFor, BLOCKS, TYPES, relatedRange, DESCRIPTION } from './page-types.mjs';

const fns = (t) => (String(t).match(/\[\^\d+\]/g) || []).length;
const STOP = new Set('a an the and or of to for in on at by with is are be does do what how which who why when where your you our we it this that from as into a'.split(' '));

export function structureProblems(d, slugs = null) {
  const out = [];
  const desc = d.description || '';
  if (desc.length < DESCRIPTION[0] || desc.length > DESCRIPTION[1]) out.push(`description is ${desc.length} characters (need ${DESCRIPTION[0]}-${DESCRIPTION[1]}): it is the search snippet`);
  if (fns(d.title) + fns(desc)) out.push('footnote marker in the title or description: they render as plain text there');
  (d.stats || []).forEach((st) => { if (!fns(`${st.label} ${st.source}`)) out.push(`key number ${st.num} has no footnote in its label or source`); });

  if (slugs) {
    const known = (s) => slugs.has(s);
    (d.ranked || []).forEach((r, i) => { if (r.slug && !known(r.slug)) out.push(`ranked ${i + 1} links "${r.slug}", which is not a page`); });
    const sp = (d.spokes || []).map((s) => s.slug);
    sp.forEach((s, i) => { if (!known(s)) out.push(`spoke ${i + 1} links "${s}", which is not a page`); });
    for (const s of new Set(sp.filter((s, i) => sp.indexOf(s) !== i))) out.push(`spoke "${s}" is listed twice`);
    (d.related || []).forEach((s) => { if (!known(s)) out.push(`related "${s}" is not a page (it would be dropped silently at build)`); });
    const rel = new Set(d.related || []);
    if (rel.size !== (d.related || []).length) out.push('a related slug is listed twice');
  }
  const [lo, hi] = relatedRange(d.type);
  const nRel = (d.related || []).length;
  if (nRel < lo || nRel > hi) out.push(`related has ${nRel} links (a ${d.type} page takes ${lo}-${hi})`);

  const t = TYPES[d.type] || TYPES.usecase;
  const topic = (d.topic || String(d.title).split(':')[0]).trim();
  const topicWords = new Set((topic.toLowerCase().match(/[a-z0-9]+/g) || []).filter((w) => !STOP.has(w)));
  for (const id of orderFor(d)) {
    const h = headingFor(d, id);
    if (!h) continue;
    const w = h.toLowerCase().match(/[a-z0-9]+/g) || [];
    for (let i = 1; i < w.length; i++) if (w[i] === w[i - 1] && !/^\d+$/.test(w[i])) out.push(`heading "${h}" says "${w[i]}" twice in a row`);
    const base = !(d.headings && d.headings[id]) && ((t.headings && t.headings[id]) || BLOCKS[id]?.h);
    if (base && base.includes('{topic}')) {
      const own = (base.replace('{topic}', ' ').toLowerCase().match(/[a-z0-9]+/g) || []).filter((x) => !STOP.has(x));
      const twice = own.filter((x) => topicWords.has(x));
      if (twice.length) out.push(`heading "${h}" repeats "${twice[0]}" (template and topic both bring it): set headings.${id}`);
    }
  }

  const A = d.answers || {};
  if (A['what-it-is'] && d.summary) out.push('answers.what-it-is renders above the summary, so the answer shows twice: put it in the summary and delete the slot');
  for (const id of Object.keys(A)) {
    const m = id.match(/^table-(\d+)$/);
    const h = m ? d.tables?.[m[1] - 1]?.title : headingFor(d, id);
    if (!h) out.push(`answers.${id} has no block on this page`);
    else if (!String(h).trim().endsWith('?')) out.push(`answers.${id} sits under "${h}", which is not a question, so it renders as a stray paragraph: delete it or make the heading the buyer's question`);
  }
  return out;
}
