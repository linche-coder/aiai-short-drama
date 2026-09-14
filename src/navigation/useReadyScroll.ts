import {useLayoutEffect,useRef} from 'react';
import {useRouter} from './Router';
/** Restore only when asynchronous content has the final page height. */
export function useReadyScroll(ready:boolean){const{route}=useRouter();const handled=useRef<number|null>(null);useLayoutEffect(()=>{if(!ready||handled.current===route.key)return;handled.current=route.key;if(route.restore&&!route.path.startsWith('/18plus'))window.scrollTo({top:route.scroll,behavior:'instant'});},[ready,route.key,route.restore,route.scroll,route.path]);}
