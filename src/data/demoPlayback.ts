import type {Content,Tier} from '../types/content';
import type {Episode} from './videoSources';
import {canSee} from '../services/rules';

export interface DemoEpisode extends Episode {tier:Tier}
// Explicitly separate test media from Content.media and formal publication/rights.
export const demoPlayback={enabled:true,count:36,groupSize:30};
export function demoEpisodes(item:Content,adultGranted=false):DemoEpisode[]{if(!demoPlayback.enabled||!item.is_demo||item.format==='article'||!canSee(item,{zone:item.content_zone,channel:'preview',adultGranted,region:null,tier:'free',sessionVerified:false}))return [];
 return Array.from({length:demoPlayback.count},(_,i)=>({id:`demo-${i+1}`,title:`第${i+1}集`,tier:i<6?'free':i<30?'basic':'premium',sources:[{src:`/media/demo/${i%2?'portrait':'landscape'}.mp4`,type:'video/mp4'}]}));}
export const demoUnlocked=(_episode:DemoEpisode,_tier:Tier)=>true;

export const isDemoAvailable=(item:Content)=>demoPlayback.enabled&&item.is_demo&&item.format!=='article'&&item.publication_status!=='offline';
