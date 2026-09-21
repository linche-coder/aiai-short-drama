import{test,expect}from'@playwright/test';
import{createPreviewPoints}from'../server/previewPoints';
import{newWallet,performCheckIn,overviewData,claimTrial,beijingDay,type PointsWallet}from'../src/services/pointsModel';
import{memberRedemptionTiers}from'../src/services/memberRedemption';
import{mkdtempSync,writeFileSync,readFileSync}from'node:fs';
import{join}from'node:path';
import{tmpdir}from'node:os';

const time=(day:number)=>new Date(`2026-09-${String(day).padStart(2,'0')}T04:00:00.000Z`);
const fixture=(balance:number,product:'view'|'legacy'='view',expiresAt=new Date(Date.now()+3*86400000).toISOString())=>{
 const file=join(mkdtempSync(join(tmpdir(),'member-points-')),'wallet.json'),wallet=newWallet();wallet.pointsBalance=17;wallet.memberPointsBalance=balance;wallet.transactions.push({id:'historic',type:'top_up',title:'历史永久积分',amount:17,balanceAfter:17,createdAt:time(1).toISOString()});
 writeFileSync(file,JSON.stringify({wallets:{reader:wallet},members:{reader:{tier:'basic',product,expiresAt}}}));return {file,service:createPreviewPoints(file)};
};
const redeem=(service:ReturnType<typeof createPreviewPoints>,tierId:string,key:string,extra:Record<string,unknown>={})=>service.run('reader','free','/api/v1/me/points/member-redeem',{tierId,idempotencyKey:key,...extra});

test('普通七日、会员固定一分、会员签到不改变普通连续周期',()=>{
 const wallet=newWallet();for(let day=1;day<=6;day++)expect(performCheckIn(wallet,false,time(day)).amount).toBe(1);
 expect(performCheckIn(wallet,false,time(7)).amount).toBe(4);expect(wallet.pointsBalance).toBe(10);
 expect(performCheckIn(wallet,true,time(8))).toMatchObject({type:'member',amount:1,permanentBalance:10,memberBalance:1});
 expect(performCheckIn(wallet,false,time(9))).toMatchObject({type:'permanent',amount:1,permanentBalance:11});
 expect(overviewData(wallet,'free',time(9)).checkIn.streakDays).toBe(1);
 expect(performCheckIn(wallet,true,time(9))).toMatchObject({type:'permanent',amount:0,alreadyClaimed:true});
 expect(wallet.memberPointsBalance).toBe(1);
});

test('免费体验不产生会员积分；旧会员即使级别非 free 也领取永久积分',()=>{
 const trialWallet=newWallet();claimTrial(trialWallet,'free',time(1));expect(performCheckIn(trialWallet,false,time(1)).type).toBe('permanent');expect(trialWallet.memberPointsBalance).toBe(0);
 const {service}=fixture(0,'legacy');const result=service.run('reader','premium','/api/v1/me/points/check-in',{});
 expect(result.checkInResult?.type).toBe('permanent');expect(result.summary.memberBalance).toBe(0);
});

test('有效付费 view 套餐签到只入会员积分，重复和跨设备请求幂等',()=>{
 const {file,service}=fixture(0);const first=service.run('reader','free','/api/v1/me/points/check-in',{});
 expect(first.checkInResult).toMatchObject({type:'member',amount:1,permanentBalance:17,memberBalance:1});
 const second=createPreviewPoints(file).run('reader','free','/api/v1/me/points/check-in',{});
 expect(second.checkInResult).toMatchObject({type:'member',amount:0,memberBalance:1,alreadyClaimed:true});
 expect(second.memberTransactions).toHaveLength(1);
});

