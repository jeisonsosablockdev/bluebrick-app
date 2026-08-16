"use client";

import { useState, useCallback } from "react";
import type { AssetFreezeItem } from "../domain/asset-freeze-types";
import { fetchUserFreezeAssets } from "../infrastructure/asset-freeze-repository";

export function useAssetFreezeControl(walletPublicKey?: string) {
  const [items, setItems] = useState<AssetFreezeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!walletPublicKey) {
      setItems([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fetched = await fetchUserFreezeAssets(walletPublicKey);
      setItems(fetched);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load freeze assets");
    } finally {
      setLoading(false);
    }
  }, [walletPublicKey]);

  return {
    items,
    loading,
    error,
    reload
  };
}
