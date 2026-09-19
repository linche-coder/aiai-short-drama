import {test,expect} from '@playwright/test';

test.beforeEach(async({page})=>{
 await page.route('**/api/v1/me/points',route=>route.fulfill({status:503,json:{code:'service_unavailable'}}));
 await page.route('**/api/v1/session',route=>route.fulfill({json:{subject:null,tier:'free',roles:[],expiresAt:null}}));
});

test('所有充值选项保留参考金额，弹层支持 Escape 和焦点恢复',async({page})=>{
 await page.goto('/membership');
 await expect(page.getByRole('heading',{name:'爱爱短剧 会员方案'})).toBeVisible();
 await expect(page.locator('main')).not.toContainText(/演示|一次性购买|购买说明|AIAI/);
 const choices=[['立即开通','悦享会员','19.9'],['升级尊享','尊享会员','39.9'],['60 积分 ¥6','60 积分','6'],['200 积分 ¥18','200 积分','18'],['580 积分 ¥45','580 积分','45'],['1,500 积分 ¥98','1,500 积分','98'],['悦享年卡','悦享年卡','168'],['尊享年卡','尊享年卡','328']];
 for(const [button,title,price] of choices){
  const trigger=button.includes('年卡')?page.locator('.recharge-annual').filter({hasText:button}):page.getByRole('button',{name:button,exact:true});
  await trigger.click();
  const dialog=page.getByRole('dialog',{name:title,exact:true});
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.recharge-price strong')).toHaveText(price);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
 }
 await page.getByRole('link',{name:'免费开始'}).click();
 await expect(page).toHaveURL(/\/free$/);
});

test('登录和关闭登录均保留所选年卡及剧集回跳，未接入支付不伪造订单',async({page})=>{
 let orders=0;
 await page.route('**/api/v1/orders',route=>{orders++;return route.fulfill({status:503,json:{}});});
 await page.route('**/api/v1/auth/sign-in',route=>route.fulfill({json:{subject:'reader',tier:'free',roles:[],expiresAt:null}}));
 await page.goto('/membership?returnTo=%2Fplay%2Fdrama-05%3Fepisode%3Ddemo-7');
 await page.locator('.recharge-annual').filter({hasText:'尊享年卡'}).click();
 await page.getByRole('link',{name:'登录后继续'}).click();
 await expect(page.getByRole('dialog',{name:'登录注册'})).toBeVisible();
 await page.getByRole('button',{name:'关闭账号窗口'}).click();
 await expect(page.getByRole('dialog',{name:'尊享年卡',exact:true})).toBeVisible();
 await expect(page).toHaveURL(/offer=premium-year/);
 await page.getByRole('link',{name:'登录后继续'}).click();
 await page.getByPlaceholder('请输入账号').fill('reader');
 await page.getByPlaceholder('请输入密码').fill('password123');
 await page.getByRole('button',{name:'登录',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'尊享年卡',exact:true});
 await expect(dialog.locator('.recharge-price strong')).toHaveText('328');
 await expect(dialog.getByRole('button',{name:'支付暂不可用'})).toBeDisabled();
 expect(new URL(page.url()).searchParams.get('returnTo')).toBe('/play/drama-05?episode=demo-7');
 expect(orders).toBe(0);
 await page.keyboard.press('Escape');
 await expect(page.getByRole('dialog')).toHaveCount(0);
 await expect(page.locator('body')).not.toHaveCSS('overflow','hidden');
});

test('会员中心保留，续费进入新充值页',async({page})=>{
 await page.route('**/api/v1/session',route=>route.fulfill({json:{subject:'member',tier:'premium',roles:[],expiresAt:null,membership:{level:3,growth:1680,nextLevelGrowth:3000,expiresAt:'2026-12-31T00:00:00Z'}}}));
 await page.goto('/membership');
 await expect(page.getByRole('heading',{name:'我的会员权益'})).toBeVisible();
 await page.getByRole('link',{name:'续费会员',exact:true}).click();
 await expect(page.getByRole('heading',{name:'爱爱短剧 会员方案'})).toBeVisible();
 await page.getByRole('button',{name:'立即开通'}).click();
 await expect(page.getByRole('button',{name:'支付暂不可用'})).toBeDisabled();
});

test('桌面手机布局、减弱动效与截图',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/membership');
 for(const width of [320,390,560,768,1024,1440]){
  await page.setViewportSize({width,height:1000});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await expect(page.locator('.recharge-card').first()).toHaveCSS('animation-name','none');
  if(width===390||width===1440)await page.screenshot({path:`.local/membership-recharge-${width}.png`,fullPage:true});
 }
 expect(errors).toEqual([]);
});
