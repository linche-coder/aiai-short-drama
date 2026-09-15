import type {ReactNode} from 'react';
import {Heart,Sparkles,Clock3} from 'lucide-react';
import type {Content} from '../types/content';
import {Poster} from '../components/Poster';
import {Link,contentHref} from '../navigation/Router';
import {records,useRecords} from '../state/records';
import {EmptyState} from '../components/content/PageParts';

export function WishButton({item,compact=false}:{item:Content;compact?:boolean}) {
 const saved=useRecords().wishlist.includes(item.id);
 return <button className={compact?'adult-save':'secondary-button'} aria-label={`${saved?'移出':'加入'}愿望榜：${item.title}`} aria-pressed={saved} onClick={()=>records.toggleWishlist(item.id)}><Heart size={18} fill={saved?'currentColor':'none'}/>{!compact&&(saved?'已加入愿望榜':'加入愿望榜')}</button>;
}
export function AdultCards({items,title,subtitle,id='adult-catalog',reset,controls}:{items:Content[];title:string;subtitle?:string;id?:string;reset?:()=>void;controls?:ReactNode}) {
 return <section className="adult-section" aria-labelledby={`${id}-title`} id={id}><div className="adult-section-heading"><div><h2 id={`${id}-title`}><span className="adult-heading-icon" aria-hidden="true">{id==='adult-latest'?<Clock3 size={21}/>:<Sparkles size={21}/>}</span>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div></div>
  {controls}{items.length?<div className="adult-grid">{items.map(item=><article className="adult-card" key={item.id} data-zone="adult">
   <div className="adult-card-art"><Link href={contentHref(item)} aria-label={`查看详情：${item.title}`}><Poster drama={item} small/></Link>{item.update_status!=='unknown'&&<span className="adult-update-badge">{item.update_status==='completed'?'已完结':'连载中'}</span>}<WishButton item={item} compact/></div>
   <Link className="adult-card-title" href={contentHref(item)}><h3>{item.title}</h3></Link>
   <p className="adult-card-description">{item.synopsis}</p><div className="adult-card-tags">{[...new Set(item.tags.length?item.tags:[item.genre])].slice(0,3).map(tag=><span key={tag}>{tag}</span>)}</div>
  </article>)}</div>:<EmptyState title="暂时没有符合条件的作品" description="试试其他筛选，或稍后回来看看。" onReset={reset}/>}
 </section>;
}
