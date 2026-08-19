import { ManagedPropertyEntity, PropertyFinancialSummary } from '../domain';

export class PropertyManagementDrizzleRepository {
  async getManagedProperties(): Promise<ManagedPropertyEntity[]> {
    return [
      {
        id: 'prop_01',
        title: 'Torre Residencial Brickell Sunset',
        location: 'Miami, FL, USA',
        totalTokensSupply: 1000,
        availableTokens: 240,
        tokenPriceUsd: 100,
        expectedApyPercent: 11.4,
        status: 'ACTIVE',
        brochureUrl: '/documents/brickell-brochure.pdf',
      },
      {
        id: 'prop_02',
        title: 'Villa de Lujo Tulum Oasis',
        location: 'Tulum, QR, México',
        totalTokensSupply: 500,
        availableTokens: 85,
        tokenPriceUsd: 100,
        expectedApyPercent: 12.8,
        status: 'ACTIVE',
        brochureUrl: '/documents/tulum-brochure.pdf',
      },
    ];
  }

  async getFinancialSummary(propertyId: string): Promise<PropertyFinancialSummary> {
    return {
      propertyId,
      grossRentalRevenueUsd: 14500,
      propertyManagementFeeUsd: 1450,
      netDistributableUsd: 13050,
      lastPayoutDate: '2026-08-01',
    };
  }
}
