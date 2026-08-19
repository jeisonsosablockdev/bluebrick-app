export interface InvestorHoldingEntity {
  assetId: string;
  propertyName: string;
  location: string;
  fractionsOwned: number;
  totalInvestedUsd: number;
  currentValuationUsd: number;
  estimatedApyPercent: number;
  imageUrl: string;
}
