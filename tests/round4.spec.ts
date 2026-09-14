import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
const out='docs/m4';
const ids=['preview-01','preview-02','preview-03','preview-04','preview-05'];
async function ready(page:Page,reduced=false){await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});await page.addInitScript(()=>sessionStorage.setItem('aiai:intro-seen','yes'));await page.goto('/#home');await expect(page.locator('.hero')).toBeVisible();}
async function idle(page:Page){await expect(page.locator('.hero')).toHaveAttribute('data-motion','idle');}
async function leave(page:Page){await page.getByRole('textbox',{name:'搜索精选内容'}).focus();await page.mouse.move(980,40);await page.waitForTimeout(300);}
async function noPreview(page:Page){expect(await page.locator('.hero-poster:not([hidden]) .card-info').evaluateAll(els=>els.map(el=>+getComputedStyle(el).opacity))).not.toContain(1);await expect(page.locator('[data-preview],.flying-cover,[popover],.drama-modal')).toHaveCount(0);}
async function exposed(page:Page,slot:number){await leave(page);const point=await page.locator(`.hero-poster[data-slot="${slot}"]`).evaluate(el=>{const r=el.getBoundingClientRect();for(const y of [r.top+r.height*.5,r.top+r.height*.7])for(let x=Math.max(12,r.left+12);x<Math.min(innerWidth-12,r.right-12);x+=6)if(document.elementFromPoint(x,y)?.closest('.hero-poster')===el)return{x,y};return null;});expect(point).not.toBeNull();await page.mouse.move(point!.x,point!.y);await page.waitForTimeout(260);return point!;}
async function consistent(page:Page,index:number){await idle(page);await expect(page.locator('.hero-poster[data-slot="0"]')).toHaveAttribute('data-drama-id',ids[index]);await expect(page.locator('.ambient-layer.active')).toHaveAttribute('data-drama-id',ids[index]);await expect(page.locator('.carousel-dots button').nth(index)).toHaveAttribute('aria-pressed','true');const slots=await page.locator('.hero-poster').evaluateAll(els=>els.map(e=>Number((e as HTMLElement).dataset.slot)));expect(new Set(slots).size).toBe(ids.length);expect(slots.filter(n=>n===0)).toHaveLength(1);}

for(const width of [1280,1920,2560])test(`carousel ${width}: 30 forward, 30 back, wrap and resize`,async({page})=>{
  test.setTimeout(65000);await page.setViewportSize({width,height:1000});await ready(page);
  await page.evaluate(()=>{(window as any).__wrap=[];(window as any).__sampling=true;const tick=()=>{if(!(window as any).__sampling)return;const center=innerWidth/2;document.querySelectorAll<HTMLElement>('[data-wrap]').forEach(el=>{const r=el.getBoundingClientRect();(window as any).__wrap.push({x:r.left+r.width/2,opacity:+getComputedStyle(el).opacity,center,inert:el.inert});});requestAnimationFrame(tick);};requestAnimationFrame(tick);});
  for(let i=1;i<=30;i++){await page.getByRole('button',{name:'下一部短剧'}).click();await consistent(page,i%ids.length);}
  for(let i=1;i<=30;i++){await page.getByRole('button',{name:'上一部短剧'}).click();await consistent(page,(ids.length-i%ids.length)%ids.length);}
  await leave(page);await noPreview(page);
  const wrap=await page.evaluate(()=>{(window as any).__sampling=false;return (window as any).__wrap as {x:number;opacity:number;center:number;inert:boolean}[];});
  expect(wrap.length).toBeGreaterThan(20);expect(wrap.filter(p=>Math.abs(p.x-p.center)<100&&p.opacity>.025)).toEqual([]);expect(wrap.every(p=>p.inert)).toBe(true);
  await fs.writeFile(`${out}/wrap-${width}.json`,JSON.stringify(wrap));
  await page.getByRole('button',{name:'下一部短剧'}).click();await page.waitForTimeout(90);await page.setViewportSize({width:1024,height:900});await consistent(page,1);
  await expect(page.locator('.hero-poster:visible')).toHaveCount(3);await page.setViewportSize({width,height:1000});await consistent(page,1);await expect(page.locator('.hero-poster:visible')).toHaveCount(5);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);await page.screenshot({path:`${out}/home-${width}.png`});
});

