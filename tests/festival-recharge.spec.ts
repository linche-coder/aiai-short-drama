import {test,expect} from '@playwright/test';
import {mkdtempSync,mkdirSync,readFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {festivalConfig,festivalPhase,festivalAccessibleLabel} from '../src/services/festivalModel';
import {settleFestivalOrder,type FestivalOrder} from '../server/festivalOrders';
import {festivalSummary,type FestivalLedger} from '../server/previewFestival';
import {createPreviewPoints} from '../server/previewPoints';
import {newWallet} from '../src/services/pointsModel';

const paidAt='2026-09-20T12:00:00+08:00';
const makeOrder=(offerId='joy-month',extra:Partial<FestivalOrder>={}):FestivalOrder=>({id:crypto.randomUUID(),userId:'member',offerId,createdAt:'2026-09-18T12:00:00+08:00',paidAt,status:'paid',...extra});
test('Beijing left-closed right-open boundaries',()=>{
 for(const [time,phase] of [['2026-09-18T15:59:59.999Z','upcoming'],['2026-09-18T16:00:00Z','active'],['2026-10-07T15:59:59.999Z','active'],['2026-10-07T16:00:00Z','ended']])expect(festivalPhase(festivalConfig,new Date(time))).toBe(phase);
});
for(const [offerId,bonus] of [['joy-month',100],['premium-month',300],['joy-year',1000],['premium-year',3000]] as const)test(`${offerId} server amount, order idempotency and independent renewals`,()=>{
 const state:FestivalLedger={wallets:{member:newWallet()}},order=makeOrder(offerId);
 state.wallets.member.pointsBalance=960;
 expect(settleFestivalOrder(state,order)).toBe(true);
 for(let i=0;i<8;i++)expect(settleFestivalOrder(state,order)).toBe(false);
 expect(state.wallets.member.pointsBalance).toBe(960+bonus);
 expect(settleFestivalOrder(state,makeOrder(offerId))).toBe(true);
 expect(state.wallets.member.pointsBalance).toBe(960+2*bonus);
 const summary=festivalSummary(state,'member');expect(summary.rechargeReward).toBe(2*bonus);expect(summary.totalReward).toBe(2*bonus);expect(summary.appReward).toBe(0);
 expect(state.wallets.member.transactions[1]).toMatchObject({type:'festival_recharge',amount:bonus,activityId:festivalConfig.id,orderId:order.id});
 expect(state.wallets.member.transactions[1].rewardId).toBe(summary.records[1].id);
});
test('only paid eligible membership orders qualify; paid time wins over creation time',()=>{
 const state:FestivalLedger={wallets:{}};
 for(const status of ['pending','processing','failed','cancelled','closed','refunded'] as const)expect(settleFestivalOrder(state,makeOrder('joy-year',{status}))).toBe(false);
 for(const offerId of ['points-60','points-200','points-580','points-1500','premium-quarter','forged'])expect(settleFestivalOrder(state,makeOrder(offerId))).toBe(false);
 for(const time of ['2026-09-18T23:59:59+08:00',festivalConfig.endsAt,'invalid'])expect(settleFestivalOrder(state,makeOrder('joy-year',{paidAt:time}))).toBe(false);
 expect(settleFestivalOrder(state,makeOrder('joy-year',{createdAt:festivalConfig.startsAt,paidAt:festivalConfig.endsAt}))).toBe(false);
 expect(settleFestivalOrder(state,makeOrder('joy-year',{paidAt:festivalConfig.startsAt}))).toBe(true);
 expect(settleFestivalOrder(state,makeOrder('joy-year',{paidAt:'2026-10-07T23:59:59+08:00'}))).toBe(true);
 expect(festivalSummary(state,'member').totalReward).toBe(2000);
});
test('full refunds reverse once, retain history and flag insufficient funds without negative balance',()=>{
 const state:FestivalLedger={wallets:{}},order=makeOrder('premium-month');settleFestivalOrder(state,order);
 expect(()=>settleFestivalOrder(state,{...order,userId:'intruder'})).toThrow('order_owner_conflict');
 expect(settleFestivalOrder(state,{...order,status:'refunded'})).toBe(true);
 expect(settleFestivalOrder(state,{...order,status:'refunded'})).toBe(false);
 expect(settleFestivalOrder(state,order)).toBe(false);
 expect(state.wallets.member.pointsBalance).toBe(0);expect(festivalSummary(state,'member').totalReward).toBe(0);
 const second=makeOrder('premium-year');settleFestivalOrder(state,second);state.wallets.member.pointsBalance=20;
 settleFestivalOrder(state,{...second,status:'refunded'});
 expect(state.wallets.member.pointsBalance).toBe(0);expect(state.wallets.member.transactions[0]).toMatchObject({type:'festival_recharge_reversal',amount:-20,reversalStatus:'insufficient_balance',unrecoveredAmount:2980});
 expect(festivalSummary(state,'member').records).toHaveLength(4);
});
test('persisted demo orders ignore client bonus/status/time, retry atomically and refund after restart',()=>{
 const file=join(mkdtempSync(join(tmpdir(),'festival-orders-')),'ledger.json'),config={...festivalConfig,startsAt:'2000-01-01T00:00:00Z',endsAt:'2999-01-01T00:00:00Z'},service=createPreviewPoints(file,config);
 const input={offerId:'joy-year',idempotencyKey:'same',amount:900000,paidAt:'2000-01-01',status:'failed'},path='/api/v1/me/points/demo-purchase';
 mkdirSync(file+'.tmp');expect(()=>service.run('member','free',path,input)).toThrow();rmSync(file+'.tmp',{recursive:true});
 for(let i=0;i<10;i++)service.run('member','free',path,input);
 expect(service.orders('member')).toHaveLength(1);expect(service.orders('other')).toHaveLength(0);
 expect(service.festival('member').rechargeReward).toBe(1000);
 expect(service.run('member','free','/api/v1/me/points',{}).summary.balance).toBe(1320);
 service.run('member','free',path,{...input,idempotencyKey:'renew'});expect(service.festival('member').rechargeReward).toBe(2000);
 const restored=createPreviewPoints(file,config),id=restored.orders('member')[0].id;restored.refundOrder(id);restored.refundOrder(id);
 expect(restored.festival('member').rechargeReward).toBe(1000);
 const disk=JSON.parse(readFileSync(file,'utf8'));expect(disk.wallets.member.transactions.filter((t:{type:string})=>t.type==='festival_recharge_reversal')).toHaveLength(1);
});

test.beforeEach(async({page})=>{
 await page.clock.setFixedTime(new Date(paidAt));
 await page.addInitScript(()=>sessionStorage.setItem('aiai:intro-seen','yes'));
 await page.emulateMedia({reducedMotion:'reduce'});
});
test('App empty link keeps page, scroll and reward state; membership anchor and four offers',async({page})=>{
 await page.goto('/festival');await expect(page.locator('.festival-tasks>section')).toHaveCount(4);
 await expect(page.locator('.festival-app')).toContainText('50积分');
 const link=page.getByRole('link',{name:'下载App',exact:true});await link.scrollIntoViewIfNeeded();const position=await page.evaluate(()=>scrollY),url=page.url();
 let mutations=0;page.on('request',request=>{if(request.method()==='POST'&&request.url().includes('/festival'))mutations++;});
 await link.click();await expect(page.getByRole('status').filter({hasText:'下载页面即将上线'})).toBeVisible();expect(page.url()).toBe(url);expect(Math.abs(await page.evaluate(()=>scrollY)-position)).toBeLessThan(3);expect(mutations).toBe(0);
 await page.getByRole('link',{name:'查看双节充值礼',exact:true}).click();await expect(page).toHaveURL(/campaign=festival#festival-recharge$/);
 await expect(page.locator('#festival-recharge')).toBeInViewport();
 for(const [offerId,bonus] of [['joy-month',100],['premium-month',300],['joy-year',1000],['premium-year',3000]] as const){
  const index=['joy-month','premium-month','joy-year','premium-year'].indexOf(offerId);await (index<2?page.locator('.recharge-tiers button.recharge-cta').nth(index):page.locator('.recharge-annual').nth(index-2)).click();await expect(page.locator('.purchase-festival-bonus strong')).toHaveText(bonus+'积分');await expect(page.locator('.recharge-purchase .recharge-points')).toHaveText(offerId.startsWith('joy')?'320 积分/月':'960 积分/月');await page.keyboard.press('Escape');
 }
 await page.getByRole('button',{name:'60 积分 ¥6',exact:true}).click();await expect(page.locator('.purchase-festival-bonus')).toHaveCount(0);
});
test('active membership campaign works for existing members; automatically hides at end',async({page})=>{
 await page.route('**/api/v1/session',r=>r.fulfill({json:{subject:'existing-member',tier:'premium',roles:[],expiresAt:null}}));
 await page.goto('/membership?campaign=festival#festival-recharge');await expect(page.locator('#festival-recharge')).toBeInViewport();
 await page.clock.install({time:new Date('2026-10-07T23:59:59+08:00')});await page.reload();await expect(page.locator('.membership-festival-bonus')).toHaveCount(4);await page.clock.runFor(1100);
 await expect(page.locator('.membership-festival-banner')).toHaveCount(0);await expect(page.locator('.membership-festival-bonus')).toHaveCount(0);await expect(page.locator('#festival-recharge')).toBeVisible();
 await page.goto('/festival');await expect(page.locator('.festival-status')).toHaveText('活动已结束');await expect(page.locator('.festival-primary')).toBeDisabled();
});
test('home, festival and membership responsive visual checks, accessible entry and reduced motion',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:1000});
  for(const [name,path,target] of [['home','/#home','.festival-strip'],['festival','/festival','.festival-page'],['membership','/membership?campaign=festival#festival-recharge','#festival-recharge']]){
   await page.goto(path);await expect(page.locator(target)).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   if(name==='home'){await expect(page.locator(target)).toHaveAccessibleName(festivalAccessibleLabel);await expect(page.locator('.festival-strip-title')).toHaveAttribute('alt',/350/);expect(await page.locator(target).evaluate(el=>parseFloat(getComputedStyle(el).transitionDuration))).toBeLessThanOrEqual(.00001);}
   if(name==='festival')await expect(page.locator('main')).not.toContainText(/20积分|最高120|最高100/);
   if(width===390||width===1440){await page.locator(target).scrollIntoViewIfNeeded();await page.screenshot({path:'.local/festival-refresh-'+name+'-'+width+'.png',fullPage:true});if(name!=='festival')await page.locator(target).screenshot({path:'.local/festival-refresh-'+name+'-detail-'+width+'.png'});}
  }
 }
 await page.goto('/#home');await page.locator('.festival-strip').focus();await expect(page.locator('.festival-strip')).toBeFocused();await page.keyboard.press('Enter');await expect(page).toHaveURL(/\/festival$/);expect(errors).toEqual([]);
});
