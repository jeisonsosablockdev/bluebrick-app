import { Marker } from "react-map-gl/mapbox";

import { formatMarketplaceSoldPercent } from "@/lib/marketplace-format";
import type { MarketplaceMapPin } from "@/lib/marketplace-map-pins";

type MarketplaceMapMarkerProps = {
  pin: MarketplaceMapPin;
  onActivate: (pin: MarketplaceMapPin) => void;
};

const MARKETPLACE_MAP_ACCENT_COLOR = "#67E8F9";

export function MarketplaceMapMarker({ pin, onActivate }: MarketplaceMapMarkerProps) {
  return (
    <Marker latitude={pin.latitude} longitude={pin.longitude} anchor="bottom">
      <div className="flex flex-col items-center">
        <button
          type="button"
          className="group flex min-h-11 min-w-16 items-center gap-2 rounded-full border border-cyan-200/40 bg-slate-950/90 px-3 py-2 text-white shadow-[0_0_0_1px_rgba(34,211,238,0.18)] transition hover:scale-105 hover:bg-slate-900/95"
          aria-label={`${pin.title}, ${pin.locationLabel}, ${formatMarketplaceSoldPercent(pin.soldPercent)} sold`}
          onMouseEnter={() => onActivate(pin)}
          onFocus={() => onActivate(pin)}
        >
          <span className="max-w-[7.5rem] truncate text-[11px] font-semibold leading-none">{pin.title}</span>
          <span className="rounded-full bg-slate-950/85 px-2 py-1 text-[11px] font-semibold shadow-inner shadow-black/25">
            {formatMarketplaceSoldPercent(pin.soldPercent)}
          </span>
        </button>
        <span
          data-testid="marketplace-map-pin-leader"
          aria-hidden="true"
          className="h-9 w-px opacity-80 shadow-[0_0_12px_rgba(103,232,249,0.42)]"
          style={{ backgroundColor: MARKETPLACE_MAP_ACCENT_COLOR }}
        />
        <span
          data-testid="marketplace-map-pin-anchor"
          aria-hidden="true"
          className="h-2.5 w-2.5 rounded-full border bg-slate-950 shadow-[0_0_14px_rgba(103,232,249,0.55)]"
          style={{ borderColor: MARKETPLACE_MAP_ACCENT_COLOR }}
        />
      </div>
    </Marker>
  );
}
