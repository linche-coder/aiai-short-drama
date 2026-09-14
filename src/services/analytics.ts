import type {ContentZone,Tier} from '../types/content';
export type EventName='page_view'|'content_impression'|'adult_entry_click'|'age_gate_view'|'age_gate_pass'|'age_gate_exit'|'age_gate_denied'|'search_submit'|'play_start'|'play_complete'|'follow_add'|'membership_view'|'upgrade_start'|'upgrade_success'|'history_hide'|'history_clear'|'complaint_submit';
export interface EventInput {name:EventName;zone:ContentZone;sourceZone?:ContentZone;contentId?:string;gateId?:string;experiment?:'A'|'B';tier?:Tier;route?:string;verified?:boolean;isDemo?:boolean}
export type SafeEvent=EventInput&{id:string;time:string;session:string};
export interface AnalyticsAdapter {send(event:SafeEvent):void|Promise<void>}
const events:SafeEvent[]=[];
let adapter:AnalyticsAdapter={send(event){if(import.meta.env.DEV){events.push(event);if(events.length>500)events.shift();}}};
export function configureAnalytics(next:AnalyticsAdapter){const previous=adapter;adapter=next;return()=>{adapter=previous;};}
const dedupe=new Set<string>();let session='';
export const completionThreshold=.9;
export function track(input:EventInput,key?:string){
 if(key&&dedupe.has(key))return;
 if(input.name==='upgrade_success'&&!input.verified)return; // success only from a verified service adapter
 if(key)dedupe.add(key);if(!session)session=crypto.randomUUID();
 // Explicit allowlist: never copy search text, titles, full URLs or arbitrary payloads.
 const event:SafeEvent={id:crypto.randomUUID(),time:new Date().toISOString(),session,name:input.name,zone:input.zone,isDemo:true};
 if(input.sourceZone)event.sourceZone=input.sourceZone;
 if(input.gateId&&/^[a-zA-Z0-9-]+$/.test(input.gateId))event.gateId=input.gateId;
 if(input.contentId&&/^[a-zA-Z0-9-]+$/.test(input.contentId))event.contentId=input.contentId;
 if(input.experiment)event.experiment=input.experiment;if(input.tier)event.tier=input.tier;
 if(input.route)event.route=input.route.startsWith('/18plus')?'/18plus':input.route.split(/[?#]/)[0].replace(/\/(play|read)\/[^/]+/,'/$1/:id');
 try{void Promise.resolve(adapter.send(event)).catch(()=>{});}catch{/* Telemetry must not interrupt the user path or log payloads. */}
}
export const previewEvents=()=>import.meta.env.DEV?[...events]:[];
export const metrics=[
 ['主动入口点击率','绿色首页主动点击入口的去重会话 / 绿色首页有效会话'],['门槛后实际进入率','完成门槛的去重会话 / 绿色首页有效会话'],['内容误曝光率','未获准或普通页面的成人内容项曝光 / 这些上下文全部内容项曝光；同时记录违规次数，目标为 0'],['完播率',`达到 ${completionThreshold*100}% 的有效观看 / 有效起播，排除测试与广告`],['追剧、付费与留存','按内容域、去重用户和观察窗口统计；共享套餐收入只计一次'],['门槛通过 / 退出率','按 gate_instance_id 去重；通过或退出 / 展示，拒绝与失败单列'],['基础升级高级转化率','服务端核实升级用户 / 看到升级入口的合资格基础用户'],['私密历史清除率','有私密历史且执行清除的用户 / 同窗口有私密历史的用户；隐藏另计'],['投诉率','投诉事件 / 对应有效观看'],['退款 / 拒付率','服务端核实退款或拒付订单 / 同口径已支付订单']
];
