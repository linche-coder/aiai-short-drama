import type {ReactNode} from 'react';
import type {Content} from '../types/content';
import {Poster} from './Poster';
import {Link,contentHref} from '../navigation/Router';

export function permissionLabel(item:Content){
 if(item.access_tier==='coin_reserved')return '待开放';
 if(item.access_tier==='basic'||item.access_tier==='premium')return '会员';
 return item.free_scope==='episodes'?'部分免费':'免费';
}

export function ContentCard({item,adult=false,action,priority=false}:{item:Content;adult?:boolean;action?:ReactNode;priority?:boolean}){
 const episodes=item.format==='article'?null:item.media?.episodes?.length;
 const poster=<span className="card-poster"><Poster drama={item} small priority={priority}/><span className="card-badges"><span className="card-permission">{permissionLabel(item)}</span>{item.original&&<span className="card-original">原创</span>}</span>{episodes?<span className="card-episodes">{episodes} 集</span>:null}</span>;
 const copy=<span className="content-card-copy"><strong className="content-card-title">{item.title}</strong><span className="content-card-description">{item.synopsis||item.tagline||item.genre}</span><span className="content-card-meta"><span>{item.genre}</span><span>{item.update_status==='completed'?'已完结':item.update_status==='ongoing'?'连载中':item.format==='motion_comic'?'漫剧':'短剧'}</span></span></span>;
 if(adult)return <article className="drama-card content-card adult-card" data-zone="adult" data-drama-id={item.id}><div className="adult-card-art"><Link href={contentHref(item)} aria-label={`查看详情：${item.title}`}>{poster}</Link>{action}</div><Link className="adult-card-title content-card-body-link" href={contentHref(item)}>{copy}</Link></article>;
 return <Link className="drama-card content-card" href={contentHref(item)} data-zone={item.content_zone} data-drama-id={item.id} aria-label={`${item.title}，${permissionLabel(item)}，${item.genre}`}>{poster}{copy}</Link>;
}
