import{useEffect,useRef,type ReactNode}from'react';
import{Flame,Sparkles,Search}from'lucide-react';
import type{Content}from'../types/content';

import{ContentCard}from'./ContentCard';
import{track}from'../services/analytics';
export function DramaGrid({id,title,subtitle,items,latest=false,results=false,controls,empty}:{id:string;title:string;subtitle?:string;items:Content[];latest?:boolean;results?:boolean;controls?:ReactNode;empty?:ReactNode}){
 const root=useRef<HTMLElement>(null);
 useEffect(()=>{const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){const key=(entry.target as HTMLElement).dataset.dramaId;const item=items.find(c=>c.id===key);if(item)track({name:'content_impression',zone:item.content_zone,contentId:item.id},`impression:${id}:${item.id}`);observer.unobserve(entry.target);}},{threshold:.4});root.current?.querySelectorAll('.drama-card').forEach(e=>observer.observe(e));return()=>observer.disconnect();},[id,items]);
 return <section ref={root} id={id} className="drama-section" aria-labelledby={`${id}-heading`}><div className="section-heading"><div><h2 id={`${id}-heading`}>{results?<Search size={21}/>:latest?<Sparkles size={21}/>:<Flame size={21}/ >}{title}</h2>{subtitle&&<p>{subtitle}</p>}</div></div>{controls}{!items.length&&empty}<div className="drama-grid">{items.map((drama,index)=><ContentCard key={drama.id} item={drama} priority={index<6}/>)}</div></section>;
}
