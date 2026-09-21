import {test,expect,request as requests,type APIRequestContext} from '@playwright/test';
import {createServer,type ViteDevServer} from 'vite';
import {previewAuth} from '../vite.config';
import {festivalConfig} from '../src/services/festivalModel';
import {newWallet} from '../src/services/pointsModel';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';

test('six equal cards, data-backed badges, adult gate, and responsive layouts',async({page})=>{
 await page.addInitScript(()=>sessionStorage.setItem('aiai:intro-seen','yes'));
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
 for(const width of [1440,1024,768,390,320]){
  await page.setViewportSize({width,height:950});
  for(const path of ['/#home','/shorts','/membership','/me']){
   await page.goto(path);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${path} at ${width}`).toBe(true);
   if(path==='/#home'||path==='/shorts'){
    const cards=page.locator(path==='/#home'?'#popular .content-card':'#catalog .content-card');await expect(cards.first()).toBeVisible();
    const columns=await cards.evaluateAll(elements=>new Set(elements.slice(0,6).map(element=>Math.round(element.getBoundingClientRect().top))).size);
    if(width===1440){expect(columns).toBe(1);const boxes=await cards.evaluateAll(elements=>elements.slice(0,6).map(element=>{const box=element.getBoundingClientRect();return {x:box.x,width:box.width}}));expect(Math.max(...boxes.map(box=>box.width))-Math.min(...boxes.map(box=>box.width))).toBeLessThan(1);expect(Math.max(...boxes.slice(1).map((box,index)=>box.x-boxes[index].x-boxes[index].width))-Math.min(...boxes.slice(1).map((box,index)=>box.x-boxes[index].x-boxes[index].width))).toBeLessThan(1);}
    await expect(cards.first().locator('.card-permission')).toHaveText('待开放');
    await expect(cards.first()).toHaveCSS('border-top-style','solid');
    if(width===1440&&path==='/#home'){await page.screenshot({path:'.local/home-cards-1440.png',fullPage:true});await cards.first().focus();await expect(cards.first()).toHaveCSS('outline-style','solid');const height=(await cards.first().boundingBox())!.height;await cards.first().locator('img').dispatchEvent('error');await expect(cards.first().locator('.image-fallback')).toBeVisible();expect((await cards.first().boundingBox())!.height).toBeCloseTo(height,0);}
   }
  }
 }
 const restrictedRequests:string[]=[];page.on('request',request=>restrictedRequests.push(request.url()));
 await page.goto('/18plus');await expect(page.getByRole('button',{name:'确认并进入'})).toBeDisabled();await expect(page.locator('.adult-card,.adult-card img')).toHaveCount(0);expect(restrictedRequests.some(url=>url.includes('adultPreview')||url.includes('/dev/assets/'))).toBe(false);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await expect(page.getByText('地区')).toHaveCount(0);await page.getByLabel('我已年满18周岁').check();await expect(page.getByRole('button',{name:'确认并进入'})).toBeEnabled();await page.getByRole('button',{name:'确认并进入'}).click();await expect(page.locator('.adult-card').first()).toBeVisible();await expect(page.locator('.adult-card .card-permission').first()).toHaveText('免费');
 const badges=await page.locator('.adult-card').first().evaluate(card=>{const a=card.querySelector('.card-original')?.getBoundingClientRect(),b=card.querySelector('.card-permission')?.getBoundingClientRect();return a&&b?b.bottom<=a.top:true});expect(badges).toBe(true);
 const actionClear=await page.locator('.adult-card').first().evaluate(card=>{const badge=card.querySelector('.card-original')?.getBoundingClientRect(),action=card.querySelector('.adult-save')?.getBoundingClientRect();return badge&&action?badge.bottom<action.top:true});expect(actionClear).toBe(true);
 await page.setViewportSize({width:1440,height:950});await page.screenshot({path:'.local/adult-cards-1440.png',fullPage:true});
 expect(errors).toEqual([]);
});

test('three server quoted plans and distinct reduced-motion symbols',async({page})=>{
 await page.addInitScript(()=>sessionStorage.setItem('aiai:intro-seen','yes'));
 await page.goto('/membership');const cards=page.locator('.recharge-tiers .recharge-card');await expect(cards).toHaveCount(3);
 for(const [index,title,amount,validity] of [[0,'畅看月卡','88','30 天'],[1,'畅看季卡','188','90 天'],[2,'永久会员','388','永久']] as const){
  await expect(cards.nth(index)).toContainText(title);await expect(cards.nth(index).locator('.recharge-price')).toContainText(amount);await expect(cards.nth(index)).toContainText(validity);
  await cards.nth(index).getByRole('button',{name:new RegExp(`选择${title}`)}).click();await expect(page.getByRole('dialog')).toContainText(`¥${amount}`);await expect(page.getByRole('dialog')).toContainText('购买前确认');await page.keyboard.press('Escape');
 }
 const emblems=await cards.locator('.recharge-emblem').evaluateAll(elements=>elements.map(element=>({shape:element.querySelector('.emblem-body')?.innerHTML,color:element.querySelector('linearGradient stop:nth-child(2)')?.getAttribute('stop-color')})));
 expect(new Set(emblems.map(emblem=>emblem.shape)).size).toBe(3);expect(new Set(emblems.map(emblem=>emblem.color)).size).toBe(3);
 expect(new Set(await cards.evaluateAll(elements=>elements.map(element=>getComputedStyle(element).getPropertyValue('--accent').trim()))).size).toBe(3);
 expect(await cards.locator('.recharge-cta').evaluateAll(elements=>elements.map(element=>getComputedStyle(element).backgroundImage))).toEqual(['none','none','none']);
 expect(await cards.nth(1).evaluate(element=>getComputedStyle(element,'::after').content)).toBe('none');
 await page.emulateMedia({reducedMotion:'reduce'});await expect(cards.first().locator('.emblem-body')).toHaveCSS('animation-name','none');
});

test('personal center balances its columns and shows distinct membership badges',async({page})=>{
 await page.addInitScript(()=>sessionStorage.setItem('aiai:intro-seen','yes'));
 const rewards=Array.from({length:7},(_,index)=>({day:index+1,points:index===6?4:1,status:index===0?'today':'upcoming'}));
 for(const state of ['free','month','timed','historic','lifetime'] as const){
  await page.setViewportSize({width:1440,height:950});
  const lifetime=state==='lifetime',paid=state==='month'||state==='timed'||lifetime,tier=state==='free'?'free':state==='month'?'basic':'premium',memberBalance=state==='free'?0:60;
  await page.unrouteAll({behavior:'wait'});
  await page.route('**/api/v1/session',route=>route.fulfill({json:{subject:`redesign-${state}`,nickname:`${state}-user`,tier,roles:[],expiresAt:null,membership:tier==='free'?null:{level:tier==='basic'?1:3,growth:0,nextLevelGrowth:1000,expiresAt:lifetime?null:'2027-01-01T00:00:00Z',permanent:lifetime}}}));
  await page.route('**/api/v1/me/overview',route=>route.fulfill({json:{checkIn:{checkedInToday:false,rewardType:null,rewardAmount:0,paidViewActive:paid,permanentMember:lifetime,streakDays:0,cycleDay:1,rewards,nextResetAt:'2027-01-01T00:00:00Z',appBonusRemaining:1},credits:{balance:20,expires:false,paidEpisodeCost:5},memberCredits:{balance:memberBalance,expires:false},trial:{status:lifetime?'ineligible':'available',startsAt:null,expiresAt:null}}}));
  await page.route('**/api/v1/me/points',route=>route.fulfill({json:{summary:{balance:20,memberBalance,tier,monthlyAllowance:0,checkedInToday:false,checkInType:null,paidViewActive:paid,permanentMember:lifetime,membershipExpiresAt:lifetime?null:'2027-01-01T00:00:00Z',trialActive:false,demo:true},transactions:[],memberTransactions:[],unlocks:[]}}));
  await page.goto('/me');await expect(page.locator('.account-shortcut-grid>a')).toHaveCount(8);
  const badge=page.locator('.account-avatar-link .user-avatar-badge');
  if(state==='free'){await expect(badge).toHaveCount(0);await expect(page.getByRole('heading',{name:'每日签到，攒积分追好剧'})).toBeVisible();await expect(page.locator('.permanent-credits')).not.toContainText('免费用户付费单集');await expect(page.locator('.trial-card')).not.toContainText('符合资格');await page.screenshot({path:'.local/me-free-1440.png',fullPage:true});}
  else await expect(badge).toHaveAttribute('data-level',lifetime?'forever':state==='month'?'month':'quarter');
  if(lifetime)await expect(page.locator('.account-avatar-link')).toHaveAttribute('aria-label','进入我的，永久会员');
  if(paid&&!lifetime){await expect(page.locator('#daily-check-in .member-redemption-tiers')).toBeVisible();await expect(page.locator('#daily-check-in')).not.toContainText('有效付费畅看会员每日签到固定获得');await expect(page.locator('#daily-check-in')).not.toContainText('仅用于兑换畅看时长，不能解锁剧集。');if(state==='timed')await page.screenshot({path:'.local/me-timed-1440.png',fullPage:true});}
  if(state==='historic')await expect(page.locator('#daily-check-in')).toContainText('历史积分制权益');
  if(lifetime){await expect(page.locator('#daily-check-in')).toContainText('永久畅看已生效');await expect(page.locator('#daily-check-in .member-redemption-tiers')).toHaveCount(0);await expect(page.locator('#trial')).toContainText('已享永久权益');await page.screenshot({path:'.local/me-lifetime-1440.png',fullPage:true});}
  const heights=await page.evaluate(()=>{const left=document.querySelector('#daily-check-in')!.getBoundingClientRect(),right=document.querySelector('.benefits-side')!.getBoundingClientRect();return {left:left.height,right:right.height}});expect(Math.abs(heights.left-heights.right),`${state} benefit columns`).toBeLessThanOrEqual(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  for(const width of [1024,768,390,320]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${state} at ${width}`).toBe(true);if(width===390&&(state==='free'||state==='timed'))await page.screenshot({path:`.local/me-${state}-390.png`,fullPage:true});}
 }
 await page.unrouteAll({behavior:'wait'});await page.goto('/me');await expect(page.getByRole('heading',{name:'尚未登录'})).toBeVisible();
});

