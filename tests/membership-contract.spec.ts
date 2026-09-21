import {test,expect} from '@playwright/test';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createPreviewPoints} from '../server/previewPoints';
import {festivalConfig} from '../src/services/festivalModel';
import {newWallet,claimTrial,overviewData,topUp,discountedCost,permanentCreditsOffer} from '../src/services/pointsModel';

const service=()=>createPreviewPoints(join(mkdtempSync(join(tmpdir(),'aiai-membership-contract-')),'points.json'),{...festivalConfig,enabled:false});

test('单一永久积分包：220 积分，旧套餐不再接受新购买',()=>{
 const points=service(),wallet=newWallet();
 expect(permanentCreditsOffer).toEqual({id:'points-220',points:220,price:10.9});
 topUp(wallet,'points-220','one');topUp(wallet,'points-220','one');expect(wallet.pointsBalance).toBe(220);
 expect(()=>topUp(wallet,'points-60','other')).toThrow('invalid_offer');
 expect(points.run('reader','free','/api/v1/me/points/demo-purchase',{offerId:'points-220',idempotencyKey:'one'}).summary.balance).toBe(220);
 expect(()=>points.run('reader','free','/api/v1/me/points/demo-purchase',{offerId:'points-200',idempotencyKey:'other'})).toThrow('invalid_offer');
 expect(()=>points.run('reader','free','/api/v1/me/points/demo-purchase',{offerId:'joy-month',idempotencyKey:'legacy'})).toThrow('invalid_offer');
});

test('月卡与季卡按服务端价格和 30/90 天生效，会员期内观看不扣积分',()=>{
 const points=service(),before=Date.now();
 const month=points.run('month','free','/api/v1/me/points/demo-purchase',{offerId:'view-month',idempotencyKey:'month'});
 expect(month.summary.tier).toBe('basic');expect(month.summary.balance).toBe(0);
 expect(points.orders('month')[0].total).toBe(8800);
 expect(Date.parse(points.member('month')!.expiresAt)-before).toBeGreaterThanOrEqual(30*86400000-5000);
 const watching=points.run('month','free','/api/v1/contents/drama-05/episodes/demo-7/unlock',{idempotencyKey:'watch',quotedCost:0});
 expect(watching.summary.balance).toBe(0);expect(watching.unlocks).toHaveLength(0);
 const quarter=points.run('quarter','free','/api/v1/me/points/demo-purchase',{offerId:'view-quarter',idempotencyKey:'quarter'});
 expect(quarter.summary.tier).toBe('premium');expect(quarter.summary.balance).toBe(0);
 expect(points.orders('quarter')[0].total).toBe(18800);
 expect(Date.parse(points.member('quarter')!.expiresAt)-before).toBeGreaterThanOrEqual(90*86400000-5000);
 expect(discountedCost(5,'premium')).toBe(0);
});

test('免费体验一次；已开通会员领取只加一天且重试不重复增加',()=>{
 const points=service(),wallet=newWallet(),now=new Date('2026-09-21T00:00:00Z');
 expect(overviewData(wallet,'premium',now).trial.status).toBe('available');
 expect(claimTrial(wallet,'free',now).status).toBe('active');
 expect(wallet.pointsBalance).toBe(0);
 expect(()=>claimTrial(wallet,'free',new Date(now.getTime()+86400001))).toThrow('trial_ineligible');
 points.run('member','free','/api/v1/me/points/demo-purchase',{offerId:'view-month',idempotencyKey:'month'});
 const before=Date.parse(points.member('member')!.expiresAt);
 expect(points.claimTrial('member','free').trial.status).toBe('active');
 const after=Date.parse(points.member('member')!.expiresAt);
 expect(after-before).toBe(86400000);
 points.claimTrial('member','free');expect(Date.parse(points.member('member')!.expiresAt)).toBe(after);
 const fixedExpiry=new Date(Date.now()+10*86400000).toISOString();
 points.claimTrial('fixed-member','premium',fixedExpiry);
 expect(Date.parse(points.member('fixed-member')!.expiresAt)-Date.parse(fixedExpiry)).toBe(86400000);
});
