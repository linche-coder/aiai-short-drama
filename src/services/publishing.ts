import type{Content}from'../types/content';import{validatePublication}from'./rules';import{accountService}from'./membership';
export interface PublishResult {ok:false;issues:ReturnType<typeof validatePublication>;message:string;simulation:true}
export async function simulatePublish(draft:Partial<Content>):Promise<PublishResult>{
 const issues=validatePublication(draft,[]);
 if(!import.meta.env.DEV||accountService.getSnapshot().role!=='content_editor')return{ok:false,issues:[{field:'role',message:'需要后台角色；会员身份不能授权此操作'}],message:'无权执行',simulation:true};
 return{ok:false,issues,message:issues.length?'校验未通过，未发布任何内容。':'本地校验完成；正式发布服务未接入，未发布。',simulation:true};
}
