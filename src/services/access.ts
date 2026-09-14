export type RegionState = 'checking'|'allowed'|'denied'|'unknown'|'error';
export type AccessSnapshot = {granted:boolean;revision:number;expiresAt:number;mode:'unavailable'|'preview';region:RegionState};
export type PreviewScenario = Exclude<RegionState,'checking'>;
let scenario:PreviewScenario='unknown';
let current:AccessSnapshot={granted:false,revision:0,expiresAt:0,mode:import.meta.env.DEV?'preview':'unavailable',region:'unknown'};
const listeners=new Set<()=>void>();
const emit=(patch:Partial<AccessSnapshot>)=>{current={...current,...patch,revision:current.revision+1};for(const fn of listeners)fn();};
let expiry:ReturnType<typeof setTimeout>|undefined;
const channel=typeof window!=='undefined'&&typeof BroadcastChannel!=='undefined'?new BroadcastChannel('aiai:adult-revocation'):null;
function revoke(broadcast=true){clearTimeout(expiry);emit({granted:false,expiresAt:0});if(broadcast){channel?.postMessage('revoke');try{localStorage.setItem('aiai:adult-revoked',String(Date.now()));}catch{/* no persistence needed */}}}
channel?.addEventListener('message',e=>{if(e.data==='revoke')revoke(false);});
if(typeof window!=='undefined')window.addEventListener('storage',e=>{if(e.key==='aiai:adult-revoked')revoke(false);});
export function abortableDelay(ms:number,signal?:AbortSignal){return new Promise<void>((resolve,reject)=>{if(signal?.aborted){reject(new DOMException('Aborted','AbortError'));return;}const fail=()=>{clearTimeout(timer);reject(new DOMException('Aborted','AbortError'));};const timer=setTimeout(()=>{signal?.removeEventListener('abort',fail);resolve();},ms);signal?.addEventListener('abort',fail,{once:true});});}
export const accessService={
 subscribe(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn);};},getSnapshot:()=>current,
 isGranted:()=>current.granted&&current.expiresAt>Date.now()&&current.region==='allowed',
 async checkRegion(signal?:AbortSignal):Promise<RegionState>{await abortableDelay(220,signal);return import.meta.env.DEV?scenario:'unknown';},
 async verify(signal?:AbortSignal){await abortableDelay(120,signal);return this.isGranted();},
 async enter(ageConfirmed:boolean,explicitConsent:boolean,signal?:AbortSignal){const revision=current.revision;const region=await this.checkRegion(signal);if(revision!==current.revision||!import.meta.env.DEV||!ageConfirmed||!explicitConsent||region!=='allowed')return false;emit({granted:true,expiresAt:Date.now()+10*60_000,region});clearTimeout(expiry);expiry=setTimeout(()=>revoke(),10*60_000);return true;},
 revoke,
 setPreviewScenario(value:PreviewScenario){if(!import.meta.env.DEV)return;scenario=value;revoke();emit({region:value});},
 getPreviewScenario:()=>scenario,
};
