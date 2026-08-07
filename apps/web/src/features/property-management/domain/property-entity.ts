export interface ManagedPropertyEntity {
  id: string;
  title: string;
  location: string;
  totalTokensSupply: number;
  availableTokens: number;
  tokenPriceUsd: number;
  expectedApyPercent: number;
  status: 'ACTIVE' | 'DRAFT' | 'SOLD_OUT';
  brochureUrl?: string;
}
