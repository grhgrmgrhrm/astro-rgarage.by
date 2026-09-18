import { visit } from 'unist-util-visit';

/**
 * Rehype plugin: prepend Astro `base` to internal absolute links
 * inside markdown content. Fixes /uslugi/... → /{base}uslugi/...
 */
export function rehypeBaseLinks({ base = '/' } = {}) {
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;

  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'a') return;
      const href = node.properties?.href;
      if (typeof href !== 'string') return;

      // Only internal absolute links: /foo, but not //foo (protocol-relative)
      if (href.startsWith('/') && !href.startsWith('//')) {
        // Skip if already prefixed with base
        if (normalizedBase && !href.startsWith(normalizedBase + '/')) {
          node.properties.href = normalizedBase + href;
        }
      }
    });
  };
}
