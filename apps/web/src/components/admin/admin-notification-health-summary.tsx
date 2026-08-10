"use client";

import type { ReactElement } from "react";

import { Card } from "@/components/ui/card";
import type { NotificationHealthResponse } from "@/components/admin/admin-notification-campaign-console.types";

export function AdminNotificationHealthSummary({
  health
}: {
  health: NotificationHealthResponse;
}): ReactElement {
  return (
    <Card className="space-y-3">
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs uppercase tracking-[0.15em] text-white/55">active subscriptions</p>
          <p className="mt-1 text-xl font-semibold text-white">{health.subscriptions.active}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs uppercase tracking-[0.15em] text-white/55">delivered / 24h</p>
          <p className="mt-1 text-xl font-semibold text-white">{health.deliveries.delivered}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs uppercase tracking-[0.15em] text-white/55">failed / 24h</p>
          <p className="mt-1 text-xl font-semibold text-white">{health.deliveries.failed}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs uppercase tracking-[0.15em] text-white/55">pruned / 24h</p>
          <p className="mt-1 text-xl font-semibold text-white">{health.deliveries.pruned}</p>
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/75">
        rollout: installability=
        {String(health.rollout.installabilityEnabled)}
        , registration=
        {String(health.rollout.registrationEnabled)}
        , delivery=
        {String(health.rollout.deliveryEnabled)}
        , adminCampaigns=
        {String(health.rollout.adminCampaignsEnabled)}
      </div>
    </Card>
  );
}
