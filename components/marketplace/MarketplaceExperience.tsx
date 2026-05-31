"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { ReactElement } from "react";

import { MarketplaceGridClient } from "@/components/marketplace/MarketplaceGridClient";
import { MarketplaceMapShell } from "@/components/marketplace/MarketplaceMapShell";
import { MarketplaceViewModeShell } from "@/components/marketplace/MarketplaceViewModeShell";
import { projectMarketplaceMapPins, type MarketplaceMapPinSource } from "@/lib/marketplace-map-pins";
import type { PropertyListItem } from "@/lib/property-service";

const DeferredMarketplaceMapClient = dynamic(
  () => import("@/components/marketplace/MarketplaceMapClient").then((module) => module.MarketplaceMapClient),
  {
    ssr: false,
    loading: () => <div data-testid="marketplace-map-loading" className="h-full min-h-[28rem] w-full" />
  }
);

type MarketplaceExperienceProps = {
  properties: PropertyListItem[];
  mapSources: MarketplaceMapPinSource[];
  mapboxAccessToken: string | null;
  mapboxStyleUrl: string;
};

function renderList(properties: PropertyListItem[]): ReactElement {
  return <MarketplaceGridClient properties={properties} />;
}

export function MarketplaceExperience({ properties, mapSources, mapboxAccessToken, mapboxStyleUrl }: MarketplaceExperienceProps) {
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [isMapBoundaryReady, setIsMapBoundaryReady] = useState(false);
  const pins = projectMarketplaceMapPins(mapSources);
  const canRenderMap = Boolean(mapboxAccessToken && pins.length > 0 && isMapBoundaryReady);
  const listNode = renderList(properties);
  const mapNode = (
    <MarketplaceMapShell
      mapboxAccessToken={mapboxAccessToken}
      selectedPinId={selectedPinId}
      onPinSelect={setSelectedPinId}
      pins={pins}
      map={
        <DeferredMarketplaceMapClient
          mapboxAccessToken={mapboxAccessToken ?? ""}
          mapStyleUrl={mapboxStyleUrl}
          pins={pins}
          selectedPinId={selectedPinId}
        />
      }
      fallback={listNode}
    />
  );

  useEffect(() => {
    if (!mapboxAccessToken || pins.length === 0) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const requestIdleCallback = window.requestIdleCallback;
    if (typeof requestIdleCallback === "function") {
      const idleId = requestIdleCallback(() => setIsMapBoundaryReady(true), { timeout: 1200 });
      return () => window.cancelIdleCallback?.(idleId);
    }

    const timeoutId = window.setTimeout(() => setIsMapBoundaryReady(true), 250);
    return () => window.clearTimeout(timeoutId);
  }, [mapboxAccessToken, pins.length]);

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
