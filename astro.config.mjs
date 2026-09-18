import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import { rehypeBaseLinks } from './scripts/rehype-base-links.mjs';

const base = '/astro-rgarage.by/';

export default defineConfig({
  site: 'https://grhgrmgrhrm.github.io',
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
