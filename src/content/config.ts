import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { pageSchema } from '../lib/page-schema.mjs';

// One AI-work page = one JSON file in src/content/ai-work. The schema is strict on purpose: these pages are
// written and refreshed by an AI, so a missing source, a missing offer or a malformed field fails the build
// instead of shipping. Keyword fields are for planning and are never rendered.
// The schema itself lives in src/lib/page-schema.mjs, so scripts/check-page.mjs validates against the same one.
const aiwork = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/ai-work' }),
  schema: pageSchema,
});

export const collections = { aiwork };
