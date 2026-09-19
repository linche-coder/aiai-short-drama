import {useSyncExternalStore} from 'react';
import {accountService} from './membership';
import {ApiError,createHttpBackend} from './backend';
import {pointsService} from './points';
import type {FestivalData} from './festivalModel';
type Snapshot={userId:string|null;data:FestivalData|null;loading:boolean;error:string};
let snapshot:Snapshot={userId:null,data:null,loading:false,error:''},generation=0;
const listeners=new Set<()=>void>(),backend=createHttpBackend(()=>document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content??'');
const emit=(next:Snapshot)=>{snapshot=next;listeners.forEach(fn=>fn());};
export const festivalError=(e:unknown)=>e instanceof ApiError&&e.code==='activity_inactive'?'活动尚未开始或已结束，请查看活动状态。':e instanceof ApiError&&e.status===401?'登录已失效，请重新登录。':'活动服务暂时不可用，请重试。';
async function refresh(){
 const userId=accountService.getSnapshot().userId,version=++generation;
 emit({userId,data:snapshot.userId===userId?snapshot.data:null,loading:true,error:''});
 try{const data=await backend.festival();if(version===generation&&userId===accountService.getSnapshot().userId){const changed=snapshot.data&&snapshot.data.totalReward!==data.totalReward;emit({userId,data,loading:false,error:''});if(changed&&userId)void pointsService.refresh();}}
 catch(e){if(version===generation&&userId===accountService.getSnapshot().userId){emit({userId,data:null,loading:false,error:festivalError(e)});if(userId&&e instanceof ApiError&&e.status===401)accountService.expire();}}
}
const channel=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('aiai-festival-updates'):null;
channel?.addEventListener('message',()=>{void refresh();void pointsService.refresh();});
export const festivalService={subscribe(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn);};},getSnapshot:()=>snapshot,refresh,
 async claim(){
  const userId=accountService.getSnapshot().userId,version=++generation;if(!userId)throw new ApiError(401,'session_expired');
  try{const data=await backend.festivalClaim();if(userId!==accountService.getSnapshot().userId)throw new ApiError(401,'session_expired');
   if(version===generation)emit({userId,data,loading:false,error:''});else await refresh();
   await pointsService.refresh();channel?.postMessage('reward');return data;
  }catch(e){if(userId===accountService.getSnapshot().userId){await refresh();await pointsService.refresh();}throw e;}
 }
};
accountService.subscribe(()=>{void refresh();});
if(typeof window!=='undefined'){
 window.addEventListener('focus',()=>{void refresh();});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')void refresh();});
 window.setInterval(()=>{if(listeners.size&&document.visibilityState==='visible')void refresh();},15000);
}
export const useFestival=()=>useSyncExternalStore(festivalService.subscribe,festivalService.getSnapshot);
