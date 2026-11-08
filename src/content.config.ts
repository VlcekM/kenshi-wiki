import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const row = z.tuple([z.string(), z.string()]);

// Articles imported from the Kenshi Fandom wiki by scripts/import-fandom.mjs. The file name is the page's URL.
const wiki = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/wiki', generateId: ({ entry }) => entry.replace(/\.md$/, '') }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    source: z.object({ title: z.string(), revision: z.number() }),
    categories: z.array(z.string()).default([]),
    infobox: z.object({
      title: z.string(),
      groups: z.array(z.object({ heading: z.string().nullable(), rows: z.array(row) })),
    }).optional(),
  }),
});

export const collections = { wiki };
