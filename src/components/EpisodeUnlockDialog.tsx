import {useRef,useState} from 'react';
import {DialogShell} from './DialogShell';
import {Link} from '../navigation/Router';
import {pointsService,usePoints,pointsError} from '../services/points';
import {discountedCost} from '../services/pointsModel';
import {accountService} from '../services/membership';
export function EpisodeUnlockDialog({contentId,episodeId,title,price,returnTo,onClose,onUnlocked}:{contentId:string;episodeId:string;title:string;price:number;returnTo:string;onClose:()=>void;onUnlocked:()=>void}){
 const state=usePoints(),summary=state.data?.summary,[busy,setBusy]=useState(false),[error,setError]=useState(''),key=useRef(crypto.randomUUID()),pending=useRef(false),guest=accountService.getSnapshot().status==='guest';
 const cost=summary?.trialActive?0:summary?discountedCost(price,summary.tier):price,insufficient=!!summary&&summary.balance<cost;
 async function confirm(){if(pending.current)return;pending.current=true;setBusy(true);setError('');try{await pointsService.unlockEpisode(contentId,episodeId,key.current,cost);onUnlocked();}catch(e){setError(pointsError(e));}finally{pending.current=false;setBusy(false);}}
 return <DialogShell title={insufficient?'积分不足':`解锁${title}`} onClose={onClose} hideFooterClose><div className="points-dialog">
 {guest?<p>登录后可使用积分解锁本集。</p>:state.error?<p role="alert">{state.error}</p>:!summary?<p role="status">正在加载积分…</p>:<><p>{summary.trialActive?<>24 小时免费体验生效中，本集观看不扣积分。</>:summary.tier!=='free'?<>会员有效期内观看不扣积分。</>:<>本集需要 {cost} 积分</>}<br/>当前积分：{summary.balance}{insufficient&&<>，还差{cost-summary.balance}积分</>}{summary.tier==='free'&&!summary.trialActive&&<><br/>解锁后可永久观看</>}</p></>}
 {error&&<p role="alert">{error}</p>}<div className="points-actions"><button className="secondary-button" onClick={onClose}>暂不解锁</button>{guest?<Link className="primary-button" href={`/account/login?returnTo=${encodeURIComponent(returnTo)}`}>登录 / 注册</Link>:insufficient?<Link className="primary-button" href={`/membership?${summary?.tier==='free'?'view=plans':'view=points'}&returnTo=${encodeURIComponent(returnTo)}${summary?.tier==='free'?'':'#points-topup'}`}>{summary?.tier==='free'?'开通会员':'充值积分'}</Link>:state.error?<button className="primary-button" onClick={()=>void pointsService.refresh()}>重试</button>:<button className="primary-button" disabled={!summary||busy} onClick={()=>void confirm()}>{busy?'解锁中…':'确认解锁'}</button>}</div></div></DialogShell>;
}
