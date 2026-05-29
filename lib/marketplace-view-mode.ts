export type MarketplaceViewMode = "combined-map-top" | "list-only" | "map-only" | "combined-list-top";

export const MARKETPLACE_VIEW_MODE_CYCLE: MarketplaceViewMode[] = [
  "combined-map-top",
  "list-only",
  "map-only",
  "combined-list-top"
];

const VIEW_MODE_LABELS: Record<MarketplaceViewMode, string> = {
  "combined-map-top": "Map top, list below",
  "list-only": "List only",
  "map-only": "Map only",
  "combined-list-top": "List top, map below"
};

export function getNextMarketplaceViewMode(currentMode: MarketplaceViewMode): MarketplaceViewMode {
  const index = MARKETPLACE_VIEW_MODE_CYCLE.indexOf(currentMode);
  const nextIndex = index === -1 ? 0 : (index + 1) % MARKETPLACE_VIEW_MODE_CYCLE.length;

  return MARKETPLACE_VIEW_MODE_CYCLE[nextIndex] ?? MARKETPLACE_VIEW_MODE_CYCLE[0];
}

export function getMarketplaceViewModeButtonLabel(currentMode: MarketplaceViewMode): string {
  const nextMode = getNextMarketplaceViewMode(currentMode);
  return `Switch to ${VIEW_MODE_LABELS[nextMode] ?? "next view"}`;
}
