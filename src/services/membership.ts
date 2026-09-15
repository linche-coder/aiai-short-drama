import type{Tier}from'../types/content';
export type Experiment='A'|'B';
export type PlanId='basic-month'|'premium-month'|'premium-quarter';
export const plans:{id:PlanId;title:string;tier:Tier;period:string;prices:Record<Experiment,number>}[]=[{id:'basic-month',title:'基础月卡',tier:'basic',period:'月',prices:{A:19,B:29}},{id:'premium-month',title:'高级月卡',tier:'premium',period:'月',prices:{A:39,B:49}},{id:'premium-quarter',title:'高级季卡',tier:'premium',period:'季',prices:{A:99,B:129}}];
export interface Account {status:'guest'|'preview';tier:Tier;experiment:Experiment;role:'none'|'preview-admin'}
let snapshot:Account={status:'guest',tier:'free',experiment:'A',role:'none'};
try{if(import.meta.env.DEV&&sessionStorage.getItem('aiai:price-preview')==='B')snapshot={...snapshot,experiment:'B'};}catch{/* optional preview preference, never an entitlement */}
const listeners=new Set<()=>void>();
function update(patch:Partial<Account>){snapshot={...snapshot,...patch};for(const fn of listeners)fn();}
export const accountService={subscribe(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn);};},getSnapshot:()=>snapshot,
 setPreview(patch:Partial<Account>){if(!import.meta.env.DEV)return;update({...patch,status:'preview'});if(patch.experiment)try{sessionStorage.setItem('aiai:price-preview',patch.experiment);}catch{/* optional */}},
 reset(){update({status:'guest',tier:'free',role:'none'});},
 async quote(id:PlanId){const plan=plans.find(p=>p.id===id);return plan?{plan,experiment:snapshot.experiment,total:plan.prices[snapshot.experiment],checkoutAvailable:false,upgradeAmount:null,expiresAt:null}:null;},
 async checkout(){return{ok:false as const,message:'结算服务尚未开放，未创建订单或扣费。'};},
 async orders(){return [] as {id:string;status:'pending'|'processing'|'paid'|'closed'|'refunding'|'refunded';total:number}[];}
};
