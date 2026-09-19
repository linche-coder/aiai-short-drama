import {PointsMenu} from './PointsMenu';
import {HeaderSearch} from './HeaderSearch';
import{Crown,UserRound}from'lucide-react';
import{useEffect,useState,useSyncExternalStore,type ReactNode,type RefObject}from'react';
import{Link,useRouter}from'../navigation/Router';
import{track}from'../services/analytics';
import{accountService}from'../services/membership';
import{AccountAvatar}from'./AccountAvatar';
const navItems=[['/','首页'],['/shorts','短剧'],['/comics','漫剧'],['/rankings','排行榜'],['/18plus','18+专区'],['/me','我的']] as const;
export function Header({query,onSearch,onSubmitSearch,onAccount,onMembership,logoRef,navigation=navItems,isActive,extraActions,brandBadge}:{query?:string;onSearch?:(value:string,composing?:boolean)=>void;onSubmitSearch?:()=>void;onAccount:()=>void;onMembership?:()=>void;logoRef?:RefObject<HTMLImageElement|null>;navigation?:readonly (readonly [string,string])[];isActive?:(href:string)=>boolean;extraActions?:ReactNode;brandBadge?:ReactNode}){
 const{route,navigate}=useRouter(),account=useSyncExternalStore(accountService.subscribe,accountService.getSnapshot);const[draft,setDraft]=useState(route.params.get('q')||'');
 useEffect(()=>{setDraft(route.path==='/search'?route.params.get('q')||'':'');},[route.path,route.search]);
 const value=query??draft;
 const change=(value:string,isComposing=false)=>{if(onSearch)onSearch(value,isComposing);else setDraft(value);};
 const submit=()=>{if(onSubmitSearch)onSubmitSearch();else{track({name:'search_submit',zone:'green'});navigate(`/search?q=${encodeURIComponent(value.trim())}`);}};
 return <header className="site-header"><div className="header-inner container">{brandBadge?<div className="brand brand-with-zone"><Link href="/#home" aria-label="爱爱短剧首页"><img ref={logoRef} className="nav-logo" src="/assets/brand/logo.svg" width="1000" height="301" alt="爱爱短剧"/></Link><Link className="brand-zone-link" href="/18plus" aria-label="18+专区首页">{brandBadge}</Link></div>:<Link className="brand" href="/#home" aria-label="爱爱短剧首页"><img ref={logoRef} className="nav-logo" src="/assets/brand/logo.svg" width="1000" height="301" alt="爱爱短剧"/></Link>}
 <nav aria-label="主导航">{navigation.map(([href,label])=>{const active=isActive?isActive(href):href==='/'?route.path==='/':route.path===href||route.path.startsWith(href+'/');return <Link key={href} href={href==='/'?'/#home':href} className={active?'nav-active':undefined} aria-current={active?'page':undefined} onClick={()=>{if(href==='/18plus')track({name:'adult_entry_click',zone:'green',sourceZone:'green'});}}>{label}</Link>;})}</nav>
 <HeaderSearch value={value} onChange={change} onSubmit={submit}/>
 <div className="header-actions"><Link className="festival-header-link" href="/festival" aria-label="双节福利"><img className="festival-header-art" src="/assets/festival/moon-gift.png" alt=""/><span className="festival-header-copy">双节福利<small>最高领120积分</small></span></Link>{extraActions}{account.status==='authenticated'&&<PointsMenu/>}<Link className="membership-button" href="/membership" aria-label="会员中心" onClick={onMembership}><Crown size={18}/><span>会员中心</span></Link>{account.status==='guest'?<button className="account-button" aria-label="登录 / 注册" onClick={onAccount}><UserRound size={19}/><span>登录 / 注册</span></button>:<Link className="account-avatar-link" aria-label={`进入我的，${account.tier==='free'?'免费用户':account.tier==='basic'?'悦享会员':'尊享会员'}`} title={account.tier==='free'?'免费用户':account.tier==='basic'?'悦享会员':'尊享会员'} href="/me"><AccountAvatar tier={account.tier}/></Link>}</div></div></header>;
}
