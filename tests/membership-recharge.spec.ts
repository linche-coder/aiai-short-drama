import {test,expect,type Page} from '@playwright/test';

const wallet=(balance:number,tier:'free'|'premium'='free')=>({summary:{balance,tier,monthlyAllowance:0,checkedInToday:false,trialActive:false,demo:true},transactions:[],unlocks:[]});
async function account(page:Page,tier:'free'|'premium',balance:number,nickname='测试用户'){
 await page.route('**/api/v1/session',route=>route.fulfill({json:{subject:'layout-user',nickname,tier,roles:[],expiresAt:null,membership:tier==='premium'?{level:3,growth:1680,nextLevelGrowth:3000,expiresAt:'2026-12-31T00:00:00Z'}:null}}));
 await page.route('**/api/v1/me/points',route=>route.fulfill({json:wallet(balance,tier)}));
 await page.route('**/api/v1/me/overview',route=>route.fulfill({json:{credits:{balance,expires:false,paidEpisodeCost:5},checkIn:{checkedInToday:false,streakDays:0,cycleDay:1,rewards:[],nextResetAt:'2026-12-31T00:00:00Z',appBonusRemaining:1},trial:{status:'available',startsAt:null,expiresAt:null}}}));
}

test('免费用户：账户、体验、三卡和永久积分共用栅格；购买只打开确认弹层',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 await account(page,'free',123456789,'一个相当长的用户昵称用来检验自动换行和余额布局');
 await page.goto('/membership');
 await expect(page.getByRole('heading',{name:'爱爱短剧 畅看会员'})).toBeVisible();
 await expect(page.locator('.membership-balance-row').first().locator('strong')).toHaveText('123,456,789');
 await expect(page.locator('.recharge-card')).toHaveCount(3);
 await expect(page.locator('.recharge-card').first()).toContainText('畅看月卡');
 await expect(page.locator('.recharge-card').nth(1)).toContainText('畅看季卡');
 await expect(page.locator('.recharge-card').last()).toContainText('永久会员');
 await expect(page.locator('.recharge-card').first()).toContainText('88');
 await expect(page.locator('.recharge-card').nth(1)).toContainText('188');
 await expect(page.locator('.recharge-card').last()).toContainText('388');
 const shapes=await page.locator('.recharge-emblem .emblem-body').evaluateAll(elements=>elements.map(element=>element.innerHTML));expect(new Set(shapes).size).toBe(3);
 await expect(page.locator('.membership-season-card')).toHaveCount(0);
 await expect(page.locator('.recharge-tiers .recharge-emblem')).toHaveCount(3);
 await expect(page.locator('.membership-credit-cta')).toHaveCount(1);
 await expect(page.locator('.membership-credit-options')).toContainText('220 积分');
 await expect(page.locator('.membership-credit-options')).toContainText('¥10.9');
 await expect(page.locator('.membership-credits h2 .lucide-coins')).toHaveCount(1);
 await expect(page.locator('.membership-credit-cta')).toContainText('购买永久积分');
 await expect(page.locator('.membership-more-plans')).toHaveCount(0);
 for(const width of [1440,768,390,320]){
  await page.setViewportSize({width,height:900});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth),`overflow at ${width}`).toBeLessThanOrEqual(1);
  if(width===1440){const edges=await page.evaluate(()=>{const box=(selector:string)=>document.querySelector(selector)!.getBoundingClientRect();return {account:box('.membership-account'),trial:box('.membership-trial'),first:box('.recharge-card:first-child'),last:box('.recharge-card:last-child'),credits:box('.membership-credits'),note:box('.membership-credits small'),quantity:box('.membership-credit-quantity'),price:box('.membership-credit-price'),buy:box('.membership-credit-cta')};});expect(Math.abs(edges.account.left-edges.first.left)).toBeLessThanOrEqual(1);expect(Math.abs(edges.account.right-edges.last.right)).toBeLessThanOrEqual(1);expect(Math.abs(edges.account.left-edges.trial.left)).toBeLessThanOrEqual(1);expect(Math.abs(edges.account.left-edges.credits.left)).toBeLessThanOrEqual(1);expect(edges.note.height).toBeLessThanOrEqual(23);expect(edges.price.left-edges.quantity.right).toBeLessThanOrEqual(20);expect(edges.buy.left-edges.price.right).toBeLessThanOrEqual(20);}
  if(width===1440||width===390)await page.screenshot({path:`.local/membership-recharge-${width}.png`,fullPage:true});
 }
 await page.setViewportSize({width:1440,height:900});
 const cta=page.locator('.membership-credit-cta').first();
 await cta.focus();await expect(cta).toHaveCSS('outline-style','solid');
 const baseBackground=await cta.evaluate(element=>getComputedStyle(element).backgroundImage);
 await cta.hover();await expect.poll(()=>cta.evaluate(element=>getComputedStyle(element).backgroundImage)).not.toBe(baseBackground);
 await cta.click();await expect(page.getByRole('dialog',{name:'购买永久积分'})).toBeVisible();
 await page.keyboard.press('Escape');await expect(cta).toBeFocused();
 await page.locator('.membership-balance-row').first().locator('a').click();await expect(page).toHaveURL(/#credits$/);
 const anchor=await page.locator('#credits').evaluate(element=>element.getBoundingClientRect().top);expect(anchor).toBeGreaterThanOrEqual(0);
 expect(errors).toEqual([]);
 await page.getByRole('link',{name:'我的订单'}).first().click();await expect(page).toHaveURL(/\/me\/orders$/);
});

