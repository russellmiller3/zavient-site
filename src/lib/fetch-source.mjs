// Fetch a cited source for the live figure check (scripts/check-source-figures.mjs), 28 Nov 2026.
// Why not plain fetch(): in this environment every HTTPS request goes through the agent proxy in HTTPS_PROXY. Node's
// fetch ignores it unless run with NODE_USE_ENV_PROXY=1, and even then a proxy refusal (the CONNECT answered 403
// because the host isn't on the egress allow list) comes back as the bare "Request was cancelled.", and an http://
// address skips the proxy and dies on DNS (ENOTFOUND), since only the proxy resolves names. So the script couldn't
// tell a blocked host from a slow one, and fired every source at once. This reader:
// - tunnels through HTTPS_PROXY itself (CONNECT), honouring NO_PROXY, with or without NODE_USE_ENV_PROXY;
// - trusts the proxy's CA bundle (NODE_EXTRA_CA_CERTS, else /root/.ccr/ca-bundle.crt) on top of the system roots.
//   TLS verification is never turned off;
// - reads an http:// source over https through the proxy (the proxy has no plain-HTTP mode), and says so if it can't;
// - names a refusal: "blocked by the egress proxy (403)" is a policy answer, never retried;
// - retries what is worth retrying (429, 503, 408, timeouts, resets) with a growing wait, one request at a time;
// - follows redirects itself, so the caller still learns the page it landed on;
// - reads a PDF's text with pdftotext when the machine has it (most cited studies are PDFs).
import http from 'node:http';
import https from 'node:https';
import tls from 'node:tls';
import zlib from 'node:zlib';
import { existsSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36 (zavient source check)';
const CA_FILES = [process.env.NODE_EXTRA_CA_CERTS, process.env.SSL_CERT_FILE, '/root/.ccr/ca-bundle.crt'].filter(Boolean);
let caCache;
function ca() {
  if (caCache === undefined) {
    const file = CA_FILES.find((f) => existsSync(f));
    caCache = file ? [...tls.rootCertificates, readFileSync(file, 'utf8')] : null;
  }
  return caCache || undefined;
}

// The proxy to use for a host, or null for a direct connection (NO_PROXY lists hosts, domains and CIDRs; only host
// names and domain suffixes matter for cited sources).
export function proxyFor(host, env = process.env) {
  const p = env.HTTPS_PROXY || env.https_proxy;
  if (!p) return null;
  const no = String(env.NO_PROXY || env.no_proxy || '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
  const h = host.toLowerCase();
  if (no.some((n) => n === '*' || h === n.replace(/^\*?\./, '') || (n.startsWith('.') || n.startsWith('*.') ? h.endsWith(n.replace(/^\*/, '')) : h.endsWith(`.${n}`)))) return null;
  return new URL(p);
}

class SourceError extends Error {
  constructor(code, message, retry = false) { super(message); this.code = code; this.retry = retry; }
}

function tunnel(proxy, host, port, timeout) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: proxy.hostname, port: proxy.port || 80, method: 'CONNECT', path: `${host}:${port}`, headers: { Host: `${host}:${port}` }, timeout });
    req.on('connect', (res, socket) => {
      // The tunnel's own errors surface on the TLS socket and the request; a refused tunnel's late reset is ignored.
      socket.on('error', () => {});
      if (res.statusCode === 200) return resolve(socket);
      socket.destroy();
      const s = res.statusCode;
      if (s === 403 || s === 407) reject(new SourceError(`proxy ${s}`, `the egress proxy refused this host (${s}): open it with a fetch tool by hand`));
      else reject(new SourceError(`proxy ${s}`, `proxy answered ${s}`, [408, 429, 502, 503, 504].includes(s)));
    });
    req.on('timeout', () => req.destroy(new SourceError('timeout', 'proxy timed out', true)));
    req.on('error', (e) => reject(e instanceof SourceError ? e : new SourceError(e.code || 'error', e.message, true)));
    req.end();
  });
}

