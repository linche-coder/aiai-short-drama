import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const out=path.resolve('docs/m4');
const browser=await chromium.launch({channel:'chrome'});
async function capture(name,viewport,mobile,scenes){
 const folder=path.resolve(`.local/m4-${name}`);await fs.mkdir(folder,{recursive:true});
 const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,reducedMotion:'no-preference'});const page=await context.newPage();const errors=[],marks=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 const cdp=await context.newCDPSession(page),frames=[],writes=[];
 cdp.on('Page.screencastFrame',e=>{const file=path.join(folder,`frame-${String(frames.length).padStart(5,'0')}.jpg`);frames.push({file,timestamp:e.metadata.timestamp});writes.push(fs.writeFile(file,Buffer.from(e.data,'base64')));void cdp.send('Page.screencastFrameAck',{sessionId:e.sessionId});});
 await page.goto('http://localhost:5173/#home');
 await cdp.send('Page.startScreencast',{format:'jpeg',quality:90,maxWidth:viewport.width,maxHeight:viewport.height,everyNthFrame:1});
 const mark=async(label)=>marks.push({label,at:Date.now(),url:page.url()});await mark('入场显现');
 await page.waitForTimeout(1500);await page.screenshot({path:path.join(out,`${name}-logo.png`)});await mark('完整显现后的停留');
 await page.locator('.intro').waitFor({state:'detached',timeout:5000});await mark('转场完成');
 await scenes(page,mark);
 await page.waitForTimeout(500);await cdp.send('Page.stopScreencast');await Promise.all(writes);await context.close();
 let concat='';for(let i=0;i<frames.length;i++)concat+=`file '${frames[i].file.replaceAll('\\','/')}'\nduration ${i+1<frames.length?Math.max(.01,frames[i+1].timestamp-frames[i].timestamp).toFixed(4):'0.5'}\n`;concat+=`file '${frames.at(-1).file.replaceAll('\\','/')}'\n`;await fs.writeFile(path.join(folder,'frames.txt'),concat);
 const result=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',path.join(folder,'frames.txt'),'-fps_mode','vfr','-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,`${name}-motion.mp4`)],{encoding:'utf8',windowsHide:true});if(result.status!==0)throw Error(result.stderr||result.error?.message);
 const report={viewport,frames:frames.length,seconds:frames.at(-1).timestamp-frames[0].timestamp,errors,marks,method:'Actual Chrome CDP frames with presentation timestamps; no synthetic animation or drama video.'};await fs.writeFile(path.join(out,`${name}-recording.json`),JSON.stringify(report,null,2));console.log(name,report.frames,report.seconds,'errors:',errors);
}
await capture('desktop',{width:1920,height:1080},false,async(page,mark)=>{
 await page.getByRole('button',{name:'暂停自动轮播'}).click();
 for(let i=0;i<5;i++){
  await page.locator('.carousel-dots button').nth(i).click();await page.waitForTimeout(500);await mark(`中心项 ${i+1}`);
  for(const slot of [-2,2]){
   await page.mouse.move(900,50);await page.waitForTimeout(120);const p=await page.locator(`.hero-poster[data-slot="${slot}"]`).evaluate(el=>{const r=el.getBoundingClientRect();for(let x=Math.max(12,r.left+12);x<Math.min(innerWidth-12,r.right-12);x+=4){const y=r.top+r.height*.65;if(document.elementFromPoint(x,y)?.closest('.hero-poster')===el)return{x,y};}throw Error('No exposed card');});
   await page.mouse.move(p.x,p.y,{steps:8});await page.waitForTimeout(260);
   if(i===0&&slot===-2)await page.screenshot({path:path.join(out,'desktop-outer-hover.png')});
  }
 }
 await page.locator('.carousel-dots button').first().click();await page.waitForTimeout(500);await page.locator('.offset-0 a').hover();await page.waitForTimeout(350);await page.screenshot({path:path.join(out,'desktop-center-hover.png')});
 await page.getByRole('button',{name:'科幻',exact:true}).click();await page.waitForTimeout(500);await mark('科幻筛选');await page.getByRole('navigation',{name:'首页分区'}).getByText('最新更新',{exact:true}).click();await page.waitForTimeout(1100);await page.screenshot({path:path.join(out,'desktop-latest.png')});await mark('恢复首页最新分区');
 await page.getByRole('textbox').fill('山海');await page.waitForTimeout(500);await page.locator('.drama-card').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'desktop-one-result.png')});await page.locator('.drama-card').click();await page.waitForTimeout(500);await page.screenshot({path:path.join(out,'desktop-details.png')});await page.goBack();await page.waitForTimeout(400);await mark('返回恢复搜索');
});
await capture('mobile',{width:390,height:844},true,async(page,mark)=>{
 await page.getByRole('button',{name:'暂停自动轮播'}).tap();await page.screenshot({path:path.join(out,'mobile-home.png')});
 await page.locator('.offset-0 a').tap();await page.waitForTimeout(600);await page.screenshot({path:path.join(out,'mobile-details.png')});await page.goBack();await page.waitForTimeout(500);await mark('触控详情与返回');
 await page.getByRole('textbox').fill('不存在的故事');await page.getByRole('textbox').press('Enter');await page.waitForTimeout(1000);await page.screenshot({path:path.join(out,'mobile-empty.png')});await page.locator('.empty-state button').tap();await page.waitForTimeout(600);await mark('空结果重置');
 await page.getByRole('button',{name:'登录 / 注册'}).tap();await page.waitForTimeout(400);await page.screenshot({path:path.join(out,'mobile-login.png')});await page.keyboard.press('Escape');await page.waitForTimeout(400);await mark('弹窗 Esc 关闭');
});
await browser.close();
