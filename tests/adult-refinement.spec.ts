import {test,expect} from '@playwright/test';
for(const width of [320,390,768,1280,1920])test('home refinement '+width,async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()===404)errors.push(r.url());});
 await page.setViewportSize({width,height:950});await page.goto('/18plus');await page.getByRole('button',{name:'确认并进入'}).click();await expect(page.locator('#adult-catalog .adult-card')).toHaveCount(6);
 await expect(page.locator('#adult-catalog-title')).toHaveText('精选推荐');await expect(page.locator('#adult-catalog .genre-filters')).toHaveCount(0);await expect(page.locator('#adult-latest-title')).toHaveText('最近上新');await expect(page.locator('.adult-ad-slot')).toHaveCount(3);
 await expect(page.locator('main')).not.toContainText(/封面样例|待审核|更新状态待确认|慢慢挑选/);await expect(page.locator('.adult-card-meta')).toHaveCount(0);await expect(page.locator('.adult-brand-mark')).toBeVisible();
 const search=await page.locator('.adult-tools .search-box').boundingBox(),wish=await page.getByRole('link',{name:'私密愿望榜',exact:true}).boundingBox();expect(wish!.x).toBeGreaterThan(search!.x+search!.width);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const cards=await page.locator('#adult-latest .adult-card:visible').evaluateAll(es=>es.map(e=>Math.round(e.getBoundingClientRect().top)));expect(new Set(cards).size).toBe(2);
 await page.getByRole('button',{name:'暂停自动切换'}).click();for(const img of await page.locator('.adult-card:visible img').all()){await img.scrollIntoViewIfNeeded();await expect.poll(()=>img.evaluate((i:HTMLImageElement)=>i.complete&&i.naturalWidth>0)).toBe(true);}await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:'docs/adult-refinement/home-'+width+'.png',fullPage:true});
 await page.getByRole('link',{name:'成人短剧',exact:true}).click();await expect(page.getByRole('group',{name:'题材',exact:true})).toBeVisible();expect(errors).toEqual([]);
});
test('common header search, private results and ordinary search',async({page})=>{
 await page.goto('/18plus');await page.getByRole('button',{name:'确认并进入'}).click();const input=page.getByRole('textbox',{name:'搜索精选内容'});await input.fill('完美婚姻');await input.press('Enter');await expect(page).toHaveURL(/18plus\/search$/);await expect(page.locator('#private-results .adult-card')).toHaveCount(1);await expect(page.locator('#private-results .adult-card-title')).toContainText('别相信完美婚姻');
 await page.locator('.adult-tools').getByRole('button',{name:'清空搜索'}).click();await expect(input).toHaveValue('');await input.press('Enter');await expect(page.locator('#private-results .adult-card')).toHaveCount(6);
 await page.getByRole('link',{name:'返回普通区',exact:true}).click();await expect(page.locator('.app')).not.toHaveAttribute('inert','',{timeout:12000});await page.getByRole('textbox',{name:'搜索精选内容'}).fill('月色');await page.getByRole('textbox',{name:'搜索精选内容'}).press('Enter');await expect(page).toHaveURL(/search/);
});
