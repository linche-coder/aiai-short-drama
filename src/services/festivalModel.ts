export const festivalConfig={id:'midautumn-national-2026',path:'/festival',startsAt:null as string|null,endsAt:null as string|null,enabled:false,participation:20,invitation:20,maxInvites:5};
export type FestivalPhase='upcoming'|'active'|'ended';
export type FestivalConfig=typeof festivalConfig;
export function festivalPhase(config:FestivalConfig,now=new Date()):FestivalPhase{
 if(config.endsAt&&now.getTime()>=Date.parse(config.endsAt))return 'ended';
 if(!config.enabled||(config.startsAt&&now.getTime()<Date.parse(config.startsAt)))return 'upcoming';
 return 'active';
}
export interface FestivalReward {id:string;activityId:string;kind:'participation'|'invitation';amount:number;createdAt:string;invitationId?:string;transactionId:string}
export interface FestivalData {activityId:string;phase:FestivalPhase;startsAt:string|null;endsAt:string|null;demo:boolean;claimed:boolean;invitationCode:string|null;successfulInvites:number;rewardedInvites:number;participationReward:number;invitationReward:number;totalReward:number;records:FestivalReward[];awarded?:boolean}
