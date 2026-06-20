import type { ReactNode } from "react";

import { formatMarketplaceSoldPercent } from "@/lib/marketplace-format";
import type { MarketplaceMapPin } from "@/lib/marketplace-map-pins";

type MarketplaceMapShellProps = {
  mapboxAccessToken: string | null;
  pins: MarketplaceMapPin[];
  selectedPinId?: string | null;
  onPinSelect?: (pinId: string) => void;
  map: ReactNode;
  fallback: ReactNode;
};

export function MarketplaceMapShell({ mapboxAccessToken, pins, selectedPinId, onPinSelect, map, fallback }: MarketplaceMapShellProps) {
  if (!mapboxAccessToken || pins.length === 0) {
    return <>{fallback}</>;
  }

  return (
    <section
      data-testid="marketplace-map-shell"
      aria-label="Marketplace map"
      className="marketplace-depth-surface overflow-hidden rounded-3xl"
    >
      <div className="px-4 py-4 shadow-[inset_0_-1px_0_rgba(47,198,255,0.07)] sm:px-6">
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Marketplace map</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-2">
          <h2 className="text-lg font-semibold text-white">United States map foundation</h2>
          <p className="text-sm text-slate-300">{pins.length} pins ready for the progressive map layer</p>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.85fr)]">
        <div className="marketplace-depth-inset relative min-h-80 overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_rgba(15,23,42,0.96)_60%)]">
          <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:48px_48px]" />
          <div className="relative h-full min-h-80">{map}</div>
        </div>

        <aside className="marketplace-depth-inset space-y-3 rounded-3xl p-4 sm:p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Pins</p>
          <div className="space-y-2">
            {pins.map((pin) => (
              <button
                key={pin.id}
                type="button"
                aria-pressed={selectedPinId === pin.id}
                onClick={() => onPinSelect?.(pin.id)}
                className={`marketplace-pin-row block w-full rounded-xl px-2.5 py-2 text-left shadow-[inset_0_1px_14px_rgba(47,198,255,0.045)] transition hover:bg-slate-950/85 ${
                  selectedPinId === pin.id ? "bg-cyan-300/10" : "bg-slate-950/60"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-white">{pin.title}</p>
                    <p className="text-[11px] text-slate-400">{pin.locationLabel}</p>
                  </div>
                  <span className="rounded-full bg-cyan-300/10 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-100 shadow-[inset_0_1px_10px_rgba(47,198,255,0.1)]">
                    {formatMarketplaceSoldPercent(pin.soldPercent)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
