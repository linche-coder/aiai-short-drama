import{useSyncExternalStore}from'react';
import type{Tier}from'../types/content';
import{avatarStore}from'../state/avatar';
import{accountService}from'../services/membership';

function MembershipBadge({tier}:{tier:Tier}){
 return <span className={`user-avatar-badge user-avatar-badge--${tier}`}><svg viewBox="0 0 32 32" fill="none" focusable="false">
  <path d="M16 1.5 29 9v14L16 30.5 3 23V9Z" fill={tier==='premium'?'#102c3b':'#321735'} stroke={tier==='premium'?'#63dce6':'#df82cc'} strokeWidth="1.2"/>
  {tier==='premium'?<>
   <path d="m7 12 5-6h8l5 6-9 13Z" fill="#41d9e6" stroke="#b3ffff" strokeLinejoin="round"/>
   <path d="m7 12 9 13-4-13Zm18 0-9 13 4-13Z" fill="#198cbd"/>
   <path d="m12 12 4-6 4 6Z" fill="#ecffff"/><path d="m12 12 4 13 4-13Z" fill="#8ff9fb"/>
  </>:<>
   <path d="m6 11 6 4 4-9 4 9 6-4-3 12H9Z" fill="#ec74cc" stroke="#ffd5f5" strokeWidth="1.1" strokeLinejoin="round"/>
   <path d="m6 11 6 4 4 8H9Zm20 0-6 4-4 8h7Z" fill="#b94cc0"/>
   <path d="m16 11 3 6-3 4-3-4Z" fill="#77399f" stroke="#ffccf2" strokeWidth=".8"/>
   <path d="M10 25h12" stroke="#ffaceb" strokeWidth="1.5" strokeLinecap="round"/>
  </>}
 </svg></span>;
}

export function AccountAvatar({tier,hero=false}:{tier:Tier;hero?:boolean}){
 const account=useSyncExternalStore(accountService.subscribe,accountService.getSnapshot),member=tier!=='free',image=useSyncExternalStore(avatarStore.subscribe,()=>avatarStore.get(account.userId),()=>null),initial=Array.from((account.nickname||account.userId||'访').trim())[0]?.toUpperCase()||'访';
 return <span className={`user-avatar user-avatar--${member?'member':'free'}${hero?' user-avatar--hero':''}`} aria-hidden="true"><span className="user-avatar-core">{image?<img className="user-avatar-image" src={image} alt=""/>:<span className="user-avatar-initial">{initial}</span>}</span>{member&&<MembershipBadge tier={tier}/>}</span>;
}
