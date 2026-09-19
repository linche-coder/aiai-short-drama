import {useEffect,useState} from 'react';
import {festivalConfig,festivalPhase} from '../services/festivalModel';

// Schedule the exact boundary as well as refreshing after a suspended tab wakes up.
export function useFestivalPhase(){
 const [phase,setPhase]=useState(()=>festivalPhase(festivalConfig));
 useEffect(()=>{
  let timer:ReturnType<typeof setTimeout>;
  const update=()=>{clearTimeout(timer);setPhase(festivalPhase(festivalConfig));const next=[festivalConfig.startsAt,festivalConfig.endsAt].map(Date.parse).find(time=>time>Date.now());if(next)timer=setTimeout(update,Math.min(next-Date.now()+10,2147483647));};
  update();window.addEventListener('focus',update);document.addEventListener('visibilitychange',update);
  return()=>{clearTimeout(timer);window.removeEventListener('focus',update);document.removeEventListener('visibilitychange',update);};
 },[]);
 return phase;
}
