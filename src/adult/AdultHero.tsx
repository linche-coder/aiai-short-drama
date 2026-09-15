import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {ArrowRight,ChevronLeft,ChevronRight,Pause,Play} from 'lucide-react';
import type {Content} from '../types/content';
import {formatLabels} from '../types/content';
import {Link,contentHref} from '../navigation/Router';
import {contentLabel} from '../data/contentLabels';
import {Poster} from '../components/Poster';
import {useReducedMotion} from '../hooks/useReducedMotion';
import {EmptyState} from '../components/content/PageParts';

// Supplied artwork is portrait. Keep it intact above a matching extended background.
const focalPoints:Record<string,string>={'private-preview-1':'70%','private-preview-2':'72%','private-preview-3':'68%','private-preview-4':'71%','private-preview-5':'70%','private-preview-6':'69%'};
export function AdultHero({items}:{items:Content[]}) {
 const [index,setIndex]=useState(0),[manual,setManual]=useState(false),[hover,setHover]=useState(false),[focus,setFocus]=useState(false),[hidden,setHidden]=useState(document.hidden),[modal,setModal]=useState(false),[failed,setFailed]=useState<string|null>(null);
 const thumbnails=useRef<HTMLDivElement>(null),reduced=useReducedMotion(),paused=manual||hover||focus||hidden||modal||reduced;
 const position=index%Math.max(items.length,1),item=items[position];
 useEffect(()=>{const change=()=>setHidden(document.hidden);document.addEventListener('visibilitychange',change);const observer=new MutationObserver(()=>setModal(!!document.querySelector('dialog[open]')));observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open']});return()=>{document.removeEventListener('visibilitychange',change);observer.disconnect();};},[]);
 useEffect(()=>{if(paused||items.length<2)return;const timer=setInterval(()=>setIndex(i=>(i+1)%items.length),6000);return()=>clearInterval(timer);},[paused,items.length,index]);
 useEffect(()=>{const strip=thumbnails.current,button=strip?.children[position] as HTMLElement|undefined;if(strip&&button)strip.scrollTo({left:button.offsetLeft-(strip.clientWidth-button.offsetWidth)/2,behavior:reduced?'instant':'smooth'});},[position,reduced]);
 const move=(delta:number)=>setIndex(i=>(i+delta+items.length)%items.length);
 if(!item)return <section className="container adult-hero-empty"><EmptyState title="故事正在准备中" description="新作品准备好后，将在这里与你见面。"/></section>;
 return <section className="adult-cinema" aria-label="重点推荐" aria-roledescription="轮播" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onFocusCapture={()=>setFocus(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setFocus(false);}}>
  <div className="adult-cinema-art" key={item.id} style={{'--art-focus':focalPoints[item.id]||'70%'} as CSSProperties} aria-hidden="true">
   {failed!==item.id&&<><div className="adult-cinema-extension" style={{backgroundImage:`url("${item.ambient}")`}}/><img className="adult-cinema-subject" src={item.largeCover} alt="" onError={()=>setFailed(item.id)} fetchPriority="high" decoding="async"/></>}
  </div>
  <div className="adult-cinema-shade"/>
  <div className="container adult-cinema-content">
   <div className="adult-cinema-copy" key={`copy-${item.id}`}><span className="adult-eyebrow">今夜精选 · {formatLabels[item.format]}</span><h1>{item.title}</h1><p>{item.synopsis}</p>{item.update_status!=='unknown'&&<span className="adult-cinema-status">{item.update_status==='completed'?'已完结':'连载中'}</span>}<Link className="primary-button" href={contentHref(item)}>{contentLabel(item)}<ArrowRight size={18}/></Link></div>
   {items.length>1&&<div className="adult-cinema-picker">
    <div className="adult-cinema-thumbnails" ref={thumbnails} aria-label="推荐作品选择">{items.map((c,i)=><button className="adult-cinema-thumb" key={c.id} aria-label={`切换推荐：${c.title}`} aria-pressed={i===position} onClick={()=>setIndex(i)}><Poster drama={c} small/></button>)}</div>
    <div className="adult-cinema-controls"><span className="adult-cinema-count" aria-live="off">{String(position+1).padStart(2,'0')} <i>/ {String(items.length).padStart(2,'0')}</i></span><span className="adult-cinema-meter" aria-hidden="true"><span style={{width:`${(position+1)/items.length*100}%`}}/></span><button aria-label="上一部" onClick={()=>move(-1)}><ChevronLeft size={19}/></button>{!reduced&&<button aria-label={manual?'继续自动切换':'暂停自动切换'} aria-pressed={manual} onClick={()=>setManual(!manual)}>{manual?<Play size={16}/>:<Pause size={16}/>}</button>}<button aria-label="下一部" onClick={()=>move(1)}><ChevronRight size={19}/></button></div>
   </div>}
  </div>
 </section>;
}
