import {useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {Gift,Check,Zap} from 'lucide-react';
import {DialogShell} from './DialogShell';
import {pointsService,pointsError,usePoints} from '../services/points';
export function CheckInDialog({onClose}:{onClose:()=>void}){
 const points=usePoints(),[busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState(false),[reward,setReward]=useState(5),pending=useRef(false);
 async function confirm(){if(pending.current)return;pending.current=true;setBusy(true);setError('');try{const result=await pointsService.checkIn();setReward(result.reward??5);setSuccess(true);}catch(e){setError(pointsError(e));}finally{pending.current=false;setBusy(false);}}
 return createPortal(<DialogShell className="check-in-modal" title={success?(reward?'签到成功':'今日已签到'):'每日签到'} onClose={onClose} hideFooterClose><div className="points-dialog check-in-content">
 <div className="check-in-reward"><span className="check-in-symbol" aria-hidden="true">{success?<Check/>:<Gift/>}</span><span className="check-in-reward-label">{success?'今日签到奖励':'今日签到可领取'}</span><div className="check-in-amount"><Zap aria-hidden="true"/><strong>+5</strong><span>积分</span></div><span className="check-in-reward-note">每日一份小奖励，让好故事继续</span></div>
 {success?<p className="check-in-message" role="status">{reward?'积分已存入账户':'今日已领取5积分，无需重复签到'}<br/>当前积分：{points.data?.summary.balance}</p>:<><p className="check-in-message">签到后积分将直接加入你的账户余额。</p>{points.data?.summary.checkedInToday&&<p role="status">今日已领取5积分</p>}{error&&<p className="check-in-error" role="alert">{error}</p>}</>}
 <div className="points-actions check-in-actions"><button className={success?'primary-button':'secondary-button'} onClick={onClose}>{success?'完成':'取消'}</button>{!success&&<button className="primary-button" disabled={busy||points.data?.summary.checkedInToday} onClick={()=>void confirm()}>{busy?'签到中…':points.data?.summary.checkedInToday?'今日已签到':'确认签到'}</button>}</div></div></DialogShell>,document.body);
}
