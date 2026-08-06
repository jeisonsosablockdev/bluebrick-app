import { PropertyEntity, MarketplaceFilterState } from '../domain';

export class PropertyDrizzleRepository {
  async getProperties(filters?: MarketplaceFilterState): Promise<PropertyEntity[]> {
    const properties: PropertyEntity[] = [
      {
        id: 'prop-01',
        slug: 'torre-metropolitana-medellin',
        title: 'Torre Metropolitana El Poblado',
        location: 'Medellín, Colombia',
        assetType: 'Residencial',
        tokenPriceUsd: 50,
        totalTokens: 10000,
        availableTokens: 3400,
        projectedApyPercentage: 12.8,
        imageUrl: '/images/properties/medellin-tower.jpg',
        model3dUrl: '/models/3d/medellin-tower.glb',
        status: 'Funding',
      },
      {
        id: 'prop-02',
        slug: 'villa-marina-cartagena',
        title: 'Villa Marina Club & Beach',
        location: 'Cartagena, Colombia',
        assetType: 'Comercial',
        tokenPriceUsd: 100,
        totalTokens: 5000,
        availableTokens: 1200,
        projectedApyPercentage: 14.5,
        imageUrl: '/images/properties/cartagena-villa.jpg',
        model3dUrl: '/models/3d/cartagena-villa.glb',
        status: 'Funding',
      },
      {
        id: 'prop-03',
        slug: 'parque-industrial-bogota',
        title: 'Hub Logístico Sabana Norte',
        location: 'Bogotá, Colombia',
        assetType: 'Desarrollo',
        tokenPriceUsd: 250,
        totalTokens: 4000,
        availableTokens: 850,
        projectedApyPercentage: 16.2,
        imageUrl: '/images/properties/bogota-hub.jpg',
        status: 'Active',
      },
    ];

    if (!filters) return properties;

    return properties.filter((p) => {
      if (filters.assetType && p.assetType !== filters.assetType) return false;
      if (filters.minApy && p.projectedApyPercentage < filters.minApy) return false;
      return true;
    });
  }

  async getPropertyBySlug(slug: string): Promise<PropertyEntity | null> {
    const list = await this.getProperties();
    return list.find((p) => p.slug === slug) || null;
  }
}
