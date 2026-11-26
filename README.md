# Zavient site (zavient.com)

The public site for Zavient LLC. Pushing to `master` on GitHub publishes it through Vercel.

- The home page is one file: `public/index.html`, styled by `public/styles.css`.
- Articles live in `src/content/insights/` and are built by Astro.
- AI-work pages live in `src/content/ai-work/` and data stories in `src/content/data-stories/`, one JSON file each.
  The schema in `src/content/config.ts` refuses a page without sources. Run `npm test` before every commit and
  `node scripts/check-links.mjs` after adding sources.
- The brand line "Moneyball for revenue systems" is frozen. Do not change it.

## Sitemap and IndexNow (automatic)

- `dist/sitemap.xml` is built on every build by `src/integrations/sitemap.mjs` from the pages that shipped. Indexable
  pages are in it; noindex pages and pages whose canonical points elsewhere are not. `lastmod` comes from the page's
  `updated` date (pass `updated="YYYY-MM-DD"` to `Base.astro`). Never hand-edit a sitemap. A new page is listed as
  soon as it builds, and `npm test` fails if any indexable page is missing.
- On every push to `master`, `.github/workflows/indexnow.yml` sends IndexNow (Bing and others) the URLs that are new
  or changed, after Vercel serves the new sitemap. Google reads the sitemap from `robots.txt` and Search Console.

## Change log

- 2026-11-26: Sitemap now builds itself from each build, with lastmod per page; the hand-made sitemap.xml and
  sitemap-ai.xml are gone (/sitemap-ai.xml redirects). Added IndexNow on deploy. Why: Russell asked for the sitemap to
  update itself when a page is published. Proof: `npm test` 16 of 16; removing a page from the sitemap fails the test.

- 2026-11-26 (branch feature/finance-pages, not live): Rebuilt 5 AI-work pages (AI consulting services hub,
  document processing, invoice processing, underwriting, credit scoring) to a publish gate: a verdict, Zavient-only
  numbers, 3+ sources, tool and price tables, build recipes and rules. They are indexed and in the AI sitemap; the
  other 16 stay noindex. Their offer now sells AI consulting with the benchmark as step one. The schema refuses an
  indexed page without a verdict. Why: Russell asked for the top pages to be "really really good and useful" and for
  the offer to sell AI consulting services. Proof: `npm test` 5 of 5 pass. Not checked: live, until merged.
- 2026-11-25, after going live: Fixed the menu's Insights, AI work and Data links, which returned 404 on
  zavient.com because Vercel serves only exact file paths (/data.html, never /data). The Insights link had been
  broken before this work too. Added a site test that every internal link names a real file; it failed on the 3
  menu links (about 75 pages each) before the fix and passes after. Why: readers clicking the menu hit a dead end.

- 2026-11-25, later (same branch): Added a trend story, the share of US job ads that mention AI from 2019 to
  October 2026 (Indeed Hiring Lab data, credited on the chart), drawn by a new line chart. Added a monthly
  store that counts which AI models, software and skills job ads name (`docs/ai-work-site/job-data/mentions.py`).
  Fixed a wrong date range on the 4 job-ad stories: the ads were posted 21 to 25 Nov 2026, not over 30 days.
  Per-ad job data no longer goes into git. Why: Russell asked for trends over time of what job ads mention.
  Proof: site tests 3 of 3 and mention-counter tests 4 of 4 pass through Runner; removing the maker exclusion
  made a test fail. Not checked: Vercel preview.

- 2026-11-25 (branch feature/ai-work-pages, not live): Added 20 "AI work" pages (one per job companies buy AI
  for, each ending with the custom-benchmark offer), 4 data stories from 2,046 US AI job ads (each with an
  embeddable chart and CSV), hubs at /ai-work and /data, a menu link to each, a second sitemap, and 3 tests.
  Why: turn search demand for AI work into consulting leads, and earn links with original data. Proof: `npm test`
  passes 3 of 3 and fails when the offer block is removed; the link check finds 0 broken links (ftc.gov,
  jamanetwork.com and dl.acm.org block checkers). Checked in a browser at desktop and 390-pixel width: no
  sideways scroll. Not checked: Vercel preview. Next step: Russell reviews, then merge to master to publish.

- 2026-11-22: Added a "Data evaluation" section to the home page, with a menu link. It offers a test of a
  company's records before the company licenses them to an AI buyer: a counted inventory, and one model scored
  with the records and without them. Why: Zarlent (zarlent.com) now has a page explaining this test and names
  Zavient as who runs it, and Zavient's site said nothing about it. The section reuses the existing two-column
  list layout, so no style rule changed. Checked in a browser at desktop width: the section renders, the menu
  does not overflow. Not checked: phone width. Next step: a real worked example to replace the fund-report
  benchmark as proof.
