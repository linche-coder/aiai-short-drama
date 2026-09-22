import {captureFestivalReferral} from '../services/festivalReferral';
﻿import{createContext,useCallback,useContext,useLayoutEffect,useState}from'react';
import type{AnchorHTMLAttributes,MouseEvent,ReactNode}from'react';
import{cancelResultsTransition}from'../motion/transitions';
import{readHomeState,saveHomeState}from'./homeState';
import type{HomeState}from'./homeState';
import type{Content}from'../types/content';
import{trustedPath}from'../services/rules';
import{track}from'../services/analytics';
import{accessService}from'../services/access';
const privateScroll=new Map<string,number>();
accessService.subscribe(()=>{if(!accessService.isGranted())privateScroll.clear();});
export type Route={path:string;search:string;params:URLSearchParams;hash:string;key:number;restore:boolean;scroll:number};
type Entry={aiai?:{scroll:number;restore:boolean;home?:HomeState;privateId?:string};playOrigin?:string;adultOrigin?:string};
type Options={restore?:boolean;replace?:boolean;preserveScroll?:boolean};
const RouterContext=createContext<{route:Route;navigate:(to:string,options?:boolean|Options)=>void;replaceHash:(hash:string)=>void}>(null!);
const read=():Route=>({path:location.pathname,search:location.search,params:new URLSearchParams(location.search),hash:location.hash,key:performance.now(),restore:(history.state as Entry)?.aiai?.restore??false,scroll:location.pathname.startsWith('/18plus')?(privateScroll.get((history.state as Entry)?.aiai?.privateId||'')??0):((history.state as Entry)?.aiai?.scroll??0)});
const isPrivate=(path:string)=>path.startsWith('/18plus');
function storeScroll(){if(isPrivate(location.pathname)&&accessService.isGranted()){const privateId=(history.state as Entry)?.aiai?.privateId||crypto.randomUUID();privateScroll.set(privateId,scrollY);history.replaceState({...history.state,aiai:{scroll:0,restore:true,privateId}},'');return;}const home=!isPrivate(location.pathname)?readHomeState(location.pathname):undefined;history.replaceState({...history.state,aiai:{scroll:isPrivate(location.pathname)?0:scrollY,restore:true,...(home?{home:{...home,scroll:scrollY,hash:location.hash}}:{})}},'');}
export function Router({children}:{children:ReactNode}){
 const[route,setRoute]=useState(read);
 useLayoutEffect(()=>{const previous=history.scrollRestoration;history.scrollRestoration='manual';const pop=()=>{cancelResultsTransition();const entry=(history.state as Entry)?.aiai;if(entry?.home&&!isPrivate(location.pathname))saveHomeState(entry.home,location.pathname);setRoute({...read(),restore:!!entry});};const scroll=()=>storeScroll();window.addEventListener('popstate',pop);window.addEventListener('scroll',scroll,{passive:true});return()=>{history.scrollRestoration=previous;window.removeEventListener('popstate',pop);window.removeEventListener('scroll',scroll);};},[]);
 useLayoutEffect(()=>{
  if(isPrivate(route.path)){if(!route.restore)window.scrollTo({top:0,behavior:'instant'});return;}
  if(route.restore)window.scrollTo({top:route.scroll,behavior:'instant'});
  else if(route.hash){let id=route.hash.slice(1);try{id=decodeURIComponent(id);}catch{/* invalid anchor */}document.getElementById(id)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
  else window.scrollTo({top:0,behavior:'instant'});
 },[route.key]);
 const replaceHash=useCallback((hash:string)=>{if(location.pathname!=='/')return;saveHomeState({hash});history.replaceState(history.state,'',location.pathname+location.search+hash);storeScroll();setRoute(previous=>previous.hash===hash?previous:{...previous,hash});},[]);
 const navigate=(to:string,raw:boolean|Options=false)=>{
  const options=typeof raw==='boolean'?{restore:raw}:raw;
  const url=new URL(trustedPath(to),location.origin);captureFestivalReferral(url.searchParams.get('invite'));storeScroll();if(!isPrivate(location.pathname))saveHomeState({scroll:scrollY},location.pathname);cancelResultsTransition();
  const saved=readHomeState(url.pathname);if(url.pathname==='/'&&!options.restore&&!options.preserveScroll){saveHomeState({query:'',genre:'全部',scroll:0,hash:url.hash||'#home'});}
  if(options.restore&&url.pathname==='/')url.hash=saved.hash;
  const scroll=options.preserveScroll?scrollY:options.restore?saved.scroll:0;
  const source=location.pathname+location.search+location.hash;const isList=/^\/(?:$|shorts$|comics$|search$|me$|18plus(?:$|\/search$|\/wishlist$))/.test(location.pathname);
  const entry={...(url.pathname==='/18plus/wishlist'&&isPrivate(location.pathname)?{adultOrigin:source}:{}),...(/^\/(?:18plus\/)?play\//.test(url.pathname)&&isList?{playOrigin:source}:{}),aiai:{...(isPrivate(url.pathname)?{privateId:crypto.randomUUID()}:{}),scroll:isPrivate(url.pathname)?0:scroll,restore:!!options.restore||!!options.preserveScroll,...(!isPrivate(url.pathname)?{home:readHomeState(url.pathname)}:{})}};
  if(isPrivate(url.pathname)&&entry.aiai.privateId)privateScroll.set(entry.aiai.privateId,options.preserveScroll?scrollY:0);
  if(isPrivate(location.pathname)&&!isPrivate(url.pathname))privateScroll.clear();
  history[options.replace?'replaceState':'pushState'](entry,'',url.pathname+url.search+url.hash);setRoute(read());
 };
 useLayoutEffect(()=>{track({name:'page_view',zone:isPrivate(route.path)?'adult':'green',route:route.path},`page:${route.key}`);},[route.key,route.path]);
 return <RouterContext.Provider value={{route,navigate,replaceHash}}>{children}</RouterContext.Provider>;
}
export const useRouter=()=>useContext(RouterContext);
export function RouteView({url,routeKey,children}:{url:string;routeKey?:number;children:ReactNode}){
 const parent=useRouter(),parsed=new URL(trustedPath(url),location.origin),route:Route={path:parsed.pathname,search:parsed.search,params:parsed.searchParams,hash:parsed.hash,key:routeKey??parent.route.key,restore:parent.route.path===parsed.pathname?parent.route.restore:true,scroll:parent.route.scroll};
 return <RouterContext.Provider value={{...parent,route}}>{children}</RouterContext.Provider>;
}
export function Link({href,restoreHome=false,onClick,...props}:AnchorHTMLAttributes<HTMLAnchorElement>&{href:string;restoreHome?:boolean}){
 const{navigate}=useRouter();const click=(event:MouseEvent<HTMLAnchorElement>)=>{onClick?.(event);if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||props.target&&props.target!=='_self'||props.download!==undefined)return;const url=new URL(href,location.href);if(url.origin!==location.origin)return;event.preventDefault();navigate(url.pathname+url.search+url.hash,restoreHome);};return <a {...props} href={href} onClick={click}/>;
}
export const dramaHref=(id:string)=>`/play/${encodeURIComponent(id)}`;
export const contentHref=(item:Content)=>item.content_zone==='adult'?`/18plus/play/${encodeURIComponent(item.id)}`:item.format==='article'?`/read/${encodeURIComponent(item.id)}`:dramaHref(item.id);
