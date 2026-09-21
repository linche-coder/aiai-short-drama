import type {ReactNode} from 'react';
import {Heart,Sparkles,Clock3} from 'lucide-react';
import type {Content} from '../types/content';
import {records,useRecords} from '../state/records';
import {EmptyState} from '../components/content/PageParts';
import {ContentCard} from '../components/ContentCard';

export function WishButton({item,compact=false}:{item:Content;compact?:boolean}) {
 const saved=useRecords().wishlist.includes(item.id);
 return <button className={compact?'adult-save':'secondary-button'} aria-label={`${saved?'移出':'加入'}愿望榜：${item.title}`} aria-pressed={saved} onClick={()=>records.toggleWishlist(item.id)}><Heart size={18} fill={saved?'currentColor':'none'}/>{!compact&&(saved?'已加入愿望榜':'加入愿望榜')}</button>;
}
export function AdultCards({items,title,subtitle,id='adult-catalog',reset,controls}:{items:Content[];title:string;subtitle?:string;id?:string;reset?:()=>void;controls?:ReactNode}) {
 return <section className="adult-section" aria-labelledby={`${id}-title`} id={id}><div className="adult-section-heading"><div><h2 id={`${id}-title`}><span className="adult-heading-icon" aria-hidden="true">{id==='adult-latest'?<Clock3 size={21}/>:<Sparkles size={21}/>}</span>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div></div>
  {controls}{items.length?<div className="adult-grid">{items.map(item=><ContentCard item={item} adult action={<WishButton item={item} compact/>} key={item.id}/>)}</div>:<EmptyState title="暂时没有符合条件的作品" description="试试其他筛选，或稍后回来看看。" onReset={reset}/>}
 </section>;
}
