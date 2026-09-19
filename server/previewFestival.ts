import {randomUUID,scryptSync,timingSafeEqual} from 'node:crypto';
import {festivalConfig,festivalPhase,type FestivalConfig,type FestivalData,type FestivalReward} from '../src/services/festivalModel';
import {newWallet,grantMonthly,type PointsWallet} from '../src/services/pointsModel';
import type {Tier} from '../src/types/content';

export interface PreviewUser {account:string;nickname:string;tier:Tier;membership:null;salt:string;hash:string}
interface Invitation {id:string;activityId:string;inviter:string;invitee:string;createdAt:string;rewarded:boolean}
export interface FestivalState {users:Record<string,PreviewUser>;codes:Record<string,string>;attributions:Record<string,string>;invitations:Invitation[];rewards:Record<string,FestivalReward[]>}
export const emptyFestival=():FestivalState=>({users:{},codes:{},attributions:{},invitations:[],rewards:{}});
export type FestivalLedger={wallets:Record<string,PointsWallet>;festival?:FestivalState};
export const previewFestivalConfig:FestivalConfig={...festivalConfig,enabled:true};
export function authenticate(user:PreviewUser|undefined,password:unknown){if(!user||typeof password!=='string'||password.length>64)return false;return timingSafeEqual(Buffer.from(user.hash,'hex'),scryptSync(password,user.salt,64));}
function reward(state:FestivalLedger,userId:string,kind:FestivalReward['kind'],config:FestivalConfig,invitationId?:string){
 const f=state.festival??(state.festival=emptyFestival()),records=f.rewards[userId]??(f.rewards[userId]=[]);
 if(records.some(r=>r.activityId===config.id&&r.kind===kind&&(kind==='participation'||r.invitationId===invitationId)))return false;
 const wallet=state.wallets[userId]??(state.wallets[userId]=newWallet()),amount=kind==='participation'?config.participation:config.invitation,id=randomUUID(),transactionId=randomUUID(),createdAt=new Date().toISOString();
 wallet.pointsBalance+=amount;
 wallet.transactions.unshift({id:transactionId,type:kind==='participation'?'festival_participation':'festival_invitation',title:kind==='participation'?'双节活动参与奖励':'双节活动邀请奖励',amount,balanceAfter:wallet.pointsBalance,createdAt,activityId:config.id,rewardId:id,...(invitationId?{invitationId}:{})});
 records.unshift({id,activityId:config.id,kind,amount,createdAt,transactionId,...(invitationId?{invitationId}:{})});return true;
}
export function festivalSummary(state:FestivalLedger,userId:string|null,config=previewFestivalConfig):FestivalData{
 const f=state.festival??(state.festival=emptyFestival());
 if(userId&&!f.codes[userId])f.codes[userId]=randomUUID();
 const records=userId?(f.rewards[userId]??[]).filter(r=>r.activityId===config.id):[],participationReward=records.filter(r=>r.kind==='participation').reduce((n,r)=>n+r.amount,0),invitationReward=records.filter(r=>r.kind==='invitation').reduce((n,r)=>n+r.amount,0);
 const invitations=f.invitations.filter(i=>i.inviter===userId&&i.activityId===config.id);
 return {activityId:config.id,phase:festivalPhase(config),startsAt:config.startsAt,endsAt:config.endsAt,demo:true,claimed:records.some(r=>r.kind==='participation'),invitationCode:userId?f.codes[userId]:null,successfulInvites:invitations.length,rewardedInvites:invitations.filter(i=>i.rewarded).length,participationReward,invitationReward,totalReward:participationReward+invitationReward,records};
}
export function claimFestival(state:FestivalLedger,userId:string,tier:Tier,config=previewFestivalConfig){
 const current=festivalSummary(state,userId,config);if(current.claimed)return {...current,awarded:false};
 if(current.phase!=='active')throw new Error('activity_inactive');
 const wallet=state.wallets[userId]??(state.wallets[userId]=newWallet());grantMonthly(wallet,userId,tier);
 const awarded=reward(state,userId,'participation',config);return {...festivalSummary(state,userId,config),awarded};
}
export function bindReferral(state:FestivalLedger,code:unknown,existing:string|undefined){
 const f=state.festival??(state.festival=emptyFestival());
 if(existing&&f.attributions[existing])return existing;
 const inviter=Object.keys(f.codes).find(id=>f.codes[id]===code);if(!inviter)throw new Error('invalid_invitation');
 const token=randomUUID();f.attributions[token]=inviter;return token;
}
export function registerFestivalUser(state:FestivalLedger,input:Record<string,unknown>,reserved:string[],attribution:string|undefined,config=previewFestivalConfig){
 const f=state.festival??(state.festival=emptyFestival()),account=String(input.account||''),password=String(input.password||'');
 if(!/^[A-Za-z0-9_]{4,20}$/.test(account)||password.length<8||password.length>64)throw new Error('invalid_registration');
 if([...reserved,...Object.keys(f.users)].some(id=>id.toLowerCase()===account.toLowerCase()))throw new Error('account_exists');
 const salt=randomUUID();const user:PreviewUser={account,nickname:account,tier:'free',membership:null,salt,hash:scryptSync(password,salt,64).toString('hex')};f.users[account]=user;
 const inviter=attribution?f.attributions[attribution]:undefined;
 if(inviter&&inviter!==account&&festivalPhase(config)==='active'&&!f.invitations.some(i=>i.invitee===account)){
  const invitation:Invitation={id:randomUUID(),activityId:config.id,inviter,invitee:account,createdAt:new Date().toISOString(),rewarded:false};
  const count=f.invitations.filter(i=>i.activityId===config.id&&i.inviter===inviter&&i.rewarded).length;
  if(count<config.maxInvites)invitation.rewarded=reward(state,inviter,'invitation',config,invitation.id);
  f.invitations.push(invitation);
 }
 return user;
}
