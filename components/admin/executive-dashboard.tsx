"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
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

type AlertItem = {
  id: string;
  title: LocalizedText;
  detail: LocalizedText;
  severity: "warning" | "critical";
};

type ActivityItem = {
  date: string;
  type: LocalizedText;
  status: LocalizedText;
  detail: LocalizedText;
};

const BASE_KPIS: KpiCard[] = [
  {
    label: { en: "Assets created", es: "Activos creados", pt: "Ativos criados" },
    value: "34",
    delta: "+3",
    period: { en: "Last 30 days", es: "Ultimos 30 dias", pt: "Ultimos 30 dias" },
    status: "normal"
  },
  {
    label: { en: "Published assets", es: "Activos publicados", pt: "Ativos publicados" },
    value: "21",
    delta: "+2",
    period: { en: "Last 30 days", es: "Ultimos 30 dias", pt: "Ultimos 30 dias" },
    status: "normal"
  },
  {
    label: { en: "Active mint batches", es: "Lotes de mint activos", pt: "Lotes de mint ativos" },
    value: "9",
    delta: "+1",
    period: { en: "Today", es: "Hoy", pt: "Hoje" },
    status: "normal"
  },
  {
    label: { en: "NFTs sold", es: "NFTs vendidos", pt: "NFTs vendidos" },
    value: "1,248",
    delta: "+84",
    period: { en: "Last 30 days", es: "Ultimos 30 dias", pt: "Ultimos 30 dias" },
    status: "normal"
  },
  {
    label: { en: "Total available supply", es: "Supply disponible total", pt: "Supply disponivel total" },
    value: "3,912",
    period: { en: "Live", es: "En vivo", pt: "Ao vivo" },
    status: "warning"
  },
  {
    label: { en: "Sold volume", es: "Volumen vendido", pt: "Volume vendido" },
    value: "$482,300",
    delta: "+6.4%",
    period: { en: "Last 30 days", es: "Ultimos 30 dias", pt: "Ultimos 30 dias" },
    status: "normal"
  },
  {
    label: { en: "Failed events", es: "Eventos fallidos", pt: "Eventos com falha" },
    value: "3",
    period: { en: "Last 24h", es: "Ultimas 24h", pt: "Ultimas 24h" },
    status: "critical"
  }
];

const ALERTS: AlertItem[] = [
  {
    id: "alt-1",
    title: {
      en: "Mint webhook failures",
      es: "Webhook de mint con fallos",
      pt: "Webhook de mint com falhas"
    },
    detail: {
      en: "3 failed events in the last 24h. Monitoring review required.",
      es: "3 eventos fallidos en las ultimas 24h. Requiere revision de monitoreo.",
      pt: "3 eventos com falha nas ultimas 24h. Requer revisao de monitoramento."
    },
    severity: "critical"
  },
  {
    id: "alt-2",
    title: {
      en: "Low supply in one mint batch",
      es: "Supply bajo en un lote de mint",
      pt: "Supply baixo em um lote de mint"
    },
    detail: {
      en: "Batch BAQ-RE-9872 has less than 8% available supply.",
      es: "Lote BAQ-RE-9872 con menos de 8% de supply disponible.",
      pt: "Lote BAQ-RE-9872 com menos de 8% de supply disponivel."
    },
    severity: "warning"
  }
];

