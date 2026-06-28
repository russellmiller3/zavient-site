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

export const collections = { insights };
