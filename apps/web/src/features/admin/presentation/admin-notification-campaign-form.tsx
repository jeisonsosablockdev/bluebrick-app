"use client";

import type { ReactElement } from "react";

import { Input } from "@/components/ui/input";
import type { CampaignConsoleFormState } from "@/features/admin/presentation/admin-notification-campaign-console.types";

type TranslateFn = (text: { en: string; es: string; pt: string }) => string;

export function AdminNotificationCampaignForm({
  form,
  isLoading,
  hasPreview,
  setForm,
  runPreview,
  runDryRun,
  runQueueCampaign,
  t
}: {
  form: CampaignConsoleFormState;
  isLoading: boolean;
  hasPreview: boolean;
  setForm: (updater: (current: CampaignConsoleFormState) => CampaignConsoleFormState) => void;
  runPreview: () => void;
  runDryRun: () => void;
  runQueueCampaign: () => void;
  t: TranslateFn;
}): ReactElement {
  return (
    <>
      <div className="grid gap-3 lg:grid-cols-2">
        <label className="space-y-1 text-sm text-white/80">
          <span>messageClass</span>
          <select
            className="glass-control min-h-11 w-full rounded-xl px-3 py-2 text-sm text-white"
            value={form.messageClass}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                messageClass: event.target.value as CampaignConsoleFormState["messageClass"]
              }))}
          >
            <option value="product_update">product_update</option>
            <option value="compliance_update">compliance_update</option>
            <option value="ops_notice">ops_notice</option>
          </select>
        </label>
        <label className="space-y-1 text-sm text-white/80">
          <span>destinationUrl</span>
          <Input value={form.destinationUrl} onChange={(event) => setForm((current) => ({ ...current, destinationUrl: event.target.value }))} />
        </label>
        <label className="space-y-1 text-sm text-white/80 lg:col-span-2">
          <span>title</span>
          <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
        </label>
        <label className="space-y-1 text-sm text-white/80 lg:col-span-2">
          <span>body</span>
          <textarea
            className="glass-control min-h-28 w-full rounded-xl px-3 py-2 text-sm text-white"
            value={form.body}
            onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
          />
        </label>
        <label className="space-y-1 text-sm text-white/80">
          <span>country (ISO-2)</span>
          <Input value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value.toUpperCase() }))} />
        </label>
        <label className="space-y-1 text-sm text-white/80">
          <span>platformFamily</span>
          <select
            className="glass-control min-h-11 w-full rounded-xl px-3 py-2 text-sm text-white"
            value={form.platformFamily}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                platformFamily: event.target.value as CampaignConsoleFormState["platformFamily"]
              }))}
          >
            <option value="all">all</option>
            <option value="ios">ios</option>
            <option value="android">android</option>
            <option value="desktop">desktop</option>
            <option value="unknown">unknown</option>
          </select>
        </label>
        <label className="space-y-1 text-sm text-white/80">
          <span>appMode</span>
          <select
            className="glass-control min-h-11 w-full rounded-xl px-3 py-2 text-sm text-white"
            value={form.appMode}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                appMode: event.target.value as CampaignConsoleFormState["appMode"]
              }))}
          >
            <option value="all">all</option>
            <option value="browser">browser</option>
            <option value="standalone">standalone</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button className="glass-control min-h-11 rounded-xl px-4 py-2 text-sm text-white" disabled={isLoading} onClick={runPreview} type="button">
          {t({ en: "Preview audience", es: "Preview audiencia", pt: "Preview audiencia" })}
        </button>
        <button className="glass-control min-h-11 rounded-xl px-4 py-2 text-sm text-white" disabled={isLoading || !hasPreview} onClick={runDryRun} type="button">
          {t({ en: "Record dry-run", es: "Registrar dry-run", pt: "Registrar dry-run" })}
        </button>
        <button className="glass-control min-h-11 rounded-xl px-4 py-2 text-sm text-white" disabled={isLoading || !hasPreview} onClick={runQueueCampaign} type="button">
          {t({ en: "Queue campaign", es: "Encolar campaña", pt: "Enfileirar campanha" })}
        </button>
      </div>
    </>
  );
}
