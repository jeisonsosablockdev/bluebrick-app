export interface InvestmentStrategyModel {
  id: string;
  name: string;
  category: 'Fix & Flip' | 'Renting' | 'Land Development';
  totalAumUsd: number;
  activePropertiesCount: number;
  averageApyPercentage: number;
  onChainVerificationAddress: string;
}

export interface TransparencyPlatformSummary {
  totalAssetsValueUsd: number;
  totalDividendsPaidUsd: number;
  verifiedWalletsCount: number;
  lastAuditTimestamp: string;
}
