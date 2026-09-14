import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const phase = process.argv[2] || 'after';
const out = process.argv[3] || 'docs/round-3';
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
await page.addInitScript(() => sessionStorage.setItem('aiai:intro-seen', 'yes'));
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.goto('http://localhost:5173');
await page.locator('.intro').waitFor({ state: 'detached' });
await page.locator('.hero-poster img').evaluateAll(images => Promise.all(images.map(i => i.decode())));
const cdp = await page.context().newCDPSession(page);
await cdp.send('Tracing.start', { categories: 'devtools.timeline,blink.user_timing,disabled-by-default-devtools.timeline.frame', transferMode: 'ReturnAsStream' });
await page.evaluate(() => {
  window.__profile = { frames: [], longTasks: [], segments: [], last: 0, active: true };
  new PerformanceObserver(list => window.__profile.longTasks.push(...list.getEntries().map(e => ({ start: e.startTime, duration: e.duration })))).observe({ type: 'longtask', buffered: false });
  const tick = t => { const p = window.__profile; if (!p.active) return; if (p.last) p.frames.push({ at: t, delta: t - p.last }); p.last = t; requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
});
const mark = name => page.evaluate(name => { performance.mark(name); window.__profile.segments.push({ name, at: performance.now() }); }, name);
const point = async offset => {
  const r = await page.locator(`.hero-poster.offset-${offset}`).boundingBox();
  return { x: Math.max(20, Math.min(1420, r.x + r.width * (offset < 0 ? .25 : offset > 0 ? .75 : .5))), y: r.y + r.height * .72 };
};
const move = async offset => { const p = await point(offset); await page.mouse.move(p.x, p.y, { steps: 8 }); };
await mark('first-center'); await move(0); await page.waitForTimeout(550);
await page.mouse.move(700, 110); await page.waitForTimeout(350);
await mark('first-side'); await move(-1); await page.waitForTimeout(550);
await mark('left-center-right'); for (const i of [-1, 0, 1, 0, -1]) { await move(i); await page.waitForTimeout(200); }
await mark('edge-reversal');
for (let i = 0; i < 6; i++) { const p = await point(0); await page.mouse.move(p.x, p.y); await page.waitForTimeout(65); await page.mouse.move(p.x, 120); await page.waitForTimeout(65); }
await mark('cover-to-button'); await move(0); await page.waitForTimeout(350);
await page.locator('.hero-poster.offset-0 .primary-button, .hero-poster.offset-0 .watch-cue').hover(); await page.waitForTimeout(450);
await mark('switch-then-hover'); await page.getByRole('button', { name: '下一部短剧' }).click(); await page.waitForTimeout(680); await move(0); await page.waitForTimeout(450);
if (out.endsWith('round-4') && phase === 'after') {
  await mark('catalog-first-hover'); await page.locator('.drama-card').first().hover(); await page.waitForTimeout(550);
  await mark('catalog-horizontal-hover'); for (let i=0;i<5;i++){await page.locator('.drama-card').nth(i).hover();await page.waitForTimeout(180);}
}
const data = await page.evaluate(() => { window.__profile.active = false; return window.__profile; });
const complete = new Promise(resolve => cdp.once('Tracing.tracingComplete', resolve));
await cdp.send('Tracing.end');
const { stream } = await complete;
let trace = '';
while (true) { const chunk = await cdp.send('IO.read', { handle: stream }); trace += chunk.data; if (chunk.eof) break; }
await cdp.send('IO.close', { handle: stream });
await fs.writeFile(`${out}/${phase}-trace.json`, trace);
const summarize = samples => {
  const sorted = samples.map(f => f.delta).sort((a,b) => a-b);
  return { samples: sorted.length, medianMs: sorted[Math.floor(sorted.length*.5)], p95Ms: sorted[Math.floor(sorted.length*.95)], maxMs: sorted.at(-1), over25Ms: sorted.filter(x=>x>25).length, over50Ms: sorted.filter(x=>x>50).length };
};
const events = JSON.parse(trace).traceEvents;
const work = ['Paint', 'Layout', 'UpdateLayoutTree', 'RasterTask'].map(name => ({ name, count: events.filter(e=>e.name===name && e.ph==='X').length, totalMs: events.filter(e=>e.name===name && e.ph==='X').reduce((a,e)=>a+(e.dur||0)/1000,0) }));
const report = { phase, browser: await browser.version(), viewport: '1440x1000', method: 'Headless installed Chrome; no CPU throttling; requestAnimationFrame intervals + CDP timeline trace, no screencast during measurement. One controlled pass, not an FPS guarantee.', overall: summarize(data.frames), segments: data.segments.map((s,i)=>({ name:s.name, ...summarize(data.frames.filter(f=>f.at>=s.at && f.at<(data.segments[i+1]?.at??Infinity))) })), longTasks:data.longTasks, work, errors };
await fs.writeFile(`${out}/${phase}-performance.json`, JSON.stringify(report,null,2));
await page.screenshot({ path:`${out}/${phase}-hover.png` });
console.log(JSON.stringify(report,null,2));
await browser.close();
