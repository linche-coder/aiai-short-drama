import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const source = 'E:/工作/0907-短剧封面';
const brand = 'C:/Users/51543/Desktop/导出图片/爱爱短剧LOGO';
const map = JSON.parse(await fs.readFile('.local/contact-map.json', 'utf8'));
const picks = [5, 8, 3, 17, 4, 14, 15, 23, 26, 27, 29, 34, 1, 2, 6, 11, 20, 25];
await fs.mkdir('public/assets/covers', { recursive: true });
await fs.mkdir('public/assets/brand', { recursive: true });
await fs.copyFile(path.join(brand, 'LOGO · 透明矢量版.svg'), 'public/assets/brand/logo.svg');
await fs.copyFile(path.join(brand, 'LOGO ·单LOGO.svg'), 'public/assets/brand/icon.svg');
const manifest = [];
for (const n of picks) {
  const input = path.join(source, map[n - 1]);
  const id = `drama-${String(n).padStart(2, '0')}`;
  await sharp(input).resize({ width: 540, withoutEnlargement: true }).webp({ quality: 86 }).toFile(`public/assets/covers/${id}.webp`);
  await sharp(input).resize({ width: 300, withoutEnlargement: true }).webp({ quality: 78 }).toFile(`public/assets/covers/${id}-small.webp`);
  await sharp(input).resize({ width: 80 }).blur(5).webp({ quality: 65 }).toFile(`public/assets/covers/${id}-ambient.webp`);
  manifest.push({ id, originalFile: map[n - 1], originalSize: '651 × 868', displaySize: '540 × 720', titleSource: '人工核对原始封面文字；页面使用简体字' });
}
await fs.writeFile('public/assets/manifest.json', JSON.stringify(manifest, null, 2));
console.log(`Prepared ${picks.length} covers and unchanged brand SVGs.`);
