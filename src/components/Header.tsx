import{Crown,Search,UserRound,X}from'lucide-react';
import{useEffect,useRef,useState,type RefObject}from'react';
import{Link,useRouter}from'../navigation/Router';
import{track}from'../services/analytics';
const navItems=[['/','首页'],['/shorts','短剧'],['/comics','漫剧'],['/rankings','排行榜'],['/18plus','18+专区'],['/me','我的']];
export function Header({query,onSearch,onSubmitSearch,onAccount,onMembership,logoRef}:{query?:string;onSearch?:(value:string,composing?:boolean)=>void;onSubmitSearch?:()=>void;onAccount:()=>void;onMembership?:()=>void;logoRef?:RefObject<HTMLImageElement|null>}){
 const{route,navigate}=useRouter(),composing=useRef(false);const[draft,setDraft]=useState(route.params.get('q')||'');
 useEffect(()=>{setDraft(route.path==='/search'?route.params.get('q')||'':'');},[route.path,route.search]);
 const privatePage=route.path.startsWith('/18plus');const value=query??draft;
 const change=(value:string,isComposing=false)=>{if(onSearch)onSearch(value,isComposing);else setDraft(value);};
 const submit=()=>{if(composing.current)return;if(onSubmitSearch)onSubmitSearch();else{track({name:'search_submit',zone:'green'});navigate(`/search?q=${encodeURIComponent(value.trim())}`);}};
 return <header className="site-header"><div className="header-inner container"><Link className="brand" href="/#home" aria-label="爱爱短剧首页"><img ref={logoRef} className="nav-logo" src="/assets/brand/logo.svg" width="1000" height="301" alt="爱爱短剧"/></Link>
 <nav aria-label="主导航">{navItems.map(([href,label])=>{const active=href==='/'?route.path==='/':route.path===href||route.path.startsWith(href+'/');return <Link key={href} href={href==='/'?'/#home':href} className={active?'nav-active':undefined} aria-current={active?'page':undefined} onClick={()=>{if(href==='/18plus')track({name:'adult_entry_click',zone:'green',sourceZone:'green'});}}>{label}</Link>;})}</nav>
 {privatePage?<div className="search-box private-search-entry"><Search size={17}/><Link href="/18plus/search">在专区内搜索</Link></div>:<form className="search-box" role="search" onSubmit={event=>{event.preventDefault();submit();}}><Search size={17} aria-hidden="true"/><input aria-label="搜索精选内容" value={value} placeholder="搜索精选短剧与漫剧" onCompositionStart={()=>{composing.current=true;change(value,true);}} onCompositionEnd={event=>{composing.current=false;change(event.currentTarget.value);}} onKeyDown={event=>{if(event.key==='Enter'&&(composing.current||event.nativeEvent.isComposing||event.nativeEvent.keyCode===229))event.preventDefault();}} onChange={event=>change(event.target.value,composing.current)}/>{value?<button type="button" className="icon-button search-clear" aria-label="清空搜索" onClick={event=>{event.preventDefault();change('');}}><X size={16}/></button>:<button className="search-submit" type="submit">搜索</button>}</form>}
 <div className="header-actions"><Link className="membership-button" href="/membership" aria-label="会员中心" onClick={onMembership}><Crown size={18}/><span>会员</span></Link><button className="account-button" aria-label="登录 / 注册" onClick={onAccount}><UserRound size={19}/><span>登录 / 注册</span></button></div></div></header>;
}
