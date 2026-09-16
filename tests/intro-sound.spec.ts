import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import timeline from '../src/motion/introTimeline.json' with { type: 'json' };

async function probe(page: Page, reject = false) {
  await page.addInitScript(({reject}) => {
    const stats = { resumes: 0, starts: 0, ended: 0, decoded: 0, closed: 0, peak: 0, samples: [] as {at:number;peak:number}[], startAt: 0, endedAt: 0 };
    (window as any).introAudio = stats;
    const resume = AudioContext.prototype.resume;
    AudioContext.prototype.resume = function() { stats.resumes++; return reject ? Promise.reject(new DOMException('Blocked', 'NotAllowedError')) : resume.call(this); };
    const decode = AudioContext.prototype.decodeAudioData;
    AudioContext.prototype.decodeAudioData = function(bytes: ArrayBuffer) { return decode.call(this, bytes).then(buffer => {stats.decoded++;return buffer;}); };
    const close = AudioContext.prototype.close;
    AudioContext.prototype.close = function() { stats.closed++; return close.call(this); };
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function(when=0, offset=0) {
      stats.starts++; stats.startAt = performance.now();
      this.addEventListener('ended', () => {stats.ended++; stats.endedAt=performance.now();});
      return start.call(this, when, offset);
    };
    // Measure real rendered PCM on the graph connected to the output destination.
    const connect = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function(destination: any, ...args: any[]) {
      if (destination instanceof AudioDestinationNode) {
        const analyser = this.context.createAnalyser(); analyser.fftSize = 1024;
        connect.call(this, analyser); connect.call(analyser, destination);
        const samples = new Float32Array(1024);
        const read = () => { analyser.getFloatTimeDomainData(samples); const peak = Math.max(...samples.map(Math.abs)); stats.peak = Math.max(stats.peak, peak); stats.samples.push({at:performance.now(),peak}); if(this.context.state !== 'closed') requestAnimationFrame(read); };
        requestAnimationFrame(read); return destination;
      }
      return (connect as any).call(this,destination,...args);
    } as any;
  }, { reject });
}
async function readyAudio(page: Page) { await expect.poll(() => page.evaluate(() => (window as any).introAudio.decoded)).toBe(2); }
async function cleaned(page: Page) {
  await expect(page.locator('.intro')).toHaveCount(0, {timeout:3000});
  await expect(page.locator('#home')).not.toHaveAttribute('inert');
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  await expect(page.locator('.nav-logo')).toHaveCSS('visibility','visible');
  expect(await page.evaluate(() => sessionStorage.getItem('aiai:intro-seen'))).toBe('yes');
}

test('waiting is silent and indefinite; keyboard is contained; one click produces real PCM and a natural tail', async ({page}) => {
  await probe(page); await page.goto('/'); await readyAudio(page);
  await expect(page.getByRole('button',{name:'进入爱爱',exact:true})).toBeFocused();
  await page.keyboard.press('Tab'); await expect(page.getByRole('button',{name:'进入爱爱',exact:true})).toBeFocused();
  await page.keyboard.press('Shift+Tab'); await expect(page.getByRole('button',{name:'进入爱爱',exact:true})).toBeFocused();
  await page.waitForTimeout(4400);
  await expect(page.locator('.intro')).toHaveAttribute('data-phase','waiting');
  expect(await page.evaluate(() => [(window as any).introAudio.resumes,(window as any).introAudio.starts,sessionStorage.getItem('aiai:intro-seen')])).toEqual([0,0,null]);
  await page.keyboard.press('Enter');
  await expect(page.locator('.intro')).toHaveAttribute('data-phase','gathering');
  await page.evaluate(() => {for(let i=0;i<8;i++)document.querySelector<HTMLButtonElement>('.intro-enter')!.click();});
  await cleaned(page);
  await expect(page.getByRole('link',{name:'爱爱短剧首页',exact:true})).toBeFocused();
  await expect(page.getByRole('link',{name:'爱爱短剧首页',exact:true})).toHaveCSS('outline-style','solid');
  const audio = await page.evaluate(() => (window as any).introAudio);
  expect(audio.resumes).toBe(1); expect(audio.starts).toBe(1); expect(audio.peak).toBeGreaterThan(.05);
  expect(audio.ended).toBe(1); expect(audio.endedAt-audio.startAt).toBeGreaterThan(1550);
  const onset = audio.samples.find((s:any)=>s.peak>.003); expect(onset.at-audio.startAt).toBeLessThan(110);
  const latePeak = audio.samples.filter((s:any)=>s.at-audio.startAt>700&&s.at-audio.startAt<1050).sort((a:any,b:any)=>b.peak-a.peak)[0];
  expect(Math.abs(latePeak.at-audio.startAt-timeline.gather)).toBeLessThan(110);
  await fs.mkdir('docs/intro-orbit',{recursive:true}); await fs.writeFile('docs/intro-orbit/browser-audio.json',JSON.stringify(audio,null,2));
  await page.reload(); await expect(page.locator('.intro')).toHaveCount(0); expect(await page.evaluate(()=>(window as any).introAudio.resumes)).toBe(0);
});