test('同一天购买或失去畅看资格后不能换一种积分再次签到',()=>{
 const free=fixture(0,'view',new Date(Date.now()-86400000).toISOString());
 const first=free.service.run('reader','free','/api/v1/me/points/check-in',{});expect(first.checkInResult?.type).toBe('permanent');
 free.service.run('reader','free','/api/v1/me/points/demo-purchase',{offerId:'view-month',idempotencyKey:'upgrade'});
 const afterUpgrade=free.service.run('reader','free','/api/v1/me/points/check-in',{});expect(afterUpgrade.checkInResult).toMatchObject({type:'permanent',amount:0,alreadyClaimed:true,memberBalance:0});
 const member=fixture(0);expect(member.service.run('reader','free','/api/v1/me/points/check-in',{}).checkInResult?.type).toBe('member');
 const state=JSON.parse(readFileSync(member.file,'utf8'));state.members.reader.expiresAt=new Date(Date.now()-1000).toISOString();writeFileSync(member.file,JSON.stringify(state));
 const afterExpiry=createPreviewPoints(member.file).run('reader','free','/api/v1/me/points/check-in',{});expect(afterExpiry.checkInResult).toMatchObject({type:'member',amount:0,alreadyClaimed:true,permanentBalance:17});
});

test('兑换门槛、固定扣分与整段 24/72/168 小时延长',()=>{
 for(const balance of [19,20,49,50,99,100]){
  for(const tier of memberRedemptionTiers){const {service}=fixture(balance);const before=service.member('reader')!.expiresAt;
   if(balance<tier.cost){expect(()=>redeem(service,tier.id,`key-${balance}-${tier.id}`)).toThrow('insufficient_member_points');expect(service.member('reader')!.expiresAt).toBe(before);}
   else{const result=redeem(service,tier.id,`key-${balance}-${tier.id}`);expect(result.summary.memberBalance).toBe(balance-tier.cost);expect(result.summary.balance).toBe(17);expect(Date.parse(service.member('reader')!.expiresAt)-Date.parse(before)).toBe(tier.hours*3600000);expect(result.memberTransactions[0]).toMatchObject({type:'member_redeem',amount:-tier.cost,balanceBefore:balance,balanceAfter:balance-tier.cost,redemptionTier:tier.id,expiresBefore:before,idempotencyKey:`key-${balance}-${tier.id}`});}
  }
 }
});

test('过期从当前服务端时间起算；原积分与历史记录保留；拒绝伪造与重复扣分',()=>{
 const expired=new Date(Date.now()-86400000).toISOString(),{file,service}=fixture(100,'view',expired),before=Date.now();
 const original=readFileSync(file,'utf8');expect(()=>redeem(service,'day-1','fake',{cost:0,days:100})).toThrow('invalid_redemption');expect(()=>redeem(service,'unknown','fake')).toThrow('invalid_redemption');expect(readFileSync(file,'utf8')).toBe(original);
 const first=redeem(service,'day-7','redeem-once');const end=Date.parse(service.member('reader')!.expiresAt);expect(end).toBeGreaterThanOrEqual(before+168*3600000);expect(end).toBeLessThanOrEqual(Date.now()+168*3600000);
 const second=redeem(service,'day-7','redeem-once');expect(second.summary.memberBalance).toBe(0);expect(service.member('reader')!.expiresAt).toBe(first.summary.membershipExpiresAt);expect(second.memberTransactions).toHaveLength(1);
 expect(second.summary.balance).toBe(17);expect(second.transactions[0].id).toBe('historic');expect(()=>redeem(service,'day-1','redeem-once')).toThrow('idempotency_conflict');
});

test('旧钱包迁移默认会员积分零，不删除签到与解锁记录',()=>{
 const {file}=fixture(0);const state=JSON.parse(readFileSync(file,'utf8'));delete state.wallets.reader.memberPointsBalance;delete state.wallets.reader.memberCheckIns;delete state.wallets.reader.memberTransactions;state.wallets.reader.checkIns=[beijingDay(new Date())];state.wallets.reader.unlocks=[{id:'old-unlock'}];writeFileSync(file,JSON.stringify(state));
 const service=createPreviewPoints(file),result=service.run('reader','free','/api/v1/me/points',{});expect(result.summary.memberBalance).toBe(0);expect(result.summary.balance).toBe(17);expect(result.transactions[0].id).toBe('historic');expect(result.unlocks[0].id).toBe('old-unlock');expect(service.run('reader','free','/api/v1/me/points/check-in',{}).checkInResult?.amount).toBe(0);expect((JSON.parse(readFileSync(file,'utf8')).wallets.reader as PointsWallet).checkIns).toEqual([beijingDay(new Date())]);
});
