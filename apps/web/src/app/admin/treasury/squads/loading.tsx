import type { ReactElement } from "react";

/**
 * =========================================================================================
 * Layer 1: Presentation Layer — Squads Multisig Console Loading Skeleton
 * Component: SquadsLoadingSkeleton
 * Description: Skeleton loading placeholder matching /profile marketplace-depth-card styling.
 * =========================================================================================
 */
export default function SquadsTreasuryLoading(): ReactElement {
  return (
    <div className="space-y-4">
      {/* Top Banner Skeleton */}
      <article className="marketplace-depth-card space-y-3 rounded-2xl p-5">
        <div className="h-4 w-48 animate-pulse rounded bg-white/10" />
        <div className="h-8 w-64 animate-pulse rounded bg-white/10" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded bg-white/10" />
      </article>

      {/* KPI Cards Skeleton */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <article key={`squads-skeleton-metric-${index}`} className="marketplace-depth-card space-y-2 rounded-2xl p-5">
            <div className="h-3 w-28 animate-pulse rounded bg-white/10" />
            <div className="h-7 w-24 animate-pulse rounded bg-white/10" />
            <div className="h-3 w-36 animate-pulse rounded bg-white/10" />
          </article>
        ))}
      </div>

      {/* Table Skeleton */}
      <article className="marketplace-depth-card space-y-3 rounded-2xl p-5">
        <div className="h-5 w-48 animate-pulse rounded bg-white/10" />
        <div className="h-28 w-full animate-pulse rounded bg-white/10" />
      </article>
    </div>
  );
}
