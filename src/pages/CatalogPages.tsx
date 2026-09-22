import{CatalogFilters}from'../components/content/CatalogFilters';
import{useReadyScroll}from'../navigation/useReadyScroll';
﻿import{useMemo}from'react';
import{DramaGrid}from'../components/DramaGrid';import{PageHeading,PreviewNote,EmptyState,LoadingState,ErrorState}from'../components/content/PageParts';import{useContents}from'../services/hooks';import{greenContext}from'../services/content';import{filterInZone}from'../services/rules';import{useRouter}from'../navigation/Router';
export function CatalogPage({kind}:{kind:'shorts'|'comics'|'search'}){
 const{route,navigate}=useRouter();const data=useContents();useReadyScroll(!data.loading);const genre=route.params.get('genre')||'全部',update=route.params.get('update')||'all',sort=route.params.get('sort')||'curated',query=kind==='search'?route.params.get('q')||'':'';
 const items=useMemo(()=>{let list=filterInZone(data.items,greenContext,query,genre);if(kind==='shorts')list=list.filter(c=>c.format==='live_action_drama');if(kind==='comics')list=list.filter(c=>c.format==='motion_comic');if(update!=='all')list=list.filter(c=>c.update_status===update);if(sort==='title')list=[...list].sort((a,b)=>a.title.localeCompare(b.title,'zh-CN'));return list;},[data.items,genre,query,kind,sort,update]);
 const change=(key:string,value:string)=>{const params=new URLSearchParams(route.search);if(value==='all'||value==='全部'||value==='curated')params.delete(key);else params.set(key,value);params.delete('page');navigate(route.path+(params.size?'?'+params:''),{replace:false,preserveScroll:true});};
 const reset=()=>navigate(kind==='search'?'/search':'/'+kind,{preserveScroll:true});
 const titles={shorts:'精选短剧',comics:'漫剧新视野',search:'搜索结果'};
 return <main className="container page"><PageHeading title={titles[kind]} description={kind==='search'?query?`与「${query}」有关的精选内容`:'输入剧名，发现下一部好故事':'循着喜欢的题材，发现属于你的故事。'}/><PreviewNote/>
 <CatalogFilters genre={genre} update={update} sort={sort} onChange={change} onReset={reset}/>
 {data.loading?<LoadingState/>:data.error?<ErrorState message={data.error} retry={data.retry}/>:items.length?<DramaGrid id="catalog" title={kind==='search'?'找到这些故事':'全部作品'}  items={items} results={kind==='search'}/>:<EmptyState title="还没找到这部故事" description="可以调整题材、更新状态，或换个关键词。" onReset={reset}/>}</main>;
}
