import { MetaplexCollectionConfig } from '../domain';

export class NftMintingDrizzleRepository {
  async getCollectionMintConfig(collectionAddress: string): Promise<MetaplexCollectionConfig> {
    return {
      collectionAddress,
      candyMachineAddress: 'CMv3_BRIDS_Sunset_Miami_Devnet_Addr',
      itemsAvailable: 1000,
      itemsRedeemed: 760,
      priceSol: 0.5,
      sellerFeeBasisPoints: 500,
      isLive: true,
    };
  }
}