test.describe('server plan ledger',()=>{
 let server:ViteDevServer,client:APIRequestContext;
 const account='redesign-ledger',password='redesign-password';
 test.beforeAll(async()=>{
  const wallet=newWallet();wallet.pointsBalance=42;wallet.memberPointsBalance=60;wallet.memberTransactions?.push({id:'old-member-points',type:'member_check_in',title:'历史积分',amount:60,balanceBefore:0,balanceAfter:60,createdAt:'2026-08-01T00:00:00Z'});
  const file=join(mkdtempSync(join(tmpdir(),'redesign-ledger-')),'state.json');writeFileSync(file,JSON.stringify({wallets:{[account]:wallet},members:{},orders:{'old-order':{id:'old-order',userId:account,offerId:'legacy',total:3900,currency:'CNY',createdAt:'2026-01-01T00:00:00Z',paidAt:'2026-01-01T00:00:00Z',status:'paid'}}}));
  server=await createServer({configFile:false,plugins:[previewAuth([{account,password,nickname:account,tier:'free',membership:null}],file,{...festivalConfig,enabled:false})],server:{host:'127.0.0.1',port:5194,strictPort:true}});await server.listen();client=await requests.newContext({baseURL:'http://127.0.0.1:5194'});expect((await client.post('/api/v1/auth/sign-in',{data:{account,password}})).status()).toBe(200);
 });
 test.afterAll(async()=>{await client?.dispose();await server?.close()});
 test('quotes, orders, duration and lifetime remain synchronized; historic records survive',async()=>{
  const plans=await client.get('/api/v1/membership/view-plans').then(response=>response.json());expect(plans.map((plan:{total:number})=>plan.total)).toEqual([8800,18800,38800]);
  for(const [id,total] of [['view-month',8800],['view-quarter',18800],['view-forever',38800]] as const){
   const quote=await client.post('/api/v1/membership/view-plans/quote',{data:{planId:id}}).then(response=>response.json());expect(quote.total).toBe(total);
   const purchase=await client.post('/api/v1/me/points/demo-purchase',{data:{offerId:id,idempotencyKey:`redesign-${id}`}});expect(purchase.status()).toBe(200);
   const orders=await client.get('/api/v1/orders').then(response=>response.json());const order=orders.find((entry:{offerId:string})=>entry.offerId===id);expect(order.total).toBe(total);expect(order.entitlementExpiresAt===null).toBe(id==='view-forever');
  }
  const session=await client.get('/api/v1/session').then(response=>response.json());expect(session.membership).toMatchObject({permanent:true,expiresAt:null});expect(session.tier).toBe('premium');
  const data=await client.get('/api/v1/me/points').then(response=>response.json());expect(data.summary).toMatchObject({permanentMember:true,paidViewActive:true,balance:42,memberBalance:60});expect(data.memberTransactions.some((item:{id:string})=>item.id==='old-member-points')).toBe(true);
  const orders=await client.get('/api/v1/orders').then(response=>response.json());expect(orders.some((item:{id:string})=>item.id==='old-order')).toBe(true);
  expect((await client.post('/api/v1/me/points/check-in',{data:{}})).status()).toBe(400);expect((await client.post('/api/v1/me/points/member-redeem',{data:{tierId:'day-1',idempotencyKey:'no-lifetime-redeem'}})).status()).toBe(400);
  const after=await client.get('/api/v1/me/points').then(response=>response.json());expect(after.summary.memberBalance).toBe(60);
 });
});
