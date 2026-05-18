"use client";

import type { ReactElement } from "react";

import { Card } from "@/components/ui/card";
import type { PreviewResponse } from "@/components/admin/admin-notification-campaign-console.types";

export function AdminNotificationPreviewTable({
  preview
}: {
  preview: PreviewResponse;
}): ReactElement {
  return (
    <Card className="space-y-3">
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs uppercase tracking-[0.15em] text-white/55">eligible wallets</p>
          <p className="mt-1 text-xl font-semibold text-white">{preview.eligibleWalletCount}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs uppercase tracking-[0.15em] text-white/55">subscriptions</p>
          <p className="mt-1 text-xl font-semibold text-white">{preview.eligibleSubscriptionCount}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs uppercase tracking-[0.15em] text-white/55">excluded wallets</p>
          <p className="mt-1 text-xl font-semibold text-white">{preview.excludedWalletCount}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs uppercase tracking-[0.15em] text-white/55">audience cap</p>
          <p className="mt-1 text-xl font-semibold text-white">{preview.audienceCap}</p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <p className="text-sm font-semibold text-white">blocked reasons</p>
        <p className="mt-1 text-sm text-white/75">{preview.blockedReasons.length ? preview.blockedReasons.join(", ") : "none"}</p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-white">sample wallets</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-white/80">
            <thead>
              <tr className="border-b border-white/10 text-white/55">
                <th className="px-2 py-2">wallet</th>
                <th className="px-2 py-2">country</th>
                <th className="px-2 py-2">subscriptions</th>
                <th className="px-2 py-2">platform</th>
                <th className="px-2 py-2">mode</th>
              </tr>
            </thead>
            <tbody>
              {preview.sampleWallets.map((wallet) => (
                <tr key={wallet.walletPublicKey} className="border-b border-white/5">
                  <td className="px-2 py-2">{wallet.walletPublicKey}</td>
                  <td className="px-2 py-2">{wallet.country ?? "n/a"}</td>
                  <td className="px-2 py-2">{wallet.activeSubscriptionCount}</td>
                  <td className="px-2 py-2">{wallet.platformFamily ?? "n/a"}</td>
                  <td className="px-2 py-2">{wallet.appMode ?? "n/a"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
