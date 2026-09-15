import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const folder = path.resolve('.local/round2-record');
const output = path.resolve('docs/round-2');
await fs.mkdir(folder, { recursive: true });
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, reducedMotion: 'no-preference' });
const cdp = await page.context().newCDPSession(page);
const frames = [], writes = [], errors = [];
page.on('pageerror', error => errors.push(error.message));
cdp.on('Page.screencastFrame', event => {
  const file = path.join(folder, `frame-${String(frames.length).padStart(5, '0')}.jpg`);
  frames.push({ file, timestamp: event.metadata.timestamp });
  writes.push(fs.writeFile(file, Buffer.from(event.data, 'base64')));
  void cdp.send('Page.screencastFrameAck', { sessionId: event.sessionId });
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: 1280, maxHeight: 1000, everyNthFrame: 1 });
await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
const start = performance.now();
for (const milliseconds of [650, 1650, 2550, 3250, 3950]) {
  await page.waitForTimeout(Math.max(0, milliseconds - (performance.now() - start)));
  await page.screenshot({ path: path.join(output, `intro-${milliseconds}ms.png`) });
}
await page.locator('.hero-poster.offset-0 .hero-surface').hover();
await page.waitForTimeout(600);
await page.screenshot({ path: path.join(output, 'hover-motion-final.png') });
await page.getByRole('button', { name: '查看短剧', exact: true }).click();
await page.waitForTimeout(900);
await page.keyboard.press('Escape');
await page.waitForTimeout(700);
await page.locator('#browse').evaluate(el => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
await page.waitForTimeout(300);
const button = name => page.getByRole('group', { name: '题材筛选' }).getByRole('button', { name, exact: true });
await button('古装').click(); await page.waitForTimeout(700);
await button('全部').click(); await page.waitForTimeout(700);
await button('奇幻').click(); await page.waitForTimeout(700);
await page.locator('.drama-card').first().click();
await page.waitForTimeout(900);
await page.keyboard.press('Escape');
await page.waitForTimeout(700);
await button('全部').click();
await page.waitForTimeout(700);
await cdp.send('Page.stopScreencast');
await Promise.all(writes);
await browser.close();
let concat = '';
for (let i = 0; i < frames.length; i++) {
  concat += `file '${frames[i].file.replaceAll('\\', '/')}'\nduration ${i + 1 < frames.length ? Math.max(.01, frames[i + 1].timestamp - frames[i].timestamp).toFixed(4) : '0.6'}\n`;
}
concat += `file '${frames.at(-1).file.replaceAll('\\', '/')}'\n`;
await fs.writeFile(path.join(folder, 'frames.txt'), concat);
const rendered = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(folder, 'frames.txt'), '-fps_mode', 'vfr', '-c:v', 'libx264', '-preset', 'fast', '-crf', '19', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(output, 'motion-review.mp4')], { encoding: 'utf8', windowsHide: true });
if (rendered.status !== 0) throw Error(rendered.stderr || rendered.error?.message);
const report = { frames: frames.length, seconds: +(frames.at(-1).timestamp - frames[0].timestamp).toFixed(2), errors, method: 'Actual Chromium Page.screencastFrame events with original presentation timestamps, encoded to variable-frame-rate MP4. No synthetic tween frames.' };
await fs.writeFile(path.join(output, 'recording.json'), JSON.stringify(report, null, 2));
console.log(report);
