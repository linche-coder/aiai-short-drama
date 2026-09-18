import {useSyncExternalStore}from'react';
import type{ContentZone}from'../types/content';
import{accessService}from'../services/access';
export interface Privacy {hideGreen:boolean;hideAdult:boolean;neutralNotifications:boolean;adultNotifications:false}
interface RecordsState {privacy:Privacy;green:string[];adult:string[];wishlist:string[];reservations:string[];revision:number}
const defaults:RecordsState={privacy:{hideGreen:false,hideAdult:true,neutralNotifications:true,adultNotifications:false},green:[],adult:[],wishlist:[],reservations:[],revision:0};
let state:RecordsState=defaults;try{const saved=JSON.parse(localStorage.getItem('aiai:guest-records:v1')||'null') as Pick<RecordsState,'privacy'|'green'>|null;if(saved)state={...defaults,privacy:{...defaults.privacy,...saved.privacy},green:Array.isArray(saved.green)?saved.green:[]};}catch{/* keep safe defaults */}
const listeners=new Set<()=>void>();
const emit=(patch:Partial<RecordsState>)=>{state={...state,...patch,revision:state.revision+1};try{localStorage.setItem('aiai:guest-records:v1',JSON.stringify({privacy:state.privacy,green:state.green}));}catch{/* device-local persistence is optional */}for(const fn of listeners)fn();};
const channel=typeof window!=='undefined'&&typeof BroadcastChannel!=='undefined'?new BroadcastChannel('aiai:local-records'):null;
channel?.addEventListener('message',e=>{if(e.data==='clear-private-history')emit({adult:[]});if(e.data==='clear-private')emit({adult:[],wishlist:[],reservations:[]});if(e.data==='clear-green')emit({green:[]});});
export const records={subscribe(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn);};},getSnapshot:()=>state,
 setPrivacy(patch:Partial<Privacy>){emit({privacy:{...state.privacy,...patch,adultNotifications:false}});},
 add(zone:ContentZone,id:string){if(zone==='adult'&&!accessService.isGranted())return;emit({[zone]:[id,...state[zone].filter(v=>v!==id)]});},
 toggleWishlist(id:string){if(!accessService.isGranted())return;const removing=state.wishlist.includes(id);emit({wishlist:removing?state.wishlist.filter(v=>v!==id):[...state.wishlist,id],reservations:removing?state.reservations.filter(v=>v!==id):state.reservations});},
 clearAdultHistory(){emit({adult:[]});channel?.postMessage('clear-private-history');},
 reserve(id:string){if(!accessService.isGranted())return;emit({reservations:[...new Set([...state.reservations,id])]});},
 remove(zone:ContentZone,id:string){emit({[zone]:state[zone].filter(v=>v!==id)});},
 clear(zone:ContentZone){emit(zone==='adult'?{adult:[],wishlist:[],reservations:[]}:{green:[]});channel?.postMessage(zone==='adult'?'clear-private':'clear-green');},
};
accessService.subscribe(()=>{if(!accessService.isGranted())emit({adult:[],wishlist:[],reservations:[]});});
export const useRecords=()=>useSyncExternalStore(records.subscribe,records.getSnapshot,records.getSnapshot);
