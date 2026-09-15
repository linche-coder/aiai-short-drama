import {useEffect,useRef} from 'react';
import {useRouter} from './Router';
/** Only a new navigation entry may reposition the page; replacing filter hashes never does. */
export function useHomeNavigation(entering:boolean){
 const {route}=useRouter();const positioned=useRef<number|null>(null);
 useEffect(()=>{if(entering||positioned.current===route.key)return;positioned.current=route.key;
 if(route.restore)window.scrollTo({top:route.scroll,behavior:'instant'});
 else {const id=route.hash==='#latest'?'latest':['#popular','#results'].includes(route.hash)?'popular':'home';document.getElementById(id)?.scrollIntoView({behavior:'instant'});}
 },[entering,route.key,route.restore,route.scroll,route.hash]);
}
