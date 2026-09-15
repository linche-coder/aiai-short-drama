import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
await fs.mkdir('docs/round-5',{recursive:true});
const browser=await chromium.launch({channel:'chrome'});
const page=await browser.newPage({viewport:{width:1280,height:720}});
await page.addInitScript(()=>sessionStorage.setItem('aiai:intro-seen','yes'));
await page.goto('http://localhost:5173/#home');
await page.locator('.hero-poster img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
const card=page.locator('.offset--2');
const point=await card.evaluate(el=>{const r=el.getBoundingClientRect();for(let x=r.left+10;x<r.right;x+=4){const y=r.top+r.height/2;if(document.elementFromPoint(x,y)?.closest('.hero-poster')===el)return{x,y};}});
await page.mouse.move(point.x,point.y);await page.waitForTimeout(400);
console.log('outer hover',await card.evaluate(e=>({z:getComputedStyle(e).zIndex,shade:getComputedStyle(e.querySelector('.cover-shade')).opacity,info:getComputedStyle(e.querySelector('.card-info')).opacity})));
await page.screenshot({path:'docs/round-5/before-hover-1280.png'});
await page.getByRole('button',{name:'悬疑',exact:true}).click();await page.getByRole('navigation').getByText('最新').click();await page.waitForTimeout(600);
console.log('nav',await page.evaluate(()=>({url:location.hash,heading:document.querySelector('.drama-section h2')?.textContent,active:document.querySelector('.nav-home')?.textContent})));
await page.setViewportSize({width:320,height:812});await page.goto('http://localhost:5173/#home');await page.screenshot({path:'docs/round-5/before-320.png'});
console.log('overflow',await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,header:[...document.querySelectorAll('.header-inner *')].map(e=>({class:e.className,right:e.getBoundingClientRect().right,width:e.getBoundingClientRect().width})).filter(e=>e.right>innerWidth)})));
try {await page.goto('https://aiai-drama-showcase.docile-shell-2494.chatgpt.site/',{timeout:20000});console.log('reference',await page.title());await page.screenshot({path:'docs/round-5/reference-320.png'});}catch(e){console.log('reference unavailable',e.message);}
await browser.close();