test('welcome exposes only the main entry button', async ({page}) => {
  await page.goto('/');
  await expect(page.getByRole('dialog').getByRole('button')).toHaveCount(1);
  await expect(page.getByRole('button',{name:'静音进入'})).toHaveCount(0);
  await page.getByRole('button',{name:'进入爱爱',exact:true}).click(); await cleaned(page);
  const brand=page.getByRole('link',{name:'爱爱短剧首页',exact:true});
  await expect(page.locator('#home')).toBeFocused();
  await expect(page.locator('#home')).toHaveCSS('outline-style','none');
  await expect(brand).toHaveCSS('outline-style','none');
  await page.screenshot({path:'docs/intro-orbit/home-pointer-focus.png'});
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link',{name:'跳到短剧内容'})).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(brand).toBeFocused();
  await expect(brand).toHaveCSS('outline-style','solid');
});

test('rejected audio cannot delay entry or replay on subsequent interaction', async ({page}) => {
  const errors:string[]=[]; page.on('pageerror',e=>errors.push(e.message));
  await probe(page,true); await page.goto('/'); await readyAudio(page); await page.getByRole('button',{name:'进入爱爱',exact:true}).click(); await cleaned(page);
  const before=await page.evaluate(()=>(window as any).introAudio.starts); await page.mouse.click(20,700); await page.waitForTimeout(250);
  expect(await page.evaluate(()=>(window as any).introAudio.starts)).toBe(before); expect(errors).toEqual([]);
});

for (const mode of ['failed','late'] as const) test(`audio ${mode} never causes delayed playback`, async ({page}) => {
  await probe(page); await page.route('**/assets/audio/aiai-orbit*.mp3',async route=>{if(mode==='failed')await route.abort();else {await new Promise(r=>setTimeout(r,2600));await route.continue().catch(()=>{});}});
  await page.goto('/'); await page.getByRole('button',{name:'进入爱爱',exact:true}).click(); await cleaned(page); await page.waitForTimeout(1500);
  expect(await page.evaluate(()=>(window as any).introAudio.starts)).toBe(0);
});

for (const failure of [false,true]) test(`content service ${failure?'error':'slow'} leaves the welcome usable`, async ({page}) => {
  await page.route('**/src/services/content.ts*',async route=>{const response=await route.fetch();let body=await response.text();body=body.replace('setTimeout(done, 100)','setTimeout(done, 5000)');if(failure)body=body.replace('await pause(signal);', 'throw new Error("内容加载失败，请重试");');await route.fulfill({response,body});});
  await page.goto('/'); await expect(page.getByRole('button',{name:'进入爱爱',exact:true})).toBeEnabled();
  if(!failure) await expect(page.locator('.hero-loading')).toBeAttached();
  await page.getByRole('button',{name:'进入爱爱',exact:true}).click(); await cleaned(page);
  if(failure)await expect(page.getByText('内容加载失败，请重试',{exact:true})).toBeVisible();else await expect(page.locator('.hero-loading')).toBeVisible();
});

for (const width of [320,390,768,1440]) test(`responsive waiting and resize during flight at ${width}px`, async ({page}) => {
  await page.setViewportSize({width,height:width<500?844:960}); await page.goto('/'); await page.waitForTimeout(1650);
  await expect(page.getByRole('button',{name:'进入爱爱',exact:true})).toBeInViewport(); await expect(page.getByRole('button',{name:'静音进入'})).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await page.locator('.intro-particles').evaluate((e:HTMLCanvasElement)=>e.width/innerWidth)).toBeLessThanOrEqual(width<600?1.5:2);
  await page.screenshot({path:`docs/intro-orbit/waiting-${width}.png`});
  await page.getByRole('button',{name:'进入爱爱',exact:true}).click(); await page.waitForTimeout(450); await page.screenshot({path:`docs/intro-orbit/gather-${width}.png`});
  await page.waitForTimeout(480); await page.setViewportSize({width:width===320?390:320,height:844}); await cleaned(page);
  await page.screenshot({path:`docs/intro-orbit/home-from-${width}.png`});
});

test('reduced motion is stationary, waits for click and plays the short sound',async({page})=>{
  await probe(page); await page.emulateMedia({reducedMotion:'reduce'}); await page.goto('/'); await readyAudio(page);
  const pixels=await page.locator('canvas').evaluate((c:HTMLCanvasElement)=>c.toDataURL()); await page.waitForTimeout(500);
  expect(await page.locator('canvas').evaluate((c:HTMLCanvasElement)=>c.toDataURL())).toBe(pixels);
  await expect(page.locator('.intro')).toHaveAttribute('data-phase','waiting');
  expect(await page.locator('.intro').evaluate(e=>e.getAnimations({subtree:true}).length)).toBe(0);
  await page.getByRole('button',{name:'进入爱爱',exact:true}).click();await cleaned(page);
  expect(await page.evaluate(()=>(window as any).introAudio.peak)).toBeGreaterThan(.05);
});

