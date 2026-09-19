export const festivalConfig={
 id:'midautumn-national-2026',path:'/festival',
 startsAt:'2026-09-19T00:00:00+08:00',endsAt:'2026-10-08T00:00:00+08:00',enabled:true,
 participation:50,invitation:50,maxInvites:5,appReward:50,
 rechargeBonus:{joyMonth:100,premiumMonth:300,joyYear:1000,premiumYear:3000},appDownloadUrl:'',
};
export const invitationMaximum=festivalConfig.invitation*festivalConfig.maxInvites;
export const taskMaximum=festivalConfig.participation+invitationMaximum+festivalConfig.appReward;
export const festivalEntryLabel=`双节福利 · 任务领${taskMaximum}积分`;
export const festivalAccessibleLabel=`双节福利，任务最高领${taskMaximum}积分，查看活动`;
const beijingDate=(value:string)=>new Date(Date.parse(value)+8*3600000).toISOString().slice(0,10);
const formatDate=(time:number)=>{const value=new Date(time+8*3600000).toISOString();const [year,month,day]=value.slice(0,10).split('-').map(Number);return `${year}年${month}月${day}日${value.slice(11,19)}`;};
export const festivalDates={short:`${beijingDate(festivalConfig.startsAt).slice(5).replace('-','.')} — ${beijingDate(new Date(Date.parse(festivalConfig.endsAt)-1000).toISOString()).slice(5).replace('-','.')}`,full:`${formatDate(Date.parse(festivalConfig.startsAt))}至${formatDate(Date.parse(festivalConfig.endsAt)-1000)}（北京时间）`};
export const festivalRechargePath='/membership?campaign=festival#festival-recharge';
export const festivalOffers=[{id:'joy-month',name:'悦享月卡',key:'joyMonth'},{id:'premium-month',name:'尊享月卡',key:'premiumMonth'},{id:'joy-year',name:'悦享年卡',key:'joyYear'},{id:'premium-year',name:'尊享年卡',key:'premiumYear'}] as const;
export function rechargeBonusFor(offerId:string,config=festivalConfig){const offer=festivalOffers.find(item=>item.id===offerId);return offer?config.rechargeBonus[offer.key]:0;}
export const festivalRewardNames={participation:'双节活动参与奖励',invitation:'双节活动邀请奖励',app:'双节活动App专享奖励',recharge:'双节会员充值加赠',recharge_reversal:'双节充值奖励回收'};
export type FestivalPhase='upcoming'|'active'|'ended';
export type FestivalConfig=typeof festivalConfig;
export function festivalPhase(config:FestivalConfig,now=new Date()):FestivalPhase{
 if(config.endsAt&&now.getTime()>=Date.parse(config.endsAt))return 'ended';
 if(!config.enabled||(config.startsAt&&now.getTime()<Date.parse(config.startsAt)))return 'upcoming';
 return 'active';
}
export interface FestivalReward {id:string;activityId:string;kind:keyof typeof festivalRewardNames;amount:number;createdAt:string;invitationId?:string;orderId?:string;transactionId:string;reversalStatus?:'complete'|'insufficient_balance';unrecoveredAmount?:number}
export interface FestivalData {activityId:string;phase:FestivalPhase;startsAt:string|null;endsAt:string|null;demo:boolean;claimed:boolean;invitationCode:string|null;successfulInvites:number;rewardedInvites:number;participationReward:number;invitationReward:number;appReward:number;rechargeReward:number;totalReward:number;records:FestivalReward[];awarded?:boolean}
