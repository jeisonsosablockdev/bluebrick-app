import { NftMintingDrizzleRepository } from '../infrastructure';
import { MetaplexCollectionConfig } from '../domain';

export async function getMintStatusQuery(collectionAddress: string): Promise<MetaplexCollectionConfig> {
  const repo = new NftMintingDrizzleRepository();
  return repo.getCollectionMintConfig(collectionAddress);
}
