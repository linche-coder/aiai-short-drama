import {ApiError,createHttpBackend} from './backend';
const backend=createHttpBackend(()=>document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content??'');
let pending:Promise<unknown>=Promise.resolve(),candidate:string|null=null;
const pendingKey='aiai:festival-referral-candidate';
async function bind(code:string){
 const request=()=>backend.festivalReferral(code);
 // Serialize first binding across tabs when Web Locks are available.
 const result=typeof navigator!=='undefined'&&navigator.locks?await navigator.locks.request('aiai-festival-referral',request):await request();
 try{sessionStorage.removeItem(pendingKey);}catch{/* Storage is optional; the service cookie is authoritative. */}
 return result;
}
// Attribution itself is stored by the service in an HttpOnly cookie, not a URL
// or editable local balance. The first valid binding wins on the service.
export function captureFestivalReferral(code:string|null){
 if(!code||code.length>100)return;
 candidate=code;try{sessionStorage.setItem(pendingKey,code);}catch{}
 pending=pending.catch(()=>{}).then(()=>bind(code));void pending.catch(()=>{});
}
export async function ensureFestivalReferral(){
 try{await pending;}catch(error){if(error instanceof ApiError&&error.code==='invalid_invitation'){try{sessionStorage.removeItem(pendingKey);}catch{}return;}if(candidate)await bind(candidate);}
}
if(typeof location!=='undefined'){
 const params=new URLSearchParams(location.search);let code=params.get('invite');
 try{const back=params.get('returnTo');if(!code&&back?.startsWith('/')&&!back.startsWith('//'))code=new URL(back,location.origin).searchParams.get('invite');if(!code)code=sessionStorage.getItem(pendingKey);}catch{/* Malformed URLs or blocked storage must not break login. */}
 captureFestivalReferral(code);
}
