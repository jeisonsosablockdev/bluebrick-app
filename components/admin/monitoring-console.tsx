"use client";

import type { ReactElement } from "react";
import { useMemo, useState } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type EventStatus = "received" | "processed" | "failed" | "ignored";
type EventType = "nft_minted" | "webhook_failed" | "claim_completed";
type EventSource = "helius" | "backend" | "manual";

type MonitoringEvent = {
  eventId: string;
  eventType: EventType;
  assetId: string;
  emissionId: string;
  wallet: string;
  signature: string;
  slot: number;
  status: EventStatus;
  source: EventSource;
  receivedAt: string;
  processedAt: string;
  errorMessage?: {
    en: string;
    es: string;
    pt: string;
  };
};

const EVENTS: MonitoringEvent[] = [
  {
    eventId: "EV-001",
    eventType: "nft_minted",
    assetId: "MDE-RE-4421",
    emissionId: "EM-4421",
    wallet: "8Fs2...hQ9A",
    signature: "2Qa7...z6Wx",
    slot: 3211345,
    status: "processed",
    source: "helius",
    receivedAt: "2026-03-06T08:11:00Z",
    processedAt: "2026-03-06T08:11:02Z"
  },
  {
    eventId: "EV-002",
    eventType: "webhook_failed",
    assetId: "CTG-RE-1040",
    emissionId: "EM-1040",
    wallet: "4Tp1...aK3V",
    signature: "9Tc5...n4Vu",
    slot: 3211369,
    status: "failed",
    source: "backend",
    receivedAt: "2026-03-06T09:05:00Z",
    processedAt: "2026-03-06T09:05:06Z",
    errorMessage: {
      en: "Timeout while reconciling event.",
      es: "Timeout al reconciliar evento.",
      pt: "Timeout ao reconciliar evento."
    }
  },
  {
    eventId: "EV-003",
    eventType: "claim_completed",
    assetId: "BAQ-RE-9872",
    emissionId: "EM-9872",
    wallet: "6Dj8...mP2B",
    signature: "3Lp9...q2Er",
    slot: 3211401,
    status: "received",
    source: "manual",
    receivedAt: "2026-03-06T10:01:00Z",
    processedAt: "-"
  }
];

function statusClass(status: EventStatus): string {
  if (status === "processed") return "bg-emerald-500/20 text-emerald-200";
  if (status === "failed") return "bg-rose-500/20 text-rose-200";
  if (status === "received") return "bg-indigo-500/20 text-indigo-200";
  return "bg-slate-500/20 text-slate-200";
}

function eventTypeLabel(type: EventType, t: ReturnType<typeof useI18n>["t"]): string {
  if (type === "nft_minted") return t({ en: "NFT minted", es: "NFT mintado", pt: "NFT mintado" });
  if (type === "webhook_failed") return t({ en: "Webhook failed", es: "webhook fallido", pt: "webhook com falha" });
  return t({ en: "Claim completed", es: "claim realizado", pt: "claim realizado" });
}

function statusLabel(status: EventStatus, t: ReturnType<typeof useI18n>["t"]): string {
  if (status === "received") return t({ en: "received", es: "recibido", pt: "recebido" });
  if (status === "processed") return t({ en: "processed", es: "procesado", pt: "processado" });
  if (status === "failed") return t({ en: "failed", es: "fallido", pt: "falhou" });
  return t({ en: "ignored", es: "ignorado", pt: "ignorado" });
}

