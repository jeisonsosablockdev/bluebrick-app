"use client";

import React from "react";
import type { AssetFreezeItem } from "../domain/asset-freeze-types";

type AssetFreezePanelProps = {
  items: AssetFreezeItem[];
  loading: boolean;
  onAction?: (assetAddress: string, action: "stake" | "unstake") => void;
};

export function AssetFreezePanel({ items, loading, onAction }: AssetFreezePanelProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-cyan-500/20 bg-slate-900/60 p-4 text-center text-sm text-cyan-200">
        Loading on-chain freeze state...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4 text-center text-sm text-slate-400">
        No active freeze control assets found.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.assetAddress} className="rounded-xl border border-white/10 bg-slate-900/80 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white">{item.displayName}</span>
            <span className={`px-2 py-0.5 text-xs rounded-full ${item.state === "frozen" ? "bg-cyan-500/20 text-cyan-300" : "bg-emerald-500/20 text-emerald-300"}`}>
              {item.state === "frozen" ? "Frozen (Staked)" : "Unfrozen"}
            </span>
          </div>
          {onAction && (
            <div className="flex gap-2">
              {item.canStake && (
                <button
                  type="button"
                  onClick={() => onAction(item.assetAddress, "stake")}
                  className="w-full rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500"
                >
                  Freeze (Stake)
                </button>
              )}
              {item.canUnstake && (
                <button
                  type="button"
                  onClick={() => onAction(item.assetAddress, "unstake")}
                  className="w-full rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-500"
                >
                  Thaw (Unstake)
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
