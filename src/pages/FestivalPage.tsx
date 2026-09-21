import {useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {Check,Gift,Users,Copy,ArrowUpRight,Sparkles,ShieldCheck,Smartphone,Crown} from 'lucide-react';
import {FestivalArtwork} from '../components/FestivalArtwork';
import {Link,useRouter} from '../navigation/Router';
import {accountService} from '../services/membership';
import {festivalService,useFestival,festivalError} from '../services/festival';
import {usePoints} from '../services/points';
import {festivalConfig,invitationMaximum,festivalDates,festivalOffers,rechargeBonusFor,festivalRechargePath,festivalRewardNames} from '../services/festivalModel';
import {useFestivalPhase} from '../hooks/useFestivalPhase';

export function FestivalPage(){
 const account=useSyncExternalStore(accountService.subscribe,accountService.getSnapshot);
 return <FestivalAccount key={account.userId||'guest'} userId={account.userId}/>;
}
function FestivalAccount({userId}:{userId:string|null}){
 const {route,navigate}=useRouter(),state=useFestival(),points=usePoints(),data=state.userId===userId?state.data:null;
 const [appNotice,setAppNotice]=useState(false);
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[celebrate,setCelebrate]=useState(false),[error,setError]=useState(''),[copied,setCopied]=useState(false),[manual,setManual]=useState(false),alive=useRef(true),started=useRef(false),root=useRef<HTMLElement>(null);
 const localPhase=useFestivalPhase();
 const phase=localPhase==='active'?(data?.phase||localPhase):localPhase,claimed=data?.claimed??false,active=phase==='active',canClaim=active&&!claimed;
 const inviteLink=data?.invitationCode?`${location.origin}/festival?invite=${encodeURIComponent(data.invitationCode)}`:'';
 useEffect(()=>{alive.current=true;void festivalService.refresh();return()=>{alive.current=false;};},[]);
 useEffect(()=>{const header=document.querySelector('.site-header');if(!header)return;const measure=()=>root.current?.style.setProperty('--festival-header-height',`${header.getBoundingClientRect().height}px`);measure();const observer=new ResizeObserver(measure);observer.observe(header);return()=>observer.disconnect();},[]);
 const login=(intent:string)=>{const params=new URLSearchParams(route.search);params.set('intent',intent);navigate(`/account/login?returnTo=${encodeURIComponent('/festival?'+params)}`,{preserveScroll:true});};
 async function claim(){
  if(!userId){login('claim');return;}if(busy)return;
  setBusy(true);setError('');setNotice('');setCelebrate(false);
  try{const result=await festivalService.claim();if(alive.current){setCelebrate(result.awarded===true);setNotice(result.awarded?`${festivalConfig.participation}积分已到账，愿好故事陪你过双节。`:`你已领取过${festivalConfig.participation}积分，无需重复领取。`);}}
  catch(e){if(alive.current)setError(festivalError(e));}finally{if(alive.current)setBusy(false);}
 }
 useEffect(()=>{if(userId&&data&&route.params.get('intent')==='claim'&&!started.current&&!location.pathname.startsWith('/account/')){started.current=true;const params=new URLSearchParams(route.search);params.delete('intent');navigate('/festival'+(params.size?'?'+params:''),{replace:true,preserveScroll:true});if(canClaim)void claim();}},[userId,data,route.search]);
 async function copy(){if(!userId){login('invite');return;}if(!inviteLink)return;try{await navigator.clipboard.writeText(inviteLink);if(alive.current){setCopied(true);setManual(false);}}catch{if(alive.current){setCopied(false);setManual(true);}}}
 return <main ref={root} className="festival-page">
  <section className="festival-hero" aria-label="中秋国庆双节活动"><FestivalArtwork immersive/></section>
  <div className="festival-body container">
  {!data&&state.error&&<div className="festival-error" role="alert">{state.error} <button className="text-button" onClick={()=>void festivalService.refresh()}>重新加载</button></div>}
  {phase!=='active'&&<p className="festival-status" role="status">{phase==='upcoming'?'活动尚未开始':'活动已结束'}</p>}
  <div className="festival-section-heading" id="festival-tasks"><h1>双节好礼，马上领取</h1></div>
  <div className="festival-tasks">
   <section className={`festival-card festival-claim ${claimed?'is-claimed':''}`}><div className="festival-card-top"><span className="festival-step">人人有份</span><Gift size={25}/></div><h2>参与即领{festivalConfig.participation}积分</h2><p>新老用户都能领，每个账号限领一次。</p><img className="festival-prize-art" src="/assets/festival/moon-gift.png" alt=""/><div className="festival-reward-number"><strong>{festivalConfig.participation}</strong><span>积分<small>永久有效</small></span></div>
    <button className="festival-primary" disabled={busy||claimed||!data||!active} onClick={()=>void claim()}>{busy?'正在领取…':claimed?<><Check size={19}/>已领取{festivalConfig.participation}积分</>:phase==='ended'?'活动已结束':!active?'活动尚未开始':`立即参与，领取${festivalConfig.participation}积分`}</button>
    <p className="festival-task-foot"><ShieldCheck size={14}/>积分永久有效，解锁好剧</p>
    {notice&&<p className={celebrate?'festival-success':'festival-info'} role="status">{celebrate&&<Sparkles size={16}/>} {notice}</p>}{error&&<div className="festival-error" role="alert">{error}<button className="text-button" disabled={busy} onClick={()=>void claim()}>重试领取</button></div>}
   </section>
   <section className="festival-card festival-invite"><div className="festival-card-top"><span className="festival-step">邀好友，好礼加码</span><Users size={25}/></div><h2>邀好友，再领{invitationMaximum}积分</h2><p>每成功邀请1位新用户注册，奖励{festivalConfig.invitation}积分，最多奖励{festivalConfig.maxInvites}位。</p>
    <div className="festival-stamps" aria-label="邀请奖励进度">{Array.from({length:festivalConfig.maxInvites},(_,i)=><div key={i} className={i<(data?.rewardedInvites||0)?'earned':''}><span>{i<(data?.rewardedInvites||0)?<Check size={18}/>:<Gift size={18}/>}</span><strong>+{festivalConfig.invitation}</strong><small>{i<(data?.rewardedInvites||0)?'已到账':`第${i+1}位`}</small></div>)}</div>
    <div className="festival-invite-progress"><span>已成功邀请 <strong>{Math.min(data?.successfulInvites||0,festivalConfig.maxInvites)}/{festivalConfig.maxInvites}</strong> 位</span><span>{(data?.rewardedInvites||0)>=festivalConfig.maxInvites?'邀请奖励已达上限':`最高${invitationMaximum}积分`}</span></div>
    {(data?.successfulInvites||0)>festivalConfig.maxInvites&&<p>累计成功邀请{data?.successfulInvites}位，超出{festivalConfig.maxInvites}位不再计奖。</p>}
    <button className="festival-secondary" disabled={!data||!active} onClick={()=>void copy()}><Copy size={17}/>{!userId?'登录获取专属邀请链接':copied?'链接已复制':'复制专属邀请链接'}</button>
    {copied&&<p role="status" className="festival-copy-feedback">已复制，发送给朋友完成新账号注册后计奖。</p>}
    {manual&&<label className="festival-manual">未能自动复制，请长按或选中下方链接复制<input aria-label="专属邀请链接" readOnly value={inviteLink} onFocus={e=>e.currentTarget.select()}/></label>}
    <p className="festival-task-foot">分享或打开链接不会发奖，以有效的新用户注册为准。</p>
   </section>
   <section className="festival-card festival-app"><div className="festival-card-top"><span className="festival-step">App专享</span><Smartphone size={25}/></div><h2>下载App，再领{festivalConfig.appReward}积分</h2><p>下载爱爱短剧App，在App内打开活动页即可领取。</p><div className="festival-app-visual" aria-hidden="true"><img className="festival-phone-illustration" src="/assets/festival/app-phone-illustration.png" alt=""/><img src="/assets/festival/moon-gift.png" alt=""/></div><a className="festival-secondary" href={festivalConfig.appDownloadUrl||undefined} role="link" tabIndex={0} onClick={e=>{if(!festivalConfig.appDownloadUrl){e.preventDefault();setAppNotice(true);}}} onKeyDown={e=>{if(e.key==='Enter'&&!festivalConfig.appDownloadUrl){e.preventDefault();setAppNotice(true);}}}>下载App <ArrowUpRight size={17}/></a>{appNotice&&<p role="status" className="festival-copy-feedback">下载页面即将上线</p>}<p className="festival-task-foot">每个账号限领一次，前往App领取</p></section>
   <section className="festival-card festival-recharge-task"><div className="festival-card-top"><span className="festival-step">双节会员充值礼</span><Crown size={25}/></div><h2>开通或续费，活动期加赠积分</h2><p>畅看月卡、季卡参加；会员套餐本身不赠送积分。</p><div className="festival-bonus-grid">{festivalOffers.map(offer=><div key={offer.id}><span>{offer.name}</span><strong>+{rechargeBonusFor(offer.id)}<small>积分</small></strong></div>)}</div><Link className="festival-secondary" href={festivalRechargePath}>查看双节充值礼 <ArrowUpRight size={17}/></Link><p className="festival-task-foot">活动期内订单支付成功后，加赠积分一次性到账</p></section>
  </div>
  <section className="festival-card festival-account"><div className="festival-section-row"><div><h2>我的活动奖励</h2></div><Link href="/me/points?tab=transactions" className="text-button">查看积分明细 <ArrowUpRight size={16}/></Link></div>
   <div className="festival-totals">{[['参与奖励',data?.participationReward],['邀请奖励',data?.invitationReward],['App奖励',data?.appReward??0],['充值加赠',data?.rechargeReward??0],['本次活动累计奖励',data?.totalReward],['成功邀请人数',data?.successfulInvites]].map(([label,value],i)=><div key={label}><span>{label}</span><strong>{userId&&data?value:'—'}<small>{i===5?'位':'积分'}</small></strong></div>)}</div>
   {userId?<><p className="festival-wallet">当前账户余额 <strong>{points.userId===userId?points.data?.summary.balance??'—':'—'}</strong> 积分 <span>包含其他来源及消费；活动累计仅统计本次活动奖励。</span></p><div className="festival-records">{data?.records.length?data.records.map(record=><div key={record.id}><span>{festivalRewardNames[record.kind]}<small>{new Date(record.createdAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false})}</small></span><strong>{record.amount>=0?'+':''}{record.amount}</strong></div>):<p className="festival-empty">暂无活动奖励记录，完成上方任务即可领取。</p>}</div></>:<div className="festival-empty">登录后查看你的奖励记录。<button className="text-button" onClick={()=>login('rewards')}>立即登录</button></div>}
  </section>
  <section className="festival-rules" id="festival-rules"><h2>活动规则</h2><ol>
   <li>活动时间为{festivalDates.full}。</li>
   <li>新老用户均可参与，每个账号本次活动限领取一次{festivalConfig.participation}积分。</li>
   <li>好友通过专属邀请链接成功注册新账号，邀请人可获得{festivalConfig.invitation}积分。</li>
   <li>每个账号最多获得{festivalConfig.maxInvites}位有效新用户的邀请奖励，邀请奖励最高{invitationMaximum}积分。</li>
   <li>同一新用户只能归属一位邀请人并计奖一次，归属确认后不可更换。</li>
   <li>禁止自邀；已有账号登录、复制链接或仅打开链接均不计入有效邀请。</li>
   <li>用户可前往下载App，并在App内参与{festivalConfig.appReward}积分专享任务；网页端不直接发放该奖励。</li>
   <li>活动期间成功开通或续费悦享、尊享会员，每笔订单均可获得对应活动积分加赠，不限制次数。</li>
   <li>{festivalOffers.map(offer=>offer.name+'加赠'+rechargeBonusFor(offer.id)+'积分').join('，')}。</li>
   <li>会员充值活动以订单支付成功时间为准，普通积分包不参加。</li>
   <li>未支付、支付失败、取消或关闭的订单不发放活动奖励。</li>
   <li>全额退款订单对应的活动加赠积分会被回收。</li>
   <li>所有活动积分进入统一积分余额，永久有效，可按现有规则使用。</li>
   <li>活动结束后停止新增奖励，已经到账的正常活动积分不因活动结束被回收。</li>
  </ol></section>
  </div>
 </main>;
}
