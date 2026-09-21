import{useSyncExternalStore}from'react';
import type{Tier}from'../types/content';
import{avatarStore}from'../state/avatar';
import{accountService}from'../services/membership';

type BadgeLevel='month'|'quarter'|'forever';
function MembershipBadge({level}:{level:BadgeLevel}){
 return <span className={`user-avatar-badge user-avatar-badge--${level}`} data-level={level}><svg viewBox="0 0 32 32" fill="none" focusable="false">
  <path d="M16 2 28 9v14L16 30 4 23V9Z" fill="#171924" stroke="currentColor" strokeWidth="1.5"/>
  {level==='month'?<><circle cx="16" cy="16" r="8" stroke="currentColor" strokeWidth="1.5"/><path d="m13 10 9 6-9 6Z" fill="currentColor"/></>:null}
  {level==='quarter'?<><path d="m7 12 5 4 4-8 4 8 5-4-2 12H9Z" fill="currentColor" fillOpacity=".65" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.2"/><path d="M10 21h12" stroke="#fff2fa" strokeWidth="1.4"/></>:null}
  {level==='forever'?<><path d="M9 9h14l5 7-12 12L4 16Z" fill="currentColor" fillOpacity=".55" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.2"/><path d="M4 16h24M9 9l7 19 7-19" stroke="#eaffff" strokeWidth="1"/></>:null}
 </svg></span>;
}

export function AccountAvatar({tier,hero=false}:{tier:Tier;hero?:boolean}){
 const account=useSyncExternalStore(accountService.subscribe,accountService.getSnapshot),member=tier!=='free',level:BadgeLevel=account.membership?.permanent?'forever':tier==='basic'?'month':'quarter',image=useSyncExternalStore(avatarStore.subscribe,()=>avatarStore.get(account.userId),()=>null),initial=Array.from((account.nickname||account.userId||'访').trim())[0]?.toUpperCase()||'访';
 return <span className={`user-avatar user-avatar--${member?'member':'free'}${member?` user-avatar--${level}`:''}${hero?' user-avatar--hero':''}`} aria-hidden="true"><span className="user-avatar-core">{image?<img className="user-avatar-image" src={image} alt=""/>:<span className="user-avatar-initial">{initial}</span>}</span>{member&&<MembershipBadge level={level}/>}</span>;
}
