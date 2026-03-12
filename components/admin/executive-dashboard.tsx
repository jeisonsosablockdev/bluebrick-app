"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";

type KpiStatus = "normal" | "warning" | "critical";

type KpiCard = {
  label: string;
  value: string;
  delta?: string;
  period: string;
  status: KpiStatus;
};

type AlertItem = {
  id: string;
  title: string;
  detail: string;
  severity: "warning" | "critical";
};

type ActivityItem = {
  date: string;
  type: string;
  status: string;
  detail: string;
};

const BASE_KPIS: KpiCard[] = [
  { label: "Activos creados", value: "34", delta: "+3", period: "Ultimos 30 dias", status: "normal" },
  { label: "Activos publicados", value: "21", delta: "+2", period: "Ultimos 30 dias", status: "normal" },
  { label: "Lotes de mint activos", value: "9", delta: "+1", period: "Hoy", status: "normal" },
  { label: "NFTs vendidos", value: "1,248", delta: "+84", period: "Ultimos 30 dias", status: "normal" },
  { label: "Supply disponible total", value: "3,912", period: "En vivo", status: "warning" },
  { label: "Volumen vendido", value: "$482,300", delta: "+6.4%", period: "Ultimos 30 dias", status: "normal" },
  { label: "Eventos fallidos", value: "3", period: "Ultimas 24h", status: "critical" }
];

const ALERTS: AlertItem[] = [
  {
    id: "alt-1",
    title: "Webhook de mint con fallos",
    detail: "3 eventos fallidos en las ultimas 24h. Requiere revision de monitoreo.",
    severity: "critical"
  },
  {
    id: "alt-2",
    title: "Supply bajo en un lote de mint",
    detail: "Lote BAQ-RE-9872 con menos de 8% de supply disponible.",
    severity: "warning"
  }
];

const RECENT_ACTIVITY: ActivityItem[] = [
  { date: "2026-03-06 08:12", type: "Activo creado", status: "Completado", detail: "Asset MDE-RE-4421 creado por admin." },
  { date: "2026-03-06 08:23", type: "Lote de mint publicado", status: "Completado", detail: "Lote CTG-RE-1040 paso a published." },
  { date: "2026-03-06 09:02", type: "NFT vendido", status: "Completado", detail: "Wallet 8Fs2...hQ9A compro 2 NFTs." },
  { date: "2026-03-06 09:14", type: "Evento on-chain", status: "Fallido", detail: "Error en conciliacion de webhook." }
];

const ASSET_SUMMARY = [
  { label: "Building New", value: "11" },
  { label: "Rental Property", value: "15" },
  { label: "Land Lot", value: "8" }
];

const QUICK_ACTIONS = [
  { label: "Crear activo", href: "/admin/assets/new" },
  { label: "Ir a mint", href: "/admin/mint" },
  { label: "Ir a monitoreo", href: "/admin/monitoring" },
  { label: "Ir a distribucion", href: "/admin/distributions" }
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

function EmptyState() {
  return (
    <Card className="space-y-2 border-dashed">
      <h2 className="text-lg font-semibold text-white">Sin datos operativos aun</h2>
      <p className="text-sm text-white/75">
        Cuando existan activos, lotes de mint y ventas, aqui veras el resumen ejecutivo de la operacion.
      </p>
    </Card>
  );
}

function ErrorState() {
  return (
    <Card className="space-y-2 border-rose-400/40 bg-rose-500/5">
      <h2 className="text-lg font-semibold text-white">Error al cargar dashboard ejecutivo</h2>
      <p className="text-sm text-white/75">El backend no respondio completamente. Intenta de nuevo.</p>
      <Button className="min-h-11 w-full sm:w-auto" variant="outline">
        Reintentar
      </Button>
    </Card>
  );
}

export function ExecutiveDashboard({ walletLabel }: { walletLabel: string }) {
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
      kpi.label === "Volumen vendido" ? { ...kpi, value: "N/A", status: "warning" as const } : kpi
    );
  }, [isPartial]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError) {
    return <ErrorState />;
  }

  if (isEmpty) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Dashboard</p>
            <h1 className="text-2xl font-semibold text-white">Vista Ejecutiva de Operacion</h1>
          </div>
          <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-white/80">{walletLabel}</span>
        </div>
        <p className="text-sm text-white/75">Resumen de activos, mint y estado operativo del sistema.</p>
      </Card>

      {criticalAlerts.length > 0 && (
        <Card className="space-y-2 border-rose-400/40 bg-rose-500/5">
          <p className="text-sm font-semibold text-rose-100">Alertas criticas</p>
          <ul className="space-y-1 text-sm text-rose-100">
            {criticalAlerts.map((alert) => (
              <li key={alert.id}>
                <span className="font-medium">{alert.title}:</span> {alert.detail}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {isPartial && (
        <Card className="space-y-1 border-amber-400/30 bg-amber-500/5">
          <p className="text-sm font-semibold text-amber-100">Datos parciales</p>
          <p className="text-sm text-amber-100">
            Algunas fuentes no respondieron (por ejemplo volumen vendido). Se muestra la mejor data disponible.
          </p>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="space-y-2">
            <p className="text-xs uppercase tracking-[0.12em] text-white/60">{kpi.label}</p>
            <div className="flex items-end justify-between gap-2">
              <p className="text-2xl font-semibold text-white">{kpi.value}</p>
              <span className={`rounded-full px-2 py-1 text-xs ${statusPillClass(kpi.status)}`}>{kpi.status}</span>
            </div>
            <p className="text-xs text-white/60">
              {kpi.delta ? `${kpi.delta} · ` : ""}
              {kpi.period}
            </p>
          </Card>
        ))}
      </div>

      <DashboardCharts context="admin" />

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="space-y-2">
          <h2 className="text-base font-semibold text-white">Resumen de activos</h2>
          <ul className="space-y-2">
            {ASSET_SUMMARY.map((item) => (
              <li key={item.label} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
                <span className="text-white/80">{item.label}</span>
                <span className="font-semibold text-white">{item.value}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="space-y-2">
          <h2 className="text-base font-semibold text-white">Acciones rapidas</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {QUICK_ACTIONS.map((action) => (
              <Link key={action.label} href={action.href}>
                <Button className="min-h-11 w-full" variant="outline">
                  {action.label}
                </Button>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <Card className="space-y-2">
        <h2 className="text-base font-semibold text-white">Actividad reciente</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/60">
                <th className="px-2 py-2 font-medium">Fecha</th>
                <th className="px-2 py-2 font-medium">Evento</th>
                <th className="px-2 py-2 font-medium">Estado</th>
                <th className="px-2 py-2 font-medium">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_ACTIVITY.map((item) => (
                <tr key={`${item.date}-${item.type}`} className="border-b border-white/10">
                  <td className="px-2 py-2 text-white">{item.date}</td>
                  <td className="px-2 py-2 text-white">{item.type}</td>
                  <td className="px-2 py-2 text-white">{item.status}</td>
                  <td className="px-2 py-2 text-white/80">{item.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="space-y-2">
        <h2 className="text-base font-semibold text-white">Alertas operativas</h2>
        <ul className="space-y-2">
          {ALERTS.map((alert) => (
            <li key={`ops-${alert.id}`} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
              <p className="font-medium text-white">{alert.title}</p>
              <p className="text-white/70">{alert.detail}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
