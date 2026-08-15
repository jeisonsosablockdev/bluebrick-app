"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type MarketplaceHandoffPrimaryAction = "create-asset" | "entry-created" | "view-marketplace";
export type MarketplaceHandoffSecondaryAction = "cancel" | "create-another";

export type MarketplaceHandoffState = {
  primaryAction: MarketplaceHandoffPrimaryAction;
  secondaryAction: MarketplaceHandoffSecondaryAction;
  primaryDisabled: boolean;
  canOpenMarketplace: boolean;
};

type MarketplaceHandoffInput = {
  createdMarketplaceEntryId: string | null;
  marketplaceCtaReady: boolean;
  hasDeployCompletedData: boolean;
  isCreatingMarketplaceEntry: boolean;
};

type UsePostCreateMarketplaceHandoffInput = {
  createdMarketplaceEntryId: string | null;
  hasDeployCompletedData: boolean;
  isCreatingMarketplaceEntry: boolean;
  readinessDelayMs?: number;
};

export function selectMarketplaceHandoffState(input: MarketplaceHandoffInput): MarketplaceHandoffState {
  const hasCreatedEntry = Boolean(input.createdMarketplaceEntryId);
  const canOpenMarketplace = hasCreatedEntry && input.marketplaceCtaReady;

  return {
    primaryAction: hasCreatedEntry
      ? canOpenMarketplace
        ? "view-marketplace"
        : "entry-created"
      : "create-asset",
    secondaryAction: hasCreatedEntry ? "create-another" : "cancel",
    primaryDisabled: !input.hasDeployCompletedData || input.isCreatingMarketplaceEntry || (hasCreatedEntry && !canOpenMarketplace),
    canOpenMarketplace
  };
}

export function usePostCreateMarketplaceHandoff(input: UsePostCreateMarketplaceHandoffInput): {
  marketplaceCtaReady: boolean;
  marketplaceHandoffState: MarketplaceHandoffState;
  openCreatedMarketplaceEntry: () => boolean;
  resetMarketplaceHandoff: () => void;
} {
  const router = useRouter();
  const readinessDelayMs = input.readinessDelayMs ?? 1_400;
  const [readyMarketplaceEntryId, setReadyMarketplaceEntryId] = useState<string | null>(null);
  const marketplaceCtaReady = Boolean(input.createdMarketplaceEntryId)
    && readyMarketplaceEntryId === input.createdMarketplaceEntryId;

  useEffect(() => {
    if (!input.createdMarketplaceEntryId) {
      return;
    }

    const createdMarketplaceEntryId = input.createdMarketplaceEntryId;
    const timeoutId = window.setTimeout(() => {
      setReadyMarketplaceEntryId(createdMarketplaceEntryId);
    }, readinessDelayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [input.createdMarketplaceEntryId, readinessDelayMs]);

  const marketplaceHandoffState = useMemo(() => selectMarketplaceHandoffState({
    createdMarketplaceEntryId: input.createdMarketplaceEntryId,
    marketplaceCtaReady,
    hasDeployCompletedData: input.hasDeployCompletedData,
    isCreatingMarketplaceEntry: input.isCreatingMarketplaceEntry
  }), [
    input.createdMarketplaceEntryId,
    input.hasDeployCompletedData,
    input.isCreatingMarketplaceEntry,
    marketplaceCtaReady
  ]);

  const resetMarketplaceHandoff = useCallback(() => {
    setReadyMarketplaceEntryId(null);
  }, []);

  const openCreatedMarketplaceEntry = useCallback(() => {
    if (!input.createdMarketplaceEntryId || !marketplaceHandoffState.canOpenMarketplace) {
      return false;
    }

    router.push(`/marketplace/${input.createdMarketplaceEntryId}`);
    return true;
  }, [input.createdMarketplaceEntryId, marketplaceHandoffState.canOpenMarketplace, router]);

  return {
    marketplaceCtaReady,
    marketplaceHandoffState,
    openCreatedMarketplaceEntry,
    resetMarketplaceHandoff
  };
}
