import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import { introPhases, timing } from '../src/config';
import { slotFor } from '../src/components/Carousel';
import { hasPlayableMedia, playableEpisodes, watchLabel } from '../src/data/media';

const out='docs/m4';
async function ready(page:Page,reduced=false){await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});await page.addInitScript(()=>sessionStorage.setItem('aiai:intro-seen','yes'));await page.goto('/#home');await expect(page.locator('.hero')).toBeVisible();}
async function idle(page:Page){await expect(page.locator('.hero')).toHaveAttribute('data-motion','idle');}
async function exposed(page:Page,slot:number){const point=await page.locator(`.hero-poster[data-slot="${slot}"]`).evaluate(el=>{const r=el.getBoundingClientRect();for(const y of [r.top+r.height*.5,r.top+r.height*.7])for(let x=Math.max(10,r.left+10);x<Math.min(innerWidth-10,r.right-10);x+=4)if(document.elementFromPoint(x,y)?.closest('.hero-poster')===el)return{x,y};return null;});expect(point).not.toBeNull();await page.mouse.move(point!.x,point!.y);}
async function materials(page:Page,slot:number){return page.locator(`.hero-poster[data-slot="${slot}"]`).evaluate(el=>{const r=el.getBoundingClientRect();const selectors=['','.hero-surface','.hero-cover','.poster-image img','.cover-shade','.poster-edge','.card-info'];return {rect:[r.x,r.y,r.width,r.height],styles:selectors.map(selector=>{const s=getComputedStyle(selector?el.querySelector(selector)!:el);return [s.transform,s.zIndex,s.opacity,s.filter,s.boxShadow,s.border,s.outline];})};});}
async function aligned(page:Page,id:string){await expect(page.locator(`nav a[href="/#${id}"]`)).toHaveAttribute('aria-current',id==='home'?'page':'location');await expect(page).toHaveURL(new RegExp(`#${id}$`));await expect.poll(()=>page.locator(`#${id}`).evaluate(el=>{const top=el.getBoundingClientRect().top;const header=document.querySelector('.site-header')!.getBoundingClientRect().bottom;const atEnd=Math.abs(scrollY+innerHeight-document.documentElement.scrollHeight)<3;return el.id==='home'?Math.abs(top)<1:top>=header-1&&(Math.abs(top-header-24)<3||atEnd);})).toBe(true);}

test('circular slots and real media availability share deterministic rules',()=>{
  for(let center=-10;center<=10;center++){
    const slots=Array.from({length:5},(_,item)=>slotFor(item,center));
    expect([...slots].sort((a,b)=>a-b)).toEqual([-2,-1,0,1,2]);
    expect(slots[((center%5)+5)%5]).toBe(0);
    expect(slots.filter(slot=>Math.abs(slot)===2)).toHaveLength(2);
  }
  expect(hasPlayableMedia()).toBe(false);expect(watchLabel({sources:[{src:' '}]})).toBe('查看详情');
  expect(hasPlayableMedia({episodes:[{id:'1',title:'未接入',sources:[]}]})).toBe(false);
  expect(watchLabel({sources:[{src:'/authorized.mp4'}]})).toBe('立即观看');
  expect(playableEpisodes({episodes:[{id:'1',title:'空',sources:[]},{id:'2',title:'已配置',sources:[{src:'/authorized.mp4'}]}]}).map(e=>e.id)).toEqual(['2']);
});

for(const width of [1280,1920])test(`all five centers keep both outer cards visually unchanged at ${width}`,async({page})=>{
  await page.setViewportSize({width,height:width===1280?720:1080});await ready(page);
  for(let index=0;index<5;index++){
    await page.locator('.carousel-dots button').nth(index).click();await idle(page);
    for(const slot of [-2,2]){
      await page.mouse.move(12,12);await page.waitForTimeout(300);const before=await materials(page,slot);
      await exposed(page,slot);await page.waitForTimeout(350);expect(await materials(page,slot)).toEqual(before);
      await page.mouse.move(12,12);expect(await materials(page,slot)).toEqual(before);
      await page.keyboard.press('Tab');await page.locator(`.hero-poster[data-slot="${slot}"] a`).focus();
      await expect(page.locator(`.hero-poster[data-slot="${slot}"]`)).toHaveCSS('z-index','3');
      await expect(page.locator(`.hero-poster[data-slot="${slot}"] .card-info`)).toHaveCSS('opacity','0');
      await expect(page.locator(`.hero-poster[data-slot="${slot}"] a`)).toHaveCSS('outline-style','solid');
      await page.getByRole('textbox').focus();
    }
    for(const slot of [-1,1]){await exposed(page,slot);await expect(page.locator(`.hero-poster[data-slot="${slot}"]`)).toHaveCSS('z-index','4');await expect(page.locator('.offset-0')).toHaveCSS('z-index','5');}
  }
});

