import{useSyncExternalStore}from'react';
import{Crown}from'lucide-react';
import type{Tier}from'../types/content';
import{avatarStore}from'../state/avatar';
import{accountService}from'../services/membership';

export function AccountAvatar({tier,hero=false}:{tier:Tier;hero?:boolean}){
 const account=useSyncExternalStore(accountService.subscribe,accountService.getSnapshot),member=tier!=='free',image=useSyncExternalStore(avatarStore.subscribe,()=>avatarStore.get(account.userId),()=>null),initial=Array.from((account.nickname||account.userId||'访').trim())[0]?.toUpperCase()||'访';
 return <span className={`user-avatar user-avatar--${member?'member':'free'}${hero?' user-avatar--hero':''}`} aria-hidden="true"><span className="user-avatar-core">{image?<img className="user-avatar-image" src={image} alt=""/>:<span className="user-avatar-initial">{initial}</span>}</span>{member&&<span className="user-avatar-badge"><Crown/></span>}</span>;
}
