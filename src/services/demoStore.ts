import type {Tier} from '../types/content';

export type DemoProfile={id:string;email:string;nickname:string;bio:string;tier:Tier;memberSince:string|null;memberUntil:string|null};
export type DemoOrderStatus='pending'|'processing'|'paid'|'closed'|'refunding'|'refunded';
export type DemoOrder={id:string;userId:string;planId:string;planTitle:string;period:string;totalFen:number;currency:'CNY';status:DemoOrderStatus;entitlementStatus:'not_started'|'pending'|'active'|'failed';createdAt:string;updatedAt:string;failureReason?:string};
export type DemoComment={id:string;userId:string;dramaId:string;episodeId:string;parentId:string|null;content:string;spoiler:boolean;status:'pending'|'published'|'rejected';createdAt:string;likes:string[]};
export type DemoNotification={id:string;userId:string;kind:'reply'|'update'|'system';title:string;body:string;href:string;createdAt:string;read:boolean};
export type DemoProgress={userId:string;dramaId:string;episodeId:string;episodeNumber:number;seconds:number;duration:number;updatedAt:string};
export type DemoTicket={id:string;userId:string;category:string;subject:string;description:string;context:string;status:'open'|'processing'|'closed';createdAt:string};
type DemoReport={id:string;userId:string;commentId:string;reason:string;createdAt:string;status:'submitted'|'reviewed'};
type DemoState={version:1;profiles:DemoProfile[];orders:DemoOrder[];comments:DemoComment[];reports:DemoReport[];notifications:DemoNotification[];progress:DemoProgress[];favorites:{userId:string;dramaId:string;createdAt:string}[];tickets:DemoTicket[];revision:number};

