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
      'kitajskie',
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

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    metaTitle: z.string(),
    description: z.string(),
    slug: z.string(),
    pubDate: z.string(),
    serviceSlug: z.string().optional(),
    category: z.string().default('news'),
    image: z.string().optional(),
    author: z.string().optional(),
    dateModified: z.string().optional(),
  }),
});

export const collections = { services, news };
