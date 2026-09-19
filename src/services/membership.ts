import {ensureFestivalReferral} from './festivalReferral';
import type{Tier}from'../types/content';
import{ApiError,createHttpBackend,type MembershipSnapshotDTO,type SessionDTO}from'./backend';

export type Experiment='A'|'B';
export type PlanId='basic-month'|'premium-month'|'premium-quarter';
export const plans:{id:PlanId;title:string;tier:Tier;period:string;duration:string;prices:Record<Experiment,number>;benefits:string[]}[]=[
 {id:'basic-month',title:'悦享月卡',tier:'basic',period:'月',duration:'1 个月',prices:{A:19,B:29},benefits:['每月赠送320积分，积分长期有效','会员有效期为 1 个月','积分解锁的剧集永久保留']},
 {id:'premium-month',title:'尊享月卡',tier:'premium',period:'月',duration:'1 个月',prices:{A:39,B:49},benefits:['每月赠送960积分，积分长期有效','积分解锁享8折，向上取整','会员有效期为 1 个月']},
 {id:'premium-quarter',title:'尊享季卡',tier:'premium',period:'季',duration:'3 个月',prices:{A:99,B:129},benefits:['每月赠送960积分，按月发放','积分解锁享8折，向上取整','会员有效期为 3 个月']},
];
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
 async reset(){const version=++sessionGeneration;try{await backend.signOut();}finally{if(version===sessionGeneration)emit(guest);}},
 async quote(id:PlanId,signal?:AbortSignal){return backend.quote(id,signal);},
 async checkout(planId:PlanId){const quote=await backend.quote(planId);return backend.checkout(quote.id,crypto.randomUUID());},
 async orders(signal?:AbortSignal){return backend.orders(signal);},
};
