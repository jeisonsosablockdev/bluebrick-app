export type AssetFreezeState = "unfrozen" | "frozen" | "sync_pending";

export type AssetFreezeItem = {
  assetAddress: string;
  collectionAddress: string;
  displayName: string;
  imageUrl: string | null;
  state: AssetFreezeState;
  canStake: boolean;
  canUnstake: boolean;
};

export type AssetFreezeActionResult = {
  ok: boolean;
  assetAddress: string;
  action: "stake" | "unstake";
  txSignature?: string;
  attemptId?: string;
};
