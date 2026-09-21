import{test,expect}from'@playwright/test';
import{createServer,type ViteDevServer}from'vite';
import react from'@vitejs/plugin-react';
import{previewAuth}from'../vite.config';
import{festivalConfig}from'../src/services/festivalModel';
import{newWallet}from'../src/services/pointsModel';
import{mkdtempSync,writeFileSync}from'node:fs';
import{join}from'node:path';
import{tmpdir}from'node:os';

let server:ViteDevServer;
const password='member-test-password',base='http://127.0.0.1:5189';
async function signIn(page:import('@playwright/test').Page,account:string){await page.context().clearCookies();expect((await page.request.post(`${base}/api/v1/auth/sign-in`,{data:{account,password}})).status()).toBe(200);}

test.beforeAll(async()=>{
 const file=join(mkdtempSync(join(tmpdir(),'member-browser-')),'wallet.json'),trial=newWallet(),paid=newWallet(),expired=newWallet(),legacy=newWallet();
 trial.trialClaimedAt=new Date().toISOString();trial.trialExpiresAt=new Date(Date.now()+86400000).toISOString();
 paid.memberPointsBalance=50;paid.pointsBalance=123456789;expired.memberPointsBalance=21;expired.pointsBalance=19;legacy.pointsBalance=961;
 const wallets:Record<string,ReturnType<typeof newWallet>>={trial,paid,expired,legacy},members:Record<string,{tier:'basic';product:'view';expiresAt:string}>={paid:{tier:'basic',product:'view',expiresAt:new Date(Date.now()+86400000).toISOString()},expired:{tier:'basic',product:'view',expiresAt:new Date(Date.now()-86400000).toISOString()}};
 for(const balance of [19,20,49,50,99,100]){const name=`balance${balance}`,wallet=newWallet();wallet.memberPointsBalance=balance;wallets[name]=wallet;members[name]={tier:'basic',product:'view',expiresAt:new Date(Date.now()+86400000).toISOString()};}
 writeFileSync(file,JSON.stringify({wallets,members}));
 const accounts=['free','trial','paid','expired','legacy',...Object.keys(wallets).filter(name=>name.startsWith('balance'))].map(account=>({account,password,nickname:`${account}超长用户名用于检查布局`,tier:account==='legacy'?'premium' as const:'free' as const,membership:account==='legacy'?{level:3,growth:100,nextLevelGrowth:1000,expiresAt:new Date(Date.now()+86400000).toISOString()}:null}));
 server=await createServer({configFile:false,root:process.cwd(),plugins:[react(),previewAuth(accounts,file,{...festivalConfig,enabled:false})],server:{host:'127.0.0.1',port:5189,strictPort:true}});await server.listen();
});
test.afterAll(async()=>{await server?.close();});

test('普通、免费体验、历史与过期账户展示准确；左卡收合且两页无横向溢出',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 for(const account of ['free','trial','legacy','expired']){
  await signIn(page,account);await page.goto(`${base}/me`);
  const card=page.locator('.daily-check-in-card');await expect(card.getByRole('heading',{name:'每日签到，攒积分追好剧'})).toBeVisible();
  await expect(card.locator('.check-in-week li')).toHaveCount(7);await expect(card).not.toContainText('距 1 天兑换还差');
  await expect(card).not.toContainText('每日一份追剧心意');await expect(card).not.toContainText('已连续签到');
  if(account==='free'||account==='trial'||account==='legacy'){
   await expect(card.locator('.check-in-member-preview')).toContainText('开通畅看会员后，每日签到可得 1 会员积分');
   await expect(card.locator('.check-in-member-preview a')).toHaveAttribute('href','/membership#festival-recharge');
   await expect(card.locator('.member-redemption-tiers')).toHaveCount(0);
  }
  if(account==='free'||account==='trial')await expect(card.locator('.check-in-summary')).toHaveCount(0);
  if(account==='trial')await expect(page.locator('.trial-status')).toContainText('体验');
  if(account==='legacy'){await expect(page.locator('.account-identity')).toContainText('历史积分制权益');await expect(card).toContainText('签到仍领取永久积分');}
  if(account==='expired'){await expect(card).toContainText('已有会员积分仍可手动兑换');await expect(card.locator('.member-redemption-tiers article').first().getByRole('button',{name:'兑换 1 天'})).toBeEnabled();}
  for(const width of [1440,768,390,320]){await page.setViewportSize({width,height:900});await page.goto(`${base}/me`);await expect(card).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBeTruthy();if(width===1440){const left=await card.boundingBox(),right=await page.locator('.benefits-side').boundingBox();expect(Math.abs(left!.y-right!.y)).toBeLessThanOrEqual(1);}await page.goto(`${base}/membership`);await expect(page.locator('#member-redemption')).toHaveCount(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBeTruthy();}
  if(account==='free'){await page.setViewportSize({width:1440,height:900});await page.goto(`${base}/me`);await page.locator('.daily-check-in-card').screenshot({path:'.local/check-in-ordinary-1440.png'});}
  await page.goto(`${base}/me`);await card.getByRole('button',{name:'立即签到'}).click();await expect(card).not.toContainText('今天已获得 1 永久积分');await expect(card.getByRole('button',{name:'今日已签到，明天再来'})).toBeDisabled();await page.goto(`${base}/membership`);await expect(page.locator('.membership-balance-row').first()).toContainText('永久积分');
 }
 expect(errors).toEqual([]);
});

