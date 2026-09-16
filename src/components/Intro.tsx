import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { prepareIntroSound } from '../motion/introSound';
import { createIntroParticles, introGeometry } from '../motion/introParticles';
import timeline from '../motion/introTimeline.json' with { type: 'json' };
import groupedLogo from '../assets/intro-logo.svg?raw';

type Phase = 'waiting' | 'gathering' | 'departing';
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (v: number) => { const p = clamp(v); return p * p * (3 - 2 * p); };

export function Intro({ logoRef, reduced, onDone }: { logoRef: RefObject<HTMLImageElement | null>; reduced: boolean; onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const floating = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const primary = useRef<HTMLButtonElement>(null);
  const controller = useRef<{ enter: (keyboard: boolean) => void; refresh: () => void } | null>(null);
  const reducedRef = useRef(reduced);
  const [phase, setPhase] = useState<Phase>('waiting');
  const id = useId().replace(/[^a-z0-9]/gi, '');
  const markup = useMemo(() => {
    let value = groupedLogo;
    for (const match of groupedLogo.matchAll(/id="([^"]+)"/g)) value = value.replaceAll(`id="${match[1]}"`, `id="${id}-${match[1]}"`).replaceAll(`#${match[1]})`, `#${id}-${match[1]})`);
    return value;
  }, [id]);

  useLayoutEffect(() => {
    reducedRef.current = reduced;
    controller.current?.refresh();
  }, [reduced]);

  useLayoutEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    primary.current?.focus({ preventScroll: true });
    let sound = prepareIntroSound();
    const particles = createIntroParticles(canvas.current!);
    const el = floating.current!;
    const curtain = root.current!.querySelector<HTMLElement>('.intro-curtain')!;
    const controls = root.current!.querySelector<HTMLElement>('.intro-actions')!;
    const reveals: Animation[] = [];
    let disposed = false, completed = false, short = false, departing = false;
    let keyboardEntry = false;
    let clickedAt: number | null = null;
    let raf = 0, safety: number | undefined, lastDraw = 0;
    const mountedAt = performance.now();
    let target = logoRef.current?.getBoundingClientRect();
    const reveal = (selector: string, frames: Keyframe[], delay: number, duration: number) => {
      const node = el.querySelector(selector);
      if (node) reveals.push(node.animate(frames, { delay, duration, fill: 'both', easing: 'cubic-bezier(.22,1,.36,1)' }));
    };
    const finishReveal = () => reveals.forEach(a => { try { a.finish(); } catch { a.cancel(); } });
    if (!reducedRef.current) {
      reveal('.brand-icon', [{ transform: 'translateX(360px)' }, { transform: 'none' }], 850, 700);
      reveal('.brand-hearts', [{ opacity: 0, transform: 'rotate(-4deg) scale(.86,.91)' }, { opacity: 1, transform: 'none' }], 140, 1030);
      reveal('.brand-dot-left', [{ opacity: 0, transform: 'translate(-15px,-12px) scale(.8)' }, { opacity: 1, transform: 'none' }], 410, 730);
      reveal('.brand-dot-right', [{ opacity: 0, transform: 'translate(15px,-16px) scale(.8)' }, { opacity: 1, transform: 'none' }], 510, 740);
      reveal('.brand-wordmark', [{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }, { opacity: 1, clipPath: 'inset(0)' }], 900, 650);
      reveal('.intro-glow', [{ opacity: 0 }, { opacity: .22, offset: .5 }, { opacity: 0 }], 40, 1800);
      reveal('.brand-sheen', [{ opacity: 0 }, { opacity: .35, offset: .5 }, { opacity: 0 }], 160, 1500);
      reveal('.brand-light', [{ transform: 'translate(-130px,35px) rotate(-18deg)' }, { transform: 'translate(360px,-25px) rotate(-18deg)' }], 160, 1500);
    }
    const finish = () => {
      if (disposed || completed) return;
      completed = true;
      clearTimeout(safety);
      cancelAnimationFrame(raf);
      onDone();
    };
    const render = (now: number) => {
      if (disposed || completed) return;
      const elapsed = clickedAt === null ? null : now - clickedAt;
      const minimal = reducedRef.current || short;
      const g = introGeometry(innerWidth, innerHeight);
      const x = g.x - g.width / 2, y = g.y - g.width * .301 / 2;
      const flight = elapsed === null || minimal ? 0 : smooth((elapsed - timeline.flightAt) / timeline.flight);
      const tx = target ? target.left - x : 0, ty = target ? target.top - y : 0;
      const scale = target ? target.width / g.width : 1;
      Object.assign(el.style, { left: `${x}px`, top: `${y}px`, width: `${g.width}px`,
        transform: `translate(${tx * flight}px,${ty * flight - Math.sin(flight * Math.PI) * 18}px) scale(${1 + (scale - 1) * flight})`,
        filter: `brightness(${elapsed === null || minimal ? 1 : 1 + .18 * Math.exp(-(((elapsed - timeline.gather) / 110) ** 2))})` });
      if (elapsed !== null) {
        if (!departing && (minimal || elapsed >= timeline.flightAt)) { departing = true; setPhase('departing'); }
        controls.style.opacity = `${1 - clamp(elapsed / 140)}`;
        if (minimal) root.current!.style.opacity = `${1 - smooth(elapsed / timeline.short)}`;
        else {
          root.current!.style.opacity = '1';
          curtain.style.opacity = `${1 - smooth((elapsed - timeline.fadeAt) / (timeline.fadeEnd - timeline.fadeAt))}`;
        }
        if (elapsed >= (short ? timeline.short : timeline.duration)) { finish(); return; }
      }
      if (now - lastDraw >= 32 || minimal) {
        const waitTime = ((clickedAt ?? now) - mountedAt) / 1000;
        particles.draw(waitTime, elapsed, minimal);
        lastDraw = now;
      }
      if (!document.hidden && (!reducedRef.current || clickedAt !== null)) raf = requestAnimationFrame(render);
    };
    const restart = () => {
      cancelAnimationFrame(raf);
      if (reducedRef.current) finishReveal();
      render(performance.now());
    };
    const resize = () => { particles.resize(); target = logoRef.current?.getBoundingClientRect(); restart(); };
    const visibility = () => {
      cancelAnimationFrame(raf);
      if (document.hidden) sound.dispose();
      else {
        // A waiting user may return from another tab and still choose sound.
        // After entry has started, visibility changes must never re-arm audio.
        if (clickedAt === null) { sound.dispose(); sound = prepareIntroSound(); }
        restart();
      }
    };
    const keydown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      event.preventDefault();
      keyboardEntry = true;
      if (clickedAt !== null) { root.current?.focus(); return; }
      primary.current?.focus();
    };
    controller.current = {
      enter(keyboard) {
        if (clickedAt !== null || disposed) return;
        keyboardEntry = keyboard;
        clickedAt = performance.now();
        short = reducedRef.current;
        sound.start(reducedRef.current, clickedAt);
        finishReveal();
        setPhase(short ? 'departing' : 'gathering');
        root.current?.focus({ preventScroll: true });
        // A safety timeout exists only after explicit entry, never while waiting.
        safety = window.setTimeout(finish, (short ? timeline.short : timeline.duration) + 400);
        restart();
      },
      refresh: restart,
    };
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', visibility);
    root.current!.addEventListener('keydown', keydown);
    const dialog = root.current!;
    restart();
    return () => {
      disposed = true;
      controller.current = null;
      sound.dispose();
      cancelAnimationFrame(raf); clearTimeout(safety);
      reveals.forEach(a => a.cancel());
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', visibility);
      dialog.removeEventListener('keydown', keydown);
      document.body.style.overflow = previousOverflow;
      // React removes inert in the same commit; focus after that commit.
      queueMicrotask(() => {
        // Pointer entry lands on the non-interactive home container. Focusing
        // the brand link here inherits the dialog's :focus-visible state.
        const destination = completed
          ? logoRef.current?.closest<HTMLElement>(keyboardEntry ? 'a' : '#home')
          : previousFocus;
        if (destination?.isConnected && !destination.closest('[inert]')) destination.focus({ preventScroll: true });
      });
    };
  }, [logoRef, onDone]);

  return <div ref={root} className={`intro${reduced ? ' intro-reduced' : ''}`} data-phase={phase} role="dialog" aria-modal="true" aria-label="欢迎来到爱爱短剧" tabIndex={-1}>
    <div className="intro-curtain" />
    <canvas ref={canvas} className="intro-particles" aria-hidden="true" />
    <div ref={floating} className="intro-logo" aria-hidden="true"><div className="intro-svg" dangerouslySetInnerHTML={{ __html: markup }} /></div>
    <div className="intro-actions">
      <button ref={primary} className="intro-enter" disabled={phase !== 'waiting'} onClick={event => controller.current?.enter(event.detail === 0)}>进入爱爱</button>
    </div>
  </div>;
}