const RECENT_ACTIVITY: ActivityItem[] = [
  {
    date: "2026-03-06 08:12",
    type: { en: "Asset created", es: "Activo creado", pt: "Ativo criado" },
    status: { en: "Completed", es: "Completado", pt: "Concluido" },
    detail: {
      en: "Asset MDE-RE-4421 created by admin.",
      es: "Asset MDE-RE-4421 creado por admin.",
      pt: "Asset MDE-RE-4421 criado por admin."
    }
  },
  {
    date: "2026-03-06 08:23",
    type: { en: "Mint batch published", es: "Lote de mint publicado", pt: "Lote de mint publicado" },
    status: { en: "Completed", es: "Completado", pt: "Concluido" },
    detail: {
      en: "Batch CTG-RE-1040 moved to published.",
      es: "Lote CTG-RE-1040 paso a published.",
      pt: "Lote CTG-RE-1040 passou para published."
    }
  },
  {
    date: "2026-03-06 09:02",
    type: { en: "NFT sold", es: "NFT vendido", pt: "NFT vendido" },
    status: { en: "Completed", es: "Completado", pt: "Concluido" },
    detail: {
      en: "Wallet 8Fs2...hQ9A bought 2 NFTs.",
      es: "Wallet 8Fs2...hQ9A compro 2 NFTs.",
      pt: "Wallet 8Fs2...hQ9A comprou 2 NFTs."
    }
  },
  {
    date: "2026-03-06 09:14",
    type: { en: "On-chain event", es: "Evento on-chain", pt: "Evento on-chain" },
    status: { en: "Failed", es: "Fallido", pt: "Falhou" },
    detail: {
      en: "Webhook reconciliation error.",
      es: "Error en conciliacion de webhook.",
      pt: "Erro na conciliacao de webhook."
    }
  }
];

const ASSET_SUMMARY: Array<{ label: LocalizedText; value: string }> = [
  { label: { en: "Building New", es: "Edificio nuevo", pt: "Edificio novo" }, value: "11" },
  { label: { en: "Rental Property", es: "Propiedad en renta", pt: "Propriedade em renda" }, value: "15" },
  { label: { en: "Land Lot", es: "Lote de engorde", pt: "Lote de valorizacao" }, value: "8" }
];

const QUICK_ACTIONS: Array<{ label: LocalizedText; href: string }> = [
  {
    label: { en: "Create asset", es: "Crear activo", pt: "Criar ativo" },
    href: "/admin/assets/new"
  },
  { label: { en: "Go to mint", es: "Ir a mint", pt: "Ir para mint" }, href: "/admin/mint" },
  {
    label: { en: "Go to monitoring", es: "Ir a monitoreo", pt: "Ir para monitoramento" },
    href: "/admin/monitoring"
  },
  {
    label: { en: "Go to distribution", es: "Ir a distribucion", pt: "Ir para distribuicao" },
    href: "/admin/distributions"
  }
];

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
        {t({ en: "Once assets, mint batches and sales exist, this executive summary will appear here.", es: "Cuando existan activos, lotes de mint y ventas, aqui veras el resumen ejecutivo de la operacion.", pt: "Quando existirem ativos, lotes de mint e vendas, aqui voce vera o resumo executivo da operacao." })}
      </p>
    </Card>
  );
}

function ErrorState({ t }: { t: ReturnType<typeof useI18n>["t"] }) {
  return (
    <Card className="space-y-2 border-rose-400/40 bg-rose-500/5">
      <h2 className="text-lg font-semibold text-white">{t({ en: "Error loading executive dashboard", es: "Error al cargar dashboard ejecutivo", pt: "Erro ao carregar dashboard executivo" })}</h2>
      <p className="text-sm text-white/75">{t({ en: "Backend did not respond fully. Try again.", es: "El backend no respondio completamente. Intenta de nuevo.", pt: "O backend nao respondeu completamente. Tente novamente." })}</p>
      <Button className="min-h-11 w-full sm:w-auto" variant="outline">
        {t({ en: "Retry", es: "Reintentar", pt: "Tentar novamente" })}
      </Button>
    </Card>
  );
}