const storageKey='aiai:isolated-sandbox:v1';
const sessionKey='aiai:isolated-sandbox-session';
const enabled=import.meta.env.DEV;
const now=()=>new Date().toISOString();
const uid=(prefix:string)=>`${prefix}_${crypto.randomUUID().replaceAll('-','').slice(0,16)}`;
const initial=():DemoState=>({version:1,profiles:[
 {id:'demo-user-a',email:'demo-a@aiai.test',nickname:'测试用户 A',bio:'仅用于本地隔离验收',tier:'free',memberSince:null,memberUntil:null},
 {id:'demo-user-b',email:'demo-b@aiai.test',nickname:'测试用户 B',bio:'仅用于本地隔离验收',tier:'premium',memberSince:'2026-09-01T00:00:00.000Z',memberUntil:'2026-12-01T00:00:00.000Z'},
],orders:[],comments:[],reports:[],notifications:[],progress:[],favorites:[],tickets:[],revision:0});
function read():DemoState{if(!enabled)return initial();try{const parsed=JSON.parse(localStorage.getItem(storageKey)||'null') as DemoState|null;if(parsed?.version===1)return parsed;}catch{/* reset corrupt sandbox data */}return initial();}
let state=read();
const listeners=new Set<()=>void>();
function persist(next:DemoState){state={...next,revision:next.revision+1};if(enabled)try{localStorage.setItem(storageKey,JSON.stringify(state));}catch{/* sandbox persistence is optional */}for(const fn of listeners)fn();}
function sessionId(){if(!enabled)return null;try{return sessionStorage.getItem(sessionKey);}catch{return null;}}
function requireUser(){const id=sessionId(),profile=state.profiles.find(item=>item.id===id);if(!profile)throw new Error('请先登录隔离沙盒账号');return profile;}
function notify(userId:string,kind:DemoNotification['kind'],title:string,body:string,href:string){return{id:uid('notice'),userId,kind,title,body,href,createdAt:now(),read:false} satisfies DemoNotification;}
export const demoStore={
 enabled,
 subscribe(fn:()=>void){listeners.add(fn);return()=>listeners.delete(fn);},
 getSnapshot:()=>state,
 currentUser(){const id=sessionId();return state.profiles.find(item=>item.id===id)??null;},
 loginAs(id:string){if(!enabled)return false;if(!state.profiles.some(item=>item.id===id))return false;sessionStorage.setItem(sessionKey,id);persist(state);return true;},
 register(email:string,nickname:string){if(!enabled)throw new Error('真实注册服务尚未接入');if(state.profiles.some(item=>item.email.toLowerCase()===email.toLowerCase()))throw new Error('该邮箱已存在于本地沙盒');const profile:DemoProfile={id:uid('user'),email,nickname,bio:'',tier:'free',memberSince:null,memberUntil:null};persist({...state,profiles:[...state.profiles,profile]});sessionStorage.setItem(sessionKey,profile.id);persist(state);return profile;},
 logout(){try{sessionStorage.removeItem(sessionKey);}catch{}persist(state);},
 updateProfile(patch:Pick<DemoProfile,'nickname'|'bio'>){const user=requireUser();persist({...state,profiles:state.profiles.map(item=>item.id===user.id?{...item,...patch}:item)});},
 ordersForCurrent(){const user=requireUser();return state.orders.filter(item=>item.userId===user.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));},
 order(id:string){const user=requireUser();return state.orders.find(item=>item.id===id&&item.userId===user.id)??null;},
 createOrder(plan:{id:string;title:string;period:string;totalFen:number}){const user=requireUser();const order:DemoOrder={id:uid('sandbox_order'),userId:user.id,planId:plan.id,planTitle:plan.title,period:plan.period,totalFen:plan.totalFen,currency:'CNY',status:'pending',entitlementStatus:'not_started',createdAt:now(),updatedAt:now()};persist({...state,orders:[order,...state.orders]});return order;},
 settleOrder(id:string,outcome:'success'|'failed'|'cancelled'|'delayed'){
  const user=requireUser(),order=state.orders.find(item=>item.id===id&&item.userId===user.id);if(!order)throw new Error('订单不存在或不属于当前账号');if(order.status==='paid'&&outcome==='success')return order;
  const stamp=now();let next:DemoOrder={...order,updatedAt:stamp};if(outcome==='success')next={...next,status:'paid',entitlementStatus:'active'};if(outcome==='delayed')next={...next,status:'paid',entitlementStatus:'pending'};if(outcome==='failed')next={...next,status:'closed',entitlementStatus:'failed',failureReason:'沙盒支付失败'};if(outcome==='cancelled')next={...next,status:'closed',entitlementStatus:'not_started',failureReason:'用户取消沙盒支付'};
  let profiles=state.profiles,notifications=state.notifications;if(outcome==='success'){
   const tier:Tier=order.planId==='basic-month'?'basic':'premium';const start=new Date(),end=new Date(start);if(order.planId==='premium-quarter')end.setMonth(end.getMonth()+3);else end.setMonth(end.getMonth()+1);
   profiles=profiles.map(item=>item.id===user.id?{...item,tier,memberSince:start.toISOString(),memberUntil:end.toISOString()}:item);
   notifications=[notify(user.id,'system','沙盒权益已更新',`${order.planTitle} 已在本地沙盒生效。`,`/me/orders/${order.id}`),...notifications];
  }
  persist({...state,profiles,notifications,orders:state.orders.map(item=>item.id===id?next:item)});return next;
 },
 commentsFor(dramaId:string,episodeId:string){return state.comments.filter(item=>item.dramaId===dramaId&&item.episodeId===episodeId&&item.status==='published');},
 myComments(){const user=requireUser();return state.comments.filter(item=>item.userId===user.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));},
 addComment(dramaId:string,episodeId:string,content:string,spoiler:boolean,parentId:string|null=null){const user=requireUser(),last=state.comments.find(item=>item.userId===user.id&&Date.now()-Date.parse(item.createdAt)<3000);if(last)throw new Error('发送太快，请稍后再试');const clean=content.trim();if(clean.length<2||clean.length>500)throw new Error('评论需为 2–500 个字符');if(state.comments.some(item=>item.userId===user.id&&item.dramaId===dramaId&&item.episodeId===episodeId&&item.content===clean&&Date.now()-Date.parse(item.createdAt)<60000))throw new Error('请勿重复发送相同内容');const comment:DemoComment={id:uid('comment'),userId:user.id,dramaId,episodeId,parentId,content:clean,spoiler,status:'published',createdAt:now(),likes:[]};let notifications=state.notifications;if(parentId){const parent=state.comments.find(item=>item.id===parentId);if(parent&&parent.userId!==user.id)notifications=[notify(parent.userId,'reply','收到一条沙盒回复',`${user.nickname} 回复了你的评论。`,`/play/${dramaId}?episode=${encodeURIComponent(episodeId)}#comments`),...notifications];}persist({...state,comments:[...state.comments,comment],notifications});return comment;},
 toggleLike(id:string){const user=requireUser(),comment=state.comments.find(item=>item.id===id);if(!comment)throw new Error('评论不存在');const likes=comment.likes.includes(user.id)?comment.likes.filter(v=>v!==user.id):[...comment.likes,user.id];persist({...state,comments:state.comments.map(item=>item.id===id?{...item,likes}:item)});},
 deleteComment(id:string){const user=requireUser(),comment=state.comments.find(item=>item.id===id);if(!comment||comment.userId!==user.id)throw new Error('只能删除自己的评论');const ids=new Set([id,...state.comments.filter(item=>item.parentId===id).map(item=>item.id)]);persist({...state,comments:state.comments.filter(item=>!ids.has(item.id))});},
 reportComment(commentId:string,reason:string){const user=requireUser();if(state.reports.some(item=>item.userId===user.id&&item.commentId===commentId))return;persist({...state,reports:[...state.reports,{id:uid('report'),userId:user.id,commentId,reason,createdAt:now(),status:'submitted'}]});},
 moderateComment(commentId:string,status:'published'|'rejected'){if(!enabled)throw new Error('仅限本地后台演示');persist({...state,comments:state.comments.map(item=>item.id===commentId?{...item,status}:item),reports:state.reports.map(item=>item.commentId===commentId?{...item,status:'reviewed'}:item)});},
 notifications(){const user=requireUser();return state.notifications.filter(item=>item.userId===user.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));},
 markNotification(id:string){const user=requireUser();persist({...state,notifications:state.notifications.map(item=>item.id===id&&item.userId===user.id?{...item,read:true}:item)});},
 saveProgress(dramaId:string,episodeId:string,episodeNumber:number,seconds:number,duration:number){const user=requireUser();if(seconds<2||!duration)return;const progress:DemoProgress={userId:user.id,dramaId,episodeId,episodeNumber,seconds,duration,updatedAt:now()};persist({...state,progress:[progress,...state.progress.filter(item=>!(item.userId===user.id&&item.dramaId===dramaId))]});},
 progress(){const user=requireUser();return state.progress.filter(item=>item.userId===user.id).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));},
 removeProgress(dramaId:string){const user=requireUser();persist({...state,progress:state.progress.filter(item=>!(item.userId===user.id&&item.dramaId===dramaId))});},
 clearProgress(){const user=requireUser();persist({...state,progress:state.progress.filter(item=>item.userId!==user.id)});},
 favorites(){const user=requireUser();return state.favorites.filter(item=>item.userId===user.id).map(item=>item.dramaId);},
 toggleFavorite(dramaId:string){const user=requireUser(),exists=state.favorites.some(item=>item.userId===user.id&&item.dramaId===dramaId);persist({...state,favorites:exists?state.favorites.filter(item=>!(item.userId===user.id&&item.dramaId===dramaId)):[...state.favorites,{userId:user.id,dramaId,createdAt:now()}]});},
 tickets(){const user=requireUser();return state.tickets.filter(item=>item.userId===user.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));},
 createTicket(category:string,subject:string,description:string,context:string){const user=requireUser();const ticket:DemoTicket={id:uid('ticket'),userId:user.id,category,subject,description,status:'open',context,createdAt:now()};persist({...state,tickets:[ticket,...state.tickets]});return ticket;},
 updateTicket(id:string,status:DemoTicket['status']){if(!enabled)throw new Error('仅限本地后台演示');persist({...state,tickets:state.tickets.map(item=>item.id===id?{...item,status}:item)});},
 reset(){if(!enabled)return;state=initial();try{localStorage.removeItem(storageKey);sessionStorage.removeItem(sessionKey);}catch{}for(const fn of listeners)fn();},
};
