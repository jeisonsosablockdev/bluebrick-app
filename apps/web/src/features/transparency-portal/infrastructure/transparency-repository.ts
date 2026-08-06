import { InvestmentStrategyModel, TransparencyPlatformSummary } from '../domain';

export class TransparencyRepository {
  async getPlatformSummary(): Promise<TransparencyPlatformSummary> {
    return {
      totalAssetsValueUsd: 14500000,
      totalDividendsPaidUsd: 875000,
      verifiedWalletsCount: 1420,
      lastAuditTimestamp: new Date().toISOString(),
    };
  }

  async getInvestmentModels(): Promise<InvestmentStrategyModel[]> {
    return [
      {
        id: 'model-01',
        name: 'Modelo Renta Residencial Premium',
        category: 'Renting',
        totalAumUsd: 8200000,
        activePropertiesCount: 14,
        averageApyPercentage: 11.5,
        onChainVerificationAddress: 'SQDS426qUB5hZahVkWgwySsLqyZaKnpBxZBP5tWYW45',
      },
      {
        id: 'model-02',
        name: 'Modelo Renovación & Venta Rápida',
        category: 'Fix & Flip',
        totalAumUsd: 4300000,
        activePropertiesCount: 6,
        averageApyPercentage: 16.2,
        onChainVerificationAddress: 'SQDS426qUB5hZahVkWgwySsLqyZaKnpBxZBP5tWYW45',
      },
      {
        id: 'model-03',
        name: 'Modelo Desarrollo Urbano Sostenible',
        category: 'Land Development',
        totalAumUsd: 2000000,
        activePropertiesCount: 2,
        averageApyPercentage: 18.0,
        onChainVerificationAddress: 'SQDS426qUB5hZahVkWgwySsLqyZaKnpBxZBP5tWYW45',
      },
    ];
  }
}
