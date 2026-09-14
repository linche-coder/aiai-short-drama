import {test,expect} from '@playwright/test';
import {previewCatalog}from'../../src/data/previewCatalog';
import {canSee,filterInZone,validatePublication,validRights,tierIncludes,hasBaseBenefits,trustedPath,playbackDecision}from'../../src/services/rules';
import {slotFor}from'../../src/components/Carousel';
import type{Content,AccessContext,Rights}from'../../src/types/content';
const green:AccessContext={zone:'green',channel:'preview',region:null,adultGranted:false,tier:'free',sessionVerified:false};
test('visibility and search isolate zones; offline, article and archived content fail closed',()=>{
 const item=previewCatalog[0],privateItem={...item,content_zone:'adult'} as Content;
 expect(canSee(item,green)).toBe(true);expect(canSee(privateItem,green)).toBe(false);expect(filterInZone([item,privateItem],green)).toEqual([item]);
 expect(canSee(privateItem,{...green,zone:'adult'})).toBe(false);expect(canSee(privateItem,{...green,zone:'adult',adultGranted:true})).toBe(true);
 expect(canSee({...item,publication_status:'offline'},green)).toBe(false);expect(canSee({...item,is_demo:false},green)).toBe(false);
 expect(canSee({...item,format:'article',body:'Draft',media:undefined},green)).toBe(false);expect(playbackDecision(item,green).allowed).toBe(false);
 expect(previewCatalog).toHaveLength(12);expect(previewCatalog.every(c=>!c.id.startsWith('drama-')&&c.is_demo&&c.rights_status==='pending'&&c.age_rating?.system==='本地演示分级（非发行评级）')).toBe(true);
});
test('publisher rejects missing fields and typed proof IDs; canonical proof scope dates and regions control approval',()=>{
 const now=Date.parse('2026-09-14T00:00:00Z');const rights:Rights={proof_id:'fixture-only',scope:['stream'],regions:['JP'],valid_from:'2026-01-01',valid_until:'2027-01-01'};
 const valid:Content={...previewCatalog[0],is_demo:false,age_rating:{system:'fixture',value:'all',minimum_age:0},rights,rights_status:'verified',region_allowlist:['JP'],series_id:'fixture-series',media:{sources:[{src:'/fixture.mp4'}]}};
 expect(validatePublication(valid,['fixture-series'],now)).toEqual(expect.arrayContaining([expect.objectContaining({field:'rights'})]));
 expect(validatePublication(valid,['fixture-series'],now,[rights])).toEqual([]);
 for(const field of ['content_zone','age_rating','region_allowlist','rights','series_id','cover','media']as const){const value={...valid,[field]:field==='region_allowlist'?[]:undefined};expect(validatePublication(value,['fixture-series'],now,[rights]).some(e=>e.field===field)).toBe(true);}
 expect(validRights(rights,['US'],now,[rights])).toBe(false);expect(validRights(rights,['JP'],Date.parse('2028-01-01'),[rights])).toBe(false);
 expect(validatePublication({...valid,age_rating:{system:'fixture',value:'bad',minimum_age:-1}},['fixture-series'],now,[rights]).some(e=>e.field==='age_rating')).toBe(true);
 const article={...valid,format:'article' as const,media:undefined,body:'Fixture text',series_id:null};expect(validatePublication(article,[],now,[rights]).some(e=>e.field==='rights')).toBe(true);
 expect(validatePublication(article,[],now,[{...rights,scope:['read']}])).toEqual([]);
});
test('included membership and safe internal destinations are centralized',()=>{
 expect(tierIncludes('premium','basic')).toBe(true);expect(hasBaseBenefits('premium')).toBe(true);expect(tierIncludes('basic','premium')).toBe(false);expect(tierIncludes('premium','coin_reserved')).toBe(false);
 for(const url of ['https://evil.invalid','//evil.invalid','/\\evil.invalid','javascript:alert(1)'])expect(trustedPath(url)).toBe('/');expect(trustedPath('/18plus?tab=original','green')).toBe('/');expect(trustedPath('/shorts?genre=x')).toBe('/shorts?genre=x');
});
test('carousel positions support empty, single, small and normal catalogs without duplicate slots',()=>{
 expect(slotFor(0,0,0)).toBe(0);for(const count of [1,2,3,4,5])for(let index=-12;index<12;index++){const slots=Array.from({length:count},(_,i)=>slotFor(i,index,count));expect(new Set(slots).size).toBe(count);expect(slots.filter(v=>v===0)).toHaveLength(1);expect(slots.every(Number.isFinite)).toBe(true);}
});

test('content entitlements require verified scope, include base and limit preview episode IDs',async()=>{
 const{contentEntitlement,planBenefits}=await import('../../src/services/rules');const proof:Rights={proof_id:'verified-fixture',scope:['stream'],regions:['JP'],valid_from:'2020-01-01',valid_until:'2099-01-01'};
 const item:Content={...previewCatalog[0],is_demo:false,publication_status:'published',age_rating:{system:'fixture',value:'all',minimum_age:0},rights:proof,rights_status:'verified',region_allowlist:['JP'],series_id:'s',access_tier:'premium',preview_episode_ids:['e1','missing'],media:{episodes:[{id:'e1',title:'Fixture',sources:[{src:'/fixture.mp4'}]}]}};
 const context:AccessContext={...green,channel:'release',region:'JP',sessionVerified:true,tier:'premium',verifiedRights:[proof],approvedSeries:['s']};
 expect(contentEntitlement(item,context)).toMatchObject({included:true,adFree:true,quality:'hd',previewEpisodeIds:[]});expect(planBenefits('premium').includesBasic).toBe(true);
 expect(contentEntitlement(item,{...context,tier:'free'})).toMatchObject({included:false,adFree:false,previewEpisodeIds:['e1']});expect(contentEntitlement(item,{...context,sessionVerified:false}).previewEpisodeIds).toEqual([]);expect(contentEntitlement(item,{...context,region:'US'}).included).toBe(false);
});
test('campaigns validate domain, qualification, date and internal destinations',async()=>{
 const{visibleCampaigns}=await import('../../src/services/rules');const{greenCampaigns}=await import('../../src/data/previewCatalog');const now=Date.parse('2026-09-14');expect(visibleCampaigns(greenCampaigns,green,now)).toHaveLength(2);
 for(const patch of [{content_zone:'adult' as const},{visibility:'qualified' as const},{status:'disabled' as const},{ends_at:'2020-01-01'},{target:'//example.com'},{target:'/18plus'}])expect(visibleCampaigns([{...greenCampaigns[0],...patch}],green,now)).toEqual([]);
});
