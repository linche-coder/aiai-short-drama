import {useRef} from 'react';
import {Search,X} from 'lucide-react';

export function HeaderSearch({value,onChange,onSubmit}:{value:string;onChange:(value:string,composing?:boolean)=>void;onSubmit:()=>void}){
 const composing=useRef(false);
 return <form className="search-box" role="search" onSubmit={event=>{event.preventDefault();if(!composing.current)onSubmit();}}><Search size={17} aria-hidden="true"/><input aria-label="搜索精选内容" value={value} placeholder="搜索精选短剧与漫剧" onCompositionStart={()=>{composing.current=true;onChange(value,true);}} onCompositionEnd={event=>{composing.current=false;onChange(event.currentTarget.value);}} onKeyDown={event=>{if(event.key==='Enter'&&(composing.current||event.nativeEvent.isComposing||event.nativeEvent.keyCode===229))event.preventDefault();}} onChange={event=>onChange(event.target.value,composing.current)}/>{value?<button type="button" className="icon-button search-clear" aria-label="清空搜索" onClick={()=>onChange('')}><X size={16}/></button>:<button className="search-submit" type="submit">搜索</button>}</form>;
}
