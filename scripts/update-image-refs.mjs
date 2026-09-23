import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';

const EXTS = new Set(['.md', '.astro', '.css', '.ts', '.tsx', '.mjs']);

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (EXTS.has(extname(p))) yield p;
  }
}

let files = 0, hits = 0;
for (const file of walk('src')) {
  const src = readFileSync(file, 'utf8');
  let count = 0;
  const out = src.replace(/(\/images\/[\w./-]+?)\.(jpg|jpeg|png)\b/gi, (m, p) => {
    if (/logo\.png$|favicon\.png$/i.test(m)) return m;
    count++;
    return p + '.webp';
  });
  if (count) { writeFileSync(file, out); files++; hits += count; }
}
console.log(`Updated ${hits} refs in ${files} files`);
