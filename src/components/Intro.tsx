import { useId, useLayoutEffect, useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import { timing } from '../config';
import { startIntroSound } from '../motion/introSound';
import groupedLogo from '../assets/intro-logo.svg?raw';

export function Intro({ logoRef, reduced, full, onDone }: { logoRef: RefObject<HTMLImageElement | null>; reduced: boolean; full: boolean; onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const floating = useRef<HTMLDivElement>(null);
  const id = useId().replace(/[^a-z0-9]/gi, '');
  const markup = useMemo(() => {
    let value = groupedLogo;
    for (const match of groupedLogo.matchAll(/id="([^"]+)"/g)) value = value.replaceAll(`id="${match[1]}"`, `id="${id}-${match[1]}"`).replaceAll(`#${match[1]})`, `#${id}-${match[1]})`);
    return value;
  }, [id]);
  useLayoutEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const animations: Animation[] = [];
    const start = Number(document.timeline.currentTime ?? performance.now());
    const stopSound = full && !reduced ? startIntroSound(start) : () => {};
    let disposed = false;
    let completed = false;
    let movement: Animation | undefined;
    let resizeFlight: Animation | undefined;
    const finish = () => { if (!disposed && !completed) { completed = true; stopSound(); onDone(); } };
    const safety = window.setTimeout(finish, full && !reduced ? timing.intro + 500 : timing.reducedIntro + 480);
    const animate = (element: Element | null | undefined, frames: Keyframe[], at: number, duration: number, easing = 'cubic-bezier(.22,1,.36,1)') => {
      if (!element) return undefined;
      const animation = element.animate(frames, { delay: at, duration, easing, fill: 'both' });
      animation.startTime = start;
      animations.push(animation);
      return animation;
    };
    const afterDeparture = (offset: number) => timing.logoMoveAt + offset;
    const fade = (selector: string, at: number, duration: number) => document.querySelectorAll(selector).forEach(el => animate(el, [{ opacity: 0 }, { opacity: 1 }], at, duration));
    const rectangleFrames = (a: DOMRect, b: DOMRect): Keyframe[] => {
      const x = b.x - a.x, y = b.y - a.y, scale = b.width / a.width;
      return [
        { transform: 'translate(0,0) scale(1)', offset: 0 },
        { transform: `translate(${x * .42}px,${y * .32 - 22}px) scale(${1 + (scale - 1) * .36})`, offset: .43 },
        { transform: `translate(${x * .85}px,${y * .82 - 10}px) scale(${1 + (scale - 1) * .83})`, offset: .75 },
        { transform: `translate(${x}px,${y}px) scale(${scale})`, offset: 1 },
      ];
    };
    const onResize = () => {
      const el = floating.current, target = logoRef.current;
      if (!el || !target || completed) return;
      const current = el.getBoundingClientRect();
      const elapsed = Math.max(0, Number(document.timeline.currentTime) - start);
      movement?.cancel(); resizeFlight?.cancel();
      Object.assign(el.style, { left: `${current.left}px`, top: `${current.top}px`, width: `${current.width}px`, transform: 'none' });
      const to = target.getBoundingClientRect();
      const available = Math.max(100, timing.intro - elapsed - 40);
      if (elapsed < timing.logoMoveAt - 300) {
        const width = Math.min(460, innerWidth * .8);
        const center = { x: (innerWidth - width) / 2, y: (innerHeight - width * .301) / 2, width };
        const total = timing.logoMoveAt + timing.logoMoveDuration - elapsed;
        const wait = (timing.logoMoveAt - elapsed) / total;
        const centered = `translate(${center.x - current.x}px,${center.y - current.y}px) scale(${width / current.width})`;
        resizeFlight = el.animate([
          { transform: 'none', offset: 0 },
          { transform: centered, offset: Math.min(.25, 300 / total) },
          { transform: centered, offset: wait },
          { transform: `translate(${to.x - current.x}px,${to.y - current.y}px) scale(${to.width / current.width})`, offset: 1 },
        ], { duration: total, fill: 'forwards', easing: 'cubic-bezier(.22,1,.36,1)' });
      } else resizeFlight = el.animate(rectangleFrames(current, to), { duration: Math.min(700, available), fill: 'forwards', easing: 'cubic-bezier(.22,1,.36,1)' });
      animations.push(resizeFlight);
    };
    try {
      if (!full || reduced) {
        const short = animate(root.current, [{ opacity: 1 }, { opacity: 0 }], 0, timing.reducedIntro);
        short?.finished.then(finish, () => {});
      } else {
        const el = floating.current!;
        const width = Math.min(460, innerWidth * .8);
        Object.assign(el.style, { left: `${(innerWidth - width) / 2}px`, top: `${(innerHeight - width * .301) / 2}px`, width: `${width}px` });
        const icon = el.querySelector('.brand-icon');
        animate(icon, [{ transform: 'translateX(360px)' }, { transform: 'translateX(0)' }], 850, 700);
        animate(el.querySelector('.brand-hearts'), [{ opacity: 0, transform: 'rotate(-4deg) scale(.86,.91)' }, { opacity: .9, transform: 'rotate(.7deg) scale(1.015,.99)', offset: .65 }, { opacity: 1, transform: 'none' }], 140, 1030);
        animate(el.querySelector('.brand-dot-left'), [{ opacity: 0, transform: 'translate(-15px,-12px) scale(.8)' }, { opacity: 1, transform: 'none' }], 410, 730);
        animate(el.querySelector('.brand-dot-right'), [{ opacity: 0, transform: 'translate(15px,-16px) scale(.8)' }, { opacity: 1, transform: 'none' }], 510, 740);
        animate(el.querySelector('.brand-wordmark'), [{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }, { opacity: 1, clipPath: 'inset(0 0 0 0)' }], 900, 650);
        // One continuous envelope begins before the heart and decays through
        // departure. Both effects live inside the icon's SVG coordinate group.
        animate(el.querySelector('.intro-glow'), [{ opacity: 0 }, { opacity: .14, offset: .16 }, { opacity: .32, offset: .32 }, { opacity: .24, offset: .52 }, { opacity: .13, offset: .71 }, { opacity: 0 }], 40, 2920, 'linear');
        animate(el.querySelector('.brand-sheen'), [{ opacity: 0 }, { opacity: .48, offset: .42 }, { opacity: .2, offset: .7 }, { opacity: 0 }], 160, 1770, 'ease-in-out');
        animate(el.querySelector('.brand-light'), [{ transform: 'translate(-130px,35px) rotate(-18deg)' }, { transform: 'translate(360px,-25px) rotate(-18deg)' }], 160, 1770, 'cubic-bezier(.35,0,.25,1)');
        movement = animate(el, rectangleFrames(el.getBoundingClientRect(), logoRef.current!.getBoundingClientRect()), timing.logoMoveAt, timing.logoMoveDuration, 'cubic-bezier(.45,0,.18,1)');
        fade('.header-inner > :not(.brand)', afterDeparture(450), 500);
        fade('.hero-ambience', afterDeparture(450), 850);
        document.querySelectorAll('.hero-poster').forEach(poster => {
          const active = poster.classList.contains('offset-0');
          animate(poster.querySelector('.hero-surface'), [{ opacity: 0, transform: `translateY(${active ? 18 : 26}px) scale(.97)` }, { opacity: 1, transform: 'none' }], afterDeparture(active ? 500 : 670), active ? 700 : 730);
        });
        fade('.carousel-controls', afterDeparture(1100), 500);
        fade('.carousel-arrow', afterDeparture(1100), 500);
        document.querySelectorAll('.content > *, .drama-card').forEach(element => {
          const rect = element.getBoundingClientRect();
          if (rect.top < innerHeight && rect.bottom > 0) animate(element, [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], afterDeparture(1150), 550);
        });
        // All phase animations share this timeline origin. Normal completion is
        // driven by this animation's finished Promise, never by a normal timer.
        const master = animate(root.current!.querySelector('.intro-curtain'), [{ opacity: 1, offset: 0 }, { opacity: 1, offset: afterDeparture(450) / timing.intro }, { opacity: 0, offset: afterDeparture(1400) / timing.intro }, { opacity: 0, offset: 1 }], 0, timing.intro, 'linear');
        master?.finished.then(async () => { await resizeFlight?.finished.catch(() => {}); finish(); }, () => {});
        window.addEventListener('resize', onResize);
      }
    } catch { finish(); }
    return () => { disposed = true; stopSound(); clearTimeout(safety); window.removeEventListener('resize', onResize); animations.forEach(a => a.cancel()); document.body.style.overflow = previous; };
  }, [full, reduced, logoRef, onDone]);
  return <div ref={root} className={`intro ${reduced || !full ? 'intro-short' : ''}`} aria-hidden="true"><div className="intro-curtain" />{full && !reduced && <div ref={floating} className="intro-logo"><div className="intro-svg" dangerouslySetInnerHTML={{ __html: markup }} /></div>}</div>;
}
