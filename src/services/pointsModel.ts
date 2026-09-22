import type {Tier} from '../types/content';

export const monthlyAllowance:Record<Tier,number>={free:0,basic:320,premium:960};
export const pointsTierName:Record<Tier,string>={free:'免费用户',basic:'悦享会员',premium:'尊享会员'};
export const formatPoints=(balance:number)=>balance>=1e12?`${(balance/1e12).toFixed(1)}万亿`:balance>=1e8?`${(balance/1e8).toFixed(1)}亿`:balance>9999?`${(balance/1e4).toFixed(1)}万`:String(balance);
export const episodePricing={baseCost:5,freeEpisodes:6,count:36};
export const permanentCreditsOffer={id:'points-220',points:220,price:10.9} as const;
export const topUps:Record<string,number>={[permanentCreditsOffer.id]:permanentCreditsOffer.points};
export interface MonthlyPointsGrant {userId:string;month:string;grantedAmount:number;tierAtGrant:Tier;updatedAt:string}
export interface PointsTransaction {id:string;type:'monthly_grant'|'check_in'|'top_up'|'episode_unlock'|'refund'|'festival_participation'|'festival_invitation'|'festival_app';title:string;amount:number;balanceAfter:number;createdAt:string;activityId?:string;rewardId?:string;invitationId?:string;orderId?:string;reversalStatus?:'complete'|'insufficient_balance';unrecoveredAmount?:number}
export interface MemberPointsTransaction {id:string;type:'member_check_in'|'member_redeem';title:string;amount:number;balanceBefore:number;balanceAfter:number;createdAt:string;redemptionTier?:string;expiresBefore?:string|null;expiresAfter?:string;idempotencyKey?:string}
export interface CheckInResult {type:'permanent'|'member';amount:number;permanentBalance:number;memberBalance:number;streakDays:number;cycleDay:number;nextResetAt:string;alreadyClaimed:boolean}
export interface EpisodeUnlock {id:string;contentId:string;episodeId:string;contentTitle:string;episodeTitle:string;coverUrl:string|null;pointsSpent:number;unlockedAt:string;href:string}
export interface PointsWallet {pointsBalance:number;memberPointsBalance?:number;grants:MonthlyPointsGrant[];checkIns:string[];memberCheckIns?:string[];transactions:PointsTransaction[];memberTransactions?:MemberPointsTransaction[];unlocks:EpisodeUnlock[];requests:Record<string,string>;trialClaimedAt?:string;trialExpiresAt?:string}
export interface PointsSummary {balance:number;memberBalance:number;tier:Tier;monthlyAllowance:number;checkedInToday:boolean;checkInType:'permanent'|'member'|null;paidViewActive:boolean;permanentMember:boolean;membershipExpiresAt:string|null;trialActive:boolean;demo:boolean}
export interface PointsData {reward?:number;checkInResult?:CheckInResult;summary:PointsSummary;transactions:PointsTransaction[];memberTransactions:MemberPointsTransaction[];unlocks:EpisodeUnlock[]}
export type CheckInRewardStatus='claimed'|'today'|'upcoming';
export type TrialStatus='available'|'claiming'|'active'|'claimed'|'ineligible'|'expired';
export interface MeOverviewDTO {
 checkIn:{checkedInToday:boolean;rewardType:'permanent'|'member'|null;rewardAmount:number;paidViewActive:boolean;permanentMember:boolean;streakDays:number;cycleDay:number;rewards:Array<{day:number;points:number;status:CheckInRewardStatus}>;nextResetAt:string;appBonusRemaining:number};
 credits:{balance:number;expires:false;paidEpisodeCost:number};
 memberCredits:{balance:number;expires:false};
 trial:{status:Exclude<TrialStatus,'claiming'>;startsAt:string|null;expiresAt:string|null};
}
export const beijingDay=(now:Date)=>new Date(now.getTime()+8*3600000).toISOString().slice(0,10);
const dayBefore=(day:string,amount=1)=>{const date=new Date(`${day}T00:00:00.000Z`);date.setUTCDate(date.getUTCDate()-amount);return date.toISOString().slice(0,10);};
function streakBefore(wallet:PointsWallet,day:string){let count=0,cursor=dayBefore(day);while(wallet.checkIns.includes(cursor)){count++;cursor=dayBefore(cursor);}return count;}
export function nextBeijingReset(now=new Date()){const shifted=new Date(now.getTime()+8*3600000);shifted.setUTCHours(24,0,0,0);return new Date(shifted.getTime()-8*3600000).toISOString();}
export const discountedCost=(price:number,tier:Tier)=>{if(!Number.isSafeInteger(price)||price<0)throw new Error('invalid_price');return tier==='free'?price:0;};
export const newWallet=():PointsWallet=>({pointsBalance:0,memberPointsBalance:0,grants:[],checkIns:[],memberCheckIns:[],transactions:[],memberTransactions:[],unlocks:[],requests:{}});
export function migrateWallet(wallet:PointsWallet){wallet.memberPointsBalance??=0;wallet.memberCheckIns??=[];wallet.memberTransactions??=[];return wallet;}
export const memberBalance=(wallet:PointsWallet)=>wallet.memberPointsBalance??0;
export const checkedInOn=(wallet:PointsWallet,day:string)=>wallet.checkIns.includes(day)||!!wallet.memberCheckIns?.includes(day);
function transaction(wallet:PointsWallet,type:PointsTransaction['type'],title:string,amount:number,now:Date){
 const balance=wallet.pointsBalance+amount;if(!Number.isSafeInteger(balance)||balance<0)throw new Error('insufficient_points');
 wallet.pointsBalance=balance;wallet.transactions.unshift({id:crypto.randomUUID(),type,title,amount,balanceAfter:balance,createdAt:now.toISOString()});
}
export function grantMonthly(wallet:PointsWallet,userId:string,tier:Tier,now=new Date(),allowance=monthlyAllowance[tier]){
 if(allowance===0)return;
 const month=beijingDay(now).slice(0,7),grant=wallet.grants.find(g=>g.month===month),difference=Math.max(0,allowance-(grant?.grantedAmount??0));
 if(!difference)return;transaction(wallet,'monthly_grant',grant?'月度积分升级补发':'月度积分发放',difference,now);
 if(grant)Object.assign(grant,{grantedAmount:allowance,tierAtGrant:tier,updatedAt:now.toISOString()});
 else wallet.grants.push({userId,month,grantedAmount:allowance,tierAtGrant:tier,updatedAt:now.toISOString()});
}
export function performCheckIn(wallet:PointsWallet,paidViewActive:boolean,now=new Date()):CheckInResult{
 migrateWallet(wallet);const day=beijingDay(now),alreadyClaimed=checkedInOn(wallet,day);
 if(!alreadyClaimed){if(paidViewActive){const before=memberBalance(wallet);wallet.memberPointsBalance=before+1;wallet.memberCheckIns!.push(day);wallet.memberTransactions!.unshift({id:crypto.randomUUID(),type:'member_check_in',title:'畅看会员每日签到',amount:1,balanceBefore:before,balanceAfter:before+1,createdAt:now.toISOString()});}else{const cycleDay=streakBefore(wallet,day)%7+1;transaction(wallet,'check_in','每日签到',cycleDay===7?4:1,now);wallet.checkIns.push(day);}}
 const type:CheckInResult['type']=wallet.memberCheckIns!.includes(day)?'member':'permanent';const overview=overviewData(wallet,'free',now,paidViewActive);
 const amount=alreadyClaimed?0:type==='member'?1:(wallet.transactions.find(item=>item.type==='check_in'&&beijingDay(new Date(item.createdAt))===day)?.amount??0);
 return {type,amount,permanentBalance:wallet.pointsBalance,memberBalance:memberBalance(wallet),streakDays:overview.checkIn.streakDays,cycleDay:overview.checkIn.cycleDay,nextResetAt:nextBeijingReset(now),alreadyClaimed};
}
export function checkIn(wallet:PointsWallet,now=new Date()){return performCheckIn(wallet,false,now).amount;}
export function overviewData(wallet:PointsWallet,_tier:Tier,now=new Date(),paidViewActive=false,permanentMember=false):MeOverviewDTO{
 const today=beijingDay(now),checkedInToday=checkedInOn(wallet,today),permanentToday=wallet.checkIns.includes(today),previous=streakBefore(wallet,today),streakDays=permanentToday?previous+1:(wallet.checkIns.includes(dayBefore(today))?previous:0),cycleDay=permanentToday?(streakDays-1)%7+1:streakDays%7+1;
 const active=!!wallet.trialExpiresAt&&Date.parse(wallet.trialExpiresAt)>now.getTime(),claimed=!!wallet.trialClaimedAt;
 const trialStatus:MeOverviewDTO['trial']['status']=active?'active':claimed?'expired':'available';
 return {checkIn:{checkedInToday,rewardType:permanentToday?'permanent':wallet.memberCheckIns?.includes(today)?'member':null,rewardAmount:permanentToday?wallet.transactions.find(item=>item.type==='check_in'&&beijingDay(new Date(item.createdAt))===today)?.amount??0:wallet.memberCheckIns?.includes(today)?1:0,paidViewActive,permanentMember,streakDays,cycleDay,rewards:Array.from({length:7},(_,index)=>{const day=index+1;return{day,points:day===7?4:1,status:day<cycleDay||permanentToday&&day===cycleDay?'claimed':day===cycleDay?'today':'upcoming'};}),nextResetAt:nextBeijingReset(now),appBonusRemaining:1},credits:{balance:wallet.pointsBalance,expires:false,paidEpisodeCost:episodePricing.baseCost},memberCredits:{balance:memberBalance(wallet),expires:false},trial:{status:permanentMember?'ineligible':trialStatus,startsAt:wallet.trialClaimedAt??null,expiresAt:wallet.trialExpiresAt??null}};
}
export function claimTrial(wallet:PointsWallet,tier:Tier,now=new Date()){
 const current=overviewData(wallet,tier,now).trial;if(current.status==='active')return current;if(current.status!=='available')throw new Error('trial_ineligible');
 const key='trial:once';if(!wallet.requests[key]){wallet.trialClaimedAt=now.toISOString();wallet.trialExpiresAt=new Date(now.getTime()+24*3600000).toISOString();wallet.requests[key]=key;}
 return overviewData(wallet,tier,now).trial;
}
export function hasActiveTrial(wallet:PointsWallet,now=new Date()){return !!wallet.trialExpiresAt&&Date.parse(wallet.trialExpiresAt)>now.getTime();}
export function unlock(wallet:PointsWallet,item:Omit<EpisodeUnlock,'id'|'pointsSpent'|'unlockedAt'>,price:number,tier:Tier,key:string,now=new Date()){
 if(!key||key.length>128)throw new Error('invalid_idempotency_key');const target=`unlock:${item.contentId}:${item.episodeId}`;
 if(wallet.requests[key]&&wallet.requests[key]!==target)throw new Error('idempotency_conflict');
 if(wallet.unlocks.some(u=>u.contentId===item.contentId&&u.episodeId===item.episodeId))return;
 const cost=discountedCost(price,tier);transaction(wallet,'episode_unlock',`解锁《${item.contentTitle}》${item.episodeTitle}`,-cost,now);
 wallet.unlocks.unshift({...item,id:crypto.randomUUID(),pointsSpent:cost,unlockedAt:now.toISOString()});wallet.requests[key]=target;
}
export function topUp(wallet:PointsWallet,offerId:string,key:string,now=new Date()){
 const amount=topUps[offerId];if(!amount||!key||key.length>128)throw new Error('invalid_offer');
 if(wallet.requests[key]){if(wallet.requests[key]!==offerId)throw new Error('idempotency_conflict');return;}
 transaction(wallet,'top_up','积分充值',amount,now);wallet.requests[key]=offerId;
}
export function refundUnlock(wallet:PointsWallet,unlockId:string,now=new Date()){
 const item=wallet.unlocks.find(u=>u.id===unlockId);if(!item)throw new Error('unlock_not_found');const key=`refund:${unlockId}`;
 if(wallet.requests[key])return;transaction(wallet,'refund','解锁退款',item.pointsSpent,now);wallet.requests[key]=key;
}
export function walletData(wallet:PointsWallet,tier:Tier,now=new Date(),allowance=monthlyAllowance[tier],paidViewActive=false,membershipExpiresAt:string|null=null,permanentMember=false):PointsData{return {summary:{balance:wallet.pointsBalance,memberBalance:memberBalance(wallet),tier,monthlyAllowance:allowance,checkedInToday:checkedInOn(wallet,beijingDay(now)),checkInType:wallet.checkIns.includes(beijingDay(now))?'permanent':wallet.memberCheckIns?.includes(beijingDay(now))?'member':null,paidViewActive,permanentMember,membershipExpiresAt,trialActive:hasActiveTrial(wallet,now),demo:true},transactions:wallet.transactions,memberTransactions:wallet.memberTransactions??[],unlocks:wallet.unlocks};}
