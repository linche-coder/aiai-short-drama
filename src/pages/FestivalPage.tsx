import {useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {Check,Gift,Users,Copy,ArrowUpRight,Sparkles,ShieldCheck} from 'lucide-react';
import {FestivalArtwork} from '../components/FestivalArtwork';
import {Link,useRouter} from '../navigation/Router';
import {accountService} from '../services/membership';
import {festivalService,useFestival,festivalError} from '../services/festival';
import {usePoints} from '../services/points';
import {festivalConfig,festivalPhase} from '../services/festivalModel';

export function FestivalPage(){
 const account=useSyncExternalStore(accountService.subscribe,accountService.getSnapshot);
 return <FestivalAccount key={account.userId||'guest'} userId={account.userId}/>;
}
function FestivalAccount({userId}:{userId:string|null}){
 const {route,navigate}=useRouter(),state=useFestival(),points=usePoints(),data=state.userId===userId?state.data:null;
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[celebrate,setCelebrate]=useState(false),[error,setError]=useState(''),[copied,setCopied]=useState(false),[manual,setManual]=useState(false),alive=useRef(true),started=useRef(false),root=useRef<HTMLElement>(null);
 const phase=data?.phase||festivalPhase(festivalConfig),claimed=data?.claimed??false,active=phase==='active',canClaim=active&&!claimed;
 const inviteLink=data?.invitationCode?`${location.origin}/festival?invite=${encodeURIComponent(data.invitationCode)}`:'';
 useEffect(()=>{alive.current=true;void festivalService.refresh();return()=>{alive.current=false;};},[]);
 useEffect(()=>{const header=document.querySelector('.site-header');if(!header)return;const measure=()=>root.current?.style.setProperty('--festival-header-height',`${header.getBoundingClientRect().height}px`);measure();const observer=new ResizeObserver(measure);observer.observe(header);return()=>observer.disconnect();},[]);
 const login=(intent:string)=>{const params=new URLSearchParams(route.search);params.set('intent',intent);navigate(`/account/login?returnTo=${encodeURIComponent('/festival?'+params)}`,{preserveScroll:true});};
 async function claim(){
  if(!userId){login('claim');return;}if(busy)return;
  setBusy(true);setError('');setNotice('');setCelebrate(false);
  try{const result=await festivalService.claim();if(alive.current){setCelebrate(result.awarded===true);setNotice(result.awarded?'20积分已到账，愿好故事陪你过双节。':'你已领取过20积分，无需重复领取。');}}
  catch(e){if(alive.current)setError(festivalError(e));}finally{if(alive.current)setBusy(false);}
 }
 useEffect(()=>{if(userId&&data&&route.params.get('intent')==='claim'&&!started.current&&!location.pathname.startsWith('/account/')){started.current=true;const params=new URLSearchParams(route.search);params.delete('intent');navigate('/festival'+(params.size?'?'+params:''),{replace:true,preserveScroll:true});if(canClaim)void claim();}},[userId,data,route.search]);
 async function copy(){if(!userId){login('invite');return;}if(!inviteLink)return;try{await navigator.clipboard.writeText(inviteLink);if(alive.current){setCopied(true);setManual(false);}}catch{if(alive.current){setCopied(false);setManual(true);}}}
 return <main ref={root} className="festival-page">
  <section className="festival-hero" aria-label="中秋国庆双节活动"><FestivalArtwork immersive/><div className="festival-hero-bottom"><a className="festival-rule-link" href="#festival-rules">活动规则</a></div></section>
  <div className="festival-body container">
  {!data&&state.error&&<div className="festival-error" role="alert">{state.error} <button className="text-button" onClick={()=>void festivalService.refresh()}>重新加载</button></div>}
  <div className="festival-section-heading" id="festival-tasks"><h1>双节好礼，马上领取</h1></div>
  <div className="festival-tasks">
   <section className={`festival-card festival-claim ${claimed?'is-claimed':''}`}><div className="festival-card-top"><span className="festival-step">人人有份</span><Gift size={25}/></div><h2>参与即领20积分</h2><p>新老用户都能领，每个账号限领一次。</p><img className="festival-prize-art" src="/assets/festival/moon-gift.png" alt=""/><div className="festival-reward-number"><strong>20</strong><span>积分<small>永久有效</small></span></div>
    <button className="festival-primary" disabled={busy||claimed||!data||!active} onClick={()=>void claim()}>{busy?'正在领取…':claimed?<><Check size={19}/>已领取20积分</>:phase==='ended'?'活动已结束':!active?'活动尚未开始':'立即参与，领取20积分'}</button>
    <p className="festival-task-foot"><ShieldCheck size={14}/>积分永久有效，解锁好剧</p>
    {notice&&<p className={celebrate?'festival-success':'festival-info'} role="status">{celebrate&&<Sparkles size={16}/>} {notice}</p>}{error&&<div className="festival-error" role="alert">{error}<button className="text-button" disabled={busy} onClick={()=>void claim()}>重试领取</button></div>}
   </section>
   <section className="festival-card festival-invite"><div className="festival-card-top"><span className="festival-step">邀好友，好礼加码</span><Users size={25}/></div><h2>邀好友，再领100积分</h2><p>每成功邀请1位新用户注册，得20积分，最多5位。</p>
    <div className="festival-stamps" aria-label="邀请奖励进度">{Array.from({length:5},(_,i)=><div key={i} className={i<(data?.rewardedInvites||0)?'earned':''}><span>{i<(data?.rewardedInvites||0)?<Check size={18}/>:<Gift size={18}/>}</span><strong>+20</strong><small>{i<(data?.rewardedInvites||0)?'已到账':`第${i+1}位`}</small></div>)}</div>
    <div className="festival-invite-progress"><span>已成功邀请 <strong>{Math.min(data?.successfulInvites||0,5)}/5</strong> 位</span><span>{(data?.rewardedInvites||0)>=5?'邀请奖励已达上限':'最高100积分'}</span></div>
    {(data?.successfulInvites||0)>5&&<p>累计成功邀请{data?.successfulInvites}位，超出5位不再计奖。</p>}
    <button className="festival-secondary" disabled={!data||!active} onClick={()=>void copy()}><Copy size={17}/>{!userId?'登录获取专属邀请链接':copied?'链接已复制':'复制专属邀请链接'}</button>
    {copied&&<p role="status" className="festival-copy-feedback">已复制，发送给朋友完成新账号注册后计奖。</p>}
    {manual&&<label className="festival-manual">未能自动复制，请长按或选中下方链接复制<input aria-label="专属邀请链接" readOnly value={inviteLink} onFocus={e=>e.currentTarget.select()}/></label>}
    <p className="festival-task-foot">分享或打开链接不会发奖，以有效的新用户注册为准。</p>
   </section>
  </div>
  <section className="festival-card festival-account"><div className="festival-section-row"><div><h2>我的活动奖励</h2></div><Link href="/me/points?tab=transactions" className="text-button">查看积分明细 <ArrowUpRight size={16}/></Link></div>
   <div className="festival-totals">{[['参与奖励',data?.participationReward],['邀请奖励',data?.invitationReward],['本次活动累计奖励',data?.totalReward],['成功邀请人数',data?.successfulInvites]].map(([label,value],i)=><div key={label}><span>{label}</span><strong>{userId&&data?value:'—'}<small>{i===3?'位':'积分'}</small></strong></div>)}</div>
   {userId?<><p className="festival-wallet">当前账户余额 <strong>{points.userId===userId?points.data?.summary.balance??'—':'—'}</strong> 积分 <span>包含其他来源及消费；活动累计仅统计本次活动奖励。</span></p><div className="festival-records">{data?.records.length?data.records.map(record=><div key={record.id}><span>{record.kind==='participation'?'双节活动参与奖励':'双节活动邀请奖励'}<small>{new Date(record.createdAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false})}</small></span><strong>+{record.amount}</strong></div>):<p className="festival-empty">暂无活动奖励记录，完成上方任务即可领取。</p>}</div></>:<div className="festival-empty">登录后查看你的奖励记录。<button className="text-button" onClick={()=>login('rewards')}>立即登录</button></div>}
  </section>
  <section className="festival-rules" id="festival-rules"><h2>活动规则</h2><ol><li>活动时间待公布。活动结束后停止发奖，已到账积分不回收。</li><li>新老用户均可参与，每个账号本次活动限领取一次20积分。</li><li>好友通过专属链接成功注册新账号，有效邀请奖励20积分；好友也可领取自己的参与奖励。</li><li>每人最多计奖5位好友，邀请奖励最高100积分，本次活动合计最高120积分。</li><li>同一新用户仅能归属一位邀请人、计奖一次，归属确认后不可更换。禁止自邀；已有账号登录、复制或打开链接不计奖。</li><li>活动积分永久有效，可按现有规则解锁剧集。</li></ol></section>
  </div>
 </main>;
}
