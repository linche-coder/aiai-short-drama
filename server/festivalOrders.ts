import {randomUUID} from 'node:crypto';
import {festivalConfig,festivalPhase,rechargeBonusFor,festivalRewardNames,type FestivalConfig,type FestivalReward} from '../src/services/festivalModel';
import {newWallet} from '../src/services/pointsModel';
import {emptyFestival,type FestivalLedger} from './previewFestival';

// Trusted server-side order snapshot only. Never expose this function as a browser callback.
export interface FestivalOrder {
 id:string;userId:string;offerId:string;createdAt:string;total?:number;currency?:'CNY';
 status:'pending'|'processing'|'paid'|'failed'|'cancelled'|'closed'|'refunded';
 paidAt?:string;refundedAt?:string;
 validity?:'fixed'|'permanent';durationDays?:number|null;entitlementExpiresAt?:string|null;
}
export function settleFestivalOrder(state:FestivalLedger,order:FestivalOrder,config:FestivalConfig=festivalConfig){
 const f=state.festival??(state.festival=emptyFestival());
 const all=Object.values(f.rewards).flat();
 const existing=all.find(r=>r.activityId===config.id&&r.kind==='recharge'&&r.orderId===order.id);
 const records=f.rewards[order.userId]??(f.rewards[order.userId]=[]);
 if(existing&&!records.includes(existing))throw new Error('order_owner_conflict');
 const wallet=state.wallets[order.userId]??(state.wallets[order.userId]=newWallet());
 let amount=0,kind:FestivalReward['kind']='recharge',extra:Partial<FestivalReward>={};
 if(order.status==='refunded'){
  if(!existing||all.some(r=>r.activityId===config.id&&r.kind==='recharge_reversal'&&r.orderId===order.id))return false;
  amount=-Math.min(wallet.pointsBalance,existing.amount);kind='recharge_reversal';
  const unrecoveredAmount=existing.amount+amount;
  extra={reversalStatus:unrecoveredAmount?'insufficient_balance':'complete',unrecoveredAmount};
 }else{
  if(existing||order.status!=='paid'||!order.paidAt||!Number.isFinite(Date.parse(order.paidAt))||festivalPhase(config,new Date(order.paidAt))!=='active')return false;
  amount=rechargeBonusFor(order.offerId,config);if(!amount)return false;
 }
 const id=randomUUID(),transactionId=randomUUID(),createdAt=new Date().toISOString();
 wallet.pointsBalance+=amount;
 records.unshift({id,transactionId,activityId:config.id,kind,amount,createdAt,orderId:order.id,...extra});
 wallet.transactions.unshift({id:transactionId,type:kind==='recharge'?'festival_recharge':'festival_recharge_reversal',title:festivalRewardNames[kind],amount,balanceAfter:wallet.pointsBalance,createdAt,activityId:config.id,rewardId:id,orderId:order.id,...extra});
 return true;
}
