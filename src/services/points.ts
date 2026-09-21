import {useSyncExternalStore} from 'react';
import {accountService} from './membership';
import {ApiError,createHttpBackend} from './backend';
import type {PointsData} from './pointsModel';

type Snapshot={userId:string|null;loading:boolean;error:string;data:PointsData|null};
let snapshot:Snapshot={userId:null,loading:false,error:'',data:null},generation=0;
const listeners=new Set<()=>void>(),backend=createHttpBackend(()=>document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content??'');
const messages:Record<string,string>={price_changed:'会员等级或价格已更新，请核对新价格后再次确认。',insufficient_points:'永久积分不足，余额已更新，请充值后重试。',insufficient_member_points:'会员积分不足，请刷新余额后重试。',invalid_redemption:'兑换档位或请求参数无效，请重新选择。',content_unavailable:'这部作品或剧集已不可用。',session_expired:'登录已失效，请重新登录。',invalid_credentials:'登录已失效，请重新登录。',idempotency_conflict:'请求已发生变化，请关闭弹窗后重试。'};
export const pointsError=(error:unknown)=>error instanceof ApiError?messages[error.code]||'积分服务暂时不可用，请稍后重试。':'操作未完成，请检查网络后重试。';
function emit(next:Snapshot){snapshot=next;listeners.forEach(fn=>fn());}
async function refresh(){
 const userId=accountService.getSnapshot().userId,version=++generation;
 if(!userId){emit({userId:null,loading:false,error:'',data:null});return;}
 emit({userId,loading:true,error:'',data:snapshot.userId===userId?snapshot.data:null});
 try{const data=await backend.points();if(version===generation&&accountService.getSnapshot().userId===userId)emit({userId,loading:false,error:'',data});}
 catch(error){if(version===generation&&accountService.getSnapshot().userId===userId){emit({userId,loading:false,error:pointsError(error),data:null});if(error instanceof ApiError&&error.status===401)accountService.expire();}}
}
async function mutate(action:()=>Promise<PointsData>){
 const userId=accountService.getSnapshot().userId;if(!userId)throw new ApiError(401,'session_expired');
 const version=++generation;
 try{const data=await action();if(accountService.getSnapshot().userId!==userId)throw new ApiError(401,'session_expired');if(version===generation)emit({userId,loading:false,error:'',data});else await refresh();return data;}
 catch(error){if(accountService.getSnapshot().userId===userId)await refresh();throw error;}
}
export const pointsService={subscribe(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn);};},getSnapshot:()=>snapshot,refresh,
 checkIn:()=>mutate(()=>backend.checkIn()),
 redeemMember:async(tierId:string,key:string)=>{const data=await mutate(()=>backend.redeemMember(tierId,key));await accountService.refresh();return data;},
 unlockEpisode:(contentId:string,episodeId:string,key:string,quotedCost?:number)=>mutate(()=>backend.unlockEpisode(contentId,episodeId,key,quotedCost)),
 purchase:(offerId:string,key:string)=>mutate(()=>backend.pointsPurchase(offerId,key)),
 getTransactions:()=>snapshot.data?.transactions??[],getUnlocks:()=>snapshot.data?.unlocks??[],
};
accountService.subscribe(()=>{void refresh();});
if(typeof window!=='undefined'){
 window.addEventListener('focus',()=>{void refresh();});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')void refresh();});
 // Also rolls the Beijing day/month over while the page remains open.
 window.setInterval(()=>{if(document.visibilityState==='visible'&&accountService.getSnapshot().userId)void refresh();},60000);
}
export const usePoints=()=>useSyncExternalStore(pointsService.subscribe,pointsService.getSnapshot);
