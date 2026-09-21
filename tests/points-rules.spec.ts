import {test,expect} from '@playwright/test';
import {newWallet,grantMonthly,checkIn,topUp,unlock,refundUnlock,discountedCost,walletData,overviewData,claimTrial} from '../src/services/pointsModel';
import {createPreviewPoints} from '../server/previewPoints';
import {mkdtempSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';

const date=new Date('2026-09-01T00:00:00Z');
const item={contentId:'drama-05',episodeId:'demo-7',contentTitle:'一部测试剧',episodeTitle:'第7集',coverUrl:null,href:'/play/drama-05?episode=demo-7'};

test('免费账号不赠月度积分；历史会员原赠分权益保留并保持幂等',()=>{
 const wallet=newWallet();grantMonthly(wallet,'reader','free',date);expect(wallet.pointsBalance).toBe(0);
 grantMonthly(wallet,'reader','basic',date);grantMonthly(wallet,'reader','basic',date);expect(wallet.pointsBalance).toBe(320);
 grantMonthly(wallet,'reader','premium',date);expect(wallet.pointsBalance).toBe(960);
 grantMonthly(wallet,'reader','premium',new Date('2026-09-30T16:00:00Z'));expect(wallet.pointsBalance).toBe(1920);
 expect(wallet.grants).toHaveLength(2);
});

test('签到北京时间跨日去重，积分包一次到账并保持幂等',()=>{
 const wallet=newWallet();checkIn(wallet,new Date('2026-09-01T15:59:59Z'));checkIn(wallet,new Date('2026-09-01T15:59:59Z'));checkIn(wallet,new Date('2026-09-01T16:00:00Z'));
 expect(wallet.pointsBalance).toBe(2);expect(wallet.checkIns).toEqual(['2026-09-01','2026-09-02']);
 topUp(wallet,'points-220','purchase-1',date);topUp(wallet,'points-220','purchase-1',date);expect(wallet.pointsBalance).toBe(222);
 expect(()=>topUp(wallet,'points-60','purchase-2',date)).toThrow('invalid_offer');
});

test('免费单集扣 5 分，会员观看扣 0 分，退款不会重复入账',()=>{
 const wallet=newWallet();topUp(wallet,'points-220','purchase',date);
 expect(discountedCost(5,'free')).toBe(5);expect(discountedCost(5,'basic')).toBe(0);expect(discountedCost(5,'premium')).toBe(0);
 unlock(wallet,item,5,'free','episode',date);unlock(wallet,item,5,'free','retry',date);expect(wallet.pointsBalance).toBe(215);
 refundUnlock(wallet,wallet.unlocks[0].id,date);refundUnlock(wallet,wallet.unlocks[0].id,date);expect(wallet.pointsBalance).toBe(220);
 expect(walletData(wallet,'free',date).unlocks[0].pointsSpent).toBe(5);
});

test('余额不足、非法价格和幂等键冲突不修改账本',()=>{
 const wallet=newWallet(),before=JSON.stringify(wallet);expect(()=>unlock(wallet,item,5,'free','key')).toThrow('insufficient_points');expect(JSON.stringify(wallet)).toBe(before);
 expect(()=>discountedCost(-1,'free')).toThrow();expect(()=>discountedCost(1.5,'premium')).toThrow();
 topUp(wallet,'points-220','purchase',date);unlock(wallet,item,5,'free','key',date);
 expect(()=>unlock(wallet,{...item,episodeId:'demo-8'},5,'free','key',date)).toThrow('idempotency_conflict');expect(wallet.pointsBalance).toBe(215);
});

test('服务端忽略伪造价格，持久化与账号隔离，下架和原子失败',()=>{
 const file=join(mkdtempSync(join(tmpdir(),'aiai-points-')),'points.json'),service=createPreviewPoints(file),path='/api/v1/contents/drama-05/episodes/demo-7/unlock';
 service.run('reader','free','/api/v1/me/points/demo-purchase',{offerId:'points-220',idempotencyKey:'purchase'});
 const result=service.run('reader','free',path,{idempotencyKey:'key',price:0,tier:'premium'});expect(result.summary.balance).toBe(215);
 expect(service.run('other','free','/api/v1/me/points',{}).summary.balance).toBe(0);
 expect(createPreviewPoints(file).run('reader','free','/api/v1/me/points',{}).summary.balance).toBe(215);
 const before=readFileSync(file,'utf8');expect(()=>service.run('reader','free','/api/v1/contents/missing/episodes/demo-7/unlock',{idempotencyKey:'bad'})).toThrow('content_unavailable');expect(readFileSync(file,'utf8')).toBe(before);
});

test('七日签到第 1 至 6 天各 1 分、第 7 天 4 分，中断后重置',()=>{
 const wallet=newWallet();for(let day=1;day<=7;day++)expect(checkIn(wallet,new Date(`2026-09-${String(day).padStart(2,'0')}T04:00:00Z`))).toBe(day===7?4:1);
 expect(wallet.pointsBalance).toBe(10);expect(overviewData(wallet,'free',new Date('2026-09-07T05:00:00Z')).checkIn.cycleDay).toBe(7);
 expect(checkIn(wallet,new Date('2026-09-09T04:00:00Z'))).toBe(1);
});

test('24 小时体验只领一次，会员也符合资格，不赠积分',()=>{
 const wallet=newWallet(),now=new Date('2026-09-01T04:00:00Z');expect(overviewData(wallet,'premium',now).trial.status).toBe('available');
 const trial=claimTrial(wallet,'premium',now);expect(trial.status).toBe('active');expect(wallet.pointsBalance).toBe(0);
 expect(claimTrial(wallet,'premium',now).expiresAt).toBe(trial.expiresAt);
 expect(overviewData(wallet,'premium',new Date(now.getTime()+86400001)).trial.status).toBe('expired');
 expect(()=>claimTrial(wallet,'premium',new Date(now.getTime()+86400001))).toThrow('trial_ineligible');
});
