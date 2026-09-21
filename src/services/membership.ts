import {ensureFestivalReferral} from './festivalReferral';
import type{Tier}from'../types/content';
import{ApiError,createHttpBackend,type MembershipSnapshotDTO,type SessionDTO}from'./backend';

export type Experiment='A'|'B';
export type PlanId='view-month'|'view-quarter'|'view-forever';
export interface Account {status:'guest'|'authenticated';tier:Tier;experiment:Experiment;role:'none'|'content_editor'|'analyst';userId:string|null;nickname:string|null;membership:MembershipSnapshotDTO|null}
const guest:Account={status:'guest',tier:'free',experiment:'A',role:'none',userId:null,nickname:null,membership:null};
let snapshot:Account=guest,sessionGeneration=0;
const listeners=new Set<()=>void>();
const csrf=()=>document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content??'';
const backend=createHttpBackend(csrf);
function emit(next:Account){snapshot=next;for(const fn of listeners)fn();}
function accept(session:SessionDTO,fallback?:string){if(!session.subject)throw new ApiError(401,'invalid_session');const role=session.roles.includes('content_editor')?'content_editor':session.roles.includes('analyst')?'analyst':'none';emit({status:'authenticated',tier:session.tier,experiment:'A',role,userId:session.subject,nickname:session.nickname||fallback||session.subject,membership:session.membership??null});}
export const accountService={
 expire(){sessionGeneration++;emit(guest);},
 subscribe(fn:()=>void){listeners.add(fn);return()=>listeners.delete(fn);},getSnapshot:()=>snapshot,
 async refresh(){const version=sessionGeneration;try{const session=await backend.session();if(version!==sessionGeneration)return;if(session.subject)accept(session);else emit(guest);}catch{if(version===sessionGeneration)emit(guest);}},
 async signIn(input:{account:string;password:string;returnTo:string},signal?:AbortSignal){const version=++sessionGeneration;const session=await backend.signIn(input,signal);if(version!==sessionGeneration)throw new ApiError(401,'session_expired');accept(session,input.account);return session;},
 async register(input:{account:string;password:string;email?:string},signal?:AbortSignal){const version=++sessionGeneration;await ensureFestivalReferral();const session=await backend.register(input,signal);if(version!==sessionGeneration)throw new ApiError(401,'session_expired');accept(session,input.account);return session;},
 requestPasswordReset(email:string,signal?:AbortSignal){return backend.requestPasswordReset(email,signal);},
 async changePassword(currentPassword:string,newPassword:string){await backend.changePassword({currentPassword,newPassword});sessionGeneration++;emit(guest);},
 async reset(){const version=++sessionGeneration;try{await backend.signOut();}finally{if(version===sessionGeneration)emit(guest);}},
 async quote(id:PlanId,signal?:AbortSignal){return backend.quote(id,signal);},
 async checkout(planId:PlanId){const quote=await backend.quote(planId);return backend.checkout(quote.id,crypto.randomUUID());},
 async orders(signal?:AbortSignal){return backend.orders(signal);},
};
