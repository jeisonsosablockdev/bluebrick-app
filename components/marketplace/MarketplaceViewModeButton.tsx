"use client";

import type { MouseEvent } from "react";

import {
  getMarketplaceViewModeButtonLabel,
  getNextMarketplaceViewMode,
  type MarketplaceViewMode
} from "@/lib/marketplace-view-mode";

type MarketplaceViewModeButtonProps = {
  currentMode: MarketplaceViewMode;
  onCycle: (nextMode: MarketplaceViewMode) => void;
};

export function MarketplaceViewModeButton({ currentMode, onCycle }: MarketplaceViewModeButtonProps) {
  function handleClick(event: MouseEvent<HTMLButtonElement>): void {
    event.preventDefault();
    onCycle(getNextMarketplaceViewMode(currentMode));
  }

  return (
    <button
      type="button"
      className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
      onClick={handleClick}
      aria-label={getMarketplaceViewModeButtonLabel(currentMode)}
    >
      {getMarketplaceViewModeButtonLabel(currentMode)}
    </button>
  );
}
