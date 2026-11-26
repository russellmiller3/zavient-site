// EDGAR own-data hit lists (round 5, 26 Nov 2026). The build thread found an own-data count ("agentic" in filings)
// taken partly from exhibits when the method said main documents only, and no way to see which file each hit came
// from. Russell: "Make it so every fix is structual to templates so it doesnt reoccur". So an own-data block built
// from SEC EDGAR search keeps its hit list in the repo, one row per counted document, with the file each hit is in:
//   data/own-data/<slug>.csv   columns: accession,form,filed,file,kind   (kind: main or exhibit)
// and says in ownData.method which documents count ("main document only" or "main documents and exhibits").
// The page check fails a new EDGAR own-data block without both; the build's tests read every hit list and fail an
// exhibit hit when the method says main document only. SEC filings are public, so the list can sit in the public repo.
// Pages built before the rule are in EDGAR_PENDING, which only shrinks.
export const EDGAR_PENDING = new Set(['ai-due-diligence', 'insurance-agencies', 'multi-entity-close']);
const EDGAR = /\bEDGAR\b/;
export const MAIN_ONLY = /\bmain documents? only\b|\bexcluding exhibits\b|\bno exhibits\b/i;
const BOTH = /\bmain documents? and exhibits\b|\bincluding exhibits\b/i;
// An exhibit's file name on EDGAR: ex-10.1, ex101, exhibit99, d123dex991.htm
export const EXHIBIT_FILE = /(?:^|[^a-z])ex(?:hibit)?[-_]?\d|dex\d{2,}/i;

export function edgarProblems(d, slug) {
  const o = d.ownData;
  if (!o || !EDGAR.test(JSON.stringify(o)) || EDGAR_PENDING.has(slug)) return [];
  const out = [];
  if (!/^data\/own-data\/[a-z0-9-]+\.csv$/.test(o.hitList || '')) out.push('own data from EDGAR needs its hit list: ownData.hitList = "data/own-data/<slug>.csv", one row per document (accession,form,filed,file,kind)');
  if (!MAIN_ONLY.test(o.method || '') && !BOTH.test(o.method || '')) out.push('own data from EDGAR must say which documents count in ownData.method: "main document only" or "main documents and exhibits"');
  return out;
}

const parse = (csv) => {
  const [head, ...rows] = String(csv).trim().split(/\r?\n/).map((l) => l.split(',').map((c) => c.trim().replace(/^"|"$/g, '')));
  return { head: (head || []).map((h) => h.toLowerCase()), rows: rows.filter((r) => r.some(Boolean)) };
};
export function hitListProblems(csv, method = '') {
  const { head, rows } = parse(csv);
  const out = [];
  const need = ['accession', 'form', 'filed', 'file', 'kind'];
  const missing = need.filter((c) => !head.includes(c));
  if (missing.length) return [`hit list is missing columns: ${missing.join(', ')}`];
  const at = Object.fromEntries(need.map((c) => [c, head.indexOf(c)]));
  if (!rows.length) out.push('hit list has no rows');
  rows.forEach((r, i) => {
    const file = r[at.file] || ''; const kind = (r[at.kind] || '').toLowerCase();
    if (!file) out.push(`row ${i + 2}: no file named for hit ${r[at.accession] || '?'}`);
    if (!/^(?:main|exhibit)$/.test(kind)) out.push(`row ${i + 2}: kind must be main or exhibit, is "${r[at.kind] || ''}"`);
    if (kind === 'main' && EXHIBIT_FILE.test(file)) out.push(`row ${i + 2}: ${file} looks like an exhibit but is marked main`);
    if (MAIN_ONLY.test(method) && (kind === 'exhibit' || EXHIBIT_FILE.test(file))) out.push(`row ${i + 2}: ${file} is an exhibit, but the method counts the main document only: drop it and recount`);
  });
  return out;
}
