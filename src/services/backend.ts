import type {Content, ContentZone, Tier} from '../types/content';
import type {SafeEvent} from './analytics';
import type {PlanId, Experiment} from './membership';

/** Contract for the future server adapter. These interfaces confer no frontend authority. */
export interface MembershipSnapshotDTO {level:number;growth:number;nextLevelGrowth:number;expiresAt:string|null}
export interface SessionDTO {subject:string|null;tier:Tier;roles:('content_editor'|'analyst')[];expiresAt:string|null;nickname?:string|null;membership?:MembershipSnapshotDTO|null}
export interface EligibilityDTO {region:'allowed'|'denied'|'unknown';ageVerified:boolean;granted:boolean;expiresAt:string|null}
export interface QuoteDTO {id:string;planId:PlanId;group:Experiment;currency:'CNY';total:number;upgradeAmount:number|null;expiresAt:string}
export interface OrderDTO {id:string;status:'pending'|'processing'|'paid'|'closed'|'refunding'|'refunded';total:number;currency:'CNY';createdAt:string}
export interface PlaybackDTO {contentId:string;sources:{src:string;type?:string}[];expiresAt:string;adFree:boolean;maxResolution:number;previewEpisodeIds:string[]}
export interface ProfileDTO {id:string;nickname:string;avatarUrl:string|null;bio:string}
export interface CommentDTO {id:string;contentId:string;episodeId:string;parentId:string|null;author:{id:string;nickname:string};content:string;spoiler:boolean;status:'pending'|'published'|'rejected';likeCount:number;liked:boolean;createdAt:string}
export interface ProgressDTO {contentId:string;episodeId:string;seconds:number;duration:number;updatedAt:string}
export interface NotificationDTO {id:string;kind:'reply'|'update'|'system';title:string;body:string;href:string;read:boolean;createdAt:string}
export interface TicketDTO {id:string;category:string;subject:string;description:string;context:Record<string,string>;status:'open'|'processing'|'closed';createdAt:string}
export interface Backend {
 session(signal?:AbortSignal):Promise<SessionDTO>;
 signIn(input:{account:string;password:string;returnTo:string},signal?:AbortSignal):Promise<SessionDTO>;
 register(input:{account:string;password:string;email?:string},signal?:AbortSignal):Promise<SessionDTO>;
 requestPasswordReset(email:string,signal?:AbortSignal):Promise<void>;
 resetPassword(token:string,password:string,signal?:AbortSignal):Promise<void>;
 signOut():Promise<void>;
 profile(signal?:AbortSignal):Promise<ProfileDTO>;
 updateProfile(input:Pick<ProfileDTO,'nickname'|'bio'>,signal?:AbortSignal):Promise<ProfileDTO>;
 eligibility(signal?:AbortSignal):Promise<EligibilityDTO>;
 enter(ageConfirmed:boolean,signal?:AbortSignal):Promise<EligibilityDTO>;
 revoke():Promise<void>;
 contents(zone:ContentZone,filters:{query?:string;genre?:string;format?:string;cursor?:string},signal?:AbortSignal):Promise<{items:Content[];cursor:string|null}>;
 detail(zone:ContentZone,id:string,signal?:AbortSignal):Promise<Content>;
 playback(zone:ContentZone,id:string,signal?:AbortSignal):Promise<PlaybackDTO>;
 quote(planId:PlanId,signal?:AbortSignal):Promise<QuoteDTO>;
 orders(signal?:AbortSignal):Promise<OrderDTO[]>;
 checkout(quoteId:string,idempotencyKey:string):Promise<{orderId:string;checkoutUrl:string}>;
 order(id:string,signal?:AbortSignal):Promise<OrderDTO>;
 comments(contentId:string,episodeId:string,cursor?:string,signal?:AbortSignal):Promise<{items:CommentDTO[];cursor:string|null}>;
 createComment(input:{contentId:string;episodeId:string;parentId?:string;content:string;spoiler:boolean},idempotencyKey:string):Promise<CommentDTO>;
 toggleCommentLike(id:string,liked:boolean):Promise<{liked:boolean;likeCount:number}>;
 deleteComment(id:string):Promise<void>;
 reportComment(id:string,reason:string):Promise<{reportId:string;status:'submitted'}>;
 saveProgress(input:ProgressDTO):Promise<void>;
 progress(signal?:AbortSignal):Promise<ProgressDTO[]>;
 notifications(signal?:AbortSignal):Promise<NotificationDTO[]>;
 markNotification(id:string,read:boolean):Promise<void>;
 createTicket(input:Omit<TicketDTO,'id'|'status'|'createdAt'>):Promise<TicketDTO>;
 tickets(signal?:AbortSignal):Promise<TicketDTO[]>;
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
  if(!response.ok)throw new ApiError(response.status,response.status===403?'access_denied':response.status===401?'invalid_credentials':response.status===409?'account_exists':response.status===429?'rate_limited':'service_unavailable');
  return response.status===204?undefined as T:response.json() as Promise<T>;
 }
 const scope=(zone:ContentZone)=>zone==='adult'?'/adult':'/green';const id=(value:string)=>encodeURIComponent(value);
 return {session:signal=>call('/session','GET',undefined,signal),signIn:(input,signal)=>call('/auth/sign-in','POST',input,signal),register:(input,signal)=>call('/auth/register','POST',input,signal),requestPasswordReset:(email,signal)=>call('/auth/password-reset','POST',{email},signal),resetPassword:(token,password,signal)=>call('/auth/password-reset/confirm','POST',{token,password},signal),signOut:()=>call('/session','DELETE'),profile:signal=>call('/me/profile','GET',undefined,signal),updateProfile:(input,signal)=>call('/me/profile','PATCH',input,signal),eligibility:signal=>call('/adult/eligibility','GET',undefined,signal),enter:(ageConfirmed,signal)=>call('/adult/consent','POST',{ageConfirmed,explicitConsent:true},signal),revoke:()=>call('/adult/consent','DELETE'),contents:(zone,filters,signal)=>call(`${scope(zone)}/contents/search`,'POST',filters,signal),detail:(zone,key,signal)=>call(`${scope(zone)}/contents/${id(key)}`,'GET',undefined,signal),playback:(zone,key,signal)=>call(`${scope(zone)}/contents/${id(key)}/playback`,'POST',{},signal),quote:(planId,signal)=>call('/membership/quotes','POST',{planId},signal),orders:signal=>call('/orders','GET',undefined,signal),checkout:(quoteId,idempotencyKey)=>call('/orders','POST',{quoteId,idempotencyKey}),order:(key,signal)=>call(`/orders/${id(key)}`,'GET',undefined,signal),comments:(contentId,episodeId,cursor,signal)=>call(`/comments?contentId=${id(contentId)}&episodeId=${id(episodeId)}${cursor?`&cursor=${id(cursor)}`:''}`,'GET',undefined,signal),createComment:(input,idempotencyKey)=>call('/comments','POST',{...input,idempotencyKey}),toggleCommentLike:(key,liked)=>call(`/comments/${id(key)}/like`,liked?'PUT':'DELETE'),deleteComment:key=>call(`/comments/${id(key)}`,'DELETE'),reportComment:(key,reason)=>call(`/comments/${id(key)}/reports`,'POST',{reason}),saveProgress:input=>call('/me/watch-progress','PUT',input),progress:signal=>call('/me/watch-progress','GET',undefined,signal),notifications:signal=>call('/me/notifications','GET',undefined,signal),markNotification:(key,read)=>call(`/me/notifications/${id(key)}`,'PATCH',{read}),createTicket:input=>call('/support/tickets','POST',input),tickets:signal=>call('/support/tickets','GET',undefined,signal),clearHistory:(zone,key)=>call(`/privacy/${zone}/history${key?'/'+id(key):''}`,'DELETE'),publish:(draft,revision)=>call('/admin/content/publish','POST',{draft,revision}),metrics:(zone,signal)=>call(`/admin/metrics?zone=${zone}`,'GET',undefined,signal),event:event=>call('/analytics/events','POST',event)};
}
