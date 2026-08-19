export interface StakingPoolEntity {
  id: string;
  propertyTitle: string;
  stakedTokensCount: number;
  annualApyPercent: number;
  accruedYieldUsd: number;
  claimableYieldUsd: number;
  lockExpiryDate?: string;
}
