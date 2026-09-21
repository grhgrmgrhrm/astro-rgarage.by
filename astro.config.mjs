import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import { rehypeBaseLinks } from './scripts/rehype-base-links.mjs';

const base = '/';

export default defineConfig({
  site: 'https://rgarage.by',
  base,
  integrations: [
    sitemap(),
    mdx(),
  ],
  markdown: {
    rehypePlugins: [
      [rehypeBaseLinks, { base }],
    ],
  },
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
});
