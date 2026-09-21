import{useRef,useState,useSyncExternalStore}from'react';
import{ArrowRight,Clock3,Gift}from'lucide-react';
import{Link}from'../navigation/Router';
import{accountService}from'../services/membership';
import{meService}from'../services/me';
import{pointsError,pointsService,usePoints}from'../services/points';
import{memberRedemptionTiers,type MemberRedemptionId}from'../services/memberRedemption';
import{DialogShell}from'./DialogShell';
import'../styles/member-redemption.css';

const formatTime=(value:string|null)=>value?new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value)):'当前没有有效畅看时长';

export function MemberRedemption({compact=false}:{compact?:boolean}){
 const account=useSyncExternalStore(accountService.subscribe,accountService.getSnapshot),points=usePoints();
 const [selected,setSelected]=useState<MemberRedemptionId|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState('');
 const key=useRef(crypto.randomUUID()),pending=useRef(false);
 const ready=account.status==='authenticated'&&points.userId===account.userId&&!points.loading&&!points.error&&!!points.data;
 const balance=ready?points.data!.summary.memberBalance??0:0,expiry=ready?points.data!.summary.membershipExpiresAt??null:null;
 const paidViewActive=ready&&points.data!.summary.paidViewActive===true;
 if(account.membership?.permanent||ready&&points.data!.summary.permanentMember)return <section className="member-redemption"><h2>会员积分记录</h2><p>永久会员无需兑换畅看时长，既有会员积分余额与交易记录均已保留。</p><Link href="/me/points?tab=member">查看历史记录 <ArrowRight size={15}/></Link></section>;
 const selectedTier=memberRedemptionTiers.find(item=>item.id===selected),base=Math.max(Date.now(),Date.parse(expiry||'')||0),estimate=selectedTier?new Date(base+selectedTier.hours*3600000).toISOString():null;
 const choose=(id:MemberRedemptionId)=>{key.current=crypto.randomUUID();setSelected(id);setError('');setSuccess('');};
 async function confirm(){if(!selectedTier||!ready||balance<selectedTier.cost||pending.current)return;pending.current=true;setBusy(true);setError('');try{const result=await pointsService.redeemMember(selectedTier.id,key.current);await meService.refresh();const transaction=result.memberTransactions.find(item=>item.idempotencyKey===key.current);setSuccess(`已扣除 ${selectedTier.cost} 会员积分，剩余 ${result.summary.memberBalance} 分；畅看到期时间：${formatTime(transaction?.expiresAfter??result.summary.membershipExpiresAt)}。`);setSelected(null);}catch(cause){setError(pointsError(cause));await pointsService.refresh();}finally{pending.current=false;setBusy(false);}}
 const tiers=<div className="member-redemption-tiers">{memberRedemptionTiers.map(tier=><article key={tier.id}><span className="member-redemption-duration">畅看 <strong>{tier.days} 天</strong></span><span>消耗 <strong>{tier.cost}</strong> 会员积分</span>{!ready?<span className="member-redemption-shortfall">登录后查看</span>:balance<tier.cost?<span className="member-redemption-shortfall">还差 {tier.cost-balance} 分</span>:<button type="button" onClick={()=>choose(tier.id)}>兑换 {tier.days} 天 <ArrowRight size={16}/></button>}</article>)}</div>;
 return <section id={compact?undefined:'member-redemption'} className={`member-redemption ${compact?'member-redemption-compact':''}`} aria-labelledby={compact?'check-in-redemption-title':'member-redemption-title'}>
  {compact?<><div className="member-redemption-compact-heading"><div className="member-redemption-compact-title"><h3 id="check-in-redemption-title">会员积分兑换畅看时长</h3><span>余额 <strong aria-live="polite">{!ready?points.error?'暂时无法获取':'加载中…':balance.toLocaleString('zh-CN')} 会员积分</strong></span></div><Link href="/me/points?tab=member">查看会员积分明细 <ArrowRight size={15}/></Link></div>{!paidViewActive&&<p className="member-redemption-compact-note">已有会员积分仍可手动兑换；当前签到领取永久积分。</p>}{tiers}</>:<><div className="member-redemption-heading"><div><h2 id="member-redemption-title"><Clock3 size={25}/> 会员积分兑换时长</h2><p>有效付费畅看会员每日签到可得 1 会员积分；积分与永久积分分账，不会自动兑换。兑换后按连续 24 小时计时。</p></div><div className="member-redemption-balance"><span>会员积分余额</span><strong aria-live="polite">{account.status==='guest'?'登录后查看':!ready?points.error?'暂时无法获取':'加载中…':balance.toLocaleString('zh-CN')}</strong><small>仅用于兑换畅看时长</small></div></div>{tiers}<div className="member-redemption-footer"><span><Gift size={16}/>{paidViewActive?'每日签到积攒会员积分；到期后余额仍保留。':balance>0?'已有会员积分仍可兑换；当前签到不获得会员积分。':'开通有效畅看套餐后，签到可得会员积分。'}</span><Link href={paidViewActive?'/me#daily-check-in':'/membership#festival-recharge'}>{paidViewActive?'前往签到':'查看畅看方案'} <ArrowRight size={15}/></Link></div></>}
  {success&&<p className="member-redemption-success" role="status">{success}</p>}
  {selectedTier&&<DialogShell title={`兑换畅看 ${selectedTier.days} 天`} onClose={()=>!busy&&setSelected(null)} hideFooterClose><div className="member-redemption-confirm"><p>请确认本次手动兑换：</p><dl><div><dt>兑换档位</dt><dd>{selectedTier.cost} 会员积分 → 畅看 {selectedTier.days} 天（{selectedTier.hours} 小时）</dd></div><div><dt>兑换后余额</dt><dd>{Math.max(0,balance-selectedTier.cost)} 会员积分</dd></div><div><dt>当前到期</dt><dd>{formatTime(expiry)}</dd></div><div><dt>预计新到期</dt><dd>{formatTime(estimate)} <small>以服务端兑换时间为准</small></dd></div></dl>{error&&<p role="alert">{error}</p>}<div className="member-redemption-confirm-actions"><button className="secondary-button" disabled={busy} onClick={()=>setSelected(null)}>取消</button><button className="primary-button" disabled={busy||!ready||balance<selectedTier.cost} onClick={()=>void confirm()}>{busy?'兑换中…':'确认扣分并兑换'}</button></div></div></DialogShell>}
 </section>;
}
