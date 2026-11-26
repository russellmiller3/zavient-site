// Tells IndexNow (Bing, Yandex, Seznam, Naver and others) which pages are new or changed after a deploy.
// Run by .github/workflows/indexnow.yml on every push to master; can also be run by hand.
//   node scripts/indexnow.mjs --new dist [--old dist-old] [--all] [--dry] [--wait]
// --old: the previous build. A URL is sent when it is new, its built HTML changed, or it was removed. Without --old, or with --all,
//        every URL in the new sitemap is sent.
// --wait: first poll the live sitemap until it matches the new build, so engines never fetch the old page.
// The key is public by design: IndexNow checks it by fetching https://zavient.com/<key>.txt.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const SITE = 'https://zavient.com';
const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const flag = (k) => args.includes(k);
const newDir = opt('--new') ?? 'dist';
const oldDir = opt('--old');

const keyFile = readdirSync('public').find((f) => /^[a-f0-9]{32}\.txt$/.test(f));
if (!keyFile) throw new Error('No IndexNow key file in public/');
const key = keyFile.replace('.txt', '');

const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const fileFor = (dir, url) => join(dir, url === `${SITE}/` ? 'index.html' : url.slice(SITE.length + 1));
const hash = (p) => existsSync(p) ? createHash('sha256').update(readFileSync(p)).digest('hex') : null;

const newMap = readFileSync(join(newDir, 'sitemap.xml'), 'utf8');
let urls = locs(newMap);
if (oldDir && !flag('--all') && existsSync(oldDir)) {
  urls = urls.filter((u) => hash(fileFor(oldDir, u)) !== hash(fileFor(newDir, u)));
  // A page cut from the site is sent too, so engines recrawl it, find the 404 and drop it (26 Nov 2026).
  const oldMap = join(oldDir, 'sitemap.xml');
  if (existsSync(oldMap)) urls.push(...locs(readFileSync(oldMap, 'utf8')).filter((u) => !newMap.includes(`<loc>${u}</loc>`)));
}
console.log(`${urls.length} URL(s) to submit`);
urls.forEach((u) => console.log(`  ${u}`));
if (!urls.length || flag('--dry')) process.exit(0);

if (flag('--wait')) {
  const deadline = Date.now() + 15 * 60 * 1000;
  for (;;) {
    const live = await fetch(`${SITE}/sitemap.xml`, { cache: 'no-store' }).then((r) => r.ok ? r.text() : '').catch(() => '');
    if (live === newMap) break;
    if (Date.now() > deadline) throw new Error('Live sitemap never matched this build; not submitting.');
    await new Promise((r) => setTimeout(r, 20000));
  }
}

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: 'zavient.com', key, keyLocation: `${SITE}/${key}.txt`, urlList: urls }),
});
console.log(`IndexNow answered ${res.status} ${res.statusText}`);
if (res.status >= 300) { console.log(await res.text()); process.exit(1); }