test('motion preference changes never restart the reveal or require another click',async({page})=>{
  await page.goto('/'); await page.emulateMedia({reducedMotion:'reduce'}); await expect(page.getByRole('button',{name:'进入爱爱',exact:true})).toBeEnabled();
  await page.emulateMedia({reducedMotion:'no-preference'});await page.getByRole('button',{name:'进入爱爱',exact:true}).click();await page.emulateMedia({reducedMotion:'reduce'}); await cleaned(page);
});

test('touch entry at DPR 3 stays bounded and plays once',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
  const page=await context.newPage();await probe(page);await page.goto('http://localhost:5173/');await readyAudio(page);
  expect(await page.locator('canvas').evaluate((c:HTMLCanvasElement)=>c.width/innerWidth)).toBe(1.5);
  await page.getByRole('button',{name:'进入爱爱',exact:true}).tap();await cleaned(page);
  expect(await page.evaluate(()=>(window as any).introAudio.starts)).toBe(1);
  expect(await page.evaluate(()=>(window as any).introAudio.peak)).toBeGreaterThan(.05);
  await context.close();
});

test('late AudioContext resume never schedules delayed output',async({page})=>{
  await probe(page);await page.addInitScript(()=>{
    const resume=AudioContext.prototype.resume;
    AudioContext.prototype.resume=function(){return new Promise((resolve,reject)=>setTimeout(()=>resume.call(this).then(resolve,reject),300));};
  });
  await page.goto('/');await readyAudio(page);await page.getByRole('button',{name:'进入爱爱',exact:true}).click();await cleaned(page);
  const audio=await page.evaluate(()=>(window as any).introAudio);
  // Chrome can unlock a source synchronously through start() itself, even if
  // the resume Promise is artificially delayed. Any such output must be prompt.
  const onset=audio.samples.find((s:any)=>s.peak>.003);
  if(onset)expect(onset.at-audio.startAt).toBeLessThan(110);
  expect(audio.starts).toBe(1);
  expect(audio.endedAt-audio.startAt).toBeLessThan(400);
});

test('returning while waiting silently preloads again and accepts a fresh sound click',async({page})=>{
  await probe(page);await page.goto('/');await readyAudio(page);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:false,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
  await expect.poll(()=>page.evaluate(()=>(window as any).introAudio.decoded)).toBe(4);
  expect(await page.evaluate(()=>(window as any).introAudio.resumes)).toBe(0);
  await page.getByRole('button',{name:'进入爱爱',exact:true}).click();await cleaned(page);
  expect(await page.evaluate(()=>(window as any).introAudio.peak)).toBeGreaterThan(.05);
});

test('post-click safety timer releases a stalled animation without an audio API',async({page})=>{
  await page.addInitScript(()=>{(window as any).AudioContext=undefined;});await page.goto('/');
  await page.evaluate(()=>{window.requestAnimationFrame=()=>0;});
  await page.getByRole('button',{name:'进入爱爱',exact:true}).click();await cleaned(page);
});

test('background switch closes audio; returning cannot replay; unmount restores scroll',async({page})=>{
  await probe(page);await page.goto('/');await readyAudio(page);await page.getByRole('button',{name:'进入爱爱',exact:true}).click();
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
  await expect.poll(()=>page.evaluate(()=>(window as any).introAudio.closed)).toBeGreaterThan(0);
  await page.waitForTimeout(2200);await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:false,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});await cleaned(page);
  expect(await page.evaluate(()=>(window as any).introAudio.starts)).toBe(1);
  await page.evaluate(()=>sessionStorage.removeItem('aiai:intro-seen'));await page.reload();
  await page.evaluate(()=>{history.pushState({},'', '/shorts');window.dispatchEvent(new PopStateEvent('popstate'));});
  await expect(page.locator('.intro')).toHaveCount(0);expect(await page.evaluate(()=>document.body.style.overflow)).toBe('');
});

test('separate brand destinations and one complete featured row',async({page})=>{await page.addInitScript(()=>sessionStorage.setItem('aiai:intro-seen','yes'));for(const width of [320,390,768,1280,1920]){await page.setViewportSize({width,height:950});await page.goto('/18plus?tab=shorts');const confirm=page.getByRole('button',{name:'确认并进入'});if(await confirm.isVisible())await confirm.click();await page.getByRole('link',{name:'18+专区首页',exact:true}).click();await expect(page).toHaveURL(/18plus$/);await expect(page.locator('#adult-catalog .adult-card')).toHaveCount(width>1100?4:width>760?3:2);const rows=await page.locator('#adult-catalog .adult-card').evaluateAll(es=>es.map(e=>Math.round(e.getBoundingClientRect().top)));expect(new Set(rows).size).toBe(1);await expect(page.getByRole('link',{name:'爱爱短剧首页',exact:true})).toHaveAttribute('href','/#home');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}await page.getByRole('link',{name:'爱爱短剧首页',exact:true}).click();await expect(page).toHaveURL(/\/#home$/);});
