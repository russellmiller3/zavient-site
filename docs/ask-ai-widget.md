# Ask AI on Zavient

The lower-right launcher is added by `src/layouts/Base.astro`. Change starter questions, button labels, or the diagnostic link there. It uses current page text and `llms.txt` in index mode, which matches Zavient's file-style Astro pages.

## Update the widget

The canonical kit checkout is `~/Desktop/code/ask-ai-widget`. Make reusable changes there, run `node test.mjs`, then run the following from the kit. Review the Zavient diff and run `npm test` from the Zavient checkout.

```sh
node scripts/install.mjs workers ~/Desktop/code/zavient-site-live
```

The installer refreshes `public/assets/ask-ai-widget.{js,css}`, `worker/ask-ai-kit/` and `ask-ai-migrations/`. The site's router, layout, config and privacy disclosure are maintained here. In the kit, see `MAINTAINING.md` for behavior, tests and incident handling.

## Adjust the answer and scope

- Set `ASK_AI_SYSTEM_PROMPT` in Worker configuration to replace the default style from the kit's `server/prompt.mjs`. Keep instructions about Zavient in the site's configuration so the kit stays portable.
- Change `ASK_AI_SITE_SCOPE` in `wrangler.jsonc` to revise which subjects the assistant can answer. Relevant business workflows, data, role and goals are in scope. Test an unrelated question and an ambiguous one along with the new intended topics.
- Edit discovery questions, suggested actions, and SVG flow behavior in the kit. The answer contract lives in `server/reply.mjs`.

## Cloudflare production setup

1. Run `npm test`. Provision a D1 database named `zavient-ask-ai` with `npx wrangler d1 create zavient-ask-ai`, or reuse the existing database of that name. Record the database's ID in the `ASK_AI_DB` entry in `wrangler.jsonc`. Use a separate database for preview when preview needs data isolation.
2. Run `npx wrangler d1 migrations apply ASK_AI_DB --remote` to create the usage and transcript tables before deploying. For local testing, use `--local`.
3. Add a random owner secret with `npx wrangler secret put ASK_AI_ADMIN_TOKEN`. Keep the secret out of source and browser assets. Open `/api/ask-transcripts` and use `owner` as the username and the secret as the password.
4. The Worker declares Workers AI, a rate limit for questions and leads, and a dedicated `ASK_AI_EMAIL` binding restricted to the verified sender. The sender is `tracking@alerts.zavient.com`, the verified domain address already used by Zavient tracking alerts. For a sender change, update the binding allowlist and `ASK_AI_EMAIL_FROM` together.
5. Deploy through the site's normal Cloudflare Workers workflow. Verify the widget with a site question, unrelated question, highlighted passage, generated diagram and suggested question. Verify an anonymous chat appears in the private owner archive. Use an authorized test recipient for **Email me this chat** and verify delivery goes only to that address.

A missing D1 binding or migration leaves chat available without the archive, usage counts or visitor email. Missing email settings disable the contact form. Failed delivery or D1 writes appear as named Ask AI events in Worker logs.

## View usage

```sh
curl -fsS -H "Authorization: Bearer ${ASK_AI_ADMIN_TOKEN}" \
  'https://zavient.com/api/ask-usage'
```

Use `?period=daily`, `?period=weekly` or `?period=monthly` for one view. Counts start when the database is configured. Each UTC bucket reports answered messages and how many distinct chats had a reply in that period. A scope redirect counts as a reply.
