"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  fetchAdminDashboardOverview,
  type DashboardOverviewResponse,
  type MetricsRange
} from "@/lib/admin-metrics-client";
import { DashboardCharts } from "@/features/investor-portfolio/presentation/dashboard-charts";
import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type LocalizedText = {
  en: string;
  es: string;
  pt: string;
};

type KpiStatus = "normal" | "warning" | "critical";

type KpiCard = {
  label: LocalizedText;
  value: string;
  delta?: string;
  period: LocalizedText;
  status: KpiStatus;
};

function statusPillClass(status: KpiStatus): string {
  if (status === "critical") {
    return "bg-rose-500/20 text-rose-200";
  }

  if (status === "warning") {
    return "bg-amber-500/20 text-amber-200";
  }

  return "bg-emerald-500/20 text-emerald-200";
}

function statusLabel(status: KpiStatus, t: ReturnType<typeof useI18n>["t"]): string {
  if (status === "critical") {
    return t({ en: "Critical", es: "Critico", pt: "Critico" });
  }

  if (status === "warning") {
    return t({ en: "Warning", es: "Advertencia", pt: "Alerta" });
  }

  return t({ en: "Normal", es: "Normal", pt: "Normal" });
}

function truncateMiddle(value: string, left = 4, right = 4): string {
  if (!value || value.length <= left + right + 3) {
    return value;
  }

  return `${value.slice(0, left)}...${value.slice(-right)}`;
}

function shortCodeFromPropertyId(value: string | null): string | null {
  if (!value) {
    return null;
  }

  return value
    .split("-")
    .map((part) => part.slice(0, 3).toUpperCase())
    .join("-");
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toISOString().replace("T", " ").slice(0, 16);
}

function formatSolFromLamports(lamports: number): string {
  const sol = lamports / 1_000_000_000;
  return `${sol.toLocaleString("en-US", { maximumFractionDigits: 4 })} SOL`;
}

function parseRange(value: string | null): MetricsRange {
  return value === "7d" || value === "30d" ? value : "24h";
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <div className="h-6 w-72 animate-pulse rounded bg-white/10" />
        <div className="h-4 w-full animate-pulse rounded bg-white/10" />
      </Card>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 7 }).map((_, index) => (
          <Card key={`kpi-skeleton-${index}`} className="space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
            <div className="h-8 w-20 animate-pulse rounded bg-white/10" />
          </Card>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ t }: { t: ReturnType<typeof useI18n>["t"] }) {
  return (
    <Card className="space-y-2 border-dashed">
      <h2 className="text-lg font-semibold text-white">{t({ en: "No operational data yet", es: "Sin datos operativos aun", pt: "Sem dados operacionais ainda" })}</h2>
      <p className="text-sm text-white/75">
        {t({ en: "Once purchases are confirmed, this executive summary will appear here.", es: "Cuando existan compras confirmadas, aqui veras el resumen ejecutivo de la operacion.", pt: "Quando existirem compras confirmadas, aqui voce vera o resumo executivo da operacao." })}
      </p>
    </Card>
  );
}

function ErrorState({
  t,
  errorMessage,
  onRetry
}: {
  t: ReturnType<typeof useI18n>["t"];
  errorMessage: string | null;
  onRetry: () => void;
}) {
  return (
    <Card className="space-y-2 border-rose-400/40 bg-rose-500/5">
      <h2 className="text-lg font-semibold text-white">{t({ en: "Error loading executive dashboard", es: "Error al cargar dashboard ejecutivo", pt: "Erro ao carregar dashboard executivo" })}</h2>
      <p className="text-sm text-white/75">{errorMessage ?? t({ en: "Backend did not respond fully. Try again.", es: "El backend no respondio completamente. Intenta de nuevo.", pt: "O backend nao respondeu completamente. Tente novamente." })}</p>
      <Button className="min-h-11 w-full sm:w-auto" variant="outline" onClick={onRetry}>
        {t({ en: "Retry", es: "Reintentar", pt: "Tentar novamente" })}
      </Button>
    </Card>
  );
}