test('已开通会员使用同一布局，保留等级、期限、权益和续费入口',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 await account(page,'premium',987654,'会员账号');await page.goto('/membership');
 await expect(page.getByRole('heading',{name:'爱爱短剧 畅看会员'})).toBeVisible();
 await expect(page.locator('.membership-account')).toContainText('尊享会员');
 await expect(page.locator('.membership-account')).toContainText('2026/12/31');
 await expect(page.locator('.membership-balance-row').first().locator('strong')).toHaveText('987,654');
 for(const width of [1440,768,390,320]){await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);if(width===1440||width===390)await page.screenshot({path:`.local/membership-member-${width}.png`,fullPage:true});}
 await page.getByText('查看当前会员权益').click();
 await expect(page.locator('.membership-benefits-content')).toContainText('VIP 剧集畅看');
 await expect(page.locator('.membership-trial')).toContainText('会员可领取一次，领取后有效期增加 1 天');
 await page.getByRole('button',{name:'选择畅看月卡'}).click();
 await expect(page.getByRole('dialog',{name:'畅看月卡'})).toBeVisible();
 await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'选择畅看季卡'}).click();
 await expect(page.getByRole('dialog',{name:'畅看季卡'})).toBeVisible();
 expect(errors).toEqual([]);
});

test('未登录和积分请求错误不显示旧余额，页头三处圆角一致',async({page})=>{
 await page.route('**/api/v1/session',route=>route.fulfill({json:{subject:null,tier:'free',roles:[],expiresAt:null}}));
 await page.goto('/membership');
 await expect(page.locator('.membership-balance-row').first()).toContainText('登录后查看');
 for(const width of [1440,390]){await page.setViewportSize({width,height:850});const radii=await page.evaluate(()=>['.site-header .search-box','.site-header .check-in-header-link','.site-header .membership-button'].map(selector=>getComputedStyle(document.querySelector(selector)!).borderTopLeftRadius));expect(radii).toEqual(['7px','7px','7px']);}
 await page.locator('.membership-credit-cta').first().click();await expect(page.getByRole('dialog',{name:'购买永久积分'})).toBeVisible();await expect(page.getByRole('link',{name:'登录后继续'})).toBeVisible();
});

test('积分接口失败时余额不沿用旧值，确认按钮不可用',async({page})=>{
 await account(page,'free',4321);
 await page.route('**/api/v1/me/points',route=>route.fulfill({status:503,json:{code:'service_unavailable'}}));
 await page.goto('/membership');
 await expect(page.locator('.membership-balance-row').first().locator('strong')).toHaveText('暂时无法获取');
 await expect(page.locator('.membership-account')).not.toContainText('4,321');
 await page.locator('.membership-credit-cta').first().click();
 await expect(page.getByRole('button',{name:'支付暂不可用'})).toBeDisabled();
});

