import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const source = 'E:/工作/0907-短剧封面';
await fs.mkdir('.local', { recursive: true });
const files = (await fs.readdir(source)).filter(f => /\.(jpg|png|webp)$/i.test(f));
const metadata = await Promise.all(files.map(async name => {
  const { width, height } = await sharp(path.join(source, name)).metadata();
  return { name, width, height, ratio: +(width / height).toFixed(3) };
}));
await fs.writeFile('.local/asset-inventory.json', JSON.stringify(metadata, null, 2));
const dimensions = {};
for (const item of metadata) { const key = `${item.width}x${item.height}`; dimensions[key] = (dimensions[key] || 0) + 1; }
console.log(JSON.stringify({ count: files.length, dimensions }, null, 2));
const selection = files.filter(f => f.startsWith('NetShort')).slice(0, 36);
const composites = await Promise.all(selection.map(async (file, i) => ({
  input: await sharp(path.join(source, file)).resize(175, 244, { fit: 'contain', background: '#121318' }).extend({ bottom: 26, background: '#121318' }).composite([{ input: Buffer.from(`<svg width="175" height="26"><text x="8" y="18" font-size="16" fill="white">${i + 1}</text></svg>`), top: 244, left: 0 }]).png().toBuffer(),
  left: (i % 9) * 180, top: Math.floor(i / 9) * 275,
})));
await sharp({ create: { width: 1620, height: 1100, channels: 3, background: '#121318' } }).composite(composites).jpeg({ quality: 90 }).toFile('.local/contact-sheet.jpg');
await fs.writeFile('.local/contact-map.json', JSON.stringify(selection, null, 2));
