"use client";

import type { ReactElement } from "react";

import { AdminNotificationCampaignForm } from "@/components/admin/admin-notification-campaign-form";
import { AdminNotificationHealthSummary } from "@/components/admin/admin-notification-health-summary";
import { AdminNotificationPreviewTable } from "@/components/admin/admin-notification-preview-table";
import type { NotificationHealthResponse } from "@/components/admin/admin-notification-campaign-console.types";
import { useI18n } from "@/components/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { useAdminNotificationCampaignConsole } from "@/components/admin/use-admin-notification-campaign-console";

export function AdminNotificationCampaignConsole({ initialHealth = null }: { initialHealth?: NotificationHealthResponse | null }): ReactElement {
  const { t } = useI18n();
  const { errorMessage, form, health, isLoading, preview, runDryRun, runPreview, runQueueCampaign, setForm, statusMessage } =
    useAdminNotificationCampaignConsole({ initialHealth, t });

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <h2 className="text-lg font-semibold text-white">{t({ en: "Push campaigns", es: "Campanas push", pt: "Campanhas push" })}</h2>
        <p className="text-sm text-white/75">
          {t({
            en: "Admin notices only. Preview is mandatory, audience is capped, and destination URLs must stay internal.",
            es: "Solo avisos admin. El preview es obligatorio, la audiencia tiene cap y la URL debe ser interna.",
            pt: "Apenas avisos admin. O preview e obrigatorio, a audiencia tem limite e a URL deve ser interna."
          })}
        </p>
      </Card>

      {health ? <AdminNotificationHealthSummary health={health} /> : null}

      <Card className="space-y-3">
        <AdminNotificationCampaignForm
          form={form}
          hasPreview={Boolean(preview)}
          isLoading={isLoading}
          runDryRun={() => void runDryRun()}
          runPreview={() => void runPreview()}
          runQueueCampaign={() => void runQueueCampaign()}
          setForm={setForm}
          t={t}
        />
      </Card>

      {statusMessage ? (
        <Card className="border-emerald-400/40 bg-emerald-500/5 text-sm text-emerald-100">{statusMessage}</Card>
      ) : null}

      {errorMessage ? (
        <Card className="border-rose-400/40 bg-rose-500/5 text-sm text-rose-100">{errorMessage}</Card>
      ) : null}

      {preview ? <AdminNotificationPreviewTable preview={preview} /> : null}
    </div>
  );
}