async function once(url, { timeout }) {
  const u = new URL(url);
  const port = Number(u.port) || 443;
  const proxy = proxyFor(u.hostname);
  const headers = { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8', 'Accept-Language': 'en-US,en;q=0.9', 'Accept-Encoding': 'gzip, deflate, br' };
  const opts = { host: u.hostname, port, path: u.pathname + u.search, method: 'GET', headers, servername: u.hostname, ca: ca(), timeout };
  if (proxy) {
    const socket = await tunnel(proxy, u.hostname, port, timeout);
    opts.createConnection = () => tls.connect({ socket, servername: u.hostname, ca: ca() });
    opts.agent = false;
  }
  return new Promise((resolve, reject) => {
    const req = https.request(opts, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        let body = Buffer.concat(chunks);
        try {
          const enc = String(res.headers['content-encoding'] || '').toLowerCase();
          if (enc === 'gzip' || enc === 'x-gzip') body = zlib.gunzipSync(body);
          else if (enc === 'br') body = zlib.brotliDecompressSync(body);
          else if (enc === 'deflate') body = zlib.inflateSync(body);
        } catch { /* keep the raw bytes */ }
        resolve({ status: res.statusCode, headers: res.headers, body });
      });
      res.on('error', (e) => reject(new SourceError(e.code || 'error', e.message, true)));
    });
    req.on('timeout', () => req.destroy(new SourceError('timeout', `no answer in ${Math.round(timeout / 1000)}s`, true)));
    req.on('error', (e) => reject(e instanceof SourceError ? e : new SourceError(e.code || 'error', e.message, /ECONNRESET|EPIPE|ETIMEDOUT|EAI_AGAIN|socket hang up/i.test(`${e.code} ${e.message}`))));
    req.end();
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export function pdfText(buf) {
  const which = spawnSync('pdftotext', ['-v']);
  if (which.error) return null;
  const dir = mkdtempSync(join(tmpdir(), 'srcpdf-'));
  try {
    writeFileSync(join(dir, 'a.pdf'), buf);
    const r = spawnSync('pdftotext', ['-q', '-layout', join(dir, 'a.pdf'), '-'], { maxBuffer: 64 * 1024 * 1024, timeout: 60000 });
    return r.status === 0 ? r.stdout.toString('utf8') : null;
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

// Read one source. Resolves { url, finalUrl, status, type, text } or { url, err, blocked }. Never throws.
export async function fetchSource(url, { timeout = 45000, tries = 4, maxRedirects = 6, log = () => {} } = {}) {
  let at = String(url);
  // No plain-HTTP route through the proxy: read the same address over https.
  if (/^http:\/\//i.test(at) && proxyFor(new URL(at).hostname)) at = at.replace(/^http:/i, 'https:');
  for (let hop = 0; hop <= maxRedirects; hop++) {
    let res; let last;
    for (let i = 0; i < tries; i++) {
      try { res = await once(at, { timeout }); if ([429, 503, 408].includes(res.status) && i < tries - 1) { last = new SourceError(`status ${res.status}`, `status ${res.status}`, true); res = null; } else break; }
      catch (e) { last = e; if (!e.retry) break; }
      const wait = 2000 * 2 ** i;
      log(`    retry ${i + 1} for ${at} in ${wait / 1000}s (${last.message})`);
      await sleep(wait);
    }
    if (!res) {
      const note = /^http:/i.test(url) && at.startsWith('https:') ? ' (an http:// source, read over https)' : '';
      return { url, err: `${last?.message || 'no answer'}${note}`, blocked: /^proxy 40[37]$/.test(last?.code || '') };
    }
    if (res.status >= 300 && res.status < 400 && res.headers.location) { at = new URL(res.headers.location, at).href; continue; }
    const type = String(res.headers['content-type'] || '').split(';')[0].trim();
    if (res.status >= 400) return { url, finalUrl: at, status: res.status, type, err: `status ${res.status}` };
    const isPdf = /pdf/i.test(type) || res.body.subarray(0, 5).toString() === '%PDF-';
    if (isPdf) {
      const t = pdfText(res.body);
      return t ? { url, finalUrl: at, status: res.status, type: 'application/pdf', text: t } : { url, finalUrl: at, status: res.status, type, err: 'a PDF, and pdftotext is not installed' };
    }
    if (!/html|text|xml|json/i.test(type)) return { url, finalUrl: at, status: res.status, type, err: `not a web page (${type || 'no type'})` };
    return { url, finalUrl: at, status: res.status, type, text: res.body.toString('utf8') };
  }
  return { url, err: 'too many redirects' };
}
