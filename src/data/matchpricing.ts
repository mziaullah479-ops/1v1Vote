export const MATCH_REQUEST_PLANS = [
  { durationHours: 24, label: '24 hours', amountPkr: 499 },
  { durationHours: 72, label: '3 days', amountPkr: 999 },
  { durationHours: 168, label: '7 days', amountPkr: 1999 },
] as const;

export type MatchRequestPlan = (typeof MATCH_REQUEST_PLANS)[number];
