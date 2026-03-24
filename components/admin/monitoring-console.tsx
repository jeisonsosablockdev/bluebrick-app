"use client";

import type { ReactElement } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  fetchAdminMonitoringEvents,
  reprocessAdminMonitoringEvent,
  type MonitoringEventsResponse
} from "@/lib/admin-metrics-client";
import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type MonitoringEvent = MonitoringEventsResponse["events"][number];

type MonitoringConsoleProps = {
  initialData: MonitoringEventsResponse | null;
  initialFilters: {
    eventType?: string;
    status?: string;
    wallet?: string;
    asset?: string;
    signature?: string;
    page: number;
    limit: number;
  };
};

function statusClass(status: "confirmed" | "failed"): string {
  if (status === "confirmed") {
    return "bg-emerald-500/20 text-emerald-200";
  }

  return "bg-rose-500/20 text-rose-200";
}

function truncateMiddle(value: string, left = 6, right = 6): string {
  if (!value || value.length <= left + right + 3) {
    return value;
  }

  return `${value.slice(0, left)}...${value.slice(-right)}`;
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toISOString().replace("T", " ").slice(0, 16);
}

export function MonitoringConsole({ initialData, initialFilters }: MonitoringConsoleProps): ReactElement {
  const { t } = useI18n();
  const [eventType, setEventType] = useState(initialFilters.eventType ?? "");
  const [statusFilter, setStatusFilter] = useState(initialFilters.status ?? "");
  const [walletFilter, setWalletFilter] = useState(initialFilters.wallet ?? "");
  const [assetFilter, setAssetFilter] = useState(initialFilters.asset ?? "");
  const [signatureFilter, setSignatureFilter] = useState(initialFilters.signature ?? "");
  const [page, setPage] = useState(Number.isInteger(initialFilters.page) && initialFilters.page > 0 ? initialFilters.page : 1);
  const [limit, setLimit] = useState(Number.isInteger(initialFilters.limit) && initialFilters.limit > 0 ? initialFilters.limit : 20);

  const [payload, setPayload] = useState<MonitoringEventsResponse | null>(initialData);
  const [isLoading, setIsLoading] = useState(initialData === null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<MonitoringEvent | null>(null);
  const [reprocessState, setReprocessState] = useState<{ eventId: string; status: "idle" | "running" | "done" | "error" }>({
    eventId: "",
    status: "idle"
  });

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetchAdminMonitoringEvents({
        eventType: eventType || null,
        status: statusFilter || null,
        wallet: walletFilter || null,
        asset: assetFilter || null,
        signature: signatureFilter || null,
        page,
        limit
      });
      setPayload(response);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not load monitoring events.");
    } finally {
      setIsLoading(false);
    }
  }, [assetFilter, eventType, limit, page, signatureFilter, statusFilter, walletFilter]);

  useEffect(() => {
    if (
      initialData
      && (initialFilters.eventType ?? "") === eventType
      && (initialFilters.status ?? "") === statusFilter
      && (initialFilters.wallet ?? "") === walletFilter
      && (initialFilters.asset ?? "") === assetFilter
      && (initialFilters.signature ?? "") === signatureFilter
      && initialFilters.page === page
      && initialFilters.limit === limit
    ) {
      setPayload(initialData);
      setErrorMessage(null);
      setIsLoading(false);
      return;
    }

    void load();
  }, [
    assetFilter,
    eventType,
    initialData,
    initialFilters.asset,
    initialFilters.eventType,
    initialFilters.limit,
    initialFilters.page,
    initialFilters.signature,
    initialFilters.status,
    initialFilters.wallet,
    limit,
    load,
    page,
    signatureFilter,
    statusFilter,
    walletFilter
  ]);

  const events = payload?.events ?? [];

  const paginationLabel = useMemo(() => {
    if (!payload) {
      return "";
    }

    return `${payload.pagination.page}/${Math.max(payload.pagination.totalPages, 1)} · total=${payload.pagination.total}`;
  }, [payload]);

  const handleReprocess = useCallback(async (event: MonitoringEvent) => {
    setReprocessState({ eventId: event.id, status: "running" });

    try {
      await reprocessAdminMonitoringEvent({ eventId: event.id });
      setReprocessState({ eventId: event.id, status: "done" });
      await load();
    } catch {
      setReprocessState({ eventId: event.id, status: "error" });
    }
  }, [load]);

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <h2 className="text-lg font-semibold text-white">{t({ en: "Event monitoring", es: "Monitoring de eventos", pt: "Monitoramento de eventos" })}</h2>
        <p className="text-sm text-white/75">{t({ en: "Traceability for purchase webhook reconciliation operations.", es: "Trazabilidad de operaciones de reconciliacion de compras por webhook.", pt: "Rastreabilidade de operacoes de reconciliacao de compras por webhook." })}</p>
        {payload ? (
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">{`freshness: ${payload.meta.dataFreshness}`}</span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">{`source: ${payload.meta.source}`}</span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">{`lastSync: ${payload.meta.lastSyncedAt ?? "n/a"}`}</span>
          </div>
        ) : null}
      </Card>

      <Card className="space-y-3">
        <p className="text-sm font-semibold text-white">{t({ en: "Filters toolbar", es: "Toolbar de filtros", pt: "Barra de filtros" })}</p>
        <div className="grid gap-3 lg:grid-cols-4 xl:grid-cols-6">
          <Input placeholder={t({ en: "event type", es: "tipo evento", pt: "tipo evento" })} value={eventType} onChange={(event) => { setPage(1); setEventType(event.target.value); }} />
          <select
            className="glass-control min-h-11 rounded-xl px-3 py-2 text-sm text-white"
            value={statusFilter || "all"}
            onChange={(event) => {
              setPage(1);
              setStatusFilter(event.target.value === "all" ? "" : event.target.value);
            }}
          >
            <option value="all">{t({ en: "Status: all", es: "Estado: todos", pt: "Status: todos" })}</option>
            <option value="confirmed">confirmed</option>
            <option value="failed">failed</option>
          </select>
          <Input placeholder={t({ en: "wallet", es: "wallet", pt: "wallet" })} value={walletFilter} onChange={(event) => { setPage(1); setWalletFilter(event.target.value); }} />
          <Input placeholder={t({ en: "asset", es: "asset", pt: "asset" })} value={assetFilter} onChange={(event) => { setPage(1); setAssetFilter(event.target.value); }} />
          <Input
            placeholder={t({ en: "signature", es: "signature", pt: "signature" })}
            value={signatureFilter}
            onChange={(event) => { setPage(1); setSignatureFilter(event.target.value); }}
          />
          <select
            className="glass-control min-h-11 rounded-xl px-3 py-2 text-sm text-white"
            value={String(limit)}
            onChange={(event) => {
              setPage(1);
              setLimit(Number(event.target.value));
            }}
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="glass-control min-h-11 rounded-xl px-4 py-2 text-sm text-white"
            onClick={() => void load()}
            type="button"
          >
            {t({ en: "Apply filters", es: "Aplicar filtros", pt: "Aplicar filtros" })}
          </button>
          <button
            className="glass-control min-h-11 rounded-xl px-4 py-2 text-sm text-white"
            onClick={() => {
              setEventType("");
              setStatusFilter("");
              setWalletFilter("");
              setAssetFilter("");
              setSignatureFilter("");
              setPage(1);
              setLimit(20);
            }}
            type="button"
          >
            {t({ en: "Clear filters", es: "Limpiar filtros", pt: "Limpar filtros" })}
          </button>
        </div>
      </Card>

      {isLoading && !payload ? (
        <Card className="space-y-2">
          <div className="h-6 w-44 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-full animate-pulse rounded bg-white/10" />
        </Card>
      ) : null}

      {errorMessage && !payload ? (
        <Card className="space-y-2 border-rose-400/40 bg-rose-500/5">
          <p className="text-sm font-semibold text-rose-100">{t({ en: "Could not load monitoring events", es: "No se pudo cargar monitoreo", pt: "Nao foi possivel carregar monitoramento" })}</p>
          <p className="text-sm text-rose-100">{errorMessage}</p>
        </Card>
      ) : null}

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-white">{t({ en: "Events table", es: "Tabla de eventos", pt: "Tabela de eventos" })}</p>
          <p className="text-xs text-white/65">{paginationLabel}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/60">
                <th className="px-2 py-2 font-medium">eventId</th>
                <th className="px-2 py-2 font-medium">eventType</th>
                <th className="px-2 py-2 font-medium">assetId</th>
                <th className="px-2 py-2 font-medium">wallet</th>
                <th className="px-2 py-2 font-medium">signature</th>
                <th className="px-2 py-2 font-medium">slot</th>
                <th className="px-2 py-2 font-medium">status</th>
                <th className="px-2 py-2 font-medium">txStatus</th>
                <th className="px-2 py-2 font-medium">receivedAt</th>
                <th className="px-2 py-2 font-medium">{t({ en: "actions", es: "acciones", pt: "acoes" })}</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b border-white/10">
                  <td className="px-2 py-2 text-white">{event.id}</td>
                  <td className="px-2 py-2 text-white">{event.eventType}</td>
                  <td className="px-2 py-2 text-white">{event.propertyId ?? "-"}</td>
                  <td className="px-2 py-2 text-white">{event.walletPublicKey ?? "-"}</td>
                  <td className="px-2 py-2 text-cyan-200">{truncateMiddle(event.signature)}</td>
                  <td className="px-2 py-2 text-white">{event.slot ?? "-"}</td>
                  <td className="px-2 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs ${statusClass(event.status)}`}>{event.status}</span>
                  </td>
                  <td className="px-2 py-2 text-white">{event.txStatus ?? "-"}</td>
                  <td className="px-2 py-2 text-white">{formatDate(event.receivedAt)}</td>
                  <td className="px-2 py-2">
                    <div className="flex flex-wrap gap-1">
                      <Button className="min-h-9 px-3 py-1 text-xs" variant="ghost" onClick={() => setSelectedEvent(event)}>
                        {t({ en: "View detail", es: "Ver detalle", pt: "Ver detalhe" })}
                      </Button>
                      <Button
                        className="min-h-9 px-3 py-1 text-xs"
                        variant="outline"
                        onClick={() => void handleReprocess(event)}
                      >
                        {reprocessState.eventId === event.id && reprocessState.status === "running"
                          ? t({ en: "Reprocessing...", es: "Reprocesando...", pt: "Reprocessando..." })
                          : t({ en: "Reprocess", es: "Reprocesar", pt: "Reprocessar" })}
                      </Button>
                      <Button
                        className="min-h-9 px-3 py-1 text-xs"
                        variant="ghost"
                        onClick={async () => {
                          if (navigator?.clipboard) {
                            await navigator.clipboard.writeText(event.signature);
                          }
                        }}
                      >
                        {t({ en: "Copy signature", es: "Copiar signature", pt: "Copiar signature" })}
                      </Button>
                      <Button
                        className="min-h-9 px-3 py-1 text-xs"
                        variant="ghost"
                        onClick={() => {
                          setPage(1);
                          setAssetFilter(event.propertyId ?? "");
                        }}
                      >
                        {t({ en: "Filter by asset", es: "Filtrar por asset", pt: "Filtrar por asset" })}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {events.length === 0 ? (
                <tr>
                  <td className="px-2 py-3 text-sm text-white/70" colSpan={10}>
                    {t({ en: "No events for current filters.", es: "No hay eventos para los filtros actuales.", pt: "Sem eventos para os filtros atuais." })}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button className="min-h-10" variant="outline" onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
            {t({ en: "Prev", es: "Anterior", pt: "Anterior" })}
          </Button>
          <Button className="min-h-10" variant="outline" onClick={() => setPage((prev) => prev + 1)}>
            {t({ en: "Next", es: "Siguiente", pt: "Proximo" })}
          </Button>
        </div>
      </Card>

      {selectedEvent && (
        <div className="fixed inset-0 z-50">
          <button
            aria-label={t({ en: "Close event detail", es: "Cerrar detalle evento", pt: "Fechar detalhe de evento" })}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedEvent(null)}
            type="button"
          />
          <aside className="glass-drawer-surface relative ml-auto h-full w-full max-w-xl overflow-y-auto p-4">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-slate-950/90 pb-3">
              <h3 className="text-lg font-semibold text-white">{t({ en: "Event detail", es: "Detalle de evento", pt: "Detalhe de evento" })}</h3>
              <Button className="min-h-11" variant="ghost" onClick={() => setSelectedEvent(null)}>
                {t({ en: "Close", es: "Cerrar", pt: "Fechar" })}
              </Button>
            </div>
            <Card className="mt-4 space-y-2 text-sm">
              <p className="text-white/80">eventId: {selectedEvent.id}</p>
              <p className="text-white/80">eventType: {selectedEvent.eventType}</p>
              <p className="text-white/80">assetId: {selectedEvent.propertyId ?? "-"}</p>
              <p className="text-white/80">wallet: {selectedEvent.walletPublicKey ?? "-"}</p>
              <p className="text-white/80">signature: {selectedEvent.signature}</p>
              <p className="text-white/80">slot: {selectedEvent.slot ?? "-"}</p>
              <p className="text-white/80">status: {selectedEvent.status}</p>
              <p className="text-white/80">txStatus: {selectedEvent.txStatus ?? "-"}</p>
              <p className="text-white/80">receivedAt: {selectedEvent.receivedAt}</p>
              {selectedEvent.errorMessage ? <p className="text-rose-200">errorMessage: {selectedEvent.errorMessage}</p> : null}
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
