import type {Content, ContentZone, Tier} from '../types/content';
import type {SafeEvent} from './analytics';
import type {PlanId, Experiment} from './membership';

/** Contract for the future server adapter. These interfaces confer no frontend authority. */
export interface SessionDTO {subject:string|null;tier:Tier;roles:('content_editor'|'analyst')[];expiresAt:string|null}
export interface EligibilityDTO {region:'allowed'|'denied'|'unknown';ageVerified:boolean;granted:boolean;expiresAt:string|null}
export interface QuoteDTO {id:string;planId:PlanId;group:Experiment;currency:'CNY';total:number;upgradeAmount:number|null;expiresAt:string}
export interface OrderDTO {id:string;status:'pending'|'processing'|'paid'|'closed'|'refunding'|'refunded';total:number;currency:'CNY';createdAt:string}
export interface PlaybackDTO {contentId:string;sources:{src:string;type?:string}[];expiresAt:string;adFree:boolean;maxResolution:number;previewEpisodeIds:string[]}
export interface Backend {
 session(signal?:AbortSignal):Promise<SessionDTO>;
 eligibility(signal?:AbortSignal):Promise<EligibilityDTO>;
 enter(ageConfirmed:boolean,signal?:AbortSignal):Promise<EligibilityDTO>;
 revoke():Promise<void>;
 contents(zone:ContentZone,filters:{query?:string;genre?:string;format?:string;cursor?:string},signal?:AbortSignal):Promise<{items:Content[];cursor:string|null}>;
 detail(zone:ContentZone,id:string,signal?:AbortSignal):Promise<Content>;
 playback(zone:ContentZone,id:string,signal?:AbortSignal):Promise<PlaybackDTO>;
 quote(planId:PlanId,signal?:AbortSignal):Promise<QuoteDTO>;
 orders(signal?:AbortSignal):Promise<OrderDTO[]>;
 checkout(quoteId:string,idempotencyKey:string):Promise<{orderId:string;checkoutUrl:string}>;
 clearHistory(zone:ContentZone,id?:string):Promise<{deleted:number;revision:string}>;
 publish(draft:Partial<Content>,revision:string):Promise<{id:string;revision:string}>;
 metrics(zone:ContentZone,signal?:AbortSignal):Promise<{observedFrom:string;observedUntil:string;values:Record<string,number|null>}>;
 event(event:SafeEvent):Promise<void>;
}
export class ApiError extends Error {constructor(public status:number,public code:string){super(code);}}
/** Not instantiated by the preview app. Enable only after server authorization exists.
 * Cookie is HttpOnly/Secure/SameSite; csrf is a short-lived server session value, never VITE_*.
 * Adult queries use POST with no URL query. Server must redact bodies from access/APM logs.
 */
export function createHttpBackend(csrf:()=>string):Backend {
 async function call<T>(path:string,method='GET',body?:unknown,signal?:AbortSignal):Promise<T>{
  const response=await fetch(`/api/v1${path}`,{method,credentials:'same-origin',cache:'no-store',signal,headers:{Accept:'application/json',...(body!==undefined?{'Content-Type':'application/json'}:{}),...(method!=='GET'?{'X-CSRF-Token':csrf()}: {})},...(body!==undefined?{body:JSON.stringify(body)}:{})});
  if(!response.ok)throw new ApiError(response.status,response.status===403?'access_denied':response.status===401?'session_required':'service_unavailable');
  return response.status===204?undefined as T:response.json() as Promise<T>;
 }
 const scope=(zone:ContentZone)=>zone==='adult'?'/adult':'/green';const id=(value:string)=>encodeURIComponent(value);
 return {session:signal=>call('/session','GET',undefined,signal),eligibility:signal=>call('/adult/eligibility','GET',undefined,signal),enter:(ageConfirmed,signal)=>call('/adult/consent','POST',{ageConfirmed,explicitConsent:true},signal),revoke:()=>call('/adult/consent','DELETE'),contents:(zone,filters,signal)=>call(`${scope(zone)}/contents/search`,'POST',filters,signal),detail:(zone,key,signal)=>call(`${scope(zone)}/contents/${id(key)}`,'GET',undefined,signal),playback:(zone,key,signal)=>call(`${scope(zone)}/contents/${id(key)}/playback`,'POST',{},signal),quote:(planId,signal)=>call('/membership/quotes','POST',{planId},signal),orders:signal=>call('/orders','GET',undefined,signal),checkout:(quoteId,idempotencyKey)=>call('/orders','POST',{quoteId,idempotencyKey}),clearHistory:(zone,key)=>call(`/privacy/${zone}/history${key?'/'+id(key):''}`,'DELETE'),publish:(draft,revision)=>call('/admin/content/publish','POST',{draft,revision}),metrics:(zone,signal)=>call(`/admin/metrics?zone=${zone}`,'GET',undefined,signal),event:event=>call('/analytics/events','POST',event)};
}
