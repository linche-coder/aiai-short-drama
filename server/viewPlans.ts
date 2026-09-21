/** Server-owned catalog. Amounts are integer CNY cents. */
export const viewPlans = [
  {id:'view-month', title:'畅看月卡', total:8800, durationDays:30, tier:'basic', validity:'fixed'},
  {id:'view-quarter', title:'畅看季卡', total:18800, durationDays:90, tier:'premium', validity:'fixed'},
  {id:'view-forever', title:'永久会员', total:38800, durationDays:null, tier:'premium', validity:'permanent'},
] as const;

export type ViewPlan = (typeof viewPlans)[number];
export const viewPlan = (id:unknown) => viewPlans.find(plan=>plan.id===id);
