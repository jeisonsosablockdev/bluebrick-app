import type { ReactNode } from "react";

import type { MarketplaceMapPin } from "@/lib/marketplace-map-pins";

type MarketplaceMapShellProps = {
  mapboxAccessToken: string | null;
  pins: MarketplaceMapPin[];
  fallback: ReactNode;
};

function formatSoldPercent(value: number): string {
  return Number.isInteger(value) ? `${value}%` : `${value.toFixed(2).replace(/\.00$/, "")}%`;
}

export function MarketplaceMapShell({ mapboxAccessToken, pins, fallback }: MarketplaceMapShellProps) {
  if (!mapboxAccessToken || pins.length === 0) {
    return <>{fallback}</>;
  }

  return (
    <section
      data-testid="marketplace-map-shell"
      aria-label="Marketplace map"
      className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
    >
      <div className="border-b border-white/10 px-4 py-4 sm:px-6">
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Marketplace map</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-2">
          <h2 className="text-lg font-semibold text-white">United States map foundation</h2>
          <p className="text-sm text-slate-300">{pins.length} pins ready for the progressive map layer</p>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.85fr)]">
        <div className="relative min-h-80 overflow-hidden rounded-3xl border border-cyan-400/15 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_rgba(15,23,42,0.96)_60%)]">
          <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:48px_48px]" />
          <div className="relative h-full min-h-80 p-4 sm:p-6">
            <div className="flex h-full flex-col justify-between gap-4">
              <div className="max-w-xl rounded-2xl border border-white/10 bg-slate-950/55 p-4 backdrop-blur-sm">
                <p className="text-sm font-semibold text-white">Mapbox GL JS v3 foundation</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  This surface is ready for a real WebGL map layer, hover zoom, and location-led discovery once the map runtime is mounted.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {pins.map((pin) => (
                  <article
                    key={pin.id}
                    className="min-w-[11rem] rounded-2xl border border-cyan-300/20 bg-slate-950/80 px-3 py-3 text-white shadow-lg shadow-cyan-950/10"
                  >
                    <p className="text-sm font-semibold">{pin.title}</p>
                    <p className="mt-1 text-xs text-slate-300">{pin.locationLabel}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-cyan-200">{formatSoldPercent(pin.soldPercent)} sold</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Pins</p>
          <div className="space-y-3">
            {pins.map((pin) => (
              <a
                key={pin.id}
                href={pin.href}
                className="block rounded-2xl border border-white/10 bg-slate-950/60 p-3 transition hover:border-cyan-300/40 hover:bg-slate-950/85"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{pin.title}</p>
                    <p className="text-xs text-slate-400">{pin.locationLabel}</p>
                  </div>
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-[11px] font-semibold text-cyan-100">
                    {formatSoldPercent(pin.soldPercent)}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </aside>
      </div>

      <div className="border-t border-white/10 bg-slate-950/55 p-4 sm:p-6">{fallback}</div>
    </section>
  );
}
