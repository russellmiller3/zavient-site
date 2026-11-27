# Zavient Growth & Conversion Fixes — Checklist & Next-Agent Notes

**Date:** 2026-11-27  
**Repo:** `github.com/russellmiller3/zavient-site`  
**Live site:** `https://zavient.com` (Cloudflare Worker `zavient-site` + Vercel rollback)  
**Related local repo:** `/Users/russellmiller/.gemini/antigravity/scratch/zarlent-review` (`zarlent.com`)

---

## 1. Context & Diagnosis (Read First)

As of 27 Nov 2026, Zavient has **61 indexed research-backed pages** (2,814 cited sources across 62 JSON files), **6 interactive tools** in `public/tools/embed/`, and a **15-question AI Readiness Assessment** (`public/ai-readiness-assessment.html`).  
The bottleneck was **not content quantity**—it was **conversion leaks, zero telemetry, zero distribution signals, and hidden assets**. All automatable code/UX/SEO fixes (Section 3A below) are now implemented and verified against all 104 automated tests (`npm test`). Remaining manual items requiring Russell's accounts are in Section 3B.

---

## 2. Hard Rules & Test Constraints (Do Not Break!)

Run `npm test` before every commit (`node scripts/check-page.mjs --indexed && astro build && node --test tests/*.mjs`). Key invariants enforced by tests:

1. **No Russell name outside `/about.html`:** `tests/site.test.mjs` fails if any AI-work page matches `/Russell/`. Keep founder name strictly on `/about.html`; use firm-level operator proof elsewhere.
2. **No Zavient prices anywhere:** `tests/no-own-price.test.mjs` scans every built `.html` and `.txt` file in `dist/` (including `llms.txt`) and fails on any Zavient price/range. Market/vendor prices are allowed.
3. **ADHD-friendly readability (`scripts/check-readability.mjs`):** Checked on all indexed JSON pages AND hand-built HTML pages (`index.html`, `about.html`, `ai-work.html`, `ai-readiness-assessment.html`). Every `<p>` and `<li>` must have **≤ 25 words per sentence** and **≤ 3 sentences per paragraph/list item**.
4. **Auto-sitemap + `llms.txt` (`src/integrations/sitemap.mjs` + `tests/site.test.mjs`):** Every non-`noindex` `.html` page in `dist/` (except `404.html`) MUST pass `updated="YYYY-MM-DD"` to `Base.astro` so `<meta property="article:modified_time">` exists for `<lastmod>`.
5. **Exact `.html` internal links:** `tests/site.test.mjs` verifies every `href="/..."` points to a real file in `dist/`. Never drop `.html` (except `/`).
6. **No nested `<a>` inside `<a>`:** Enforced across all built HTML files.
7. **Cloudflare Worker + redirects parity (`tests/site.test.mjs`):**
   - `wrangler.jsonc` keeps `assets.directory = "./dist"`, `assets.html_handling = "none"`, `assets.not_found_handling = "404-page"`, `assets.run_worker_first = ["/", "/api/lead"]`, `previews = {}`.
   - `public/_redirects` MUST exactly mirror `vercel.json` redirects.
8. **Layout guards (`tests/layout-guards.test.mjs`):** Preserve `.nav-away` slide-away mobile menu script in `Base.astro`, `.sticky-toc`, nested list padding, and ranked list numbering in `public/ai-work/ai-work.css`.
9. **Golden template 4 diagnostic spots:** Every `templateVersion` page must emit `data-diag` in exact order `['bottom-line', 'beside-proof', 'sticky', 'end']`.

---

## 3. Execution Checklist

### A. Code & Site Fixes (Completed 27 Nov 2026)
- [x] **A1. On-site diagnostic request form + Cloudflare Worker `/api/lead` receiver**
  - Added compact diagnostic form inside `src/components/ConsultingCta.astro` (Name, Work email, Company/Role, Workflow note + honeypot `company_fax`) with `POST /api/lead` and automatic pre-filled `mailto:hello@zavient.com` + "Copy brief" fallback if edge secret isn't set yet.
  - Added `POST /api/lead` handler to `worker/index.js` (Zarlent `LEAD_SHEET_URL` Google Sheets webhook pattern) and updated `wrangler.jsonc` + `tests/site.test.mjs`.
- [x] **A2. Surface the 6 Free Interactive Tools & Balance Homepage Grids**
  - Added `Free tools` link in `Base.astro` top nav (`/ai-work.html#tools`) and `#diagnostic` nav CTA so visitors land on the working form + calendar choice instead of jumping cold to Calendly.
  - Added **"Free interactive tools"** section on `src/pages/index.astro` linking all 6 interactive tools, balanced both 7-card grids to symmetrical 8-card (4×2) grids, added firm-level **"Who you work with"** proof block, and restored `#data-evaluation` anchor for Zarlent's cross-link (`zarlent.com/data-evaluation-before-licensing/`).
