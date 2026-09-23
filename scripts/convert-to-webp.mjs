import { readdirSync, statSync, unlinkSync } from 'node:fs';
import { join, extname } from 'node:path';
import sharp from 'sharp';

const ROOT = 'public/images';
const KEEP = new Set(['logo.png', 'favicon.png']);
const MAX_SIZE = 1600;
const QUALITY = 82;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}

let converted = 0, saved = 0;
for (const file of walk(ROOT)) {
  const ext = extname(file).toLowerCase();
  const base = file.split(/[\\/]/).pop();
  if (!['.jpg', '.jpeg', '.png'].includes(ext) || KEEP.has(base)) continue;

  const out = file.slice(0, -ext.length) + '.webp';
  const before = statSync(file).size;
  await sharp(file)
    .resize({ width: MAX_SIZE, height: MAX_SIZE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(out);

  const after = statSync(out).size;
  saved += before - after;
  unlinkSync(file);
  converted++;
}
console.log(`Converted: ${converted} files, saved ${(saved / 1024 / 1024).toFixed(1)} MB`);
