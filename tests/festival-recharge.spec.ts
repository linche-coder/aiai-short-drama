import {test,expect} from '@playwright/test';
import {mkdtempSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {festivalConfig,festivalPhase,extraViewingDaysFor} from '../src/services/festivalModel';
import {extraViewingDaysForOrder,type FestivalOrder} from '../server/festivalOrders';
import {createPreviewPoints} from '../server/previewPoints';

const paidAt='2026-09-20T12:00:00+08:00';
const makeOrder=(offerId='view-month',extra:Partial<FestivalOrder>={}):FestivalOrder=>({id:crypto.randomUUID(),userId:'member',offerId,createdAt:'2026-09-18T12:00:00+08:00',paidAt,status:'paid',...extra});

test('campaign boundaries and eligible paid orders',()=>{
 for(const [time,phase] of [['2026-09-18T15:59:59.999Z','upcoming'],['2026-09-18T16:00:00Z','active'],['2026-10-07T15:59:59.999Z','active'],['2026-10-07T16:00:00Z','ended']])expect(festivalPhase(festivalConfig,new Date(time))).toBe(phase);
 expect(extraViewingDaysFor('view-month')).toBe(7);
 expect(extraViewingDaysFor('view-quarter')).toBe(30);
 for(const [id,days] of [['view-month',7],['view-quarter',30]] as const)expect(extraViewingDaysForOrder(makeOrder(id))).toBe(days);
 for(const id of ['view-forever','points-220','joy-month','forged'])expect(extraViewingDaysForOrder(makeOrder(id))).toBe(0);
 for(const status of ['pending','processing','failed','cancelled','closed','refunded'] as const)expect(extraViewingDaysForOrder(makeOrder('view-month',{status}))).toBe(0);
 for(const time of ['2026-09-18T23:59:59+08:00',festivalConfig.endsAt,'invalid'])expect(extraViewingDaysForOrder(makeOrder('view-month',{paidAt:time}))).toBe(0);
 expect(extraViewingDaysForOrder(makeOrder('view-month',{paidAt:festivalConfig.startsAt}))).toBe(7);
});

test('preview purchases extend membership once per order without granting points',()=>{
 const file=join(mkdtempSync(join(tmpdir(),'festival-days-')),'ledger.json');
 const config={...festivalConfig,startsAt:'2000-01-01T00:00:00Z',endsAt:'2999-01-01T00:00:00Z'};
 const service=createPreviewPoints(file,config),path='/api/v1/me/points/demo-purchase';
 const before=Date.now(),input={offerId:'view-month',idempotencyKey:'same',amount:999999,bonus:999999};
 for(let i=0;i<5;i++)service.run('member','free',path,input);
 const first=service.orders('member');expect(first).toHaveLength(1);
 expect(first[0]).toMatchObject({total:8800,durationDays:30,extraViewingDays:7});
 expect(Date.parse(first[0].entitlementExpiresAt!)-before).toBeGreaterThanOrEqual(37*86400000-5000);
 expect(service.run('member','free','/api/v1/me/points',{}).summary.balance).toBe(0);
 service.run('member','free',path,{offerId:'view-quarter',idempotencyKey:'renew'});
 const orders=service.orders('member');expect(orders).toHaveLength(2);
 expect(orders[1].extraViewingDays).toBe(30);
 expect(Date.parse(orders[1].entitlementExpiresAt!)-Date.parse(first[0].entitlementExpiresAt!)).toBe(120*86400000);
 expect(service.festival('member').totalReward).toBe(0);
 const restored=createPreviewPoints(file,config);expect(restored.orders('member')).toHaveLength(2);
 const disk=JSON.parse(readFileSync(file,'utf8'));expect(disk.wallets.member.transactions.filter((t:{type:string})=>t.type.includes('festival_recharge'))).toHaveLength(0);
});

test('refunded bonus days are removed only once',()=>{
 const file=join(mkdtempSync(join(tmpdir(),'festival-refund-')),'ledger.json');
 const config={...festivalConfig,startsAt:'2000-01-01T00:00:00Z',endsAt:'2999-01-01T00:00:00Z'};
 const service=createPreviewPoints(file,config);
 service.run('member','free','/api/v1/me/points/demo-purchase',{offerId:'view-month',idempotencyKey:'one'});
 const order=service.orders('member')[0],before=Date.parse(service.member('member').expiresAt!);
 service.refundOrder(order.id);
 expect(Date.parse(service.member('member').expiresAt!)).toBe(before-7*86400000);
 service.refundOrder(order.id);
 expect(Date.parse(service.member('member').expiresAt!)).toBe(before-7*86400000);
 expect(service.run('member','free','/api/v1/me/points',{}).summary.balance).toBe(0);
});

test.beforeEach(async({page})=>{
 await page.clock.setFixedTime(new Date(paidAt));
 await page.addInitScript(()=>sessionStorage.setItem('aiai:intro-seen','yes'));
});

test('festival page and membership dialog show viewing days',async({page})=>{
 await page.goto('/festival');
 await expect(page.locator('.festival-recharge-task')).toContainText('开通畅看会员赠送观看天数');
 await expect(page.locator('.festival-recharge-task')).toContainText('7天');
 await expect(page.locator('.festival-recharge-task')).toContainText('30天');
 await expect(page.locator('.festival-recharge-task')).not.toContainText('积分');
 await expect(page.locator('.festival-hero .festival-title-art')).toHaveCount(1);
 await expect(page.locator('.festival-hero .festival-title-art')).toHaveAttribute('src','/assets/festival/aiai-festival-kv-complete-v6.png');
 expect(await page.locator('.festival-hero .festival-title-art').evaluate((image:HTMLImageElement)=>image.complete&&image.naturalWidth===1536)).toBe(true);
 await page.getByRole('link',{name:'查看畅看会员礼'}).click();
 await expect(page).toHaveURL(/\/membership$/);
 await expect(page.locator('.membership-festival-bonus')).toHaveCount(2);
 await page.getByRole('link',{name:'会员',exact:true}).click();
 await expect(page).toHaveURL(/\/membership$/);
 await expect(page.locator('.membership-festival-bonus')).toHaveCount(2);
 for(const [index,title,days] of [[0,'畅看月卡','7'],[1,'畅看季卡','30']] as const){
  await page.locator('.recharge-tiers button.recharge-cta').nth(index).click();
  await expect(page.getByRole('dialog',{name:title})).toBeVisible();
  await expect(page.locator('.purchase-festival-bonus')).toContainText(`${days} 天畅看`);
  await page.keyboard.press('Escape');
 }
 await page.locator('.membership-credit-cta').click();
 await expect(page.locator('.purchase-festival-bonus')).toHaveCount(0);
});
