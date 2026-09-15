import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const folder=path.resolve('.local/round3-record'), output=path.resolve('docs/round-3');
await fs.mkdir(folder,{recursive:true}); await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome'});
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});
const cdp=await page.context().newCDPSession(page);
const frames=[],writes=[],errors=[];
page.on('pageerror',e=>errors.push(e.message));
cdp.on('Page.screencastFrame',e=>{
  const file=path.join(folder,`frame-${String(frames.length).padStart(5,'0')}.jpg`);
  frames.push({file,timestamp:e.metadata.timestamp});writes.push(fs.writeFile(file,Buffer.from(e.data,'base64')));
  void cdp.send('Page.screencastFrameAck',{sessionId:e.sessionId});
});
await cdp.send('Page.startScreencast',{format:'jpeg',quality:90,maxWidth:1440,maxHeight:1000,everyNthFrame:1});
await page.goto('http://localhost:5173',{waitUntil:'domcontentloaded'});
const start=performance.now();
for (const t of [350,850,1300,1750,2350,2850,3400,4100]) {
  await page.waitForTimeout(Math.max(0,t-(performance.now()-start)));
  await page.screenshot({path:path.join(output,`intro-${t}ms.png`)});
}
for (const offset of [-2,-1,0,1,2]) {
  await page.getByRole('textbox',{name:'搜索剧名'}).focus();await page.mouse.move(710,105);await page.waitForTimeout(310);
  const card=page.locator(`.hero-poster.offset-${offset}`);
  const point=await card.evaluate(el=>{const r=el.getBoundingClientRect();for(let x=Math.max(15,r.left+12);x<Math.min(innerWidth-15,r.right-12);x+=8){const y=r.top+r.height*.7;if(document.elementFromPoint(x,y)?.closest('.hero-poster')===el)return{x,y};}return null;});
  if(!point)throw Error(`No exposed point for ${offset}`);
  await page.mouse.move(point.x,point.y,{steps:10});await page.waitForTimeout(350);
  await card.getByRole('button',{name:'查看短剧',exact:true}).hover();await page.waitForTimeout(350);
  if(offset===-2 || offset===1) {
    await card.getByRole('button',{name:'查看短剧',exact:true}).click();await page.waitForTimeout(680);
    await page.keyboard.press('Escape');await page.waitForTimeout(420);
  }
}
await page.locator('.drama-card').first().click();await page.waitForTimeout(750);
await page.getByRole('button',{name:'关闭弹层'}).click();await page.waitForTimeout(420);
await page.locator('.drama-card').nth(1).click();await page.waitForTimeout(60);
await page.keyboard.press('Escape');await page.waitForTimeout(500);
await cdp.send('Page.stopScreencast');await Promise.all(writes);
await browser.close();
let concat='';for(let i=0;i<frames.length;i++)concat+=`file '${frames[i].file.replaceAll('\\','/')}'\nduration ${i+1<frames.length?Math.max(.01,frames[i+1].timestamp-frames[i].timestamp).toFixed(4):'0.6'}\n`;
concat+=`file '${frames.at(-1).file.replaceAll('\\','/')}'\n`;
await fs.writeFile(path.join(folder,'frames.txt'),concat);
const r=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',path.join(folder,'frames.txt'),'-fps_mode','vfr','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',path.join(output,'motion-review.mp4')],{encoding:'utf8',windowsHide:true});
if(r.status!==0)throw Error(r.stderr||r.error?.message);
const report={frames:frames.length,seconds:+(frames.at(-1).timestamp-frames[0].timestamp).toFixed(2),errors,method:'Actual Chrome Page.screencastFrame JPEGs with presentation timestamps. Variable frame rate MP4, no synthetic intermediate frames; recording is separate from performance measurement.'};
await fs.writeFile(path.join(output,'recording.json'),JSON.stringify(report,null,2));console.log(report);
