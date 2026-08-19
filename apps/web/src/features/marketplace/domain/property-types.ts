export interface PropertyEntity {
  id: string;
  slug: string;
  title: string;
  location: string;
  assetType: 'Residencial' | 'Comercial' | 'Desarrollo';
  tokenPriceUsd: number;
  totalTokens: number;
  availableTokens: number;
  projectedApyPercentage: number;
  imageUrl: string;
  model3dUrl?: string;
  status: 'Funding' | 'Active' | 'SoldOut';
}

export interface MarketplaceFilterState {
  searchTerm?: string;
  assetType?: string;
  minApy?: number;
  sortBy?: 'apy-desc' | 'price-asc' | 'price-desc';
}
