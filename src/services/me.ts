import{useSyncExternalStore}from'react';
import{ApiError,createHttpBackend}from'./backend';
import{accountService}from'./membership';
import{pointsService}from'./points';
import type{MeOverviewDTO}from'./pointsModel';

type Snapshot={userId:string|null;loading:boolean;error:string;data:MeOverviewDTO|null};
let snapshot:Snapshot={userId:null,loading:false,error:'',data:null},generation=0;
const listeners=new Set<()=>void>(),backend=createHttpBackend(()=>document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content??'');
const emit=(next:Snapshot)=>{snapshot=next;listeners.forEach(listener=>listener());};
export const meError=(error:unknown)=>error instanceof ApiError&&error.code==='trial_ineligible'?'当前账号不符合体验领取资格。':error instanceof ApiError&&error.code==='session_expired'?'登录已失效，请重新登录。':'个人中心服务暂时不可用，请稍后重试。';
async function refresh(){const userId=accountService.getSnapshot().userId,version=++generation;if(!userId){emit({userId:null,loading:false,error:'',data:null});return;}emit({userId,loading:true,error:'',data:snapshot.userId===userId?snapshot.data:null});try{const data=await backend.meOverview();if(version===generation&&accountService.getSnapshot().userId===userId)emit({userId,loading:false,error:'',data});}catch(error){if(version===generation){emit({userId,loading:false,error:meError(error),data:null});if(error instanceof ApiError&&error.status===401)accountService.expire();}}}
async function mutate(action:()=>Promise<MeOverviewDTO>){const userId=accountService.getSnapshot().userId;if(!userId)throw new ApiError(401,'session_expired');const version=++generation;try{const data=await action();if(version===generation)emit({userId,loading:false,error:'',data});await pointsService.refresh();return data;}catch(error){await refresh();throw error;}}
export const meService={subscribe(listener:()=>void){listeners.add(listener);return()=>listeners.delete(listener);},getSnapshot:()=>snapshot,refresh,async checkIn(){const result=await pointsService.checkIn();await refresh();return result;},claimTrial:()=>mutate(()=>backend.claimTrial())};
accountService.subscribe(()=>{void refresh();});
if(typeof window!=='undefined'){window.addEventListener('focus',()=>{if(accountService.getSnapshot().userId)void refresh();});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&accountService.getSnapshot().userId)void refresh();});}
export const useMeOverview=()=>useSyncExternalStore(meService.subscribe,meService.getSnapshot);
