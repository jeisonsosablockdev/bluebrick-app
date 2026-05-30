"use client";

import type { ReactElement } from "react";

import { MarketplaceGridClient } from "@/components/marketplace/MarketplaceGridClient";
import { MarketplaceMapClient } from "@/components/marketplace/MarketplaceMapClient";
import { MarketplaceMapShell } from "@/components/marketplace/MarketplaceMapShell";
import { MarketplaceViewModeShell } from "@/components/marketplace/MarketplaceViewModeShell";
import { projectMarketplaceMapPins, type MarketplaceMapPinSource } from "@/lib/marketplace-map-pins";
import type { PropertyListItem } from "@/lib/property-service";

type MarketplaceExperienceProps = {
  properties: PropertyListItem[];
  mapSources: MarketplaceMapPinSource[];
  mapboxAccessToken: string | null;
};

function renderList(properties: PropertyListItem[]): ReactElement {
  return <MarketplaceGridClient properties={properties} />;
}

export function MarketplaceExperience({ properties, mapSources, mapboxAccessToken }: MarketplaceExperienceProps) {
  const pins = projectMarketplaceMapPins(mapSources);
  const canRenderMap = Boolean(mapboxAccessToken && pins.length > 0);
  const listNode = renderList(properties);
  const mapNode = (
    <MarketplaceMapShell
      mapboxAccessToken={mapboxAccessToken}
      pins={pins}
      map={<MarketplaceMapClient mapboxAccessToken={mapboxAccessToken ?? ""} pins={pins} />}
      fallback={listNode}
    />
  );

  return (
    <MarketplaceViewModeShell
      render={(mode) => {
        if (!canRenderMap) {
          return listNode;
        }

        switch (mode) {
          case "list-only":
            return listNode;
          case "map-only":
            return mapNode;
          case "combined-list-top":
            return (
              <div className="space-y-6">
                {listNode}
                {mapNode}
              </div>
            );
          case "combined-map-top":
          default:
            return (
              <div className="space-y-6">
                {mapNode}
                {listNode}
              </div>
            );
        }
      }}
    />
  );
}
