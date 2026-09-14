import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
await fs.mkdir('docs/round-2', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, reducedMotion: 'reduce' });
await page.goto('http://localhost:5173');
await page.locator('.intro').waitFor({ state: 'detached' });
const dimensions = {};
for (const width of [1280, 1440, 1920, 390]) {
  await page.setViewportSize({ width, height: 1000 });
  await page.screenshot({ path: `docs/round-2/before-${width}.png`, fullPage: true });
  dimensions[width] = await page.evaluate(() => ({ heroHeight: document.querySelector('.hero').getBoundingClientRect().height, stageWidth: document.querySelector('.carousel-stage').getBoundingClientRect().width, posterWidth: document.querySelector('.hero-poster.offset-0').getBoundingClientRect().width, cardWidth: document.querySelector('.drama-card').getBoundingClientRect().width }));
}
await fs.writeFile('docs/round-2/before-metrics.json', JSON.stringify(dimensions, null, 2));
console.log(dimensions);
await browser.close();
