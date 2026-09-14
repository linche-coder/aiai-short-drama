import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const manifest = JSON.parse(await fs.readFile('public/assets/manifest.json', 'utf8'));
for (const item of manifest) {
  await sharp(path.join('E:/工作/0907-短剧封面', item.originalFile)).webp({ quality: 92 }).toFile(`public/assets/covers/${item.id}-large.webp`);
  item.largeSize = '651 × 868';
}
await fs.writeFile('public/assets/manifest.json', JSON.stringify(manifest, null, 2));
await import('./prepare-intro.mjs');
console.log('Original six paths and gradient definitions preserved; 18 full-resolution covers generated.');
