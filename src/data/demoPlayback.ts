import {episodePricing} from '../services/pointsModel';
﻿import type {Content,Tier} from '../types/content';
import type {Episode} from './videoSources';
import {canSee} from '../services/rules';

export interface DemoEpisode extends Episode {tier:Tier}
// Explicitly separate test media from Content.media and formal publication/rights.
export const demoPlayback={enabled:import.meta.env.DEV,count:episodePricing.count,groupSize:30};
export function demoEpisodes(item:Content,adultGranted=false):DemoEpisode[]{if(!demoPlayback.enabled||!item.is_demo||item.format==='article'||!canSee(item,{zone:item.content_zone,channel:'preview',adultGranted,region:null,tier:'free',sessionVerified:false}))return [];
 return Array.from({length:demoPlayback.count},(_,i)=>({id:`demo-${i+1}`,title:`第${i+1}集`,pointsCost:i<episodePricing.freeEpisodes?0:episodePricing.baseCost,tier:i<6?'free':i<30?'basic':'premium',sources:[{src:`/media/demo/${i%2?'portrait':'landscape'}.mp4`,type:'video/mp4'}]}));}

export const isDemoAvailable=(item:Content)=>demoPlayback.enabled&&item.is_demo&&item.format!=='article'&&item.publication_status!=='offline';
