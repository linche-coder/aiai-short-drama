import {rechargeBonusFor} from '../services/festivalModel';
import {festivalService} from '../services/festival';
import {useFestivalPhase} from '../hooks/useFestivalPhase';
import {pointsService,pointsError,usePoints} from '../services/points';
import{useEffect,useRef,useState,useSyncExternalStore,type CSSProperties,type PointerEvent}from'react';
import{ArrowUpRight,BadgeCheck,CalendarDays,Check,ChevronRight,Crown,Diamond,Headphones,ReceiptText,ShieldCheck,Sparkles}from'lucide-react';
import{accountService,plans,type Account}from'../services/membership';
import{useRouter,Link}from'../navigation/Router';
import{DialogShell}from'../components/DialogShell';
import{MembershipEmblem}from'../components/MembershipEmblem';
import '../styles/membership-recharge.css';
import{AccountAvatar}from'../components/AccountAvatar';
import{track}from'../services/analytics';

const tierName=(tier:Account['tier'])=>tier==='basic'?'悦享会员':tier==='premium'?'尊享会员':'免费用户';
const date=(value:string|null|undefined)=>value?new Intl.DateTimeFormat('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value)):'以权益记录为准';

type Offer = {id:string;title:string;price:number;period?:string;points:string;tone:'pink'|'cyan'};
const offers:Offer[] = [
 {id:'joy-month',title:'悦享会员',price:19.9,period:'月',points:'320 积分/月',tone:'pink'},
 {id:'premium-month',title:'尊享会员',price:39.9,period:'月',points:'960 积分/月',tone:'cyan'},
 {id:'points-60',title:'60 积分',price:6,points:'60 积分',tone:'pink'},
 {id:'points-200',title:'200 积分',price:18,points:'200 积分',tone:'pink'},
 {id:'points-580',title:'580 积分',price:45,points:'580 积分',tone:'pink'},
 {id:'points-1500',title:'1,500 积分',price:98,points:'1,500 积分',tone:'pink'},
 {id:'joy-year',title:'悦享年卡',price:168,period:'年',points:'320 积分/月',tone:'pink'},
 {id:'premium-year',title:'尊享年卡',price:328,period:'年',points:'960 积分/月',tone:'cyan'},
];
const tiers = [
 {id:'free',title:'免费用户',price:0,points:'40 积分/月',benefits:['短剧可看','前段剧集免费','积分解锁后续剧集','1 台设备'],action:'免费开始',tone:'silver'},
 {id:'joy-month',title:'悦享会员',price:19.9,original:29.9,points:'320 积分/月',benefits:['短剧 · 漫剧 · 18+专区','无广告','最高 1080P','1 台设备'],action:'立即开通',tone:'pink'},
 {id:'premium-month',title:'尊享会员',price:39.9,original:59.9,points:'960 积分/月',benefits:['积分解锁 8 折','每月 1 张整剧畅看券','新剧提前 48 小时','2 台设备'],action:'升级尊享',tone:'cyan'},
];

function moveSpotlight(event:PointerEvent<HTMLElement>){
 if(event.pointerType!=='mouse'||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const bounds=event.currentTarget.getBoundingClientRect();
 event.currentTarget.style.setProperty('--spot-x',`${event.clientX-bounds.left}px`);
 event.currentTarget.style.setProperty('--spot-y',`${event.clientY-bounds.top}px`);
}

export function MembershipPage(){
 const account=useSyncExternalStore(accountService.subscribe,accountService.getSnapshot),{route,navigate}=useRouter(),returnTo=route.params.get('returnTo');
 const phase=useFestivalPhase(),festivalActive=phase==='active';
 const points=usePoints(),[busy,setBusy]=useState(false),[purchaseError,setPurchaseError]=useState(''),purchaseKey=useRef(crypto.randomUUID()),pending=useRef(false);
 const [selected,setSelected]=useState<Offer|null>(()=>offers.find(item=>item.id===route.params.get('offer'))??null);
 useEffect(()=>{purchaseKey.current=crypto.randomUUID();setPurchaseError('');},[selected?.id]);
 useEffect(()=>{if(route.hash==='#festival-recharge'&&festivalActive){const frame=requestAnimationFrame(()=>document.getElementById('festival-recharge')?.scrollIntoView({behavior:'instant',block:'start'}));return()=>cancelAnimationFrame(frame);}},[route.hash,route.search,account.tier,festivalActive]);
 useEffect(()=>{if(route.params.get('view')==='points')requestAnimationFrame(()=>document.getElementById('points-topup')?.scrollIntoView());},[route.search,account.tier]);
 async function purchase(){if(!selected||pending.current)return;pending.current=true;setBusy(true);setPurchaseError('');try{await pointsService.purchase(selected.id,purchaseKey.current);await accountService.refresh();await festivalService.refresh();setSelected(null);if(returnTo)navigate(returnTo);else navigate('/me/points');}catch(e){setPurchaseError(pointsError(e));}finally{pending.current=false;setBusy(false);}}
 useEffect(()=>{track({name:'membership_view',zone:'green',experiment:'A',tier:account.tier},`membership:${route.key}`);},[route.key,account.tier]);
 useEffect(()=>{setSelected(offers.find(item=>item.id===route.params.get('offer'))??null);},[route.search]);
 const purchasePath=(offer:Offer)=>{const params=new URLSearchParams(route.params);params.set('view','plans');params.set('offer',offer.id);return `/membership?${params}`;};
 if(account.status==='authenticated'&&account.tier!=='free'&&route.params.get('view')!=='plans'&&route.params.get('view')!=='points'&&!route.params.has('offer')&&route.params.get('campaign')!=='festival'&&route.hash!=='#festival-recharge')return <MemberCenter account={account} returnTo={returnTo}/>;
 return <main className="recharge-page">
  <div className="recharge-universe" aria-hidden="true"><div className="recharge-orbit recharge-orbit-one"/><div className="recharge-orbit recharge-orbit-two"/><div className="recharge-planet"/><div className="recharge-aurora"/>{Array.from({length:24},(_,i)=><i key={i} className="recharge-star" style={{'--x':`${(i*37+7)%100}%`,'--y':`${(i*23+11)%100}%`,'--delay':`${-i*.7}s`,'--size':`${i%4===0?4:2}px`} as CSSProperties}/>)}</div>
  <div className="recharge-content">
   <header className="recharge-heading"><div className="recharge-heading-spark" aria-hidden="true"><Sparkles/></div><h1><span>爱爱短剧</span> 会员方案</h1><p>会员每月送积分，精彩剧集按需解锁</p></header>
   <section className="recharge-tiers" id="festival-recharge" aria-label="会员方案">
    {tiers.map((tier,index)=><article key={tier.id} className={`recharge-card recharge-${tier.tone}`} onPointerMove={moveSpotlight} style={{'--index':index} as CSSProperties}>
     {index===1&&<div className="recharge-popular"><Crown size={16} fill="currentColor"/> 最受欢迎</div>}
     <div className="recharge-card-top"><MembershipEmblem level={index}/><h2>{tier.title}</h2></div>
     <div className="recharge-price-area">{tier.original&&<del>¥{tier.original}</del>}<div className="recharge-price"><span>¥</span><strong>{tier.price}</strong>{index>0&&<small>/月</small>}</div></div>
     <div className="recharge-points">{tier.points}</div>{festivalActive&&index>0&&<FestivalBonus offerId={tier.id}/>}
     <div className="recharge-card-rule"/>
     <ul>{tier.benefits.map(benefit=><li key={benefit}><span className="recharge-check"><Check size={12} strokeWidth={2.5}/></span>{benefit}</li>)}</ul>
     {index===0?<Link className="recharge-cta" href="/free">{tier.action}<ChevronRight size={18}/></Link>:<button className="recharge-cta" onClick={()=>setSelected(offers[index-1])}>{tier.action}<ChevronRight size={18}/></button>}
    </article>)}
   </section>
   <section className="recharge-annuals" aria-labelledby="recharge-annual-title"><h2 id="recharge-annual-title"><Sparkles size={19}/>年卡更省</h2><div className="recharge-annual-options">{offers.slice(6).map((offer,index)=><button key={offer.id} onClick={()=>setSelected(offer)} className={`recharge-annual recharge-${offer.tone}`}><span>{offer.title}</span><strong><small>¥</small>{offer.price}<small>/年</small></strong><ChevronRight size={20}/><span className="recharge-annual-meta">{festivalActive&&<FestivalBonus offerId={offer.id}/>}<span className="recharge-annual-compare">按月购买 <s>¥{index===0?'238.8':'478.8'}</s></span></span></button>)}</div></section>
   <section id="points-topup" className="recharge-topups" aria-labelledby="recharge-topup-title"><h2 id="recharge-topup-title">积分不够？<span>按需补充</span></h2><div className="recharge-topup-options">{offers.slice(2,6).map(offer=><button key={offer.id} onClick={()=>setSelected(offer)} className="recharge-topup"><span>{offer.title}</span><strong><small>¥</small>{offer.price}</strong><ChevronRight size={15}/></button>)}</div></section>
   <p className="recharge-footnote"><ShieldCheck size={13}/><span>18+专区需完成年龄与地区验证<span className="recharge-note-dot"> · </span><span>已解锁剧集永久保留</span></span></p>
  </div>
  {selected&&!location.pathname.startsWith('/account/')&&<DialogShell title={selected.title} onClose={()=>setSelected(null)} hideFooterClose><div className={`recharge-purchase recharge-${selected.tone}`}><div className="recharge-purchase-symbol" aria-hidden="true">{selected.period?<Crown/>:<Diamond/>}</div><div className="recharge-price"><span>¥</span><strong>{selected.price}</strong>{selected.period&&<small>/{selected.period}</small>}</div>{selected.period&&<p className="purchase-benefit-label">会员权益</p>}<div className="recharge-points">{selected.points}</div>{festivalActive&&selected.period&&<div className="purchase-festival-bonus"><span>双节活动加赠</span><strong>{rechargeBonusFor(selected.id)}积分</strong><small>活动期内支付成功后到账，每笔均享</small></div>}{account.status==='guest'?<Link className="recharge-cta" href={`/account/login?returnTo=${encodeURIComponent(purchasePath(selected))}`}>登录后继续<ChevronRight size={18}/></Link>:<><p>{points.data?.summary.demo?'本地演示订单，不会发生真实扣款。':'支付服务暂不可用，请稍后再试。'}</p>{purchaseError&&<p role="alert">{purchaseError}</p>}<button className="recharge-cta" disabled={busy||!points.data?.summary.demo} onClick={()=>void purchase()}>{busy?'处理中…':points.data?.summary.demo?'确认演示购买':'支付暂不可用'}</button></>}</div></DialogShell>}
 </main>;
}

function FestivalBonus({offerId}:{offerId:string}){return <span className="membership-festival-bonus">双节活动额外赠 <b>{rechargeBonusFor(offerId)}</b> 积分</span>;}

function MemberCenter({account,returnTo}:{account:Account;returnTo:string|null}){
 const membership=account.membership;
 const benefits=[
  {icon:<Crown/>,title:'每月赠送积分',body:account.tier==='premium'?'每月赠送960积分，积分解锁享8折。':'每月赠送320积分，按需解锁精彩剧集。'},
  {icon:<BadgeCheck/>,title:'已解锁永久保留',body:'积分长期有效，可跨月累积；已解锁的剧集不会因会员到期重新锁定。'},
  {icon:<Sparkles/>,title:'专属身份标识',body:'页头与个人中心展示会员头像光环和对应会员标识。'},
  {icon:<ShieldCheck/>,title:'权益状态可查',body:'可从订单页面查看购买记录和权益处理状态。'},
 ];
 return <main className="container page member-center"><section className="member-center-hero"><div className="member-identity"><AccountAvatar tier={account.tier} hero/><div><span className="member-tier"><Crown/> {tierName(account.tier)}</span><h1>{account.nickname||account.userId}</h1><p><CalendarDays/> 有效期至 {date(membership?.expiresAt)}</p></div></div><div className="member-hero-actions"><Link className="secondary-button" href="/me/orders"><ReceiptText/> 我的订单</Link><Link className="primary-button" href={`/membership?view=plans${returnTo?`&returnTo=${encodeURIComponent(returnTo)}`:''}`}>续费会员</Link></div></section><section className="member-section"><div className="member-section-heading"><div><span className="eyebrow">MY BENEFITS</span><h2>我的会员权益</h2></div><Link className="text-button" href="/membership-guide">查看会员说明 <ArrowUpRight/></Link></div><div className="member-benefits">{benefits.map(item=><article className="surface-panel" key={item.title}>{item.icon}<h3>{item.title}</h3><p>{item.body}</p></article>)}</div></section><section className="member-section member-services"><div className="member-section-heading"><div><span className="eyebrow">MEMBER SERVICE</span><h2>会员服务</h2></div></div><div className="member-service-links"><Link className="surface-panel" href="/membership?view=points#points-topup"><Diamond/><span><strong>充值积分</strong><small>按需补充，长期有效</small></span><ArrowUpRight/></Link><Link className="surface-panel" href="/me/orders"><ReceiptText/><span><strong>订单与权益</strong><small>查看订单状态和权益记录</small></span><ArrowUpRight/></Link><Link className="surface-panel" href="/support/membership"><Headphones/><span><strong>会员帮助</strong><small>查看会员使用问题</small></span><ArrowUpRight/></Link></div></section><section id="renew" className="member-section"><div className="member-section-heading"><div><span className="eyebrow">RENEW MEMBERSHIP</span><h2>续费会员</h2><p>续费前请再次核对期限和价格。</p></div></div><div className="member-renew-grid">{plans.filter(plan=>plan.tier===account.tier).map(plan=><article className="surface-panel" key={plan.id}><div><span>{plan.duration}</span><h3>{plan.title}</h3><p>一次性购买，不自动续费</p></div><strong>¥{plan.prices.A}</strong><Link className="secondary-button" href={`/checkout?plan=${plan.id}${returnTo?`&returnTo=${encodeURIComponent(returnTo)}`:''}`}>查看方案</Link></article>)}</div></section></main>;
}