export function MonitoringConsole(): ReactElement {
  const { t } = useI18n();
  const [eventType, setEventType] = useState<EventType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<EventStatus | "all">("all");
  const [walletFilter, setWalletFilter] = useState("");
  const [assetFilter, setAssetFilter] = useState("");
  const [signatureFilter, setSignatureFilter] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<MonitoringEvent | null>(null);

  const filtered = useMemo(() => {
    const walletTerm = walletFilter.trim().toLowerCase();
    const assetTerm = assetFilter.trim().toLowerCase();
    const sigTerm = signatureFilter.trim().toLowerCase();

    return EVENTS.filter((event) => {
      const typeMatch = eventType === "all" || event.eventType === eventType;
      const statusMatch = statusFilter === "all" || event.status === statusFilter;
      const walletMatch = walletTerm.length === 0 || event.wallet.toLowerCase().includes(walletTerm);
      const assetMatch = assetTerm.length === 0 || event.assetId.toLowerCase().includes(assetTerm);
      const signatureMatch = sigTerm.length === 0 || event.signature.toLowerCase().includes(sigTerm);
      return typeMatch && statusMatch && walletMatch && assetMatch && signatureMatch;
    });
  }, [assetFilter, eventType, signatureFilter, statusFilter, walletFilter]);

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <h2 className="text-lg font-semibold text-white">{t({ en: "Event monitoring", es: "Monitoring de eventos", pt: "Monitoramento de eventos" })}</h2>
        <p className="text-sm text-white/75">{t({ en: "Traceability for mint, backend and reconciliation operations.", es: "Trazabilidad de operaciones de mint, backend y reconciliacion.", pt: "Rastreabilidade de operacoes de mint, backend e reconciliacao." })}</p>
      </Card>

      <Card className="space-y-3">
        <p className="text-sm font-semibold text-white">{t({ en: "Filters toolbar", es: "Toolbar de filtros", pt: "Barra de filtros" })}</p>
        <div className="grid gap-3 lg:grid-cols-5">
          <select
            className="rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-white"
            value={eventType}
            onChange={(event) => setEventType(event.target.value as EventType | "all")}
          >
            <option value="all">{t({ en: "Type: all", es: "Tipo: todos", pt: "Tipo: todos" })}</option>
            <option value="nft_minted">{eventTypeLabel("nft_minted", t)}</option>
            <option value="webhook_failed">{eventTypeLabel("webhook_failed", t)}</option>
            <option value="claim_completed">{eventTypeLabel("claim_completed", t)}</option>
          </select>
          <select
            className="rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-white"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as EventStatus | "all")}
          >
            <option value="all">{t({ en: "Status: all", es: "Estado: todos", pt: "Status: todos" })}</option>
            <option value="received">{statusLabel("received", t)}</option>
            <option value="processed">{statusLabel("processed", t)}</option>
            <option value="failed">{statusLabel("failed", t)}</option>
            <option value="ignored">{statusLabel("ignored", t)}</option>
          </select>
          <Input placeholder={t({ en: "wallet", es: "wallet", pt: "wallet" })} value={walletFilter} onChange={(event) => setWalletFilter(event.target.value)} />
          <Input placeholder={t({ en: "asset", es: "asset", pt: "asset" })} value={assetFilter} onChange={(event) => setAssetFilter(event.target.value)} />
          <Input
            placeholder={t({ en: "signature", es: "signature", pt: "signature" })}
            value={signatureFilter}
            onChange={(event) => setSignatureFilter(event.target.value)}
          />
        </div>
      </Card>

      <Card className="space-y-3">
        <p className="text-sm font-semibold text-white">{t({ en: "Events table", es: "Tabla de eventos", pt: "Tabela de eventos" })}</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/60">
                <th className="px-2 py-2 font-medium">eventId</th>
                <th className="px-2 py-2 font-medium">eventType</th>
                <th className="px-2 py-2 font-medium">assetId</th>
                <th className="px-2 py-2 font-medium">emissionId</th>
                <th className="px-2 py-2 font-medium">wallet</th>
                <th className="px-2 py-2 font-medium">signature</th>
                <th className="px-2 py-2 font-medium">slot</th>
                <th className="px-2 py-2 font-medium">status</th>
                <th className="px-2 py-2 font-medium">source</th>
                <th className="px-2 py-2 font-medium">receivedAt</th>
                <th className="px-2 py-2 font-medium">processedAt</th>
                <th className="px-2 py-2 font-medium">{t({ en: "actions", es: "acciones", pt: "acoes" })}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((event) => (
                <tr key={event.eventId} className="border-b border-white/10">
                  <td className="px-2 py-2 text-white">{event.eventId}</td>
                  <td className="px-2 py-2 text-white">{eventTypeLabel(event.eventType, t)}</td>
                  <td className="px-2 py-2 text-white">{event.assetId}</td>
                  <td className="px-2 py-2 text-white">{event.emissionId}</td>
                  <td className="px-2 py-2 text-white">{event.wallet}</td>
                  <td className="px-2 py-2 text-cyan-200">{event.signature}</td>
                  <td className="px-2 py-2 text-white">{event.slot}</td>
                  <td className="px-2 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs ${statusClass(event.status)}`}>{statusLabel(event.status, t)}</span>
                  </td>
                  <td className="px-2 py-2 text-white">{event.source}</td>
                  <td className="px-2 py-2 text-white">{event.receivedAt}</td>
                  <td className="px-2 py-2 text-white">{event.processedAt}</td>
                  <td className="px-2 py-2">
                    <div className="flex flex-wrap gap-1">
                      <Button className="min-h-9 px-3 py-1 text-xs" variant="ghost" onClick={() => setSelectedEvent(event)}>
                        {t({ en: "View detail", es: "Ver detalle", pt: "Ver detalhe" })}
                      </Button>
                      <Button className="min-h-9 px-3 py-1 text-xs" variant="outline">
                        {t({ en: "Reprocess", es: "Reprocesar", pt: "Reprocessar" })}
                      </Button>
                      <Button className="min-h-9 px-3 py-1 text-xs" variant="ghost">
                        {t({ en: "Copy signature", es: "Copiar signature", pt: "Copiar signature" })}
                      </Button>
                      <Button className="min-h-9 px-3 py-1 text-xs" variant="ghost">
                        {t({ en: "Filter by asset", es: "Filtrar por asset", pt: "Filtrar por asset" })}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedEvent && (
        <div className="fixed inset-0 z-50">
          <button
            aria-label={t({ en: "Close event detail", es: "Cerrar detalle evento", pt: "Fechar detalhe de evento" })}
            className="absolute inset-0 bg-black/70"
            onClick={() => setSelectedEvent(null)}
            type="button"
          />
          <aside className="relative ml-auto h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-[#070b14] p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{t({ en: "Event detail", es: "Detalle de evento", pt: "Detalhe de evento" })}</h3>
              <Button className="min-h-11" variant="ghost" onClick={() => setSelectedEvent(null)}>
                {t({ en: "Close", es: "Cerrar", pt: "Fechar" })}
              </Button>
            </div>
            <Card className="mt-4 space-y-2 text-sm">
              <p className="text-white/80">eventId: {selectedEvent.eventId}</p>
              <p className="text-white/80">eventType: {eventTypeLabel(selectedEvent.eventType, t)}</p>
              <p className="text-white/80">assetId: {selectedEvent.assetId}</p>
              <p className="text-white/80">emissionId: {selectedEvent.emissionId}</p>
              <p className="text-white/80">wallet: {selectedEvent.wallet}</p>
              <p className="text-white/80">signature: {selectedEvent.signature}</p>
              <p className="text-white/80">slot: {selectedEvent.slot}</p>
              <p className="text-white/80">status: {statusLabel(selectedEvent.status, t)}</p>
              <p className="text-white/80">source: {selectedEvent.source}</p>
              <p className="text-white/80">receivedAt: {selectedEvent.receivedAt}</p>
              <p className="text-white/80">processedAt: {selectedEvent.processedAt}</p>
              {selectedEvent.errorMessage ? <p className="text-rose-200">errorMessage: {t(selectedEvent.errorMessage)}</p> : null}
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
