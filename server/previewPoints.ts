import {existsSync,readFileSync,mkdirSync,writeFileSync,renameSync} from 'node:fs';
import {dirname} from 'node:path';
import {grantMonthly,newWallet,checkIn,unlock,topUp,walletData,episodePricing,discountedCost,type PointsWallet} from '../src/services/pointsModel';
import {previewCatalog} from '../src/data/previewCatalog';
import type {Tier,Content} from '../src/types/content';
import {authenticate,bindReferral,claimFestival,festivalSummary,registerFestivalUser,previewFestivalConfig,type FestivalState} from './previewFestival';
import type {FestivalConfig} from '../src/services/festivalModel';

// Development only. One process serializes each complete mutation, then atomically
// replaces the persisted ledger. No client-provided balance, price or tier is used.
export function createPreviewPoints(file:string,festivalConfig:FestivalConfig=previewFestivalConfig){
 type State={wallets:Record<string,PointsWallet>;members:Record<string,{tier:Tier;expiresAt:string}>;festival?:FestivalState};
 let state:State=existsSync(file)?JSON.parse(readFileSync(file,'utf8')):{wallets:{},members:{}};
 function commit(next:State){mkdirSync(dirname(file),{recursive:true});writeFileSync(file+'.tmp',JSON.stringify(next),'utf8');renameSync(file+'.tmp',file);state=next;}
 const tierFor=(id:string,fallback:Tier)=>{const member=state.members[id];return member?Date.parse(member.expiresAt)>Date.now()?member.tier:'free':fallback;};
 return {
  member:(id:string)=>state.members[id],tierFor,
  authenticate(id:string,password:unknown){const user=state.festival?.users[id];return authenticate(user,password)?user:undefined;},
  register(input:Record<string,unknown>,reserved:string[],attribution?:string){const next=structuredClone(state),user=registerFestivalUser(next,input,reserved,attribution,festivalConfig);commit(next);return user;},
  referral(code:unknown,existing?:string){const next=structuredClone(state),token=bindReferral(next,code,existing);commit(next);return token;},
  festival(userId:string|null,tier:Tier='free',claim=false){const next=structuredClone(state),data=claim&&userId?claimFestival(next,userId,tierFor(userId,tier),festivalConfig):festivalSummary(next,userId,festivalConfig);commit(next);return data;},
  run(userId:string,fallback:Tier,path:string,input:Record<string,unknown>,adultItems:Content[]=[]){
   const next=structuredClone(state),wallet=next.wallets[userId]??(next.wallets[userId]=newWallet());let tier=tierFor(userId,fallback);
   grantMonthly(wallet,userId,tier);
   let reward:number|undefined;
   if(path.endsWith('/check-in')){const before=wallet.pointsBalance;checkIn(wallet);reward=wallet.pointsBalance-before;}
   if(path.endsWith('/demo-purchase')){
    const offer=String(input.offerId||''),key=String(input.idempotencyKey||'');
    if(offer.startsWith('points-'))topUp(wallet,offer,key);
    else {
     if(!['joy-month','premium-month','joy-year','premium-year'].includes(offer)||!key||key.length>128)throw new Error('invalid_offer');
     if(wallet.requests[key]&&wallet.requests[key]!==offer)throw new Error('idempotency_conflict');
     if(!wallet.requests[key]){tier=offer.startsWith('joy')?'basic':'premium';const end=new Date(Math.max(Date.now(),Date.parse(next.members[userId]?.expiresAt||'')||0));end.setUTCMonth(end.getUTCMonth()+(offer.endsWith('year')?12:1));next.members[userId]={tier,expiresAt:end.toISOString()};wallet.requests[key]=offer;grantMonthly(wallet,userId,tier);}
    }
   }
   const match=path.match(/^\/api\/v1\/contents\/([^/]+)\/episodes\/([^/]+)\/unlock$/);
   if(match){
    const contentId=decodeURIComponent(match[1]),episodeId=decodeURIComponent(match[2]),item=[...previewCatalog,...adultItems].find(c=>c.id===contentId),number=Number(episodeId.replace(/^demo-/,''));
    if(!item||item.publication_status==='offline'||!item.is_demo||item.format==='article'||!/^demo-\d+$/.test(episodeId)||number<1||number>episodePricing.count)throw new Error('content_unavailable');
    const cost=number<=episodePricing.freeEpisodes?0:episodePricing.baseCost;
    if(input.quotedCost!==undefined&&input.quotedCost!==discountedCost(cost,tier)&&!wallet.unlocks.some(u=>u.contentId===contentId&&u.episodeId===episodeId))throw new Error('price_changed');
    unlock(wallet,{contentId,episodeId,contentTitle:item.title,episodeTitle:`第${number}集`,coverUrl:item.cover,href:`/${item.content_zone==='adult'?'18plus/':''}play/${contentId}?episode=${episodeId}`},cost,tier,String(input.idempotencyKey||''));
   }
   commit(next);return {...walletData(wallet,tier),...(reward===undefined?{}:{reward})};
  }
 };
}
