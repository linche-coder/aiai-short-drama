import {extraViewingDaysFor,festivalConfig,festivalPhase,type FestivalConfig} from '../src/services/festivalModel';

// Trusted server-side order snapshot only. Never expose this function as a browser callback.
export interface FestivalOrder {
 id:string;userId:string;offerId:string;createdAt:string;total?:number;currency?:'CNY';
 status:'pending'|'processing'|'paid'|'failed'|'cancelled'|'closed'|'refunded';
 paidAt?:string;refundedAt?:string;
 validity?:'fixed'|'permanent';durationDays?:number|null;extraViewingDays?:number;entitlementExpiresAt?:string|null;
}
export function extraViewingDaysForOrder(order:FestivalOrder,config:FestivalConfig=festivalConfig){
 if(order.status!=='paid'||!order.paidAt||!Number.isFinite(Date.parse(order.paidAt)))return 0;
 return festivalPhase(config,new Date(order.paidAt))==='active'?extraViewingDaysFor(order.offerId,config):0;
}
