"use client";

import { useState } from "react";

import type {
  CampaignConsoleFormState,
  NotificationHealthResponse,
  PreviewResponse
} from "@/components/admin/admin-notification-campaign-console.types";
import { DEFAULT_ADMIN_NOTIFICATION_CAMPAIGN_FORM } from "@/components/admin/admin-notification-campaign-console.types";

type TranslateFn = (text: { en: string; es: string; pt: string }) => string;

type UseAdminNotificationCampaignConsoleOptions = {
  initialHealth?: NotificationHealthResponse | null;
  t: TranslateFn;
};

type RequestTarget = "preview" | "send";

function buildRequestPayload(form: CampaignConsoleFormState, previewHash: string | null, dryRun: boolean): Record<string, unknown> {
  return {
    messageClass: form.messageClass,
    title: form.title,
    body: form.body,
    destinationUrl: form.destinationUrl || null,
    previewHash,
    dryRun,
    segment: {
      country: form.country || null,
      platformFamily: form.platformFamily === "all" ? null : form.platformFamily,
      appMode: form.appMode === "all" ? null : form.appMode
    }
  };
}

function buildStatusMessage(target: RequestTarget, dryRun: boolean, hasBlockers: boolean, t: TranslateFn): string {
  if (target === "preview") {
    return hasBlockers
      ? t({ en: "Preview loaded with blockers.", es: "Preview cargado con bloqueos.", pt: "Preview carregado com bloqueios." })
      : t({ en: "Preview loaded.", es: "Preview cargado.", pt: "Preview carregado." });
  }

  return dryRun
    ? t({ en: "Dry-run recorded successfully.", es: "Dry-run registrado.", pt: "Dry-run registrado." })
    : t({ en: "Campaign queued successfully.", es: "Campaña encolada.", pt: "Campanha enfileirada." });
}

export function useAdminNotificationCampaignConsole({
  initialHealth = null,
  t
}: UseAdminNotificationCampaignConsoleOptions) {
  const [form, setForm] = useState<CampaignConsoleFormState>({ ...DEFAULT_ADMIN_NOTIFICATION_CAMPAIGN_FORM });
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [health] = useState<NotificationHealthResponse | null>(initialHealth);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function runRequest(target: RequestTarget, dryRun: boolean): Promise<void> {
    const url = target === "preview" ? "/api/admin/notifications/campaigns/preview" : "/api/admin/notifications/campaigns/send";

    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(buildRequestPayload(form, preview?.audienceHash ?? null, dryRun))
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Request failed.");
      }

      if (target === "preview") {
        const nextPreview = payload.data as PreviewResponse;
        setPreview(nextPreview);
        setStatusMessage(buildStatusMessage("preview", false, nextPreview.blockedReasons.length > 0, t));
        return;
      }

      setStatusMessage(buildStatusMessage("send", dryRun, false, t));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return {
    errorMessage,
    form,
    health,
    isLoading,
    preview,
    setForm,
    statusMessage,
    runPreview: () => runRequest("preview", false),
    runDryRun: () => runRequest("send", true),
    runQueueCampaign: () => runRequest("send", false)
  };
}
