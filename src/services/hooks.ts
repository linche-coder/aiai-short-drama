import {useEffect,useState,useSyncExternalStore} from 'react';
import type {Content,AccessContext,Campaign} from '../types/content';
import {contentService,greenContext} from './content';
import {accessService} from './access';
export const useAccess=()=>useSyncExternalStore(accessService.subscribe,accessService.getSnapshot,accessService.getSnapshot);
export function useContents(context:AccessContext=greenContext){
 const [state,setState]=useState<{items:Content[];loading:boolean;error:string}>({items:[],loading:true,error:''});const[retry,setRetry]=useState(0);
 useEffect(()=>{const abort=new AbortController();setState({items:[],loading:true,error:''});contentService.list(context,abort.signal).then(items=>{if(!abort.signal.aborted)setState({items,loading:false,error:''});},error=>{if(!abort.signal.aborted)setState({items:[],loading:false,error:error.message});});return()=>abort.abort();},[context.zone,context.adultGranted,context.tier,context.channel,retry]);
 return {...state,retry:()=>setRetry(n=>n+1)};
}

export function useCampaigns(context:AccessContext){const[items,set]=useState<Campaign[]>([]);useEffect(()=>{const abort=new AbortController();void contentService.campaigns(context,abort.signal).then(items=>{if(!abort.signal.aborted)set(items);}).catch(()=>{});return()=>abort.abort();},[context.zone,context.adultGranted]);return items;}
