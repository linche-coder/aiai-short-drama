import {test,expect,type Page} from '@playwright/test';
import fs from 'node:fs';
const out='docs/adult/screenshots';fs.mkdirSync(out,{recursive:true});
async function enter(page:Page,url='/18plus'){
 await page.addInitScript(()=>sessionStorage.setItem('aiai:intro-seen','yes'));
 await page.goto(url);await expect(page.getByRole('heading',{name:'进入18+专区',exact:true})).toBeVisible();
 await page.getByLabel('我已年满18周岁').check();await page.getByRole('button',{name:'确认并进入',exact:true}).click();
 await expect(page.locator('.adult-card').first()).toBeVisible();await expect(page.locator('.loading-state')).toHaveCount(0);
}
test('gate: age confirmation only, no early data, and cleared consent fail closed',async({page})=>{
 const requests:string[]=[];page.on('request',r=>requests.push(r.url()));await page.goto('/18plus/play/private-preview-1');
 expect(requests.some(r=>r.includes('/dev/adultPreview')||r.includes('/dev/assets/'))).toBe(false);
 await expect(page.getByLabel('我已年满18周岁')).not.toBeChecked();await expect(page.getByRole('button',{name:'确认并进入',exact:true})).toBeDisabled();await expect(page.getByText('地区')).toHaveCount(0);await page.screenshot({path:`${out}/gate-age-only.png`,fullPage:true});
 await page.getByLabel('我已年满18周岁').check();await expect(page.getByRole('button',{name:'确认并进入',exact:true})).toBeEnabled();await page.getByLabel('我已年满18周岁').uncheck();await expect(page.getByRole('button',{name:'确认并进入',exact:true})).toBeDisabled();
 await page.keyboard.press('Escape');await expect(page).toHaveURL(/\/#home$/);await expect(page.locator('.adult-shell')).toHaveCount(0);
 await enter(page);await page.evaluate(()=>sessionStorage.removeItem('aiai:adult-session-consent'));await page.reload();await expect(page.getByRole('heading',{name:'进入18+专区',exact:true})).toBeVisible();await expect(page.locator('.adult-card')).toHaveCount(0);
});
for(const width of [320,390,768,1280,1920])test(`visual and images ${width}`,async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await page.setViewportSize({width,height:width<800?950:1080});await enter(page);await expect(page.locator('.adult-card')).toHaveCount(6);
 await page.getByRole('button',{name:'暂停自动切换',exact:true}).click();await page.locator('.adult-main-poster img').evaluate((img:HTMLImageElement)=>img.decode());
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(page.locator('.adult-main-poster img')).toHaveCSS('object-fit','contain');
 for(const img of await page.locator('.adult-card img').all()){await img.scrollIntoViewIfNeeded();await expect.poll(()=>img.evaluate((i:HTMLImageElement)=>i.complete&&i.naturalWidth>0)).toBe(true);}
 await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:`${out}/home-${width}.png`,fullPage:true});
 const size=await page.getByRole('button',{name:'下一部',exact:true}).boundingBox();expect(size!.height).toBeGreaterThanOrEqual(44);expect(size!.width).toBeGreaterThanOrEqual(44);
 await page.getByRole('button',{name:'隐私设置',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.screenshot({path:`${out}/privacy-${width}.png`});await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.getByRole('button',{name:'隐私设置',exact:true})).toBeFocused();expect(errors).toEqual([]);
});
test('navigation, filters, private search, wish state, detail and position restore',async({page})=>{
 await enter(page);await page.getByRole('link',{name:'成人短剧',exact:true}).click();await expect(page.locator('.adult-card')).toHaveCount(6);
 await page.getByLabel('题材',{exact:true}).selectOption('悬疑');await expect(page.locator('.adult-card')).toHaveCount(1);await expect(page).toHaveURL(/genre=/);
 await page.getByLabel('更新状态',{exact:true}).selectOption('completed');await expect(page.locator('.adult-card')).toHaveCount(0);await page.goBack();await expect(page.locator('.adult-card')).toHaveCount(1);await expect(page.getByLabel('题材',{exact:true})).toHaveValue('悬疑');
 await page.getByRole('button',{name:'重置筛选',exact:true}).click();await expect(page.locator('.adult-card')).toHaveCount(6);
 for(const name of ['成人漫剧','原创','最新','热门']){await page.getByRole('link',{name,exact:true}).click();await expect(page.locator('.adult-nav [aria-current=page]')).toHaveText(name);await expect(page.locator('.adult-card')).toHaveCount(0);if(name!=='成人漫剧'){await page.getByRole('button',{name:'漫剧',exact:true}).click();await expect(page).toHaveURL(/format=motion_comic/);}}
 await page.getByRole('link',{name:'爱爱短剧专区首页'}).click();await expect(page.locator('.adult-card')).toHaveCount(6);await page.locator('.adult-card').first().scrollIntoViewIfNeeded();const scroll=await page.evaluate(()=>scrollY);
 const save=page.locator('.adult-card .adult-save').first();await save.click();await expect(save).toHaveAttribute('aria-pressed','true');await page.screenshot({path:`${out}/saved.png`});
 const wishBox=await page.getByRole('link',{name:'私密愿望榜',exact:true}).boundingBox();await page.mouse.click(wishBox!.x+wishBox!.width/2,wishBox!.y+wishBox!.height/2);await expect(page.locator('.adult-card')).toHaveCount(1);await page.getByRole('button',{name:'返回原浏览位置'}).click();await expect(page.locator('.adult-card')).toHaveCount(6);await expect.poll(()=>page.evaluate(()=>scrollY)).toBeCloseTo(scroll,0);
 await page.locator('.adult-card-art>a').first().click();await expect(page.getByRole('heading',{name:'暂未配置视频源',exact:true})).toBeVisible();await expect(page.locator('video')).toHaveCount(0);await expect(page.locator('.episode-grid')).toHaveCount(0);await page.screenshot({path:`${out}/detail.png`,fullPage:true});
 await page.getByRole('button',{name:'返回上一列表',exact:true}).click();await expect(page.locator('.adult-card')).toHaveCount(6);await expect.poll(()=>page.evaluate(()=>scrollY)).toBeCloseTo(scroll,0);
 await page.getByRole('link',{name:'专区搜索',exact:true}).click();await page.getByLabel('专区关键词').fill('婚姻');await page.getByRole('button',{name:'搜索',exact:true}).click();await expect(page.locator('.adult-card')).toHaveCount(1);expect(page.url()).not.toContain('婚姻');await page.getByRole('link',{name:'返回普通区',exact:true}).click();await expect(page.locator('.adult-shell')).toHaveCount(0);await expect(page.locator('[data-zone=adult]')).toHaveCount(0);await expect(page.getByLabel('搜索精选内容')).toHaveValue('');
});
test('manual pause, reduced motion, revocation and privacy cleanup',async({page})=>{
 await enter(page);await page.getByRole('button',{name:'暂停自动切换',exact:true}).click();const title=await page.locator('.adult-hero h1').innerText();await page.mouse.move(0,0);await page.getByRole('link',{name:'返回普通区',exact:true}).focus();await page.waitForTimeout(6300);await expect(page.locator('.adult-hero h1')).toHaveText(title);
 await page.getByRole('button',{name:'下一部',exact:true}).click();await expect(page.locator('.adult-hero h1')).not.toHaveText(title);await expect(page.getByRole('button',{name:'继续自动切换',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('.adult-hero-main')).toHaveCSS('animation-name','none');
 await page.getByRole('button',{name:'隐私设置',exact:true}).click();await page.getByRole('button',{name:'清除成人观看历史',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('愿望榜保留');await page.getByRole('button',{name:'确认清除历史'}).click();await expect(page.getByRole('status')).toHaveText('已清除本地观看历史。');await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'退出18+专区',exact:true}).click();await page.goBack();await expect(page.getByRole('heading',{name:'进入18+专区',exact:true})).toBeVisible();await expect(page.locator('.adult-card')).toHaveCount(0);
});
test('catalog error and empty states recover',async({page})=>{
 await enter(page);await page.evaluate(async()=>{const {contentService}=await import(performance.getEntriesByType('resource').map(e=>e.name).find(n=>/\/src\/services\/content\.ts(?:\?|$)/.test(n))!);contentService.setPreviewScenario('error');});await page.getByRole('link',{name:'愿望榜',exact:true}).click();await page.getByRole('link',{name:'成人短剧',exact:true}).click();await expect(page.getByText('内容加载失败，请重试',{exact:true})).toBeVisible();await page.screenshot({path:`${out}/content-error.png`});
 await page.evaluate(async()=>{const {contentService}=await import('/src/services/content.ts' as string);contentService.setPreviewScenario('empty');});await page.getByRole('button',{name:'重试',exact:true}).click();await expect(page.locator('.adult-card')).toHaveCount(0);await page.screenshot({path:`${out}/content-empty.png`});
});
