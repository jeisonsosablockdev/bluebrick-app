export interface CommissionTierRules {
  tier1Percentage: number;
  tier2Percentage: number;
  minInvestmentRequiredUsd: number;
}

export const DEFAULT_COMMISSION_TIER: CommissionTierRules = {
  tier1Percentage: 5.0,
  tier2Percentage: 2.0,
  minInvestmentRequiredUsd: 100,
};
