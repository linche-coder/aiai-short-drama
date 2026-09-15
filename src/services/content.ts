import type { Content, AccessContext } from '../types/content';
import { previewCatalog } from '../data/previewCatalog';
import { filterInZone, canSee, visibleCampaigns } from './rules';
import { accessService } from './access';
export const greenContext:AccessContext={zone:'green',channel:'preview',adultGranted:false,region:null,tier:'free',sessionVerified:false};
const loadAdultPreview=()=>import('../dev/adultPreview');
const pause=(signal?:AbortSignal)=>new Promise<void>((resolve,reject)=>{if(signal?.aborted){reject(new DOMException('Aborted','AbortError'));return;}const timer=setTimeout(done,100);function abort(){clearTimeout(timer);reject(new DOMException('Aborted','AbortError'));}function done(){signal?.removeEventListener('abort',abort);resolve();}signal?.addEventListener('abort',abort,{once:true});});
let scenario:'ready'|'empty'|'error'='ready';
export const contentService={
 setPreviewScenario(value:'ready'|'empty'|'error'){if(import.meta.env.DEV)scenario=value;},getPreviewScenario:()=>scenario,
 async list(context:AccessContext,signal?:AbortSignal):Promise<Content[]> {
  await pause(signal);
  if(context.zone==='green'){if(import.meta.env.DEV&&scenario==='error')throw new Error('内容加载失败，请重试');return import.meta.env.DEV&&scenario==='empty'?[]:filterInZone(previewCatalog,context);}
  if(!await accessService.verify(signal))throw new Error('请重新完成访问确认');
  if(scenario==='error')throw new Error('内容加载失败，请重试');
  if(scenario==='empty')return [];
  const { adultPreview }=await loadAdultPreview!();
  if(signal?.aborted||!accessService.isGranted())throw new DOMException('Aborted','AbortError');
  return filterInZone(adultPreview,context);
 },
 async campaigns(context:AccessContext,signal?:AbortSignal){if(context.zone!=='adult'||!await accessService.verify(signal)||!import.meta.env.DEV)return [];const{adultCampaigns}=await loadAdultPreview!();if(signal?.aborted||!accessService.isGranted())return [];return visibleCampaigns(adultCampaigns,context);},
 async detail(id:string,context:AccessContext,signal?:AbortSignal) {const list=await this.list(context,signal);const item=list.find(c=>c.id===id);return item&&canSee(item,context)?item:null;},
 search:filterInZone,
 recommendations(items:Content[],context:AccessContext,id?:string){return filterInZone(items,context).filter(item=>item.id!==id).slice(0,4);},
};
