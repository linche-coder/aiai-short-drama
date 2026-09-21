import {existsSync,readFileSync,mkdirSync,writeFileSync,renameSync} from 'node:fs';
import {dirname} from 'node:path';
import {grantMonthly,newWallet,performCheckIn,migrateWallet,memberBalance,unlock,topUp,walletData,episodePricing,discountedCost,overviewData,claimTrial,hasActiveTrial,monthlyAllowance,type PointsWallet} from '../src/services/pointsModel';
import {memberRedemptionTier} from '../src/services/memberRedemption';
import {previewCatalog} from '../src/data/previewCatalog';
import type {Tier,Content} from '../src/types/content';
import {authenticate,bindReferral,claimFestival,festivalSummary,registerFestivalUser,previewFestivalConfig,type FestivalState} from './previewFestival';
import type {FestivalConfig} from '../src/services/festivalModel';
import {randomUUID,scryptSync,timingSafeEqual} from 'node:crypto';
import {settleFestivalOrder,type FestivalOrder} from './festivalOrders';
import {viewPlan} from './viewPlans';

// Development only. One process serializes each complete mutation, then atomically
// replaces the persisted ledger. No client-provided balance, price or tier is used.
export function createPreviewPoints(file:string,festivalConfig:FestivalConfig=previewFestivalConfig){
 type Member={tier:Tier;expiresAt:string|null;product?:'view'|'legacy';permanent?:boolean;legacyAllowance?:number;legacyExpiresAt?:string};
 type State={wallets:Record<string,PointsWallet>;members:Record<string,Member>;festival?:FestivalState;orders?:Record<string,FestivalOrder>;credentials?:Record<string,{salt:string;hash:string}>};
 let state:State=existsSync(file)?JSON.parse(readFileSync(file,'utf8')):{wallets:{},members:{}};
 function commit(next:State){mkdirSync(dirname(file),{recursive:true});writeFileSync(file+'.tmp',JSON.stringify(next),'utf8');renameSync(file+'.tmp',file);state=next;}
 const isPermanent=(id:string)=>state.members[id]?.product==='view'&&state.members[id]?.permanent===true;
 const tierFor=(id:string,fallback:Tier)=>{const member=state.members[id];return member?(isPermanent(id)||Date.parse(member.expiresAt||'')>Date.now())?member.tier:'free':fallback;};
 const allowanceFor=(id:string,tier:Tier)=>{const member=state.members[id];return member?.product==='view'?(member.legacyExpiresAt&&Date.parse(member.legacyExpiresAt)>Date.now()?member.legacyAllowance??0:0):monthlyAllowance[tier];};
 const paidViewActive=(id:string,now=new Date())=>state.members[id]?.product==='view'&&(isPermanent(id)||Date.parse(state.members[id].expiresAt||'')>now.getTime());
 return {
  member:(id:string)=>state.members[id],tierFor,isPermanent,
  orders:(userId:string)=>Object.values(state.orders??{}).filter(order=>order.userId===userId).map(order=>({...order,festivalRewards:(state.festival?.rewards[userId]??[]).filter(reward=>reward.orderId===order.id)})),
  // Server-only refund hook; a verified full refund is required. No public HTTP route.
  refundOrder(orderId:string){const next=structuredClone(state),order=next.orders?.[orderId];if(!order||!['paid','refunded'].includes(order.status))throw new Error('invalid_order');order.status='refunded';order.refundedAt??=new Date().toISOString();settleFestivalOrder(next,order,festivalConfig);commit(next);},
  authenticate(id:string,password:unknown){const user=state.festival?.users[id];return authenticate(user,password)?user:undefined;},
  passwordMatches(id:string,password:unknown,fallback?:string){if(typeof password!=='string'||password.length>64)return false;const stored=state.credentials?.[id];if(stored)return timingSafeEqual(Buffer.from(stored.hash,'hex'),scryptSync(password,stored.salt,64));const user=state.festival?.users[id];return user?authenticate(user,password):password===fallback;},
  changePassword(id:string,currentPassword:unknown,newPassword:string,fallback?:string){if(!this.passwordMatches(id,currentPassword,fallback))throw new Error('invalid_current_password');if(newPassword.length<8||newPassword.length>64)throw new Error('invalid_new_password');const next=structuredClone(state),salt=randomUUID();(next.credentials??(next.credentials={}))[id]={salt,hash:scryptSync(newPassword,salt,64).toString('hex')};commit(next);},
  register(input:Record<string,unknown>,reserved:string[],attribution?:string){const next=structuredClone(state),user=registerFestivalUser(next,input,reserved,attribution,festivalConfig);commit(next);return user;},
  referral(code:unknown,existing?:string){const next=structuredClone(state),token=bindReferral(next,code,existing);commit(next);return token;},
  festival(userId:string|null,tier:Tier='free',claim=false){const next=structuredClone(state),data=claim&&userId?claimFestival(next,userId,tierFor(userId,tier),festivalConfig):festivalSummary(next,userId,festivalConfig);commit(next);return data;},
  overview(userId:string,fallback:Tier){const next=structuredClone(state),wallet=migrateWallet(next.wallets[userId]??(next.wallets[userId]=newWallet())),tier=tierFor(userId,fallback);grantMonthly(wallet,userId,tier,new Date(),allowanceFor(userId,tier));const data=overviewData(wallet,tier,new Date(),!!paidViewActive(userId),isPermanent(userId));commit(next);return data;},
  claimTrial(userId:string,fallback:Tier,fallbackExpiry?:string){if(isPermanent(userId))throw new Error('trial_ineligible');const next=structuredClone(state),wallet=migrateWallet(next.wallets[userId]??(next.wallets[userId]=newWallet())),tier=tierFor(userId,fallback),claimed=!!wallet.trialClaimedAt;grantMonthly(wallet,userId,tier,new Date(),allowanceFor(userId,tier));claimTrial(wallet,tier);if(!claimed&&tier!=='free'){const current=next.members[userId],base=Math.max(Date.now(),Date.parse(current?.expiresAt||'')||0,Date.parse(fallbackExpiry||'')||0);next.members[userId]={...current,tier,expiresAt:new Date(base+24*60*60*1000).toISOString(),product:current?.product??'legacy'};}const data=overviewData(wallet,tier,new Date(),!!paidViewActive(userId));commit(next);return data;},
  run(userId:string,fallback:Tier,path:string,input:Record<string,unknown>,adultItems:Content[]=[]){
   const next=structuredClone(state),wallet=migrateWallet(next.wallets[userId]??(next.wallets[userId]=newWallet()));let tier=tierFor(userId,fallback);
   grantMonthly(wallet,userId,tier,new Date(),allowanceFor(userId,tier));
   let checkInResult:ReturnType<typeof performCheckIn>|undefined;
   if(path.endsWith('/check-in')){if(isPermanent(userId))throw new Error('permanent_check_in_unavailable');checkInResult=performCheckIn(wallet,!!paidViewActive(userId));}
   if(path.endsWith('/member-redeem')){
    if(isPermanent(userId))throw new Error('permanent_redemption_unavailable');
    const tierChoice=memberRedemptionTier(input.tierId),key=input.idempotencyKey;
    if(!tierChoice||typeof key!=='string'||!key||key.length>128||Object.keys(input).some(field=>!['tierId','idempotencyKey'].includes(field)))throw new Error('invalid_redemption');
    const target=`redeem:${tierChoice.id}`;
    if(wallet.requests[key]&&wallet.requests[key]!==target)throw new Error('idempotency_conflict');
    if(!wallet.requests[key]){
     const before=memberBalance(wallet);if(before<tierChoice.cost)throw new Error('insufficient_member_points');
     const now=new Date(),current=next.members[userId],expiresBefore=current?.expiresAt??null,base=Math.max(now.getTime(),Date.parse(expiresBefore||'')||0),expiresAfter=new Date(base+tierChoice.hours*3600000).toISOString();
     wallet.memberPointsBalance=before-tierChoice.cost;
     wallet.memberTransactions!.unshift({id:randomUUID(),type:'member_redeem',title:`兑换畅看 ${tierChoice.days} 天`,amount:-tierChoice.cost,balanceBefore:before,balanceAfter:wallet.memberPointsBalance,createdAt:now.toISOString(),redemptionTier:tierChoice.id,expiresBefore,expiresAfter,idempotencyKey:key});
     wallet.requests[key]=target;
     next.members[userId]={tier:current?.tier&&current.tier!=='free'?current.tier:'basic',expiresAt:expiresAfter,product:'view',...(current?.product==='legacy'&&Date.parse(current.expiresAt||'')>now.getTime()?{legacyAllowance:monthlyAllowance[current.tier],legacyExpiresAt:current.expiresAt!}:current?.legacyExpiresAt?{legacyAllowance:current.legacyAllowance,legacyExpiresAt:current.legacyExpiresAt}:{})};
     tier=next.members[userId].tier;
    }
   }
   if(path.endsWith('/demo-purchase')){
    const offer=String(input.offerId||''),key=String(input.idempotencyKey||'');
    if(offer.startsWith('points-'))topUp(wallet,offer,key);
    else {
     const plan=viewPlan(offer);if(!plan||!key||key.length>128)throw new Error('invalid_offer');
     if(isPermanent(userId))throw new Error('already_permanent');
     if(wallet.requests[key]&&wallet.requests[key]!==offer)throw new Error('idempotency_conflict');
     if(!wallet.requests[key]){
      const current=next.members[userId],end=new Date(Math.max(Date.now(),Date.parse(current?.expiresAt||'')||0));if(plan.durationDays)end.setUTCDate(end.getUTCDate()+plan.durationDays);
      tier=current?.permanent?current.tier:plan.tier;next.members[userId]={tier,expiresAt:plan.validity==='permanent'?null:current?.permanent?null:end.toISOString(),permanent:plan.validity==='permanent'||current?.permanent===true,product:'view',...(current?.product==='legacy'&&Date.parse(current.expiresAt||'')>Date.now()?{legacyAllowance:monthlyAllowance[current.tier],legacyExpiresAt:current.expiresAt!}:current?.legacyExpiresAt?{legacyAllowance:current.legacyAllowance,legacyExpiresAt:current.legacyExpiresAt}:{})};wallet.requests[key]=offer;
      const now=new Date().toISOString(),order:FestivalOrder={id:randomUUID(),userId,offerId:offer,total:plan.total,currency:'CNY',createdAt:now,paidAt:now,status:'paid',validity:plan.validity,durationDays:plan.durationDays,entitlementExpiresAt:next.members[userId].expiresAt};
      (next.orders??(next.orders={}))[order.id]=order;
      settleFestivalOrder(next,order,festivalConfig);
     }
    }
   }
   const match=path.match(/^\/api\/v1\/contents\/([^/]+)\/episodes\/([^/]+)\/unlock$/);
   if(match){
    const contentId=decodeURIComponent(match[1]),episodeId=decodeURIComponent(match[2]),item=[...previewCatalog,...adultItems].find(c=>c.id===contentId),number=Number(episodeId.replace(/^demo-/,''));
    if(!item||item.publication_status==='offline'||!item.is_demo||item.format==='article'||!/^demo-\d+$/.test(episodeId)||number<1||number>episodePricing.count)throw new Error('content_unavailable');
    const trialAccess=number>episodePricing.freeEpisodes&&(hasActiveTrial(wallet)||tier!=='free'),cost=number<=episodePricing.freeEpisodes?0:episodePricing.baseCost;
    if(input.quotedCost!==undefined&&input.quotedCost!==discountedCost(cost,tier)&&!wallet.unlocks.some(u=>u.contentId===contentId&&u.episodeId===episodeId))throw new Error('price_changed');
    if(!trialAccess)unlock(wallet,{contentId,episodeId,contentTitle:item.title,episodeTitle:`第${number}集`,coverUrl:item.cover,href:`/${item.content_zone==='adult'?'18plus/':''}play/${contentId}?episode=${episodeId}`},cost,tier,String(input.idempotencyKey||''));
   }
   commit(next);return {...walletData(wallet,tier,new Date(),allowanceFor(userId,tier),!!paidViewActive(userId),state.members[userId]?.expiresAt??null,isPermanent(userId)),...(checkInResult?{reward:checkInResult.amount,checkInResult}:{})};
  }
 };
}
