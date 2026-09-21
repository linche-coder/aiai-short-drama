export type AccessSnapshot = {granted:boolean;revision:number;expiresAt:number;mode:'unavailable'|'preview'};
// Local acknowledgement only: never an identity or server authorization result.
const consentKey='aiai:adult-session-consent';
let confirmed=false;try{confirmed=typeof sessionStorage!=='undefined'&&sessionStorage.getItem(consentKey)==='acknowledged';}catch{}
let current:AccessSnapshot={granted:confirmed,revision:0,expiresAt:confirmed?Number.MAX_SAFE_INTEGER:0,mode:import.meta.env?.DEV?'preview':'unavailable'};
const listeners=new Set<()=>void>();
const emit=(patch:Partial<AccessSnapshot>)=>{current={...current,...patch,revision:current.revision+1};for(const fn of listeners)fn();};
const channel=typeof window!=='undefined'&&typeof BroadcastChannel!=='undefined'?new BroadcastChannel('aiai:adult-revocation'):null;
function revoke(broadcast=true){try{sessionStorage.removeItem(consentKey);}catch{}emit({granted:false,expiresAt:0});if(broadcast){channel?.postMessage('revoke');try{localStorage.setItem('aiai:adult-revoked',String(Date.now()));}catch{/* no persistence needed */}}}
channel?.addEventListener('message',e=>{if(e.data==='revoke')revoke(false);});
if(typeof window!=='undefined')window.addEventListener('storage',e=>{if(e.key==='aiai:adult-revoked')revoke(false);});
export function abortableDelay(ms:number,signal?:AbortSignal){return new Promise<void>((resolve,reject)=>{if(signal?.aborted){reject(new DOMException('Aborted','AbortError'));return;}const fail=()=>{clearTimeout(timer);reject(new DOMException('Aborted','AbortError'));};const timer=setTimeout(()=>{signal?.removeEventListener('abort',fail);resolve();},ms);signal?.addEventListener('abort',fail,{once:true});});}
export const accessService={
 subscribe(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn);};},getSnapshot:()=>current,
 isConfirmed:()=>current.granted,
 isGranted:()=>current.granted, // Compatibility for local preview consumers; not playback authorization.
 async verify(signal?:AbortSignal){await abortableDelay(120,signal);return this.isGranted();},
 async enter(ageConfirmed:boolean,explicitConsent:boolean,signal?:AbortSignal){if(signal?.aborted||!ageConfirmed||!explicitConsent)return false;try{sessionStorage.setItem(consentKey,'acknowledged');}catch{}emit({granted:true,expiresAt:Number.MAX_SAFE_INTEGER});return true;},
 revoke,
};