test('rapid arrows and indicators keep latest intent without animation queues',async({page})=>{
  await ready(page);let target=0;
  for(let i=0;i<40;i++){if(i%7===0){target=(i/7|0)%5;await page.locator('.carousel-dots button').nth(target).click();}else{const next=i%3!==0;target=(target+(next?1:4))%5;await page.getByRole('button',{name:next?'下一部短剧':'上一部短剧'}).click();}}
  await consistent(page,target);await leave(page);await noPreview(page);
  expect(await page.locator('.hero-poster').evaluateAll(els=>els.flatMap(el=>el.getAnimations()).filter(a=>a.playState==='running').length)).toBe(0);
  await page.locator('.hero').focus();await page.keyboard.press('ArrowRight');target=(target+1)%5;await consistent(page,target);
});

test('real hover/focus clears, window blur hides preview, return has no stale layer',async({page})=>{
  await ready(page);for(const slot of [0,-1,1,-2,2]){await exposed(page,slot);const card=page.locator(`.hero-poster[data-slot="${slot}"]`);await expect(card.locator('.card-info')).toHaveCSS('opacity',Math.abs(slot)===2?'0':'1');expect(await card.evaluate(el=>el.querySelector('.card-info')!.getBoundingClientRect().height/el.getBoundingClientRect().height)).toBeLessThan(.4);}
  await leave(page);await noPreview(page);
  await page.keyboard.press('Tab'); // use keyboard modality before explicit focus
  await page.locator('.offset--2 a').focus();await expect(page.locator('.offset--2 .card-info')).toHaveCSS('opacity','0');await expect(page.locator('.offset--2')).toHaveCSS('z-index','3');await page.getByRole('textbox',{name:'搜索精选内容'}).focus();await noPreview(page);
  await exposed(page,0);await page.evaluate(()=>dispatchEvent(new Event('blur')));await page.waitForTimeout(280);await noPreview(page);await page.evaluate(()=>dispatchEvent(new Event('focus')));
  await page.mouse.move(711,350);await page.locator('.offset-0 a').click();await expect(page).toHaveURL(/\/play\/preview-01$/);await page.goBack();await idle(page);await page.waitForTimeout(300);await noPreview(page);
});

for(const region of ['upper','lower','title','background','watch'])test(`Banner entire link: ${region} is one navigation`,async({page})=>{
  await ready(page);await exposed(page,0);const card=page.locator('.offset-0 a');const start=await page.evaluate(()=>history.length);let box;
  if(region==='upper'||region==='lower'){box=await card.boundingBox();await page.mouse.click(box!.x+box!.width*.5,box!.y+box!.height*(region==='upper'?.2:.65));}
  else if(region==='title')await card.locator('h2').click();
  else if(region==='watch')await card.locator('.watch-cue').click();
  else{box=await card.locator('.card-info').boundingBox();await page.mouse.click(box!.x+box!.width-15,box!.y+box!.height*.5);}
  await expect(page).toHaveURL(/\/play\/preview-01$/);await expect(page.getByRole('heading',{level:1})).toHaveText('晨光邮局');expect(await page.evaluate(()=>history.length)).toBe(start+1);await expect(page.locator('dialog,video')).toHaveCount(0);
});

test('every Banner, popular, latest and filtered result has native destination',async({page})=>{
  await ready(page,true);
  for(const slot of [-2,-1,0,1,2]){const point=await exposed(page,slot);const card=page.locator(`.hero-poster[data-slot="${slot}"]`);const id=await card.getAttribute('data-drama-id');await page.mouse.click(point.x,point.y);await expect(page).toHaveURL(new RegExp(`/play/${id}$`));await page.getByRole('link',{name:'返回首页',exact:true}).first().click();await idle(page);}
  for(const group of ['popular','latest']){const link=page.locator(`#${group} .drama-card`).first();const href=await link.getAttribute('href');await link.locator('.card-title').click();await expect(page).toHaveURL(new RegExp(`${href}$`));await page.goBack();await idle(page);}
  await page.getByRole('group',{name:'题材筛选'}).getByRole('button',{name:'科幻',exact:true}).click();await expect(page.locator('.drama-card')).toHaveCount(2);const link=page.locator('.drama-card').first(),href=await link.getAttribute('href');await link.click();await expect(page).toHaveURL(new RegExp(`${href}$`));
  await page.goBack();await expect(page.locator('.drama-card')).toHaveCount(2);expect(await page.locator('.drama-link button,.drama-link a').count()).toBe(0);
});

