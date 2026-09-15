import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
await fs.mkdir('docs/round-4',{recursive:true});
const browser=await chromium.launch({channel:'chrome'});
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
await page.addInitScript(()=>sessionStorage.setItem('aiai:intro-seen','yes'));
await page.goto('http://localhost:5173/#home');await page.locator('.intro').waitFor({state:'detached'});
const snapshot=()=>page.evaluate(()=>({activeElement:document.activeElement?.tagName,cards:[...document.querySelectorAll('.hero-poster')].map(el=>({id:el.dataset.dramaId,slot:el.className,preview:el.dataset.preview,hover:el.matches(':hover'),focus:el.matches(':focus-within'),opacity:getComputedStyle(el.querySelector('.poster-info')).opacity,zIndex:getComputedStyle(el).zIndex}))}));
for(let i=0;i<3;i++){
  await page.locator('.offset-1 .side-cover-button').click({position:{x:300,y:80}});
  await page.getByRole('textbox',{name:'搜索剧名'}).focus();await page.mouse.move(980,40);await page.waitForTimeout(350);
}
const afterSideClicks=await snapshot();
for(let i=0;i<12;i++)await page.getByRole('button',{name:'下一部短剧'}).click();
for(let i=0;i<8;i++)await page.getByRole('button',{name:'上一部短剧'}).click();
await page.getByRole('textbox',{name:'搜索剧名'}).focus();await page.mouse.move(980,40);await page.waitForTimeout(400);
const afterArrows=await snapshot();
await page.screenshot({path:'docs/round-4/before-residual.png'});
const report={afterSideClicks,afterArrows};await fs.writeFile('docs/round-4/before-reproduction.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();
