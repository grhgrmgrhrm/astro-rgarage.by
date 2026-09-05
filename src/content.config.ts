import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    metaTitle: z.string(),
    description: z.string(),
    slug: z.string(),
    category: z.enum([
      'avtoelektrika',
      'diagnostics',
      'kuzov',
      'other',
      'services',
      'shinomontazh',
      'turbin',
      'slesarnye',
      'evakuator',
      'geo',
    ]),
    image: z.string(),
    priceFrom: z.string().optional(),
    executionTime: z.string().optional(),
    featured: z.boolean().default(false),
    relatedServices: z.array(z.string()).default([]),
  }),
});

export const collections = { services };
