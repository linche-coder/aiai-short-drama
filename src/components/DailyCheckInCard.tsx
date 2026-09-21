import{Check,Gift,RotateCcw}from'lucide-react';
import{useRef,useState}from'react';
import{Link}from'../navigation/Router';
import{meError,meService}from'../services/me';
import{memberRedemptionTiers}from'../services/memberRedemption';
import type{MeOverviewDTO}from'../services/pointsModel';
import{MemberRedemption}from'./MemberRedemption';

export function DailyCheckInCard({data,legacyMember=false}:{data:MeOverviewDTO;legacyMember?:boolean}){
 const[busy,setBusy]=useState(false),[message,setMessage]=useState(''),pending=useRef(false);
 const member=data.checkIn.paidViewActive===true,memberBalance=data.memberCredits?.balance??0;
 const checkIn=async()=>{if(pending.current||data.checkIn.checkedInToday)return;pending.current=true;setBusy(true);setMessage('');try{await meService.checkIn();}catch(error){setMessage(meError(error));}finally{pending.current=false;setBusy(false);}};
 if(data.checkIn.permanentMember)return <section id="daily-check-in" className="daily-check-in-card permanent-check-in-card" aria-labelledby="daily-check-in-title"><header><div><h2 id="daily-check-in-title">永久畅看已生效</h2><p className="check-in-mode">权益没有到期日，观看不扣积分。当前无需兑换畅看天数。</p></div></header><div className="permanent-check-in-status"><Gift size={22}/><span>永久会员签到奖励尚待确定；现在不会发放只能兑换时长的新会员积分。</span></div><p className="permanent-history">既有会员积分 {memberBalance.toLocaleString('zh-CN')} 分已保留，可在<Link href="/me/points?tab=member">会员积分记录</Link>中查看。</p></section>;
 return <section id="daily-check-in" className={`daily-check-in-card ${member?'member-check-in-card':'ordinary-check-in-card'}`} aria-labelledby="daily-check-in-title">
  <header><div><h2 id="daily-check-in-title">{member?'每日签到领会员积分':'每日签到，攒积分追好剧'}</h2>{!member&&legacyMember?<p className="check-in-mode">当前为历史积分制权益，签到仍领取永久积分；开通有效畅看套餐后才切换为会员积分。</p>:null}</div></header>
  {member?<div className="member-check-in-highlight"><Gift size={22}/><strong>今日签到 +1 会员积分</strong></div>:<ol className="check-in-week" aria-label="七日签到奖励">{data.checkIn.rewards.map(item=><li key={item.day} className={`reward-${item.status}`} aria-current={item.status==='today'?'step':undefined}><span>第 {item.day} 天</span><strong>+{item.points}</strong><small>{item.status==='claimed'?<><Check/>已领取</>:item.status==='today'?'今日':'永久积分'}</small></li>)}</ol>}
  <div className="check-in-actions-row"><button className="primary-button" disabled={busy||data.checkIn.checkedInToday} aria-busy={busy} onClick={()=>void checkIn()}>{busy?'签到中…':data.checkIn.checkedInToday?'今日已签到，明天再来':<><Gift/>立即签到</>}</button></div>
  {message&&<p className="me-feedback" role="alert">{message}<button className="text-button" onClick={()=>void checkIn()}><RotateCcw/>重试</button></p>}
  {member||memberBalance>0?<MemberRedemption compact/>:<div className="check-in-member-preview"><p>开通畅看会员后，每日签到可得 1 会员积分；会员积分可兑换额外畅看时长。</p><div className="check-in-preview-bottom"><span>{memberRedemptionTiers.map(tier=>`${tier.cost} 分兑 ${tier.days} 天`).join(' / ')}</span><Link href="/membership#festival-recharge">查看畅看方案 →</Link></div></div>}
 </section>;
}
