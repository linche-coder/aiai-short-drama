import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Film, RotateCcw } from 'lucide-react';
import { dramas } from '../data/dramas';
import type { VideoSource } from '../data/videoSources';
import { Link } from '../navigation/Router';
import { Header } from './Header';
import { Poster } from './Poster';
import { Footer } from './Footer';

function VideoPlayer({ sources, title }: { sources: VideoSource[]; title: string }) {
  const [status, setStatus] = useState<'loading'|'ready'|'error'>('loading');
  const [attempt,setAttempt]=useState(0);
  const video=useRef<HTMLVideoElement>(null);
  const [ratio,setRatio]=useState<number>();
  useEffect(()=>{
    const el=video.current!;
    return()=>el.pause();
  },[attempt]);
  useEffect(()=>{if(status!=='loading')return;const timeout=window.setTimeout(()=>setStatus('error'),15000);return()=>clearTimeout(timeout);},[status,attempt]);
  return <div className="video-stage" style={ratio ? {aspectRatio:Math.max(ratio, .65)} : undefined} data-status={status}>
    <video key={attempt} ref={video} controls={status!=='error'} playsInline preload="metadata" aria-label={`${title}视频播放器`} onLoadedMetadata={e=>{const v=e.currentTarget;setRatio(v.videoWidth/v.videoHeight);setStatus('ready');}} onCanPlay={()=>setStatus('ready')} onWaiting={()=>setStatus('loading')} onPlaying={()=>setStatus('ready')} onError={()=>setStatus('error')}>
      {sources.map((source,i)=><source key={source.src} src={source.src} type={source.type} onError={()=>{if(i===sources.length-1)setStatus('error');}} />)}
      您的浏览器不支持 HTML 视频播放。
    </video>
    {status==='loading' && <div className="video-status" role="status"><span className="loading-ring"/>正在加载视频…</div>}
    {status==='error' && <div className="video-status video-error" role="alert"><Film size={32}/><h2>视频暂时无法播放</h2><p>片源可能不可用，或浏览器不支持该格式。</p><button className="primary-button" onClick={()=>{setStatus('loading');setAttempt(n=>n+1);}}><RotateCcw size={16}/>重新加载</button></div>}
  </div>;
}
export function PlayPage({ id, onAccount, onMembership }: { id: string; onAccount:()=>void; onMembership:()=>void }) {
  const drama=dramas.find(item=>item.id===id);
  const logo=useRef<HTMLImageElement>(null);
  const [episode,setEpisode]=useState(0);
  useEffect(()=>{try{sessionStorage.setItem('aiai:intro-seen','yes');}catch{/* optional */}document.title=drama?`${drama.title} · 爱爱短剧`:'未找到短剧 · 爱爱短剧';document.querySelector<HTMLElement>('.play-page h1')?.focus({preventScroll:true});},[drama]);
  const episodes=drama?.media?.episodes?.filter(item=>item.id && item.title)??[];
  const sources=(episodes.length?episodes[episode]?.sources:drama?.media?.sources)?.filter(source=>source.src.trim())??[];
  return <><Header logoRef={logo} onAccount={onAccount} onMembership={onMembership} /><main className="play-page container">
    <Link className="back-link" href="/" restoreHome><ArrowLeft size={17}/>返回首页</Link>
    {drama ? <><div className="play-heading"><span className="eyebrow">爱爱短剧 / STORY THEATER</span><h1 tabIndex={-1}>{drama.title}</h1><p>{drama.tagline}</p></div>
      <div className="play-layout"><section className="play-main" aria-label="播放区域">
        {sources.length ? <VideoPlayer key={`${id}-${episode}`} sources={sources} title={drama.title}/> : <div className="no-source"><div className="no-source-poster"><Poster drama={drama} priority /></div><div className="no-source-copy"><span className="status-label"><Film size={16}/>片源待接入</span><h2>该短剧暂未配置视频源</h2><p>暂时还不能播放，可以先去发现其他故事。</p><Link href="/" restoreHome className="primary-button">继续发现好故事<ArrowLeft size={16}/></Link></div></div>}
        {episodes.length>0 && <section className="episode-panel" aria-label="选集"><h2>选集 <small>{episodes.length} 集</small></h2><div>{episodes.map((item,i)=><button key={item.id} aria-pressed={episode===i} onClick={()=>setEpisode(i)}>{item.title}</button>)}</div></section>}
      </section><aside className="story-panel"><span className="eyebrow">关于这部故事</span><h2>{drama.title}</h2><span className="genre-badge">{drama.genre}</span><p>{drama.synopsis}</p><small>题材与简介为演示资料，以正式作品信息为准。</small></aside></div>
    </> : <section className="not-found"><Film size={42}/><span className="eyebrow">STORY NOT FOUND</span><h1 tabIndex={-1}>没有找到这部短剧</h1><p>链接可能有误，或该作品尚未收录。</p><Link href="/#home" className="primary-button">返回首页</Link></section>}
  </main><Footer/></>;
}
