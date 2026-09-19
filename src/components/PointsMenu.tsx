import {useEffect,useRef,useState} from 'react';
import {Zap,Gift,ChevronRight} from 'lucide-react';
import {Link,useRouter} from '../navigation/Router';
import {pointsService,usePoints} from '../services/points';
import {pointsTierName,formatPoints} from '../services/pointsModel';
import {CheckInDialog} from './CheckInDialog';
export function PointsMenu(){
 const points=usePoints(),summary=points.data?.summary,{route}=useRouter(),[open,setOpen]=useState(false),[checkIn,setCheckIn]=useState(false),root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null),pinned=useRef(false),pointer=useRef(false);
 const cancel=()=>{if(timer.current)clearTimeout(timer.current);};
 const close=()=>{cancel();pinned.current=false;setOpen(false);};
 useEffect(()=>{close();setCheckIn(false);},[route.path,route.search]);
 useEffect(()=>{const outside=(e:PointerEvent)=>{if(!root.current?.contains(e.target as Node))close();};const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'&&open&&!checkIn){e.preventDefault();close();trigger.current?.focus();setOpen(false);}};document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);return()=>{cancel();document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};},[open,checkIn]);
 const label=summary?`剩余积分${summary.balance}，打开积分菜单`:points.error?'积分加载失败，打开积分菜单':'正在加载积分，打开积分菜单';
 return <><div ref={root} className="points-menu" onPointerEnter={e=>{if(e.pointerType==='mouse'){cancel();setOpen(true);}}} onPointerLeave={e=>{if(e.pointerType==='mouse'&&!pinned.current)timer.current=setTimeout(()=>{if(!root.current?.contains(document.activeElement))setOpen(false);},180);}} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget)){close();}}}>
 <button ref={trigger} className="points-trigger" aria-label={label} aria-expanded={open} aria-controls="points-popover" onPointerDown={()=>{pointer.current=true;}} onFocus={()=>{if(!pointer.current)setOpen(true);}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pinned.current=true;setOpen(true);}}} onClick={()=>{pointer.current=false;if(pinned.current){close();}else{pinned.current=true;cancel();setOpen(true);}}}><Zap size={17}/><span>{summary?formatPoints(summary.balance):points.error?'!':'…'}</span></button>
 <div id="points-popover" className={`points-popover ${open?'is-open':''}`} inert={!open} aria-hidden={!open} role="region" aria-label="积分账户">
 {points.error?<div role="alert"><p>{points.error}</p><button className="text-button" onClick={()=>void pointsService.refresh()}>重新加载积分</button></div>:!summary?<p role="status">积分加载中…</p>:<><div className="points-row points-tier"><strong>{pointsTierName[summary.tier]}</strong><Link className="points-action" href={summary.tier==='free'?'/membership':'/membership?view=points#points-topup'}>{summary.tier==='free'?'开通会员':'充值'}</Link></div><div className="points-row"><Zap/><span>剩余积分</span><strong className="points-number">{summary.balance}</strong></div><div className="points-row"><Gift/><div className="points-check-copy"><span>每日签到</span><small>{summary.checkedInToday?'今日已领取5积分':'每日可领取5积分'}</small></div><button className="points-action" aria-label={summary.checkedInToday?'今日已签到':'去签到'} disabled={summary.checkedInToday} onClick={()=>{close();setCheckIn(true);}}>{summary.checkedInToday?'已签到':'去签到'}</button></div><Link className="points-details" href="/me/points">使用详情<ChevronRight size={17}/></Link></>}
 </div></div>{checkIn&&<CheckInDialog onClose={()=>{setCheckIn(false);trigger.current?.focus();}}/>}</>;
}
