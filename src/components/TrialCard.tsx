import {Clock3} from 'lucide-react';
import {useRef,useState,useSyncExternalStore} from 'react';
import {accountService} from '../services/membership';
import {meError,meService} from '../services/me';
import type {MeOverviewDTO} from '../services/pointsModel';

const format=(value:string)=>new Date(value).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});

export function TrialCard({trial}:{trial:MeOverviewDTO['trial']}){
 const account=useSyncExternalStore(accountService.subscribe,accountService.getSnapshot),member=account.tier!=='free',permanent=account.membership?.permanent===true;
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),pending=useRef(false);
 async function claim(){if(pending.current||trial.status!=='available')return;pending.current=true;setBusy(true);setError('');try{await meService.claimTrial();await accountService.refresh();}catch(value){setError(meError(value));}finally{pending.current=false;setBusy(false);}}
 const labels={active:member?'已领取，会员有效期增加 1 天':`体验有效至 ${trial.expiresAt?format(trial.expiresAt):''}`,claimed:'体验已领取',ineligible:'当前账号不符合领取资格',expired:'领取机会已用完',available:''};
 const available=!permanent&&trial.status==='available';
 return <section id="trial" className="me-benefit-card trial-card" aria-labelledby="trial-title">
  <header className="me-benefit-heading"><Clock3 aria-hidden="true"/><h2 id="trial-title">24 小时免费畅看</h2></header>
  <div className="me-benefit-main">{available?<><span className="me-benefit-kicker">{member?'会员有效期':'畅看体验'}</span><div className="me-benefit-metric"><strong>{member?'+1':'24'}</strong><span>{member?'天':'小时'}</span></div></>:<><span className="me-benefit-kicker">体验状态</span><strong className={`trial-status status-${trial.status}`}>{permanent?'已享永久权益':labels[trial.status]}</strong>{permanent&&<span className="me-benefit-validity">无需领取体验</span>}</>}</div>
  {available&&<button className="primary-button me-benefit-action" disabled={busy} aria-busy={busy} onClick={()=>void claim()}>{busy?'领取中…':member?'领取并增加 1 天':'立即领取 24 小时体验'}</button>}
  {error&&<p role="alert" className="me-feedback">{error}</p>}
 </section>;
}
