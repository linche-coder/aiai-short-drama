import type {Campaign,Content} from '../types/content';
import horizontalCoverManifest from './horizontalCoverManifest.json';

const covers=import.meta.glob('./assets/landscape/*.webp',{eager:true,query:'?url',import:'default'}) as Record<string,string>;

// Local cover previews only; story, rights, and release details have not been verified.
export const adultPreview:Content[]=horizontalCoverManifest.map(item=>{
 const cover=covers[`./assets/landscape/${item.asset}`];
 return {id:item.id,title:item.title,synopsis:'封面预览，剧情资料待补充。',tagline:'',tags:['短剧'],genre:'短剧',format:'live_action_drama',content_zone:'adult',age_rating:null,region_allowlist:[],rights_status:'pending',rights:null,series_id:null,publication_status:'draft',cover,thumbnail:cover,largeCover:cover,ambient:cover,cover_origin:'provided',access_tier:'free',original:false,published_at:null,update_status:'unknown',is_demo:true};
});

export const adultCampaigns:Campaign[]=[];
