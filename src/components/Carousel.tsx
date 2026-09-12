import { memo, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { groups } from '../data/dramas';
import { timing } from '../config';
import { Poster } from './Poster';
import { CardInfo } from './CardInfo';
import { Link, dramaHref } from '../navigation/Router';
import { saveHomeState } from '../navigation/homeState';

const items = groups.featured;
const modulo = (value: number) => ((value % items.length) + items.length) % items.length;
export const slotFor = (item: number, index: number) => modulo(item - index + Math.floor(items.length / 2)) - Math.floor(items.length / 2);
const position = (slot: number) => slot === 0 ? 'translate(-50%,-50%)' : `translate(calc(-50% ${slot > 0 ? '+' : '-'} var(--${Math.abs(slot) === 1 ? 'near' : 'far'})),-50%) translateZ(${Math.abs(slot) === 1 ? -65 : -150}px) rotateY(${slot > 0 ? -1 : 1}deg) scale(${Math.abs(slot) === 1 ? .95 : .88})`;

export const Carousel = memo(function Carousel({ initialIndex, initialPaused, reduced, blocked }: { initialIndex: number; initialPaused: boolean; reduced: boolean; blocked: boolean }) {
  const root = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(() => modulo(initialIndex));
  const [paused, setPaused] = useState(initialPaused);
  const [wide, setWide] = useState(() => innerWidth >= 1200);
  const current = useRef(index), previous = useRef(index), target = useRef(index);
  const moving = useRef(false), animations = useRef<Animation[]>([]), ticket = useRef(0);
  const pauseRef = useRef(paused), blockedRef = useRef(blocked), reducedRef = useRef(reduced);
  const skip = useRef(false);
  pauseRef.current = paused; blockedRef.current = blocked; reducedRef.current = reduced;
  const request = useRef<(next: number) => void>(() => {});
  request.current = next => {
    target.current = modulo(next);
    if (moving.current || current.current === target.current) return;
    moving.current = true; root.current!.dataset.motion = 'moving'; root.current!.dataset.pointerReady = 'false';
    setIndex(target.current);
  };
  const manual = (next: number) => { setPaused(true); pauseRef.current = true; saveHomeState({ paused: true }); request.current(next); };

  useLayoutEffect(() => {
    const element = root.current!, old = previous.current;
    current.current = index; previous.current = index; saveHomeState({ index });
    document.documentElement.style.setProperty('--current-ambience', `url("${items[index].ambient}")`);
    const id = ++ticket.current;
    const cards = [...element.querySelectorAll<HTMLElement>('.hero-poster')];
    const finish = () => {
      if (ticket.current !== id) return;
      animations.current.forEach(animation => animation.cancel()); animations.current = [];
      cards.forEach(card => { card.removeAttribute('data-wrap'); card.inert = false; });
      moving.current = false; element.dataset.motion = 'idle';
      if (target.current !== current.current) request.current(target.current);
    };
    if (old === index || reduced || skip.current) { skip.current = false; finish(); return; }
    const start = document.timeline.currentTime;
    // All cards share one timeline. No CSS position transition competes with it.
    animations.current = cards.map((card, i) => {
      const from = slotFor(i, old), to = slotFor(i, index);
      const wrap = Math.abs(to-from) > Math.floor(items.length / 2);
      let frames: Keyframe[];
      if (wrap) {
        card.dataset.wrap = 'true'; card.inert = true;
        frames = [
          { transform: position(from), opacity: 1, offset: 0 },
          { transform: `${position(from)} translateX(${Math.sign(from)*45}px)`, opacity: 0, offset: .32 },
          { transform: `${position(to)} translateX(${Math.sign(to)*45}px)`, opacity: 0, offset: .68 },
          { transform: position(to), opacity: 1, offset: 1 },
        ];
      } else frames = [{ transform: position(from), opacity: 1 }, { transform: position(to), opacity: 1 }];
      const animation = card.animate(frames, { duration: timing.carouselMove, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' });
      animation.startTime = start; return animation;
    });
    void Promise.all(animations.current.map(animation => animation.finished.catch(() => {}))).then(finish);
  }, [index, reduced]);

  useLayoutEffect(() => {
    const element = root.current!;
    const settle = () => {
      ticket.current++; animations.current.forEach(animation => animation.cancel()); animations.current = [];
      element.querySelectorAll<HTMLElement>('.hero-poster').forEach(card => { card.removeAttribute('data-wrap'); card.inert = false; });
      moving.current = false; element.dataset.motion = 'idle'; element.dataset.pointerReady = 'false'; skip.current = current.current !== target.current;
      if (current.current !== target.current) request.current(target.current);
    };
    const resize = () => { setWide(innerWidth >= 1200); settle(); };
    const deactivate = () => { element.dataset.windowActive = 'false'; settle(); };
    const activate = () => { element.dataset.windowActive = 'true'; element.dataset.pointerReady = 'false'; };
    const visibility = () => document.hidden ? deactivate() : activate();
    window.addEventListener('resize', resize); window.addEventListener('blur', deactivate); window.addEventListener('focus', activate); document.addEventListener('visibilitychange', visibility);
    const timer = window.setInterval(() => {
      if (pauseRef.current || blockedRef.current || reducedRef.current || moving.current || document.hidden || element.dataset.windowActive !== 'true' || element.matches(':hover') || element.contains(document.activeElement)) return;
      request.current(target.current + 1);
    }, timing.carousel);
    return () => { clearInterval(timer); ticket.current++; animations.current.forEach(animation => animation.cancel()); window.removeEventListener('resize', resize); window.removeEventListener('blur', deactivate); window.removeEventListener('focus', activate); document.removeEventListener('visibilitychange', visibility); };
  }, []);

  return <section ref={root} className="hero" data-motion="idle" data-pointer-ready="false" data-window-active="true" aria-label="精选短剧轮播" aria-roledescription="轮播" tabIndex={0}
    onPointerMove={e => { if (e.pointerType === 'mouse' && !moving.current && e.currentTarget.dataset.pointerReady !== 'true') e.currentTarget.dataset.pointerReady = 'true'; }}
    onPointerLeave={e => { e.currentTarget.dataset.pointerReady = 'false'; }}
    onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); manual(target.current + (e.key === 'ArrowLeft' ? -1 : 1)); } }}>
    <h1 className="sr-only">爱爱短剧 · 发现你的下一部好故事</h1>
    <div className="hero-ambience" aria-hidden="true">{items.map((item,i)=><div key={item.id} data-drama-id={item.id} className={`ambient-layer ${i === index ? 'active' : ''}`} style={{ backgroundImage:`url(${item.ambient})` }} />)}</div>
    <div className="hero-inner"><div className="carousel-stage">
      {items.map((item,i)=>{const slot=slotFor(i,index); const visible=Math.abs(slot)<=(wide?2:1);return <article key={item.id} hidden={!visible} className={`hero-poster offset-${slot}`} data-slot={slot} data-drama-id={item.id} aria-current={slot===0?'true':undefined} style={{transform:position(slot)}}>
        <Link className="hero-surface drama-link" href={dramaHref(item.id)} tabIndex={visible?0:-1} aria-label={`立即观看：${item.title}，${item.genre}`}>
          <div className="hero-cover"><Poster drama={item} priority /><span className="cover-shade" /></div><span className="poster-edge" />
          {slot===0 && <span className="featured-badge">本期精选</span>}<CardInfo drama={item} banner />
        </Link>
      </article>;})}
      <button className="carousel-arrow previous" aria-label="上一部短剧" onClick={()=>manual(target.current-1)}><ChevronLeft /></button>
      <button className="carousel-arrow next" aria-label="下一部短剧" onClick={()=>manual(target.current+1)}><ChevronRight /></button>
    </div>
    <div className="carousel-controls"><span className="slide-number" aria-live={paused?'polite':'off'}>{String(index+1).padStart(2,'0')}<i>/</i><span>{String(items.length).padStart(2,'0')}</span></span><div className="carousel-dots" aria-label="选择轮播位置">{items.map((item,i)=><button key={item.id} className={i===index?'selected':''} aria-label={`第${i+1}部：${item.title}`} aria-pressed={i===index} onClick={()=>manual(i)} />)}</div><button className="autoplay-button" aria-label={paused?'继续自动轮播':'暂停自动轮播'} aria-pressed={paused} disabled={reduced} onClick={()=>{setPaused(!paused);pauseRef.current=!paused;saveHomeState({paused:!paused});}}>{paused||reduced?<Play size={12}/>:<Pause size={12}/>}<span>{reduced?'手动':paused?'继续':'暂停'}</span></button></div>
    </div>
  </section>;
});
