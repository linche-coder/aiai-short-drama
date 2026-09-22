import {useEffect,useRef,useState,type ReactNode} from 'react';
import {ShieldCheck,ArrowLeft,ArrowRight,LockKeyhole} from 'lucide-react';
import {accessService} from '../services/access';
import {useAccess,useContents} from '../services/hooks';
import {Link,useRouter} from '../navigation/Router';
import {FilterOptions} from '../components/Filters';
import {EmptyState,LoadingState,PageHeading,ErrorState} from '../components/content/PageParts';
import {filterInZone} from '../services/rules';
import {useRecords} from '../state/records';
import type {AccessContext} from '../types/content';
import {AdultLayout,adultTabs,useAdultSearch} from '../adult/AdultLayout';
import {AdultCards} from '../adult/AdultCards';
import {AdultHero} from '../adult/AdultHero';
import {useReadyScroll} from '../navigation/useReadyScroll';
export function AdultBoundary({children}:{children:ReactNode}){
 const {navigate}=useRouter(),access=useAccess(),[ageConfirmed,setAgeConfirmed]=useState(false);const confirmed=access.granted;
 useEffect(()=>{if(confirmed)return;const key=(e:KeyboardEvent)=>{if(e.key==='Escape')navigate('/#home');};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[confirmed]);
 if(confirmed)return <AdultLayout qualified>{children}</AdultLayout>;
 return <div className="adult-shell adult-consent-shell"><main className="gate-page"><section className="gate-card" aria-labelledby="adult-consent-title"><span className="gate-symbol"><ShieldCheck size={32}/></span><h1 id="adult-consent-title">进入18+专区</h1><p>本专区仅面向已满 18 周岁的用户。请确认年龄后主动进入。</p><label className="age-confirm"><input type="checkbox" checked={ageConfirmed} onChange={e=>setAgeConfirmed(e.target.checked)}/>我已年满18周岁</label><button className="primary-button" disabled={!ageConfirmed} onClick={()=>void accessService.enter(ageConfirmed,true)}>确认并进入</button><button className="secondary-button" onClick={()=>navigate('/#home')}><ArrowLeft size={16}/>返回普通区</button></section></main></div>;
}
export const adultContext:AccessContext={zone:'adult',channel:'preview',adultGranted:true,region:null,tier:'free',sessionVerified:false};
function useCatalogColumns(){
 const read=()=>window.innerWidth>1100?5:window.innerWidth>760?3:2;
 const [columns,setColumns]=useState(read);
 useEffect(()=>{const update=()=>setColumns(read());window.addEventListener('resize',update);return()=>window.removeEventListener('resize',update);},[]);
 return columns;
}
export function AdultPage(){
 const {route,navigate}=useRouter(),data=useContents(adultContext),state=useRecords();
 const columns=useCatalogColumns(),pageSize=columns*5;
 const tab=route.params.get('tab')||'home',format=route.params.get('format')||'all',genre=route.params.get('genre')||'all',status=route.params.get('status')||'all',sort=route.params.get('sort')||'selection';
 const home=tab==='home',validTab=adultTabs.some(([id])=>id===tab),title=adultTabs.find(([id])=>id===tab)?.[1]||'专区精选';
 useReadyScroll(!data.loading);
 useEffect(()=>{document.title=`${title} · 爱爱短剧18+专区`;},[title,route.key]);
 useEffect(()=>{if((tab&&!validTab)||!['all','live_action_drama','motion_comic'].includes(format)||!['all','ongoing','completed','unknown'].includes(status)||!['selection','title','newest'].includes(sort))navigate('/18plus',{replace:true});},[route.key]);
 const change=(key:string,value:string)=>{const params=new URLSearchParams(location.search);params.delete('page');if(value==='all'||value==='selection')params.delete(key);else params.set(key,value);navigate(`/18plus${params.size?'?'+params:''}`,{preserveScroll:true});};
 const reset=()=>navigate(`/18plus${validTab?'?tab='+tab:''}`,{preserveScroll:true});
 let items=data.items.filter(c=>(tab!=='shorts'||c.format==='live_action_drama')&&(tab!=='comics'||c.format==='motion_comic')&&(tab!=='original'||c.original)&&(format==='all'||c.format===format)&&(genre==='all'||c.genre===genre)&&(status==='all'||c.update_status===status));
 if(tab==='latest'||sort==='newest')items=items.filter(c=>c.published_at!==null).sort((a,b)=>Date.parse(b.published_at!)-Date.parse(a.published_at!));
 // Popular previews retain their editor order; no fabricated view counts.
 if(tab==='popular')items=[...items].sort((a,b)=>Number(b.original)-Number(a.original));
 if(sort==='title')items=[...items].sort((a,b)=>a.title.localeCompare(b.title,'zh-CN'));
 const pageCount=Math.max(1,Math.ceil(items.length/pageSize)),rawPage=Number(route.params.get('page')||1),currentPage=Math.min(pageCount,Math.max(1,Number.isSafeInteger(rawPage)?rawPage:1));
 const paged=items.slice((currentPage-1)*pageSize,currentPage*pageSize);
 useEffect(()=>{if(data.loading||home)return;if(route.params.has('page')&&String(currentPage)!==route.params.get('page')){const params=new URLSearchParams(location.search);params.set('page',String(currentPage));navigate('/18plus?'+params,{replace:true,preserveScroll:true});}},[data.loading,currentPage,route.key,home]);
 const turnPage=(page:number)=>{const params=new URLSearchParams(location.search);params.set('page',String(page));navigate('/18plus?'+params,{preserveScroll:true});requestAnimationFrame(()=>document.getElementById('adult-catalog')?.scrollIntoView({block:'start',behavior:'instant'}));};
 const latest=data.items.filter(c=>c.published_at).sort((a,b)=>Date.parse(b.published_at!)-Date.parse(a.published_at!));
 const history=state.privacy.hideAdult?[]:data.items.filter(c=>state.adult.includes(c.id));
 const filterGroup=(label:string,key:string,value:string,options:{value:string;label:string}[])=>options.length>1?<div className="adult-filter-row" key={key}><span className="adult-filter-label">{label}</span><FilterOptions label={label} selected={value} options={options} onSelect={value=>change(key,value)}/></div>:null;
 const values=[...new Set(data.items.map(c=>c.genre))];
 const statusLabels={unknown:'待确认',ongoing:'连载中',completed:'已完结'};
 const filters=<div className="adult-catalog-filters home-genre-filter">
 {!['shorts','comics'].includes(tab)&&filterGroup('类型','format',format,[{value:'all',label:'全部'},...([...new Set(data.items.map(c=>c.format))].map(value=>({value,label:value==='motion_comic'?'漫剧':'真人'})))])}
 {filterGroup('题材','genre',genre,[{value:'all',label:'全部'},...values.map(value=>({value,label:value}))])}
 {filterGroup('更新状态','status',status,[{value:'all',label:'全部'},...[...new Set(data.items.map(c=>c.update_status))].filter(value=>value!=='unknown').map(value=>({value,label:statusLabels[value]}))])}
 {filterGroup('排序','sort',sort,[{value:'selection',label:'编辑顺序'},{value:'title',label:'标题顺序'},...(data.items.some(c=>c.published_at)?[{value:'newest',label:'上线时间'}]:[])])}
 </div>;
 return <main className="adult-main">
  {data.loading?<div className="container"><LoadingState/></div>:data.error?<div className="container"><ErrorState message={data.error} retry={data.retry}/></div>:<>
   {home&&<AdultHero/>}
   <div className="container adult-body">
    {home&&history.length>0&&<AdultCards id="adult-history" title="继续观看" items={history}/>}
    <AdultCards items={home?data.items.slice(0,columns):paged} title={home?"精选推荐":title} controls={home?undefined:filters} reset={reset}/>
    {!home&&pageCount>1&&<nav className="adult-pagination" aria-label="内容分页"><button disabled={currentPage===1} onClick={()=>turnPage(currentPage-1)}>上一页</button>{Array.from({length:pageCount},(_,i)=>i+1).filter(p=>p===1||p===pageCount||Math.abs(p-currentPage)<=1).map((p,i,list)=><span key={p}>{i>0&&p-list[i-1]>1&&<span className="pagination-ellipsis">…</span>}<button aria-label={`第${p}页`} aria-current={p===currentPage?'page':undefined} onClick={()=>turnPage(p)}>{p}</button></span>)}<button disabled={currentPage===pageCount} onClick={()=>turnPage(currentPage+1)}>下一页</button><small>第 {currentPage} / {pageCount} 页 · 共 {items.length} 部</small></nav>}
    {home&&<><AdultCards id="adult-latest" title="最近上新" items={(latest.length?latest:data.items).filter(c=>!data.items.slice(0,columns).some(featured=>featured.id===c.id)).slice(0,columns*2)}/><section className="adult-ad-row" aria-label="广告位">{[1,2,3].map(n=><div className="adult-ad-slot" key={n}><span>广告</span><strong>品牌合作</strong><small>ADVERTISEMENT · {String(n).padStart(2,'0')}</small></div>)}</section></>}

    <Link className="adult-wishlist-banner" href="/18plus/wishlist"><span className="adult-wishlist-symbol"><LockKeyhole size={26}/></span><div><span className="adult-eyebrow">YOUR PRIVATE LIST</span><h2>把心动，留到下一场。</h2><p>收藏想看的故事。在私密愿望榜里，慢慢遇见。</p></div><span>查看愿望榜 <ArrowRight size={18}/></span></Link>
   </div>
  </>}
 </main>;
}
export function AdultSearch(){
 const data=useContents(adultContext),{query,setQuery,committed,setCommitted}=useAdultSearch();const composing=useRef(false);const found=filterInZone(data.items,adultContext,committed);useReadyScroll(!data.loading);
 useEffect(()=>{document.title='专区搜索 · 爱爱短剧';},[]);
 return <main className="container page adult-body"><PageHeading title="专区搜索" description="搜索专区内的短剧与漫剧。"/><form className="private-search-form" onSubmit={e=>{e.preventDefault();if(!composing.current)setCommitted(query.trim());}}><label>专区关键词<input value={query} placeholder="搜索想看的故事" onChange={e=>setQuery(e.target.value)} onCompositionStart={()=>{composing.current=true;}} onCompositionEnd={()=>{composing.current=false;}} onKeyDown={e=>{if(e.key==='Enter'&&(composing.current||e.nativeEvent.isComposing))e.preventDefault();}}/></label><button className="primary-button">搜索</button><button className="secondary-button" type="button" onClick={()=>{setQuery('');setCommitted('');}}>清空</button></form>{data.loading?<LoadingState/>:data.error?<ErrorState message={data.error} retry={data.retry}/>:<AdultCards id="private-results" items={found} title="搜索结果" reset={()=>{setQuery('');setCommitted('');}}/>}</main>;
}
export function WishlistPage(){
 const state=useRecords(),data=useContents(adultContext),{navigate}=useRouter();const items=data.items.filter(c=>state.wishlist.includes(c.id));useReadyScroll(!data.loading);
 useEffect(()=>{document.title='私密愿望榜 · 爱爱短剧';},[]);
 return <main className="container page adult-body"><button className="text-button" onClick={()=>{if(history.state?.adultOrigin)history.back();else navigate('/18plus');}}><ArrowLeft size={16}/>返回原浏览位置</button><PageHeading title="私密愿望榜" description="仅保存在当前页面会话中，不上传、不公开；刷新、退出或资格失效后清除。"/>{data.loading?<LoadingState/>:data.error?<ErrorState message={data.error} retry={data.retry}/>:items.length?<AdultCards title="留给自己的故事" items={items}/>:<EmptyState title="愿望榜还是空的" description="遇到感兴趣的故事，点亮海报上的爱心。"><Link className="primary-button" href="/18plus">发现专区内容</Link></EmptyState>}<section className="surface-panel"><h2>新作预约</h2><p>预约通知服务暂未开放。你可以先将作品保存在本次会话的愿望榜中。</p></section></main>;
}
