import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { TYPES, COMMON_REQUIRED, MIN } from '../lib/page-types.mjs';

// One AI-work page = one JSON file in src/content/ai-work. The schema is strict on purpose: these pages are
// written and refreshed by an AI, so a missing source, a missing offer or a malformed field fails the build
// instead of shipping. Keyword fields are for planning and are never rendered.
const link = z.object({ name: z.string().min(2), url: z.string().url(), what: z.string().min(10) });
const aiwork = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/ai-work' }),
  schema: z.object({
    title: z.string().min(10).max(70),
    description: z.string().min(50).max(160),
    job: z.string(),
    industry: z.string().default('any industry'),
    summary: z.string().min(80),
    // Golden templates (26 Nov 2026): a page with templateVersion follows its type's block order and requirements in
    // src/lib/page-types.mjs. Pages without it are the first pages and keep the layout they shipped with.
    type: z.enum(Object.keys(TYPES) as [string, ...string[]]).default('usecase'),
    templateVersion: z.number().int().optional(),
    topic: z.string().optional(),
    headings: z.record(z.string()).default({}),
    example: z.object({ input: z.string(), output: z.string() }).optional(),
    howToTest: z.array(z.string()).default([]),
    buyVsBuild: z.object({ buy: z.string(), build: z.string() }).optional(),
    watchOuts: z.array(z.string()).default([]),
    humanRole: z.array(z.string().min(15)).default([]),
    teamAfter: z.array(z.string().min(15)).default([]),
    walkAway: z.array(z.string().min(15)).default([]),
    forward: z.array(z.string().min(10)).default([]),
    applies: z.array(z.object({ if: z.string(), then: z.string() })).default([]),
    faq: z.array(z.object({ q: z.string().min(10), a: z.string().min(20) })).default([]),
    ranked: z.array(z.object({ name: z.string(), slug: z.string().optional(), why: z.string(), payoff: z.string() })).default([]),
    decisions: z.array(z.object({ decision: z.string(), know: z.string() })).default([]),
    tool: z.object({ embed: z.string().regex(/^\/tools\/embed\/[a-z0-9-]+\.html$/), steps: z.array(z.string()).min(3), method: z.array(z.string()).min(3) }).optional(),
    timeline: z.array(z.object({ date: z.string(), what: z.string() })).default([]),
    // Crossings only: the work playbook this page narrows, and the industry's slug. Address: /ai-work/<parent>/<industrySlug>.html
    parent: z.string().regex(/^[a-z0-9-]+$/).optional(),
    industrySlug: z.string().regex(/^[a-z0-9-]+$/).optional(),
    differs: z.array(z.object({ what: z.string(), how: z.string() })).default([]),
    // ICP review log, in order (Russell, 26 Nov 2026). Never rendered; the publish gate checks it.
    reviews: z.array(z.object({ reader: z.string(), notes: z.string() })).default([]),
    resources: z.array(link).min(1),
    sources: z.array(link).min(1),
    related: z.array(z.string()).default([]),
    keyword: z.object({ phrase: z.string(), searches: z.number(), cpc: z.number(), difficulty: z.number().nullable() }),
    updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    // Publish gate (26 Nov 2026): a page is indexed only when it carries a verdict, Zavient-only numbers and 3+ sources.
    // Every other page stays noindex. The optional blocks below are what an indexed page is built from.
    index: z.boolean().default(false),
    // Bottom line as 3-5 short bullets (26 Nov 2026, Russell): "In the bottom line, you have to make it bullets that are
    // easy to scan." Each bullet is one idea with a footnote; scripts/check-readability.mjs caps its length.
    verdict: z.array(z.string().min(15)).min(3).max(5).optional(),
    // Top of page (26 Nov 2026, Russell: "the top should be very BLUF and tell the reader what the content is on the
    // rest of the page"): the verdict leads, then this list of what the page covers, each linking to its section.
    onPage: z.array(z.object({ to: z.string().regex(/^[a-z0-9-]+$/), text: z.string().min(10) })).default([]),
    pickElse: z.array(z.string()).default([]),
    stats: z.array(z.object({ num: z.string(), label: z.string(), source: z.string() })).default([]),
    ownData: z.object({ title: z.string(), intro: z.string(), headers: z.array(z.string()), rows: z.array(z.array(z.string())), note: z.string() }).optional(),
    tables: z.array(z.object({
      title: z.string(), intro: z.string(), headers: z.array(z.string()),
      rows: z.array(z.object({ name: z.string(), url: z.string().url().optional(), cells: z.array(z.string()) })),
      note: z.string().optional(),
    })).default([]),
    recipes: z.array(z.object({ name: z.string(), when: z.string(), flow: z.array(z.string()).min(2), cost: z.string() })).default([]),
    rules: z.array(z.object({ name: z.string(), url: z.string().url(), status: z.string(), what: z.string() })).default([]),
    spokes: z.array(z.object({ slug: z.string(), why: z.string() })).default([]),
    offer: z.object({ heading: z.string(), body: z.string() }).optional(),
    recipesTitle: z.string().default('Three ways to build it'),
    testTitle: z.string().default('How to benchmark AI on this job before you buy'),
  }).superRefine((d, ctx) => {
    const need = (ok, message) => { if (!ok) ctx.addIssue({ code: z.ZodIssueCode.custom, message }); };
    if (!d.templateVersion) {
      need(d.example && d.buyVsBuild && d.howToTest.length >= 3 && d.watchOuts.length >= 2, 'a page without templateVersion needs example, buyVsBuild, 3+ howToTest and 2+ watchOuts');
      need(!d.index || (d.verdict && d.onPage.length >= 3 && d.stats.length >= 3 && d.sources.length >= 3), 'an indexed AI-work page needs a verdict, an On this page list of 3+ items, 3+ Zavient numbers and 3+ sources');
      return;
    }
    need(d.type !== 'crossing' || (d.parent && d.industrySlug), 'a crossing page needs parent (its work playbook slug) and industrySlug, which make its address');
    if (!d.index) return; // drafts may build half-filled; they stay noindex
    const t = TYPES[d.type];
    for (const f of [...COMMON_REQUIRED, ...t.required]) {
      const v = d[f];
      need(v !== undefined && v !== null && (!Array.isArray(v) || v.length > 0), `an indexed ${d.type} page needs ${f}`);
    }
    need(d.sources.length >= MIN[t.minSources || 'sources'], `an indexed ${d.type} page needs ${MIN[t.minSources || 'sources']}+ sources`);
  }),
});

export const collections = { aiwork };
