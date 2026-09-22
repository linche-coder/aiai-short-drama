import {festivalAccessibleLabel,festivalEntryLabel} from '../services/festivalModel';
import {FestivalArtwork,festivalAssets} from '../components/FestivalArtwork';
import {adultBanners} from '../data/adultBanners';
import {Link} from '../navigation/Router';
﻿import {useEffect,useState} from 'react';
import {ChevronLeft,ChevronRight,Play} from 'lucide-react';
import {useReducedMotion} from '../hooks/useReducedMotion';
import {EmptyState} from '../components/content/PageParts';

// The activity artwork stays first; the remaining slides use the supplied covers.
const items=[{id:'festival',title:festivalEntryLabel,genre:'节日活动',synopsis:'',image:festivalAssets.desktop,focus:'center'},...adultBanners];
export function AdultHero() {
 const [index,setIndex]=useState(0),[hover,setHover]=useState(false),[focus,setFocus]=useState(false),[hidden,setHidden]=useState(document.hidden),[modal,setModal]=useState(false),[failed,setFailed]=useState<string|null>(null);
 const reduced=useReducedMotion(),paused=hover||focus||hidden||modal||reduced;
 const position=index%Math.max(items.length,1),item=items[position];
 const visibleStart=Math.min(Math.max(position-1,0),Math.max(items.length-4,0));
 const visibleItems=items.slice(visibleStart,visibleStart+4);
 useEffect(()=>{const change=()=>setHidden(document.hidden);document.addEventListener('visibilitychange',change);const observer=new MutationObserver(()=>setModal(!!document.querySelector('dialog[open]')));observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open']});return()=>{document.removeEventListener('visibilitychange',change);observer.disconnect();};},[]);
 useEffect(()=>{if(paused||items.length<2)return;const timer=setInterval(()=>setIndex(i=>(i+1)%items.length),6000);return()=>clearInterval(timer);},[paused,items.length,index]);
 const move=(delta:number)=>setIndex(i=>(i+delta+items.length)%items.length);
 if(!item)return <section className="container adult-hero-empty"><EmptyState title="故事正在准备中" description="新作品准备好后，将在这里与你见面。"/></section>;
 return <section className={`adult-cinema adult-cinema-artwork ${item.id==='festival'?'adult-festival-slide':'adult-cover-slide'}`} aria-label="重点推荐" aria-roledescription="轮播" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onFocusCapture={()=>setFocus(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setFocus(false);}}>
  {item.id==='festival'?<div className="adult-festival-art"><FestivalArtwork compact/></div>:<div className="adult-cinema-art" key={item.id}  aria-hidden="true">
   {failed!==item.id&&<><div className="adult-cinema-extension" style={{backgroundImage:`url("${item.image}")`}}/><img className="adult-cinema-subject" src={item.image} alt="" onError={()=>setFailed(item.id)} fetchPriority="high" decoding="async"/></>}
  </div>
  }<div className="adult-cinema-shade"/>
  <div className="container adult-cinema-content">
   {item.id==='festival'?<Link aria-label={festivalAccessibleLabel} className="primary-button adult-festival-cta" href="/festival">去领双节好礼<ChevronRight size={18}/></Link>:<div className="adult-cinema-copy" key={item.id}><span className="adult-eyebrow">今夜精选 · {item.genre}</span><h1>{item.title}</h1><p>{item.synopsis||'剧情简介待补充。'}</p><span className="adult-cinema-status">集数待定</span><Link className="primary-button" href={`/18plus/play/${item.id}`}><Play size={18} fill="currentColor"/>立即播放</Link></div>}
   {items.length>1&&<div className="adult-cinema-picker">
    <div className="adult-cinema-navigation"><button className="adult-cinema-arrow" aria-label="上一部" onClick={()=>move(-1)}><ChevronLeft size={22}/></button><div className="adult-cinema-thumbnails" aria-label="推荐作品选择">{visibleItems.map((c,i)=><button className="adult-cinema-thumb" key={c.id} aria-label={`切换推荐：${c.title}`} aria-pressed={visibleStart+i===position} onClick={()=>setIndex(visibleStart+i)}><img src={c.image} alt="" style={{objectPosition:c.focus}} decoding="async"/><span className="adult-cinema-thumb-title">{c.title}</span></button>)}</div><button className="adult-cinema-arrow" aria-label="下一部" onClick={()=>move(1)}><ChevronRight size={22}/></button></div>
    <div className="adult-cinema-dots" aria-label="轮播页码">{items.map((c,i)=><button key={c.id} aria-label={`第 ${i+1} 张：${c.title}`} aria-current={i===position?'true':undefined} onClick={()=>setIndex(i)}/>)}</div>
   </div>}
  </div>
 </section>;
}
