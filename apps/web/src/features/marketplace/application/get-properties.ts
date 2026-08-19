import { PropertyDrizzleRepository } from '../infrastructure';
import { PropertyEntity, MarketplaceFilterState } from '../domain';

export async function getMarketplacePropertiesQuery(filters?: MarketplaceFilterState): Promise<PropertyEntity[]> {
  const repo = new PropertyDrizzleRepository();
  return repo.getProperties(filters);
}

export async function getPropertyDetailsQuery(slug: string): Promise<PropertyEntity | null> {
  const repo = new PropertyDrizzleRepository();
  return repo.getPropertyBySlug(slug);
}