- [x] **A3. Upgrade `/ai-work.html` Hub (`src/pages/ai-work/index.astro`)**
  - Removed `noindex`, added `canonical` + `updated="2026-11-27"`, and built instant search + category filter pills (`All`, `Free tools`, `Industries`, `Workflows`, `Consulting`, `Comparisons`) with `#tools` hash auto-filter.
- [x] **A4. Tool Page Conversion & UX Improvements**
  - Added above-the-fold `Jump straight to the interactive tool ↓` button on `type === 'tool'` pages in `src/components/AiWorkPage.astro`.
  - Added **"Copy 1-page CEO summary"** button + pre-filled email body on `public/ai-readiness-assessment.html` results screen.
- [x] **A5. Social Sharing (OG/Twitter Tags), Branded OG Card & `llms.txt`**
  - Generated branded `public/og-card.png` (1200×630) + `public/og-card.svg` and wired full Open Graph + Twitter Card meta tags in `src/layouts/Base.astro`.
  - Extended `src/integrations/sitemap.mjs` to auto-generate `dist/llms.txt` on every build.
- [x] **A6. Real `404.html`, `/privacy.html`, Footer Trust Links & Analytics Hook**
  - Created `src/pages/404.astro` (wired via `not_found_handling: "404-page"`) and `src/pages/privacy.astro`.
  - Upgraded footer in `Base.astro` (`Free tools`, `About`, `Privacy`, `LinkedIn`, `Email us`).
  - Added optional Cloudflare Web Analytics beacon hook in `Base.astro` (`PUBLIC_CF_BEACON_TOKEN`).
- [x] **A7. Eliminate All 6 Orphaned Indexed Pages**
  - Linked `ai-roadmap-builder` from homepage `#tools`, `ai-collections` from `community-banks-credit-unions.json`, `ai-procurement` from `supply-chain-logistics.json`, `wealth-management` from `private-equity.json`, `zapier-vs-make-vs-workato` from `ai-automation-consulting.json`, and `ai-consulting-small-business` from `ai-for-operations-leaders.json`.
- [x] **A8. Full Verification (`npm test`)**
  - All 61 indexed page checks, readability checks, price checks, Worker `/api/lead` tests, link checks, sitemap/llms.txt checks, and layout guards pass (`104/104`).

### B. Manual Actions Only Russell Can Do (5–10 Minutes Total)
- [x] **B1. Verify/Fix Booking Link** — Completed 27 Nov 2026: replaced all 14 broken `https://calendly.com/zavient/call` links across pages, components, readiness check, all 6 embedded tools, and tests with `https://calendar.app.google/2xXiMLiamRFtfFKH9`.
- [x] **B5a. Add Founder Headshot** — Completed 27 Nov 2026: optimized `/Users/russellmiller/Desktop/Personal/Zavient/resumes/profile_image.jpg` -> `public/russell-miller.jpg` (480×480) and added responsive founder card to `src/pages/about.astro`.
- [ ] **B2. Verify `hello@zavient.com` Delivery**
  - Send a test email to `hello@zavient.com` and verify it reaches your inbox (archived site used `rmiller@zavient.com`).
- [ ] **B3. Finish Cloudflare DNS Cutover + Secrets + Analytics**
  - Point `zavient.com` DNS from Vercel to Cloudflare Worker `zavient-site` (activates `POST /api/lead` and custom `404.html`).
  - Add `LEAD_SHEET_URL` encrypted secret on Cloudflare Worker `zavient-site` (reusing the same Google Apps Script receiver pattern as Zarlent's `leads-to-sheet.gs`).
  - Turn on Cloudflare Web Analytics for `zavient.com` (either auto-injected via Cloudflare dashboard or by setting `PUBLIC_CF_BEACON_TOKEN`).
- [ ] **B4. Submit Sitemap in Google Search Console & Bing Webmaster Tools**
  - Submit `https://zavient.com/sitemap.xml` and request indexing for `/` and `/ai-work.html` to break out of the `zaviant.com` spelling-correction shadow.
- [ ] **B5b. Launch Outbound Sprint** — Ready-to-send 20-target kit + clickable launchpad created 27 Nov 2026 (plus 27 existing unsent Gmail drafts in `rmiller@zavient.com`).
- [ ] **B6. Sync Local Checkout (`~/Desktop/code/zavient-site-live`)**
  - Run `git pull` in your local `zavient-site` checkout after verifying GitHub `master`.
