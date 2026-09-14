import type { AccessContext, Content, ContentZone, Rights, Tier, Campaign } from '../types/content';
import { hasPlayableMedia } from '../data/media';
export type Issue = { field: string; message: string };
export const tierIncludes = (owned: Tier, needed: string) => needed!=='coin_reserved' && (['free','basic','premium'].indexOf(owned) >= ['free','basic','premium'].indexOf(needed)) && ['free','basic','premium'].includes(needed);
export const hasBaseBenefits = (tier: Tier) => tierIncludes(tier,'basic');
export function validRights(rights: Rights | null | undefined, regions: string[], now=Date.now(), verifiedProofs: readonly Rights[] = [], scope='stream') {
  const verified=verifiedProofs.find(proof=>proof.proof_id===rights?.proof_id);
  return !!verified && !!rights && verified.scope.includes(scope) && regions.length>0 && regions.every(r=>verified.regions.includes(r)) && Date.parse(verified.valid_from)<=now && Date.parse(verified.valid_until)>now;
}
export function validatePublication(item: Partial<Content>, validSeries: string[] = [], now=Date.now(), verifiedProofs: readonly Rights[] = []): Issue[] {
  const errors:Issue[]=[];const add=(field:string,message:string)=>errors.push({field,message});
  if(!item.title?.trim())add('title','请填写作品名称');
  if(!['green','adult'].includes(item.content_zone??''))add('content_zone','请选择内容域');
  if(!['live_action_drama','motion_comic','short_film','article'].includes(item.format??''))add('format','请选择内容格式');
  const rating=item.age_rating;
  if(!rating?.system || !rating.value || !Number.isInteger(rating.minimum_age) || rating.minimum_age<0 || rating.minimum_age>21)add('age_rating','填写分级体系、等级和最低年龄');
  else if((item.content_zone==='adult' && rating.minimum_age<18)||(item.content_zone==='green'&&rating.minimum_age>=18))add('age_rating','分级与内容域不一致');
  const regions=item.region_allowlist??[];
  if(!regions.length||regions.some(r=>!/^[A-Z]{2}$/.test(r)||r==='ZZ'))add('region_allowlist','选择已配置且明确的地区');
  if(item.rights_status!=='verified'||!validRights(item.rights,regions,now,verifiedProofs,item.format==='article'?'read':'stream'))add('rights','需要可核验、有效且覆盖发布地区的播放授权证明');
  if(['live_action_drama','motion_comic'].includes(item.format??'')&&(!item.series_id||!validSeries.includes(item.series_id)))add('series_id','关联有效系列');
  if(!item.cover||!item.largeCover||!item.thumbnail||!item.ambient)add('cover','请配置完整的显式海报资源');
  if(item.format==='article') {if(!item.body?.trim())add('body','文章必须有正文');if('media' in item && item.media)add('body','文章不能包含视频字段');}
  else if(!hasPlayableMedia(item.media))add('media','视频发布需要实际片源或选集');
  if(!['free','basic','premium','coin_reserved'].includes(item.access_tier??''))add('access_tier','请选择权益规则');
  if(item.is_demo!==false)add('is_demo','演示资料不能发布为正式作品');
  return errors;
}
export function canSee(item: Content, context: AccessContext) {
  if(item.content_zone!==context.zone || (item.content_zone==='adult'&&!context.adultGranted))return false;
  if(context.channel==='preview'&&item.is_demo)return item.format!=='article' && item.publication_status!=='offline';
  return item.publication_status==='published'&&!item.is_demo&&validatePublication(item,context.approvedSeries??[],Date.now(),context.verifiedRights??[]).length===0&&!!context.region&&item.region_allowlist.includes(context.region);
}
export const planBenefits=(tier:Tier)=>({adFree:hasBaseBenefits(tier),quality:hasBaseBenefits(tier)?'hd' as const:'standard' as const,includesBasic:hasBaseBenefits(tier),includesPremium:tier==='premium'});
export function contentEntitlement(item:Content,context:AccessContext){
 const authorized=canSee(item,context)&&context.sessionVerified&&!!context.region&&item.region_allowlist.includes(context.region)&&validRights(item.rights,item.region_allowlist,Date.now(),context.verifiedRights??[],item.format==='article'?'read':'stream');
 const included=authorized&&tierIncludes(context.tier,item.access_tier);
 const availableEpisodes=item.format==='article'?[]:(item.media?.episodes??[]).filter(e=>hasPlayableMedia({sources:e.sources})).map(e=>e.id);
 return {included,adFree:included&&planBenefits(context.tier).adFree,quality:included?planBenefits(context.tier).quality:'standard' as const,previewEpisodeIds:authorized&&!included?(item.preview_episode_ids??[]).filter(id=>availableEpisodes.includes(id)):[]};
}
export function playbackDecision(item: Content,context: AccessContext): {allowed:boolean; reason:string} {
  if(!canSee(item,context))return {allowed:false,reason:'当前无法访问这部作品'};
  if(item.format==='article')return {allowed:false,reason:'文章请使用阅读页面'};
  if(!hasPlayableMedia(item.media))return {allowed:false,reason:'即将上线 · 片源待接入'};
  if(!context.sessionVerified)return {allowed:false,reason:'播放授权服务尚未接入'};
  if(!context.region || !item.region_allowlist.includes(context.region) || !validRights(item.rights,item.region_allowlist,Date.now(),context.verifiedRights??[]))return {allowed:false,reason:'作品播放授权暂不可用'};
  if(!contentEntitlement(item,context).included)return {allowed:false,reason:'当前权益不包含此作品'};
  return {allowed:true,reason:''};
}
export function filterInZone(items: Content[],context: AccessContext,query='',genre='全部') {const q=query.trim().toLocaleLowerCase();return items.filter(item=>canSee(item,context)&&(genre==='全部'||item.genre===genre)&&(!q||[item.title,...item.tags].some(text=>text.toLocaleLowerCase().includes(q))));}
export function trustedPath(value:string,zone?:ContentZone) {
  if(!value.startsWith('/')||value.startsWith('//')||/[\\\r\n]/.test(value))return '/';
  try{const u=new URL(value,'https://local.invalid');if(u.origin!=='https://local.invalid')return '/';if(zone==='green'&&u.pathname.startsWith('/18plus'))return '/';return u.pathname+u.search+u.hash;}catch{return '/';}
}

export function visibleCampaigns(items:Campaign[],context:AccessContext,now=Date.now()){return items.filter(item=>item.content_zone===context.zone&&(item.visibility==='public'||context.adultGranted)&&(item.content_zone!=='adult'||context.adultGranted)&&item.status!=='disabled'&&(item.status==='active'||context.channel==='preview')&&Date.parse(item.starts_at)<=now&&Date.parse(item.ends_at)>now&&trustedPath(item.target,context.zone)===item.target);}
