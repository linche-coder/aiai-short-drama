import type {Tier} from '../types/content';

export const monthlyAllowance:Record<Tier,number>={free:40,basic:320,premium:960};
export const pointsTierName:Record<Tier,string>={free:'免费用户',basic:'悦享会员',premium:'尊享会员'};
export const formatPoints=(balance:number)=>balance>=1e12?`${(balance/1e12).toFixed(1)}万亿`:balance>=1e8?`${(balance/1e8).toFixed(1)}亿`:balance>9999?`${(balance/1e4).toFixed(1)}万`:String(balance);
export const episodePricing={baseCost:10,freeEpisodes:6,count:36};
export const topUps:Record<string,number>={'points-60':60,'points-200':200,'points-580':580,'points-1500':1500};
export interface MonthlyPointsGrant {userId:string;month:string;grantedAmount:number;tierAtGrant:Tier;updatedAt:string}
export interface PointsTransaction {id:string;type:'monthly_grant'|'check_in'|'top_up'|'episode_unlock'|'refund'|'festival_participation'|'festival_invitation'|'festival_app'|'festival_recharge'|'festival_recharge_reversal';title:string;amount:number;balanceAfter:number;createdAt:string;activityId?:string;rewardId?:string;invitationId?:string;orderId?:string;reversalStatus?:'complete'|'insufficient_balance';unrecoveredAmount?:number}
export interface EpisodeUnlock {id:string;contentId:string;episodeId:string;contentTitle:string;episodeTitle:string;coverUrl:string|null;pointsSpent:number;unlockedAt:string;href:string}
export interface PointsWallet {pointsBalance:number;grants:MonthlyPointsGrant[];checkIns:string[];transactions:PointsTransaction[];unlocks:EpisodeUnlock[];requests:Record<string,string>}
export interface PointsSummary {balance:number;tier:Tier;monthlyAllowance:number;checkedInToday:boolean;demo:boolean}
export interface PointsData {reward?:number;summary:PointsSummary;transactions:PointsTransaction[];unlocks:EpisodeUnlock[]}
export const beijingDay=(now:Date)=>new Date(now.getTime()+8*3600000).toISOString().slice(0,10);
export const discountedCost=(price:number,tier:Tier)=>{if(!Number.isSafeInteger(price)||price<0)throw new Error('invalid_price');return tier==='premium'?Math.ceil(price*.8):price;};
export const newWallet=():PointsWallet=>({pointsBalance:0,grants:[],checkIns:[],transactions:[],unlocks:[],requests:{}});
function transaction(wallet:PointsWallet,type:PointsTransaction['type'],title:string,amount:number,now:Date){
 const balance=wallet.pointsBalance+amount;if(!Number.isSafeInteger(balance)||balance<0)throw new Error('insufficient_points');
 wallet.pointsBalance=balance;wallet.transactions.unshift({id:crypto.randomUUID(),type,title,amount,balanceAfter:balance,createdAt:now.toISOString()});
}
export function grantMonthly(wallet:PointsWallet,userId:string,tier:Tier,now=new Date()){
 const month=beijingDay(now).slice(0,7),grant=wallet.grants.find(g=>g.month===month),difference=Math.max(0,monthlyAllowance[tier]-(grant?.grantedAmount??0));
 if(!difference)return;transaction(wallet,'monthly_grant',grant?'月度积分升级补发':'月度积分发放',difference,now);
 if(grant)Object.assign(grant,{grantedAmount:monthlyAllowance[tier],tierAtGrant:tier,updatedAt:now.toISOString()});
 else wallet.grants.push({userId,month,grantedAmount:monthlyAllowance[tier],tierAtGrant:tier,updatedAt:now.toISOString()});
}
export function checkIn(wallet:PointsWallet,now=new Date()){const day=beijingDay(now);if(wallet.checkIns.includes(day))return;transaction(wallet,'check_in','每日签到',5,now);wallet.checkIns.push(day);}
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
export function walletData(wallet:PointsWallet,tier:Tier,now=new Date()):PointsData{return {summary:{balance:wallet.pointsBalance,tier,monthlyAllowance:monthlyAllowance[tier],checkedInToday:wallet.checkIns.includes(beijingDay(now)),demo:true},transactions:wallet.transactions,unlocks:wallet.unlocks};}
