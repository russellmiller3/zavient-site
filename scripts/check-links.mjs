// Opens every source and resource URL cited in src/content (AI-work pages and data stories) and reports any that
// do not answer with a success status. Run: node scripts/check-links.mjs. Exit 1 if any link fails.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const links = [];
for (const dir of ['ai-work']) {
  for (const f of readdirSync(join(root, 'src/content', dir)).filter((x) => x.endsWith('.json'))) {
    const d = JSON.parse(readFileSync(join(root, 'src/content', dir, f), 'utf8'));
    for (const l of [...(d.resources || []), ...(d.sources || [])]) links.push({ page: `${dir}/${f}`, url: l.url });
  }
}
const uniq = [...new Set(links.map((l) => l.url))];
const status = {};
await Promise.all(uniq.map(async (u) => {
  try {
    const r = await fetch(u, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (link check)' }, signal: AbortSignal.timeout(20000) });
    status[u] = r.status;
  } catch (e) {
    status[u] = `error: ${e.cause?.code || e.name}`;
  }
}));
// Hosts that refuse automated requests even for their home page (checked 25 Nov 2026: ftc.gov answers 404 to
// its own home page; jamanetwork.com and dl.acm.org show a robot check). Their links are reported, not failed.
const BLOCKS_CHECKERS = ['www.ftc.gov', 'jamanetwork.com', 'dl.acm.org'];
const failed = links.filter((l) => !(typeof status[l.url] === 'number' && status[l.url] < 400));
const blocked = failed.filter((l) => BLOCKS_CHECKERS.includes(new URL(l.url).host));
const bad = failed.filter((l) => !blocked.includes(l));
console.log(`${uniq.length} unique links on ${new Set(links.map((l) => l.page)).size} pages; ${new Set(bad.map((b) => b.url)).size} broken; ${new Set(blocked.map((b) => b.url)).size} on sites that block checkers`);
for (const b of bad) console.log(`  BROKEN ${status[b.url]}  ${b.url}  (${b.page})`);
for (const b of blocked) console.log(`  blocks checkers ${status[b.url]}  ${b.url}  (${b.page})`);
process.exit(bad.length ? 1 : 0);
