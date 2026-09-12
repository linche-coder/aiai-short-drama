import { createContext, useContext, useLayoutEffect, useState } from 'react';
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { cancelResultsTransition } from '../motion/transitions';
import { saveHomeState } from './homeState';

type Route = { path: string; hash: string; key: number; restore: boolean; scroll: number };
type Entry = { aiai?: { scroll: number; restore: boolean } };
const RouterContext = createContext<{ route: Route; navigate: (to: string, restore?: boolean) => void }>(null!);
const read = (): Route => ({ path: location.pathname, hash: location.hash, key: performance.now(), restore: (history.state as Entry)?.aiai?.restore ?? false, scroll: (history.state as Entry)?.aiai?.scroll ?? 0 });
const storeScroll = () => history.replaceState({ ...history.state, aiai: { scroll: scrollY, restore: true } }, '');

/** One History API owner for both routes and home anchors; links remain native. */
export function Router({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState(read);
  useLayoutEffect(() => {
    const previous = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    const pop = () => { cancelResultsTransition(); setRoute({ ...read(), restore: true }); };
    const scroll = () => storeScroll();
    window.addEventListener('popstate', pop); window.addEventListener('scroll', scroll, { passive: true });
    return () => { history.scrollRestoration = previous; window.removeEventListener('popstate', pop); window.removeEventListener('scroll', scroll); };
  }, []);
  useLayoutEffect(() => {
    if (route.path === '/' && route.restore) {
      let saved = route.scroll;
      if (!saved) { try { saved = JSON.parse(sessionStorage.getItem('aiai:home') || '{}').scroll ?? 0; } catch { /* optional storage */ } }
      window.scrollTo({ top: saved, behavior: 'instant' });
    } else if (route.hash) { let anchor=route.hash.slice(1);try{anchor=decodeURIComponent(anchor);}catch{/* malformed anchors simply have no target */}document.getElementById(anchor)?.scrollIntoView({ behavior: 'instant' }); }
    else window.scrollTo({ top: 0, behavior: 'instant' });
  }, [route]);
  const navigate = (to: string, restore = false) => {
    const url = new URL(to, location.origin);
    if (url.origin !== location.origin) { location.assign(url.href); return; }
    storeScroll(); if(location.pathname==='/')saveHomeState({scroll:scrollY}); cancelResultsTransition();
    history.pushState({ aiai: { scroll: 0, restore } }, '', url.pathname + url.search + url.hash);
    setRoute(read());
  };
  return <RouterContext.Provider value={{ route, navigate }}>{children}</RouterContext.Provider>;
}
export const useRouter = () => useContext(RouterContext);
export function Link({ href, restoreHome = false, onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; restoreHome?: boolean }) {
  const { navigate } = useRouter();
  const click = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || props.target && props.target !== '_self' || props.download !== undefined) return;
    const url = new URL(href, location.href);
    if (url.origin !== location.origin) return;
    event.preventDefault(); navigate(url.pathname + url.search + url.hash, restoreHome);
  };
  return <a {...props} href={href} onClick={click} />;
}
export const dramaHref = (id: string) => `/play/${encodeURIComponent(id)}`;
