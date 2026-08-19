import { LandingRepository } from '../infrastructure';
import { LandingHeroData, FeaturedPropertySummary } from '../domain';

export async function getLandingContentQuery(): Promise<{
  hero: LandingHeroData;
  featuredProperties: FeaturedPropertySummary[];
}> {
  const repository = new LandingRepository();
  const [hero, featuredProperties] = await Promise.all([
    repository.getHeroData(),
    repository.getFeaturedProperties(),
  ]);

  return { hero, featuredProperties };
}