test('Enter and new tab retain browser link behavior',async({page,context})=>{
  await ready(page,true);const link=page.locator('.offset-0 a');await link.focus();await page.keyboard.press('Enter');await expect(page).toHaveURL(/\/play\/preview-01$/);await page.goBack();
  const popup=context.waitForEvent('page');await page.locator('.offset-0 a').click({modifiers:['Control']});const tab=await popup;await tab.waitForLoadState();await expect(tab).toHaveURL(/\/play\/preview-01$/);await expect(tab.locator('.no-source')).toBeVisible();await tab.close();
});

test('return restores query genre index and scroll across refresh, forward and anchors',async({page})=>{
  await ready(page,true);await page.getByRole('button',{name:'下一部短剧'}).click();await consistent(page,1);
  await page.getByRole('group',{name:'题材筛选'}).getByRole('button',{name:'奇幻',exact:true}).click();await page.getByRole('textbox',{name:'搜索精选内容'}).fill('山海');await expect(page.locator('.drama-card')).toHaveCount(1);
  await page.locator('.drama-card').scrollIntoViewIfNeeded();const before=await page.evaluate(()=>scrollY);await page.locator('.drama-card').click();await expect(page).toHaveURL(/\/play\/preview-02$/);await page.reload();await expect(page.locator('.no-source')).toBeVisible();
  await page.getByRole('link',{name:'返回首页',exact:true}).first().click();await expect(page.getByRole('textbox',{name:'搜索精选内容'})).toHaveValue('山海');await expect(page.locator('.drama-card')).toHaveCount(1);await consistent(page,1);expect(Math.abs(await page.evaluate(()=>scrollY)-before)).toBeLessThan(8);await noPreview(page);await expect(page.locator('.intro')).toHaveCount(0);
  await page.goBack();await expect(page).toHaveURL(/\/play\/preview-02$/);await page.goForward();await expect(page.locator('.drama-card')).toHaveCount(1);
  await page.locator('.drama-card').click();await page.getByRole('navigation',{name:'主导航'}).getByRole('link',{name:'首页',exact:true}).click();await page.getByRole('navigation',{name:'首页分区'}).getByRole('link',{name:'热门推荐',exact:true}).click();await expect(page.locator('#popular')).toBeVisible();await expect(page).toHaveURL(/\/#popular$/);expect(await page.locator('#popular').evaluate(e=>Math.abs(e.getBoundingClientRect().top))).toBeLessThan(170);
});

test('direct player, invalid ID, no source and real home link',async({page})=>{
  await page.goto('/play/preview-04');await expect(page.getByRole('heading',{level:1})).toHaveText('星河拾光');await page.reload();await expect(page.getByText('该作品暂未配置视频源')).toBeVisible();await expect(page.locator('video,.episode-panel')).toHaveCount(0);
  await page.getByRole('link',{name:'返回首页',exact:true}).first().click();await expect(page.locator('.hero')).toBeVisible();await expect(page.locator('.intro')).toHaveCount(0);
  await page.goto('/play/not-a-drama');await expect(page.getByRole('heading',{name:'没有找到这部作品'})).toBeVisible();await page.locator('.empty-state a').click();await expect(page).toHaveURL(/\/#home$/);
});

// Isolated native-player fixture: does not bypass production visibility or add catalog media.
async function configure(page:Page,media:any){await page.route('**/src/main.tsx*',route=>route.fulfill({contentType:'application/javascript',body:`import React from '/node_modules/.vite/deps/react.js';import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';const{useState}=React;const{createRoot}=ReactDOM;import {VideoPlayer} from '/src/components/VideoPlayer.tsx';import '/src/styles.css';const media=${JSON.stringify(media)};function Fixture(){const[i,set]=useState(0);const episodes=media.episodes||[];return React.createElement('main',null,React.createElement(VideoPlayer,{key:"player-"+i,sources:episodes.length?episodes[i].sources:media.sources,title:'Native media test'}),...episodes.map((e,n)=>React.createElement('button',{key:n,'aria-pressed':n===i,onClick:()=>set(n)},e.title)))}createRoot(document.getElementById('root')).render(React.createElement(Fixture));` }));}
test('configured test media: native play pause seek, intrinsic video ratio, episodes',async({page})=>{
  await configure(page,{episodes:[{id:'test-1',title:'测试片段 A',sources:[{src:'/__test__/player.mp4',type:'video/mp4'}]},{id:'test-2',title:'测试片段 B',sources:[{src:'/__test__/player.mp4',type:'video/mp4'}]}]});
  const file=await fs.readFile('tests/fixtures/player-test.mp4');
  await page.route('**/__test__/player.mp4',route=>{const range=route.request().headers().range?.match(/bytes=(\d+)-(\d*)/);const start=range?Number(range[1]):0,end=range&&range[2]?Math.min(Number(range[2]),file.length-1):file.length-1;return route.fulfill({status:range?206:200,contentType:'video/mp4',headers:{'Accept-Ranges':'bytes','Content-Length':String(end-start+1),...(range?{'Content-Range':`bytes ${start}-${end}/${file.length}`}:{})},body:file.subarray(start,end+1)});});await page.goto('/play/preview-01');const video=page.locator('video');await expect(page.locator('.video-stage')).toHaveAttribute('data-status','ready');await expect(video).toHaveAttribute('controls','');
  await video.evaluate(async(e:HTMLVideoElement)=>{await e.play();});await expect.poll(()=>video.evaluate((e:HTMLVideoElement)=>e.currentTime)).toBeGreaterThan(.1);await video.evaluate((e:HTMLVideoElement)=>{e.pause();e.currentTime=2;});await expect.poll(()=>video.evaluate((e:HTMLVideoElement)=>e.currentTime)).toBeGreaterThan(1.9);
  expect(await video.evaluate((e:HTMLVideoElement)=>e.videoWidth/e.videoHeight)).toBeCloseTo(16/9);await expect(video).toHaveCSS('object-fit','contain');await page.getByRole('button',{name:'测试片段 B'}).click();await expect(page.getByRole('button',{name:'测试片段 B'})).toHaveAttribute('aria-pressed','true');await expect(page.locator('.video-stage')).toHaveAttribute('data-status','ready');
});
test('media loading, failure and retry do not become endless fake progress',async({page})=>{
  await configure(page,{sources:[{src:'/__test__/missing.mp4',type:'video/mp4'}]});await page.route('**/__test__/missing.mp4',async route=>{await new Promise(r=>setTimeout(r,300));await route.fulfill({status:404,body:''});});await page.goto('/play/preview-01');await expect(page.getByText('正在加载视频…')).toBeVisible();await expect(page.getByText('视频暂时无法播放')).toBeVisible();await page.getByRole('button',{name:'重新加载'}).click();await expect(page.getByText('视频暂时无法播放')).toBeVisible();
});

test('accounts membership search ads and reduced motion remain usable',async({page})=>{
  await ready(page,true);for(const name of ['登录 / 注册']){await page.getByRole('button',{name,exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('dialog')).toHaveCount(0);expect(await page.evaluate(()=>document.body.style.overflow)).toBe('');}
  await expect(page.locator('.campaign-grid a')).toHaveCount(2);await page.getByRole('link',{name:'会员中心',exact:true}).click();await expect(page.getByRole('heading',{name:'一份会员，更多好故事'})).toBeVisible();await page.goBack();await page.getByRole('textbox',{name:'搜索精选内容'}).fill('不存在的作品');await expect(page.getByRole('heading',{name:'还没找到这部故事'})).toBeVisible();await page.locator('.empty-state button').click();await expect(page.locator('.drama-card')).toHaveCount(12);
  await page.locator('.drama-card').first().click();await page.getByRole('button',{name:'登录 / 注册',exact:true}).click();await page.getByRole('button',{name:'继续逛逛'}).click();await expect(page.locator('dialog')).toHaveCount(0);
});

test('mobile layout, no-source page, resource checks and no abandoned overlays',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',baseURL:'http://localhost:5173'});const page=await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});await ready(page,true);await expect(page.locator('.hero-poster:visible')).toHaveCount(3);await expect(page.locator('.offset-0 .card-info')).toHaveCSS('opacity','1');await page.locator('.offset-0 a').tap();await expect(page.locator('.no-source')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);await page.screenshot({path:`${out}/play-390.png`,fullPage:true});await page.getByRole('link',{name:'返回首页',exact:true}).first().tap();await expect(page.locator('dialog,[popover],.flying-cover')).toHaveCount(0);expect(errors).toEqual([]);await context.close();
});