export function ExecutiveDashboard({ walletLabel }: { walletLabel: string }) {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const view = searchParams.get("view");

  const isLoading = view === "loading";
  const isEmpty = view === "empty";
  const isError = view === "error";
  const isPartial = view === "partial-data";

  const criticalAlerts = ALERTS.filter((item) => item.severity === "critical");

  const kpis = useMemo<KpiCard[]>(() => {
    if (!isPartial) {
      return BASE_KPIS;
    }

    return BASE_KPIS.map((kpi) =>
      kpi.label.en === "Sold volume" ? { ...kpi, value: "N/A", status: "warning" as const } : kpi
    );
  }, [isPartial]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError) {
    return <ErrorState t={t} />;
  }

  if (isEmpty) {
    return <EmptyState t={t} />;
  }

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
        <p className="text-sm text-white/75">{t({ en: "Summary of assets, mint, and system operational status.", es: "Resumen de activos, mint y estado operativo del sistema.", pt: "Resumo de ativos, mint e status operacional do sistema." })}</p>
      </Card>

      {criticalAlerts.length > 0 && (
        <Card className="space-y-2 border-rose-400/40 bg-rose-500/5">
          <p className="text-sm font-semibold text-rose-100">{t({ en: "Critical alerts", es: "Alertas criticas", pt: "Alertas criticos" })}</p>
          <ul className="space-y-1 text-sm text-rose-100">
            {criticalAlerts.map((alert) => (
              <li key={alert.id}>
                <span className="font-medium">{t(alert.title)}:</span> {t(alert.detail)}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {isPartial && (
        <Card className="space-y-1 border-amber-400/30 bg-amber-500/5">
          <p className="text-sm font-semibold text-amber-100">{t({ en: "Partial data", es: "Datos parciales", pt: "Dados parciais" })}</p>
          <p className="text-sm text-amber-100">
            {t({
              en: "Some sources did not respond (for example sold volume). Best available data is shown.",
              es: "Algunas fuentes no respondieron (por ejemplo volumen vendido). Se muestra la mejor data disponible.",
              pt: "Algumas fontes nao responderam (por exemplo volume vendido). A melhor informacao disponivel esta sendo exibida."
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

      <DashboardCharts context="admin" />

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="space-y-2">
          <h2 className="text-base font-semibold text-white">{t({ en: "Asset summary", es: "Resumen de activos", pt: "Resumo de ativos" })}</h2>
          <ul className="space-y-2">
            {ASSET_SUMMARY.map((item) => (
              <li key={item.label.en} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
                <span className="text-white/80">{t(item.label)}</span>
                <span className="font-semibold text-white">{item.value}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="space-y-2">
          <h2 className="text-base font-semibold text-white">{t({ en: "Quick actions", es: "Acciones rapidas", pt: "Acoes rapidas" })}</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {QUICK_ACTIONS.map((action) => (
              <Link key={action.label.en} href={action.href}>
                <Button className="min-h-11 w-full" variant="outline">
                  {t(action.label)}
                </Button>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <Card className="space-y-2">
        <h2 className="text-base font-semibold text-white">{t({ en: "Recent activity", es: "Actividad reciente", pt: "Atividade recente" })}</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/60">
                <th className="px-2 py-2 font-medium">{t({ en: "Date", es: "Fecha", pt: "Data" })}</th>
                <th className="px-2 py-2 font-medium">{t({ en: "Event", es: "Evento", pt: "Evento" })}</th>
                <th className="px-2 py-2 font-medium">{t({ en: "Status", es: "Estado", pt: "Status" })}</th>
                <th className="px-2 py-2 font-medium">{t({ en: "Detail", es: "Detalle", pt: "Detalhe" })}</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_ACTIVITY.map((item) => (
                <tr key={`${item.date}-${item.type.en}`} className="border-b border-white/10">
                  <td className="px-2 py-2 text-white">{item.date}</td>
                  <td className="px-2 py-2 text-white">{t(item.type)}</td>
                  <td className="px-2 py-2 text-white">{t(item.status)}</td>
                  <td className="px-2 py-2 text-white/80">{t(item.detail)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="space-y-2">
        <h2 className="text-base font-semibold text-white">{t({ en: "Operational alerts", es: "Alertas operativas", pt: "Alertas operacionais" })}</h2>
        <ul className="space-y-2">
          {ALERTS.map((alert) => (
            <li key={`ops-${alert.id}`} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
              <p className="font-medium text-white">{t(alert.title)}</p>
              <p className="text-white/70">{t(alert.detail)}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
