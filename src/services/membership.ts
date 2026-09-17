import type{Tier}from'../types/content';
import{ApiError,createHttpBackend,type MembershipSnapshotDTO,type SessionDTO}from'./backend';

export type Experiment='A'|'B';
export type PlanId='basic-month'|'premium-month'|'premium-quarter';
export const plans:{id:PlanId;title:string;tier:Tier;period:string;duration:string;prices:Record<Experiment,number>;benefits:string[]}[]=[
 {id:'basic-month',title:'基础月卡',tier:'basic',period:'月',duration:'1 个月',prices:{A:19,B:29},benefits:['有效期内观看已上线的基础会员内容','会员有效期为 1 个月','可在订单中查询权益状态']},
 {id:'premium-month',title:'高级月卡',tier:'premium',period:'月',duration:'1 个月',prices:{A:39,B:49},benefits:['有效期内观看已上线的高级会员内容','包含已上线的基础会员内容','会员有效期为 1 个月']},
 {id:'premium-quarter',title:'高级季卡',tier:'premium',period:'季',duration:'3 个月',prices:{A:99,B:129},benefits:['有效期内观看已上线的高级会员内容','包含已上线的基础会员内容','会员有效期为 3 个月']},
];
export interface Account {status:'guest'|'authenticated';tier:Tier;experiment:Experiment;role:'none'|'content_editor'|'analyst';userId:string|null;nickname:string|null;membership:MembershipSnapshotDTO|null}
const guest:Account={status:'guest',tier:'free',experiment:'A',role:'none',userId:null,nickname:null,membership:null};
let snapshot:Account=guest;
const listeners=new Set<()=>void>();
const csrf=()=>document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content??'';
const backend=createHttpBackend(csrf);
function emit(next:Account){snapshot=next;for(const fn of listeners)fn();}
function accept(session:SessionDTO,fallback?:string){if(!session.subject)throw new ApiError(401,'invalid_session');const role=session.roles.includes('content_editor')?'content_editor':session.roles.includes('analyst')?'analyst':'none';emit({status:'authenticated',tier:session.tier,experiment:'A',role,userId:session.subject,nickname:session.nickname||fallback||session.subject,membership:session.membership??null});}
export const accountService={
 subscribe(fn:()=>void){listeners.add(fn);return()=>listeners.delete(fn);},getSnapshot:()=>snapshot,
 async refresh(){try{const session=await backend.session();if(session.subject)accept(session);else emit(guest);}catch{emit(guest);}},
 async signIn(input:{account:string;password:string;returnTo:string},signal?:AbortSignal){const session=await backend.signIn(input,signal);accept(session,input.account);return session;},
 async register(input:{account:string;password:string;email?:string},signal?:AbortSignal){const session=await backend.register(input,signal);accept(session,input.account);return session;},
 requestPasswordReset(email:string,signal?:AbortSignal){return backend.requestPasswordReset(email,signal);},
 async reset(){try{await backend.signOut();}finally{emit(guest);}},
 async quote(id:PlanId,signal?:AbortSignal){return backend.quote(id,signal);},
 async checkout(planId:PlanId){const quote=await backend.quote(planId);return backend.checkout(quote.id,crypto.randomUUID());},
 async orders(signal?:AbortSignal){return backend.orders(signal);},
};
