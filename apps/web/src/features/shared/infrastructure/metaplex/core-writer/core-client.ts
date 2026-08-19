/**
 * Metaplex Core (mpl-core) + Umi Writer Client - On-Chain Writes, Minting & Freeze
 */

export interface CreateCollectionParams {
  name: string;
  uri: string;
  updateAuthority: string;
}

export interface MintAssetParams {
  collectionAddress: string;
  ownerAddress: string;
  name: string;
  uri: string;
}

export function getUmiWriterClient() {
  return {
    isReady: true,
  };
}
