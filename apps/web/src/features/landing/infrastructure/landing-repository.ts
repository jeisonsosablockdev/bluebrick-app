import { LandingHeroData, FeaturedPropertySummary } from '../domain';

export class LandingRepository {
  async getHeroData(): Promise<LandingHeroData> {
    return {
      title: 'Inversión Inmobiliaria Tokenizada en Solana',
      subtitle: 'Accede a fracciones de propiedades reales de alta rentabilidad respaldadas por contratos inteligentes de Solana y seguridad institucional.',
      badge: '✨ BRIDS Web3 Real Estate v0.2.0',
      ctaPrimaryText: 'Explorar Propiedades',
      ctaSecondaryText: 'Portal de Transparencia',
    };
  }

  async getFeaturedProperties(): Promise<FeaturedPropertySummary[]> {
    return [
      {
        id: 'prop-01',
        title: 'Villa Balcones del Norte - Medellín',
        location: 'El Poblado, Colombia',
        expectedYield: '12.5% APY',
        tokenPriceUsd: 50,
        imageUrl: '/images/properties/villa-balcones.jpg',
      },
      {
        id: 'prop-02',
        title: 'Torre Empresarial Guayacanes',
        location: 'Laureles, Colombia',
        expectedYield: '11.8% APY',
        tokenPriceUsd: 100,
        imageUrl: '/images/properties/torre-guayacanes.jpg',
      },
    ];
  }
}
