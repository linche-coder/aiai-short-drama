import{useEffect,useRef,type ReactNode}from'react';
import{ArrowUpRight,Flame,Sparkles,Search}from'lucide-react';
import type{Content}from'../types/content';

import{Poster}from'./Poster';import{CardInfo}from'./CardInfo';
import{Link,contentHref}from'../navigation/Router';import{contentLabel}from'../data/contentLabels';
import{track}from'../services/analytics';
export function DramaGrid({id,title,subtitle,items,latest=false,results=false,controls,empty}:{id:string;title:string;subtitle?:string;items:Content[];latest?:boolean;results?:boolean;controls?:ReactNode;empty?:ReactNode}){
 const root=useRef<HTMLElement>(null);
 useEffect(()=>{const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){const key=(entry.target as HTMLElement).dataset.dramaId;const item=items.find(c=>c.id===key);if(item)track({name:'content_impression',zone:item.content_zone,contentId:item.id},`impression:${id}:${item.id}`);observer.unobserve(entry.target);}},{threshold:.4});root.current?.querySelectorAll('.drama-card').forEach(e=>observer.observe(e));return()=>observer.disconnect();},[id,items]);
 return <section ref={root} id={id} className="drama-section" aria-labelledby={`${id}-heading`}><div className="section-heading"><div><h2 id={`${id}-heading`}>{results?<Search size={21}/>:latest?<Sparkles size={21}/>:<Flame size={21}/ >}{title}</h2>{subtitle&&<p>{subtitle}</p>}</div></div>{controls}{!items.length&&empty}<div className="drama-grid">{items.map(drama=><Link className="drama-card drama-link" href={contentHref(drama)} key={drama.id} data-drama-id={drama.id} data-zone={drama.content_zone} data-instance={`list-${drama.id}`} style={{viewTransitionName:`${id}-${drama.id}`}} aria-label={`${contentLabel(drama)}：${drama.title}，${drama.genre}`}><div className="card-poster"><Poster drama={drama} small/><CardInfo drama={drama}/></div><div className="card-title"><h3>{drama.title}</h3><ArrowUpRight size={16}/></div><p>{drama.genre}</p></Link>)}</div></section>;
}