export function ExecutiveDashboard({
  walletLabel,
  initialOverview
}: {
  walletLabel: string;
  initialOverview: DashboardOverviewResponse | null;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  const urlRange = parseRange(searchParams.get("range"));

  const [overview, setOverview] = useState<DashboardOverviewResponse | null>(initialOverview);
  const [isLoading, setIsLoading] = useState(initialOverview === null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [range, setRange] = useState<MetricsRange>(urlRange);

  useEffect(() => {
    setRange(urlRange);
  }, [urlRange]);

  const setQueryParam = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || !value.trim()) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const onRangeChange = useCallback((nextRange: MetricsRange) => {
    setRange(nextRange);
    setQueryParam("range", nextRange);
  }, [setQueryParam]);

  const loadOverview = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetchAdminDashboardOverview({ range });
      setOverview(response);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not load dashboard overview.");
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => {
    if (initialOverview && initialOverview.meta.range === range && !view) {
      setOverview(initialOverview);
      setIsLoading(false);
      setErrorMessage(null);
      return;
    }

    if (view === "loading" || view === "error" || view === "empty") {
      return;
    }

    void loadOverview();
  }, [initialOverview, loadOverview, range, view]);

  const effectiveOverview = overview;
  const derivedEmpty = effectiveOverview ? effectiveOverview.kpis.totalAttempts === 0 : false;

  if (view === "loading" || (isLoading && !effectiveOverview)) {
    return <LoadingState />;
  }

  if (view === "error" || (errorMessage && !effectiveOverview)) {
    return <ErrorState t={t} errorMessage={errorMessage} onRetry={() => void loadOverview()} />;
  }

  if (view === "empty" || derivedEmpty) {
    return <EmptyState t={t} />;
  }

  if (!effectiveOverview) {
    return <ErrorState t={t} errorMessage={t({ en: "No data available.", es: "No hay datos disponibles.", pt: "Sem dados disponiveis." })} onRetry={() => void loadOverview()} />;
  }

  const criticalAlerts = effectiveOverview.alerts.filter((item) => item.level === "critical");
  const totalSoldQuantity = effectiveOverview.assetSummary.reduce((sum, item) => sum + item.soldQuantity, 0);

  const kpis: KpiCard[] = [
    {
      label: { en: "Total attempts", es: "Intentos totales", pt: "Tentativas totais" },
      value: String(effectiveOverview.kpis.totalAttempts),
      period: { en: "Selected range", es: "Rango seleccionado", pt: "Intervalo selecionado" },
      status: "normal"
    },
    {
      label: { en: "Confirmed", es: "Confirmadas", pt: "Confirmadas" },
      value: String(effectiveOverview.kpis.confirmedAttempts),
      period: { en: "Selected range", es: "Rango seleccionado", pt: "Intervalo selecionado" },
      status: "normal"
    },
    {
      label: { en: "Failed", es: "Fallidas", pt: "Falhas" },
      value: String(effectiveOverview.kpis.failedAttempts),
      period: { en: "Selected range", es: "Rango seleccionado", pt: "Intervalo selecionado" },
      status: effectiveOverview.kpis.failedAttempts > 0 ? "critical" : "normal"
    },
    {
      label: { en: "Conversion", es: "Conversion", pt: "Conversao" },
      value: `${effectiveOverview.kpis.conversionRatePct}%`,
      period: { en: "Selected range", es: "Rango seleccionado", pt: "Intervalo selecionado" },
      status: effectiveOverview.kpis.conversionRatePct < 30 ? "warning" : "normal"
    },
    {
      label: { en: "Revenue", es: "Ingresos", pt: "Receita" },
      value: formatSolFromLamports(effectiveOverview.kpis.revenueLamports),
      period: { en: "Selected range", es: "Rango seleccionado", pt: "Intervalo selecionado" },
      status: "normal"
    },
    {
      label: { en: "Sold quantity", es: "Cantidad vendida", pt: "Quantidade vendida" },
      value: String(totalSoldQuantity),
      period: { en: "Selected range", es: "Rango seleccionado", pt: "Intervalo selecionado" },
      status: "normal"
    },
    {
      label: { en: "Assets tracked", es: "Activos monitoreados", pt: "Ativos monitorados" },
      value: String(effectiveOverview.assetSummary.length),
      period: { en: "Live", es: "En vivo", pt: "Ao vivo" },
      status: "normal"
    }
  ];

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Dashboard</p>
            <h1 className="text-2xl font-semibold text-white">{t({ en: "Executive operations view", es: "Vista Ejecutiva de Operacion", pt: "Visao executiva da operacao" })}</h1>
          </div>
          <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-white/80">{walletLabel}</span>
        </div>
        <p className="text-sm text-white/75">{t({ en: "Summary of purchase operations and webhook reconciliation health.", es: "Resumen de operaciones de compra y salud de reconciliacion por webhook.", pt: "Resumo de operacoes de compra e saude de reconciliacao por webhook." })}</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="space-y-1 text-xs text-white/70">
            <span>{t({ en: "Timeframe", es: "Ventana de tiempo", pt: "Janela de tempo" })}</span>
            <select
              className="glass-control min-h-11 w-full rounded-xl px-3 py-2 text-sm text-white"
              value={range}
              onChange={(event) => onRangeChange(parseRange(event.target.value))}
            >
              <option value="24h">24h</option>
              <option value="7d">7d</option>
              <option value="30d">30d</option>
            </select>
          </label>
          <label className="space-y-1 text-xs text-white/70 sm:col-span-2">
            <span>{t({ en: "Filter options", es: "Opciones de filtro", pt: "Opcoes de filtro" })}</span>
            <div className="glass-control min-h-11 rounded-xl px-3 py-2 text-sm text-white/80">
              {t({
                en: "Dashboard supports range. Sales supports range/status/wallet/candyMachine. Monitoring supports eventType/status/wallet/asset/signature/paging.",
                es: "Dashboard soporta rango. Ventas soporta rango/estado/wallet/candyMachine. Monitoreo soporta eventType/estado/wallet/asset/signature/paginacion.",
                pt: "Dashboard suporta intervalo. Vendas suporta intervalo/status/wallet/candyMachine. Monitoramento suporta eventType/status/wallet/asset/signature/paginacao."
              })}
            </div>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">{`range: ${effectiveOverview.meta.range}`}</span>
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">{`freshness: ${effectiveOverview.meta.dataFreshness}`}</span>
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">{`source: ${effectiveOverview.meta.source}`}</span>
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">{`lastSync: ${effectiveOverview.meta.lastSyncedAt ?? "n/a"}`}</span>
        </div>
      </Card>

      {criticalAlerts.length > 0 && (
        <Card className="space-y-2 border-rose-400/40 bg-rose-500/5">
          <p className="text-sm font-semibold text-rose-100">{t({ en: "Critical alerts", es: "Alertas criticas", pt: "Alertas criticos" })}</p>
          <ul className="space-y-1 text-sm text-rose-100">
            {criticalAlerts.map((alert) => (
              <li key={alert.id}>{alert.message}</li>
            ))}
          </ul>
        </Card>
      )}

      {view === "partial-data" && (
        <Card className="space-y-1 border-amber-400/30 bg-amber-500/5">
          <p className="text-sm font-semibold text-amber-100">{t({ en: "Partial data", es: "Datos parciales", pt: "Dados parciais" })}</p>
          <p className="text-sm text-amber-100">
            {t({
              en: "QA override is active (view=partial-data).",
              es: "El override de QA esta activo (view=partial-data).",
              pt: "O override de QA esta ativo (view=partial-data)."
            })}
          </p>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label.en} className="space-y-2">
            <p className="text-xs uppercase tracking-[0.12em] text-white/60">{t(kpi.label)}</p>
            <div className="flex items-end justify-between gap-2">
              <p className="text-2xl font-semibold text-white">{kpi.value}</p>
              <span className={`rounded-full px-2 py-1 text-xs ${statusPillClass(kpi.status)}`}>{statusLabel(kpi.status, t)}</span>
            </div>
            <p className="text-xs text-white/60">
              {kpi.delta ? `${kpi.delta} · ` : ""}
              {t(kpi.period)}
            </p>
          </Card>
        ))}
      </div>

      <DashboardCharts context="admin" adminChartsData={effectiveOverview.charts} />

      <Card className="space-y-2">
        <h2 className="text-base font-semibold text-white">{t({ en: "Asset summary", es: "Resumen de activos", pt: "Resumo de ativos" })}</h2>
        <ul className="space-y-2">
          {effectiveOverview.assetSummary.map((item) => (
            <li key={`${item.candyMachineAddress}-${item.collectionAddress}`} className="space-y-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 overflow-hidden rounded-md border border-white/10 bg-white/5">
                  {item.propertyImageUrl ? (
                    <Image
                      alt={item.propertyTitle ?? item.propertyId ?? "project"}
                      className="h-full w-full object-cover"
                      fill
                      sizes="40px"
                      src={item.propertyImageUrl}
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-white">
                    {item.propertyTitle ?? item.propertyId ?? truncateMiddle(item.candyMachineAddress, 6, 6)}
                  </p>
                  <p className="truncate text-xs text-white/60">
                    {item.internalCode
                      ? `code: ${item.internalCode}`
                      : item.propertyId
                        ? `id: ${item.propertyId} · ref: ${shortCodeFromPropertyId(item.propertyId) ?? "n/a"}`
                        : `cm: ${truncateMiddle(item.candyMachineAddress, 6, 6)}`}
                  </p>
                </div>
                <span className="font-semibold text-white">{item.confirmedAttempts}/{item.totalAttempts}</span>
              </div>
              <p className="text-xs text-white/60">{`sold=${item.soldQuantity} · inProgress=${item.inProgressAttempts} · revenue=${formatSolFromLamports(item.revenueLamports)}`}</p>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="space-y-2">
        <h2 className="text-base font-semibold text-white">{t({ en: "Recent activity", es: "Actividad reciente", pt: "Atividade recente" })}</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/60">
                <th className="px-2 py-2 font-medium">{t({ en: "Date", es: "Fecha", pt: "Data" })}</th>
                <th className="px-2 py-2 font-medium">{t({ en: "Property", es: "Propiedad", pt: "Propriedade" })}</th>
                <th className="px-2 py-2 font-medium">{t({ en: "Status", es: "Estado", pt: "Status" })}</th>
                <th className="px-2 py-2 font-medium">{t({ en: "Signature", es: "Firma", pt: "Assinatura" })}</th>
              </tr>
            </thead>
            <tbody>
              {effectiveOverview.recentActivity.map((item) => (
                <tr key={item.attemptId} className="border-b border-white/10">
                  <td className="px-2 py-2 text-white">{formatDate(item.createdAt)}</td>
                  <td className="px-2 py-2 text-white">{item.propertyId}</td>
                  <td className="px-2 py-2 text-white">{item.status}</td>
                  <td className="px-2 py-2 text-cyan-200">{item.txSignature ? truncateMiddle(item.txSignature, 6, 6) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="space-y-2">
        <h2 className="text-base font-semibold text-white">{t({ en: "Operational alerts", es: "Alertas operativas", pt: "Alertas operacionais" })}</h2>
        <ul className="space-y-2">
          {effectiveOverview.alerts.map((alert) => (
            <li key={`ops-${alert.id}`} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
              {alert.message}
            </li>
          ))}
          {effectiveOverview.alerts.length === 0 ? <li className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70">{t({ en: "No active alerts.", es: "No hay alertas activas.", pt: "Sem alertas ativas." })}</li> : null}
        </ul>
      </Card>
    </div>
  );
}
