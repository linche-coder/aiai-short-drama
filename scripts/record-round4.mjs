import{chromium}from'@playwright/test';
import fs from'node:fs/promises';
import path from'node:path';
import{spawnSync}from'node:child_process';
const folder=path.resolve('.local/round4-record'),out=path.resolve('docs/round-4');await fs.mkdir(folder,{recursive:true});await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});
await page.addInitScript(()=>sessionStorage.setItem('aiai:intro-seen','yes'));
const cdp=await page.context().newCDPSession(page),frames=[],writes=[],errors=[],routes=[];
page.on('pageerror',e=>errors.push(e.message));
cdp.on('Page.screencastFrame',e=>{const file=path.join(folder,`frame-${String(frames.length).padStart(5,'0')}.jpg`);frames.push({file,timestamp:e.metadata.timestamp});writes.push(fs.writeFile(file,Buffer.from(e.data,'base64')));void cdp.send('Page.screencastFrameAck',{sessionId:e.sessionId});});
await page.goto('http://localhost:5173/#home');await page.locator('.hero').waitFor();await page.locator('.hero-poster img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
await cdp.send('Page.startScreencast',{format:'jpeg',quality:90,maxWidth:1440,maxHeight:1000,everyNthFrame:1});
for(const slot of [-2,-1,0,1,2]){
  await page.mouse.move(710,105);await page.waitForTimeout(260);const card=page.locator(`.hero-poster[data-slot="${slot}"]`);
  const p=await card.evaluate(el=>{const r=el.getBoundingClientRect();for(let x=Math.max(12,r.left+12);x<Math.min(innerWidth-12,r.right-12);x+=6){const y=r.top+r.height*.7;if(document.elementFromPoint(x,y)?.closest('.hero-poster')===el)return{x,y};}return null;});if(!p)throw Error(`No exposed card ${slot}`);
  await page.mouse.move(p.x,p.y,{steps:6});await page.waitForTimeout(400);
}
await page.getByRole('textbox',{name:'搜索剧名'}).focus();await page.mouse.move(980,40);await page.waitForTimeout(350);await page.screenshot({path:path.join(out,'after-no-residual.png')});
for(let i=0;i<6;i++){await page.getByRole('button',{name:'下一部短剧'}).click();await page.waitForTimeout(470);}
for(let i=0;i<8;i++)await page.getByRole('button',{name:i%3===0?'下一部短剧':'上一部短剧'}).click();
await page.waitForTimeout(900);await page.locator('.carousel-dots button').first().click();await page.waitForTimeout(500);
await page.locator('.offset-0 a').click();routes.push(page.url());await page.waitForTimeout(1100);await page.screenshot({path:path.join(out,'play-1440.png')});
await page.getByRole('link',{name:'返回首页',exact:true}).first().click();routes.push(page.url());await page.waitForTimeout(400);
await page.getByRole('group',{name:'题材筛选'}).getByRole('button',{name:'悬疑',exact:true}).click();await page.waitForTimeout(550);
await page.locator('.drama-card').first().hover();await page.waitForTimeout(450);await page.screenshot({path:path.join(out,'filtered-hover.png')});await page.locator('.drama-card').first().click();routes.push(page.url());await page.waitForTimeout(950);
await page.goBack();routes.push(page.url());await page.waitForTimeout(700);
await cdp.send('Page.stopScreencast');await Promise.all(writes);await browser.close();
let concat='';for(let i=0;i<frames.length;i++)concat+=`file '${frames[i].file.replaceAll('\\','/')}'\nduration ${i+1<frames.length?Math.max(.01,frames[i+1].timestamp-frames[i].timestamp).toFixed(4):'0.6'}\n`;concat+=`file '${frames.at(-1).file.replaceAll('\\','/')}'\n`;await fs.writeFile(path.join(folder,'frames.txt'),concat);
const rendered=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',path.join(folder,'frames.txt'),'-fps_mode','vfr','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,'motion-review.mp4')],{encoding:'utf8',windowsHide:true});if(rendered.status!==0)throw Error(rendered.stderr||rendered.error?.message);
const report={frames:frames.length,seconds:+(frames.at(-1).timestamp-frames[0].timestamp).toFixed(2),errors,routes,method:'Actual Chrome screencast frames and presentation timestamps; variable frame rate MP4, no synthesized frames. The video documents the UI only, never used as drama media.'};await fs.writeFile(path.join(out,'recording.json'),JSON.stringify(report,null,2));console.log(report);