test('有效付费畅看会员在 /me 直接兑换，共用确认流程并同步两页余额',async({page})=>{
 await signIn(page,'paid');await page.setViewportSize({width:1440,height:900});await page.goto(`${base}/me`);
 const card=page.locator('.daily-check-in-card');await expect(card.getByRole('heading',{name:'每日签到领会员积分'})).toBeVisible();
 for(const benefit of ['.permanent-credits','.trial-card']){const panel=page.locator(benefit),icon=await panel.locator('.me-benefit-heading>svg').boundingBox(),title=await panel.locator('h2').boundingBox();expect(icon!.x+icon!.width).toBeLessThan(title!.x);expect(Math.abs(icon!.y-title!.y)).toBeLessThan(22);}
 await expect(card).not.toContainText('今日可签到 · 北京时间每日更新资格');
 expect(await card.locator('.check-in-actions-row .primary-button').evaluate(button=>getComputedStyle(button).gap)).toBe('12px');
 await expect(card.locator('.check-in-summary')).toHaveCount(0);
 await expect(card).toContainText('今日签到 +1 会员积分');await expect(card.locator('.check-in-week')).toHaveCount(0);
 await expect(card.locator('.member-redemption-tiers article')).toHaveCount(3);await expect(card.getByRole('button',{name:'兑换 1 天'})).toBeEnabled();await expect(card.getByRole('button',{name:'兑换 3 天'})).toBeEnabled();
 await expect(card.locator('.member-redemption-tiers article').nth(2)).toContainText('还差 50 分');await expect(card.locator('.member-redemption-tiers article').nth(2).locator('button')).toHaveCount(0);
 await card.screenshot({path:'.local/check-in-member-1440.png'});
 await page.locator('.benefits-side').screenshot({path:'.local/me-benefits-side-1440.png'});
 const left=await card.boundingBox(),right=await page.locator('.benefits-side').boundingBox();expect(Math.abs(left!.y-right!.y)).toBeLessThanOrEqual(1);
 for(const width of [1440,768,390,320]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBeTruthy();const box=await card.getByRole('button',{name:'兑换 3 天'}).boundingBox();expect(box!.height).toBeGreaterThanOrEqual(40);}
 await page.setViewportSize({width:1440,height:900});
 await card.getByRole('button',{name:'兑换 3 天'}).click();await expect(page.getByRole('dialog',{name:'兑换畅看 3 天'})).toContainText('50 会员积分 → 畅看 3 天');
 await expect(page.getByRole('button',{name:'确认扣分并兑换'})).toBeEnabled();await page.getByRole('button',{name:'确认扣分并兑换'}).click();
 await expect(card.getByRole('status').filter({hasText:'已扣除 50 会员积分'})).toBeVisible();await expect(card.locator('.member-redemption-tiers article').first()).toContainText('还差 20 分');
 await page.goto(`${base}/membership`);await expect(page.locator('.membership-balance-row').nth(1)).toContainText('会员积分：0');await expect(page.locator('#member-redemption')).toHaveCount(0);
 const balances=await page.locator('.membership-balance-row').evaluateAll(rows=>rows.map(row=>row.getBoundingClientRect().top));expect(Math.abs(balances[0]-balances[1])).toBeLessThanOrEqual(2);
 await expect(page.locator('.membership-balance-row').nth(1).locator('a')).toHaveAttribute('href','/me#daily-check-in');
 const badge=page.locator('.account-avatar-link .user-avatar-badge');await expect(badge).toBeVisible();expect((await badge.boundingBox())!.width).toBeLessThanOrEqual(18);
 await page.goto(`${base}/me`);const redemptionTop=(await card.locator('.member-redemption-compact').boundingBox())!.y;await card.getByRole('button',{name:'立即签到'}).click();await expect(card).not.toContainText('今天已获得 1 会员积分');await expect(card.getByRole('button',{name:'今日已签到，明天再来'})).toBeDisabled();expect(Math.abs((await card.locator('.member-redemption-compact').boundingBox())!.y-redemptionTop)).toBeLessThanOrEqual(1);await page.goto(`${base}/membership`);await expect(page.locator('.membership-balance-row').nth(1)).toContainText('会员积分：1');
 await page.goto(`${base}/18plus/play/private-preview-1`);await expect(page.getByRole('heading',{name:'进入18+专区',exact:true})).toBeVisible();
});

test('20/50/100 分门槛在个人中心和会员中心一致，低余额只显示静态差额',async({page})=>{
 for(const balance of [19,20,49,50,99,100]){
  await signIn(page,`balance${balance}`);await page.goto(`${base}/me`);
  for(const [index,cost,days] of [[0,20,1],[1,50,3],[2,100,7]]){
   const card=page.locator('.daily-check-in-card .member-redemption-tiers article').nth(index);
   if(balance<cost){await expect(card).toContainText(`还差 ${cost-balance} 分`);await expect(card.locator('button')).toHaveCount(0);}
   else await expect(card.getByRole('button',{name:`兑换 ${days} 天`})).toBeEnabled();
  }
  await page.goto(`${base}/membership`);await expect(page.locator('#member-redemption')).toHaveCount(0);await expect(page.locator('.membership-balance-row').nth(1)).toContainText(`会员积分：${balance}`);
 }
});