test('stationary pointer and focus lose preview as the item enters an outer slot',async({page})=>{
  await ready(page);await exposed(page,0);await expect(page.locator('.offset-0 .card-info')).toHaveCSS('opacity','1');
  const id=await page.locator('.offset-0').getAttribute('data-drama-id');
  for(let i=0;i<2;i++){await page.getByRole('button',{name:'下一部短剧'}).evaluate((e:HTMLButtonElement)=>e.click());await idle(page);}
  const card=page.locator(`.hero-poster[data-drama-id="${id}"]`);await expect(card).toHaveAttribute('data-outer','true');await expect(card.locator('.card-info')).toHaveCSS('opacity','0');await expect(card.locator('.cover-shade')).toHaveCSS('opacity','0.38');
  await page.keyboard.press('Tab');await card.locator('a').focus();await expect(card).toHaveCSS('z-index','3');await page.keyboard.press('Enter');await expect(page).toHaveURL(new RegExp(`/play/${id}$`));
});

for(const [width,height] of [[320,812],[390,844],[768,1024],[1280,720],[1920,1080]])test(`navigation, search, history and viewport ${width}x${height}`,async({page})=>{
  await page.setViewportSize({width,height});await ready(page,true);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  for(const selector of ['.account-button','.membership-button','.search-box'])expect(await page.locator(selector).evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;})).toBe(true);
  await page.getByRole('button',{name:'科幻',exact:true}).click();await expect(page).toHaveURL(/#results$/);await expect(page.locator('.home-section-nav [aria-current]')).toHaveCount(0);
  await page.getByRole('navigation',{name:'首页分区'}).getByText('最新更新',{exact:true}).click();await expect(page.locator('.drama-card')).toHaveCount(12);await expect(page.getByRole('textbox')).toHaveValue('');await aligned(page,'latest');
  await page.getByRole('textbox').fill('山海');await expect(page.locator('.drama-card')).toHaveCount(1);await expect(page).toHaveURL(/#results$/);await expect(page.locator('.home-section-nav [aria-current]')).toHaveCount(0);
  await page.locator('.drama-card').scrollIntoViewIfNeeded();const before=await page.evaluate(()=>scrollY);await page.locator('.drama-card').click();await expect(page.locator('.no-source')).toBeVisible();await expect(page.locator('video')).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.goBack();await expect(page.getByRole('textbox')).toHaveValue('山海');await expect(page.locator('.drama-card')).toHaveCount(1);await expect(page).toHaveURL(/#results$/);expect(Math.abs(await page.evaluate(()=>scrollY)-before)).toBeLessThan(8);await expect(page.locator('.intro')).toHaveCount(0);
  await page.getByRole('navigation',{name:'首页分区'}).getByText('热门推荐',{exact:true}).click();await aligned(page,'popular');await expect(page.locator('.drama-card')).toHaveCount(12);
  await page.getByRole('textbox').fill('不存在的故事xyz');await expect(page.locator('.empty-state')).toBeVisible();await expect(page.locator('.empty-state .primary-button')).toHaveCSS('color','rgb(255, 255, 255)');
  await page.locator('.empty-state').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/empty-${width}.png`});
  await page.locator('.empty-state button').click();await expect(page.locator('.drama-card')).toHaveCount(12);await expect(page.getByRole('textbox')).toHaveValue('');await expect(page.getByRole('button',{name:'全部',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('textbox').fill('山海');await expect(page.locator('.drama-card')).toHaveCount(1);await page.getByRole('button',{name:'清空搜索'}).click();await expect(page.locator('.drama-card')).toHaveCount(12);
  await page.getByRole('navigation',{name:'主导航'}).getByText('首页',{exact:true}).click();await aligned(page,'home');expect(await page.evaluate(()=>scrollY)).toBe(0);
  // Trigger native lazy loading before capturing the full page.
  for(const image of await page.locator('.drama-card img').all()){await image.scrollIntoViewIfNeeded();await image.evaluate((el:HTMLImageElement)=>el.decode());}
  await page.getByRole('navigation',{name:'主导航'}).getByText('首页',{exact:true}).click();await page.locator('.hero-poster img').evaluateAll(els=>Promise.all(els.map(el=>(el as HTMLImageElement).decode())));
  await page.screenshot({path:`${out}/home-${width}.png`,fullPage:true});await page.screenshot({path:`${out}/banner-${width}.png`});
  expect(errors).toEqual([]);
});

test('IME commits once, typing preserves scroll and smooth navigation stays selected',async({page})=>{
  await ready(page);const input=page.getByRole('textbox');await input.focus();const before=await page.evaluate(()=>scrollY);
  await input.dispatchEvent('compositionstart');await input.fill('山');await input.dispatchEvent('keydown',{key:'Enter',isComposing:true,keyCode:229});await page.waitForTimeout(300);
  await expect(page.locator('.drama-card')).toHaveCount(12);expect(await page.evaluate(()=>scrollY)).toBe(before);
  await input.fill('山海');await input.dispatchEvent('compositionend',{data:'山海'});await expect(page.locator('.drama-card')).toHaveCount(1);expect(await page.evaluate(()=>scrollY)).toBe(before);
  await input.press('Enter');await expect(page).toHaveURL(/search\?q=/);await expect(page.locator('.drama-card')).toHaveCount(1);await page.getByRole('navigation',{name:'主导航'}).getByText('首页',{exact:true}).click();await expect(page.locator('#popular')).toBeVisible();
  await page.getByRole('navigation',{name:'首页分区'}).getByText('最新更新',{exact:true}).click();const states=await page.evaluate(async()=>{const states:string[]=[];const start=performance.now();while(performance.now()-start<1400){states.push(document.querySelector('.home-section-nav [aria-current]')?.textContent||'');await new Promise(requestAnimationFrame);}return [...new Set(states)];});expect(states).toEqual(['最新更新']);await aligned(page,'latest');
  await page.evaluate(()=>document.getElementById('popular')!.scrollIntoView({behavior:'instant'}));await aligned(page,'popular');
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await aligned(page,'home');
});

test('history entries retain their own filters and pending searches cannot overwrite navigation',async({page})=>{
  await ready(page);
  await page.getByRole('button',{name:'奇幻',exact:true}).click();await page.getByRole('textbox').fill('山海');await expect(page.locator('.drama-card')).toHaveCount(1);
  await page.locator('.drama-card').scrollIntoViewIfNeeded();
  // Click the visible sticky navigation directly: locator.click() first scrolls
  // its original flow position into view, changing the state we intend to save.
  await page.getByRole('navigation',{name:'首页分区'}).getByText('最新更新',{exact:true}).scrollIntoViewIfNeeded();const before=await page.evaluate(()=>scrollY);const nav=await page.getByRole('navigation',{name:'首页分区'}).getByText('最新更新',{exact:true}).boundingBox();await page.mouse.click(nav!.x+nav!.width/2,nav!.y+nav!.height/2);
  await page.goBack();await expect(page.getByRole('textbox')).toHaveValue('山海');await expect(page.getByRole('button',{name:'奇幻',exact:true})).toHaveAttribute('aria-pressed','true');expect(Math.abs(await page.evaluate(()=>scrollY)-before)).toBeLessThan(8);
  await page.reload();await expect(page.locator('.drama-card')).toHaveCount(1);await expect(page).toHaveURL(/#results$/);
  await page.getByRole('textbox').fill('无结果输入');await page.getByRole('navigation',{name:'首页分区'}).getByText('热门推荐',{exact:true}).click();await aligned(page,'popular');await page.waitForTimeout(600);await expect(page.locator('.drama-card')).toHaveCount(12);await expect(page.getByRole('textbox')).toHaveValue('');
});

test('intro waits for entry, preserves grouped reveal and cleans up after departure',async({page})=>{
  expect(introPhases).toEqual({reveal:1550,gather:820,transition:1680,flight:640});expect(timing.intro).toBe(1680);expect(timing.logoMoveAt).toBe(900);
  await page.goto('/');await expect(page.locator('.intro .intro-logo')).toBeVisible();
  const phases=await page.evaluate(()=>document.getAnimations().map(animation=>({target:(animation.effect as KeyframeEffect).target?.getAttribute('class'),delay:animation.effect!.getTiming().delay,duration:animation.effect!.getTiming().duration})));
  expect(phases.find(p=>p.target==='brand-wordmark')).toMatchObject({delay:900,duration:650});expect(phases.find(p=>p.target==='brand-icon')).toMatchObject({delay:850,duration:700});
  expect(phases.find(p=>p.target==='intro-logo')).toBeUndefined();
  await page.getByRole('button',{name:'进入爱爱',exact:true}).click();
  await expect(page.locator('.intro')).toHaveCount(0,{timeout:3000});await expect(page.locator('.app')).not.toHaveAttribute('inert');expect(await page.evaluate(()=>document.body.style.overflow)).toBe('');
  await page.locator('.offset-0 a').click();await page.goBack();await expect(page.locator('.intro')).toHaveCount(0);
  await page.evaluate(()=>sessionStorage.removeItem('aiai:intro-seen'));await page.emulateMedia({reducedMotion:'reduce'});await page.reload();
  await expect(page.getByRole('button',{name:'进入爱爱',exact:true})).toBeVisible();await page.getByRole('button',{name:'进入爱爱',exact:true}).click();await expect(page.locator('.intro')).toHaveCount(0,{timeout:1000});await expect(page.locator('.nav-logo')).toHaveCSS('visibility','visible');
});

test('touch targets do not overlap, catalog avoids sticky hover, dialogs restore focus',async({browser})=>{
  const context=await browser.newContext({viewport:{width:320,height:812},hasTouch:true,isMobile:true,baseURL:'http://localhost:5173'});const page=await context.newPage();await ready(page,true);
  const targets=await page.locator('nav a,.header-actions button,.genre-filters button,.carousel-arrow,.carousel-dots button,.autoplay-button').evaluateAll(els=>els.map(e=>{const r=e.getBoundingClientRect();return {name:e.getAttribute('aria-label')||e.textContent,rect:{x:r.x,y:r.y,w:r.width,h:r.height}};}));
  for(const {rect:r} of targets){expect(r.w).toBeGreaterThanOrEqual(44);expect(r.h).toBeGreaterThanOrEqual(44);}
  for(let i=0;i<targets.length;i++)for(let j=i+1;j<targets.length;j++){const a=targets[i].rect,b=targets[j].rect;expect(Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>0&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>0,`${targets[i].name}/${targets[j].name}`).toBe(false);}
  for(const name of ['登录 / 注册'])for(const close of ['button','escape','backdrop']){
    const trigger=page.getByRole('button',{name,exact:true});await trigger.tap();await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByRole('button',{name:'关闭弹层'})).toBeFocused();
    await page.keyboard.press('Shift+Tab');await expect(page.getByRole('button',{name:'关闭',exact:true})).toBeFocused();await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'关闭弹层'})).toBeFocused();
    expect(await page.evaluate(()=>document.body.style.overflow)).toBe('hidden');
    if(close==='button')await page.getByRole('button',{name:'关闭弹层'}).tap();else if(close==='escape')await page.keyboard.press('Escape');else await page.touchscreen.tap(3,3);
    await expect(page.locator('dialog')).toHaveCount(0);await expect(trigger).toBeFocused();expect(await page.evaluate(()=>document.body.style.overflow)).toBe('');
  }
  await page.locator('.drama-card').first().tap();await page.goBack();await expect(page.locator('.drama-card .card-info').first()).toHaveCSS('opacity','0');expect(await page.locator('.drama-grid').first().evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length)).toBe(2);
  await context.close();
});
