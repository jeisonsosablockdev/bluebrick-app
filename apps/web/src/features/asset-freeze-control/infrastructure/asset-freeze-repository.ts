import type { AssetFreezeItem } from "../domain/asset-freeze-types";

export async function fetchUserFreezeAssets(walletPublicKey: string): Promise<AssetFreezeItem[]> {
  const response = await fetch(`/api/protected/stake/assets?wallet=${encodeURIComponent(walletPublicKey)}`);
  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as { data?: Array<Record<string, unknown>> };
  const items = payload.data ?? [];

  return items.map((raw) => ({
    assetAddress: String(raw.assetAddress || ""),
    collectionAddress: String(raw.collectionAddress || ""),
    displayName: String(raw.displayName || "BRIDS NFT"),
    imageUrl: typeof raw.imageUrl === "string" ? raw.imageUrl : null,
    state: raw.isFrozen ? "frozen" : "unfrozen",
    canStake: !raw.isFrozen && !raw.syncPending,
    canUnstake: Boolean(raw.isFrozen) && !raw.syncPending
  }));
}
