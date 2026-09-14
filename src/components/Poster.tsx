import{memo,useState}from'react';
import{ImageOff}from'lucide-react';
import type{Content}from'../types/content';
export const Poster=memo(function Poster({drama,priority=false,small=false}:{drama:Content;priority?:boolean;small?:boolean}){
 const[failed,setFailed]=useState(false);return <span className="poster-image">{failed?<span className="image-fallback"><ImageOff size={26}/><span>封面暂不可用</span></span>:<img src={small?drama.cover:drama.largeCover} srcSet={small&&drama.thumbnail!==drama.cover?`${drama.thumbnail} 300w, ${drama.cover} 540w, ${drama.largeCover} 651w`:undefined} sizes={small?'(max-width: 540px) 45vw, (max-width: 900px) 30vw, 260px':undefined} alt={`${drama.title}封面`} width="651" height="868" loading={priority?'eager':'lazy'} fetchPriority={priority?'high':'auto'} decoding="async" onError={()=>setFailed(true)}/>}</span>;
});
