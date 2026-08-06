import { InvestorHoldingEntity, DividendAnalyticsEntity } from '../domain';

export class PortfolioDrizzleRepository {
  async getHoldingsByWallet(walletAddress: string): Promise<InvestorHoldingEntity[]> {
    return [
      {
        assetId: 'prop_01',
        propertyName: 'Torre Residencial Brickell Sunset',
        location: 'Miami, FL, USA',
        fractionsOwned: 12,
        totalInvestedUsd: 1200,
        currentValuationUsd: 1350,
        estimatedApyPercent: 11.4,
        imageUrl: '/images/properties/brickell.jpg',
      },
      {
        assetId: 'prop_02',
        propertyName: 'Villa de Lujo Tulum Oasis',
        location: 'Tulum, QR, México',
        fractionsOwned: 5,
        totalInvestedUsd: 500,
        currentValuationUsd: 580,
        estimatedApyPercent: 12.8,
        imageUrl: '/images/properties/tulum.jpg',
      },
    ];
  }

  async getDividendAnalyticsByWallet(walletAddress: string): Promise<DividendAnalyticsEntity> {
    return {
      totalDividendsEarnedUsd: 284.5,
      pendingClaimUsd: 42.1,
      historicalPayoutsCount: 8,
      averageMonthlyYieldPercent: 1.02,
    };
  }
}
