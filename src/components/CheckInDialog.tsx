import {useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {Gift,Check,Zap} from 'lucide-react';
import {DialogShell} from './DialogShell';
import {pointsService,pointsError,usePoints} from '../services/points';
export function CheckInDialog({onClose}:{onClose:()=>void}){
 const points=usePoints(),[busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState(false),[reward,setReward]=useState<number|null>(null),[rewardType,setRewardType]=useState<'permanent'|'member'|null>(null),pending=useRef(false);
 async function confirm(){if(pending.current)return;pending.current=true;setBusy(true);setError('');try{const result=await pointsService.checkIn();setReward(result.checkInResult?.amount??0);setRewardType(result.checkInResult?.type??null);setSuccess(true);}catch(e){setError(pointsError(e));}finally{pending.current=false;setBusy(false);}}
 return createPortal(<DialogShell className="check-in-modal" title={success?(reward?'签到成功':'今日已签到'):'每日签到'} onClose={onClose} hideFooterClose><div className="points-dialog check-in-content">
 <div className="check-in-reward"><span className="check-in-symbol" aria-hidden="true">{success?<Check/>:<Gift/>}</span><span className="check-in-reward-label">{success?'今日签到奖励':points.data?.summary.paidViewActive?'会员每日签到奖励':'七日周期签到奖励'}</span><div className="check-in-amount"><Zap aria-hidden="true"/><strong>{reward===null?points.data?.summary.paidViewActive?'1':'1–4':`+${reward}`}</strong><span>{rewardType==='member'||rewardType===null&&points.data?.summary.paidViewActive?'会员积分':'永久积分'}</span></div><span className="check-in-reward-note">{points.data?.summary.paidViewActive?'有效付费畅看会员每天固定获得 1 会员积分':'第 1–6 天各 1 永久积分，第 7 天 4 永久积分'}</span></div>
 {success?<p className="check-in-message" role="status">{reward?`${rewardType==='member'?'会员积分':'永久积分'}已存入账户`:'今日已签到，无需重复领取'}<br/>永久积分：{points.data?.summary.balance} · 会员积分：{points.data?.summary.memberBalance}</p>:<><p className="check-in-message">服务端根据签到时的付费畅看资格，决定奖励会员积分或永久积分。</p>{points.data?.summary.checkedInToday&&<p role="status">今日已签到</p>}{error&&<p className="check-in-error" role="alert">{error}</p>}</>}
 <div className="points-actions check-in-actions"><button className={success?'primary-button':'secondary-button'} onClick={onClose}>{success?'完成':'取消'}</button>{!success&&<button className="primary-button" disabled={busy||points.data?.summary.checkedInToday} onClick={()=>void confirm()}>{busy?'签到中…':points.data?.summary.checkedInToday?'今日已签到':'确认签到'}</button>}</div></div></DialogShell>,document.body);
}
