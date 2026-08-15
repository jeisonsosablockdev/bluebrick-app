"use client";

import { useState, type ReactNode } from "react";

import { MarketplaceViewModeButton } from "@/features/marketplace/presentation/MarketplaceViewModeButton";
import type { MarketplaceViewMode } from "@/lib/marketplace-view-mode";

type MarketplaceViewModeShellProps = {
  render: (mode: MarketplaceViewMode) => ReactNode;
};

export function MarketplaceViewModeShell({ render }: MarketplaceViewModeShellProps) {
  const [currentMode, setCurrentMode] = useState<MarketplaceViewMode>("combined-map-top");

  return (
    <section data-testid="marketplace-view-mode-shell" className="space-y-4">
      <MarketplaceViewModeButton
        currentMode={currentMode}
        onCycle={(nextMode) => {
          setCurrentMode(nextMode);
        }}
      />
      {render(currentMode)}
    </section>
  );
}
