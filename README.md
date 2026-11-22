# Zavient site (zavient.com)

The public site for Zavient LLC. Pushing to `master` on GitHub publishes it through Vercel.

- The home page is one file: `public/index.html`, styled by `public/styles.css`.
- Articles live in `src/content/insights/` and are built by Astro.
- The brand line "Moneyball for revenue systems" is frozen. Do not change it.

## Change log

- 2026-11-22: Added a "Data evaluation" section to the home page, with a menu link. It offers a test of a
  company's records before the company licenses them to an AI buyer: a counted inventory, and one model scored
  with the records and without them. Why: Zarlent (zarlent.com) now has a page explaining this test and names
  Zavient as who runs it, and Zavient's site said nothing about it. The section reuses the existing two-column
  list layout, so no style rule changed. Checked in a browser at desktop width: the section renders, the menu
  does not overflow. Not checked: phone width. Next step: a real worked example to replace the fund-report
  benchmark as proof.
