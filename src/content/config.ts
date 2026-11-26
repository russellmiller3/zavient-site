import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// One Insights article = this shape. Decap CMS edits these same fields.
// Prose (sections, "Ask your CEO" blockquotes, the "What kills these" list)
// lives in the Markdown body; structured metadata lives here.
const insights = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/insights' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    dek: z.string(),
    tag: z.string(),
    order: z.number().default(50),
    flagship: z.boolean().default(false),
    blurb: z.string(),
    ctaHeading: z.string().default('Send me the metric you want to move.'),
    ctaBlurb: z.string().default("Company URL, revenue motion, the number that matters. I'll tell you where I'd look first and whether an engagement is worth it."),
    ctaSubject: z.string().default('AI Value Creation'),
    stats: z.array(z.object({ num: z.string(), label: z.string() })).default([]),
    sources: z.array(z.object({ name: z.string(), url: z.string(), what: z.string(), conf: z.string() })).default([]),
  }),
});

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
    example: z.object({ input: z.string(), output: z.string() }),
    howToTest: z.array(z.string()).min(3),
    buyVsBuild: z.object({ buy: z.string(), build: z.string() }),
    watchOuts: z.array(z.string()).min(2),
    resources: z.array(link).min(1),
    sources: z.array(link).min(1),
    related: z.array(z.string()).default([]),
    keyword: z.object({ phrase: z.string(), searches: z.number(), cpc: z.number(), difficulty: z.number().nullable() }),
    updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    // Publish gate (26 Nov 2026): a page is indexed only when it carries a verdict, Zavient-only numbers and 3+ sources.
    // Every other page stays noindex. The optional blocks below are what an indexed page is built from.
    index: z.boolean().default(false),
    verdict: z.string().min(40).optional(),
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
  }).refine((d) => !d.index || (d.verdict && d.onPage.length >= 3 && d.stats.length >= 3 && d.sources.length >= 3), {
    message: 'an indexed AI-work page needs a verdict, an On this page list of 3+ items, 3+ Zavient numbers and 3+ sources',
  }),
});

// One data story = one JSON file in src/content/data-stories: a finding, one chart, the method and the sources.
// Each story also ships its chart as an embeddable SVG and its numbers as CSV, so other sites can cite and link it.
const datastory = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/data-stories' }),
  schema: z.object({
    title: z.string().min(20).max(90),
    description: z.string().min(50).max(160),
    dek: z.string().min(40),
    findings: z.array(z.string()).min(2),
    chart: z.object({
      title: z.string(), subtitle: z.string().default(''), unit: z.enum(['count', 'usd', 'percent']),
      // 'bar' compares categories; 'line' shows one series over time (labels are YYYY-MM).
      kind: z.enum(['bar', 'line']).default('bar'),
      // Named first in the chart's credit line when the numbers come from someone else's data (CC BY needs it).
      creditSource: z.string().optional(),
      bars: z.array(z.object({ label: z.string(), value: z.number(), note: z.string().optional() })).min(3),
    }),
    method: z.array(z.string()).min(2),
    sources: z.array(link).min(1),
    updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
});

export const collections = { insights, aiwork, datastory };
