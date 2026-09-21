// Shared presentation contract. The server validates every request against this fixed list.
export const memberRedemptionTiers = [
 {id:'day-1',cost:20,days:1,hours:24},
 {id:'day-3',cost:50,days:3,hours:72},
 {id:'day-7',cost:100,days:7,hours:168},
] as const;
export type MemberRedemptionId = typeof memberRedemptionTiers[number]['id'];
export const memberRedemptionTier = (id:unknown) => memberRedemptionTiers.find(tier=>tier.id===id);