test('访客购买积分保留商品及原页面回跳，不提交订单',async({page})=>{
 let purchases=0;
 await page.route('**/api/v1/session',route=>route.fulfill({json:{subject:null,tier:'free',roles:[],expiresAt:null}}));
 await page.route('**/api/v1/me/points/demo-purchase',route=>{purchases++;return route.fulfill({status:503,json:{code:'service_unavailable'}});});
 await page.goto('/membership?returnTo=%2Fplay%2Fdrama-05%3Fepisode%3Ddemo-7');
 await page.locator('.membership-credit-cta').first().click();
 await page.getByRole('link',{name:'登录后继续'}).click();
 await expect(page.getByRole('dialog',{name:'登录注册'})).toBeVisible();
 const loginReturn=new URL(page.url()).searchParams.get('returnTo');
 expect(loginReturn).toBeTruthy();
 expect(new URL(loginReturn!,'http://localhost').searchParams.get('offer')).toBe('points-220');
 expect(new URL(loginReturn!,'http://localhost').searchParams.get('returnTo')).toBe('/play/drama-05?episode=demo-7');
 expect(purchases).toBe(0);
});

test('会员说明显示与当前套餐一致的价格、权益及体验规则',async({page})=>{
 await page.goto('/membership-guide');
 await expect(page.getByRole('heading',{name:'账号与隐私'})).toBeVisible();
 await expect(page.getByRole('heading',{name:'会员与付费'})).toBeVisible();
 await expect(page.locator('.policy-copy')).toContainText('畅看月卡有效期 30 天，季卡有效期 90 天，永久会员无到期日');
 await expect(page.locator('.policy-copy')).toContainText('永久积分包可重复购买');
 await expect(page.locator('.policy-copy')).toContainText('已开通限时会员领取后有效期增加一天');
 await expect(page.getByRole('link',{name:'查看完整用户协议'})).toHaveAttribute('href','/terms');
 await expect(page.getByRole('link',{name:'查看隐私说明'})).toHaveAttribute('href','/privacy');
 await page.screenshot({path:'.local/membership-guide-1440.png',fullPage:true});
});

test('会员领取体验后显示有效期顺延，刷新后不出现第二次领取入口',async({page})=>{
 let expiry='2026-12-30T00:00:00Z',claims=0;
 await page.route('**/api/v1/session',route=>route.fulfill({json:{subject:'trial-member',nickname:'体验会员',tier:'premium',roles:[],expiresAt:null,membership:{level:3,growth:1680,nextLevelGrowth:3000,expiresAt:expiry}}}));
 await page.route('**/api/v1/me/points',route=>route.fulfill({json:wallet(0,'premium')}));
 const overview=()=>({credits:{balance:0,expires:false,paidEpisodeCost:5},checkIn:{checkedInToday:false,streakDays:0,cycleDay:1,rewards:[],nextResetAt:'2026-12-31T00:00:00Z',appBonusRemaining:1},trial:{status:claims?'active':'available',startsAt:claims?'2026-09-21T00:00:00Z':null,expiresAt:claims?'2026-09-22T00:00:00Z':null}});
 await page.route('**/api/v1/me/overview',route=>route.fulfill({json:overview()}));
 await page.route('**/api/v1/me/trial',route=>{claims++;expiry='2026-12-31T00:00:00Z';return route.fulfill({json:overview()});});
 await page.goto('/membership');await page.getByRole('button',{name:'领取加 1 天'}).click();
 await expect(page.locator('.membership-trial')).toContainText('已领取，会员有效期增加 1 天');
 await expect(page.locator('.membership-account')).toContainText('2026/12/31');
 await page.reload();await expect(page.getByRole('button',{name:'领取加 1 天'})).toHaveCount(0);expect(claims).toBe(1);
});
