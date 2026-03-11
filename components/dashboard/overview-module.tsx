"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type DashboardMetric = {
  label: string;
  value: string;
};

function DashboardSkeleton(): ReactElement {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={`skeleton-metric-${index}`} className="space-y-2">
            <div className="h-4 w-28 animate-pulse rounded bg-white/10" />
            <div className="h-8 w-20 animate-pulse rounded bg-white/10" />
          </Card>
        ))}
      </div>
      <Card className="space-y-2">
        <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
        <div className="h-20 w-full animate-pulse rounded bg-white/10" />
      </Card>
    </div>
  );
}

function EmptyState(): ReactElement {
  return (
    <Card className="space-y-3 border-dashed">
      <p className="text-sm font-medium text-white">Aun no tienes activos en tu cuenta.</p>
      <p className="text-sm text-white/70">
        Cuando completes tu primera inversion, aqui veras tus NFTs, rentas acumuladas y eventos recientes.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button className="min-h-11" variant="primary">
          Explorar propiedades
        </Button>
        <Link href="/" className="inline-flex min-h-11 items-center text-sm text-cyan-300 hover:text-cyan-200">
          Volver al inicio
        </Link>
      </div>
    </Card>
  );
}

function ErrorState(): ReactElement {
  return (
    <Card className="space-y-3 border-red-400/40 bg-red-500/5">
      <h2 className="text-lg font-semibold text-white">No se pudo cargar el dashboard</h2>
      <p className="text-sm text-white/80">
        Ocurrio un error al recuperar tu resumen. Intenta de nuevo en unos segundos.
      </p>
      <Link href="/protected" className="text-sm text-cyan-300 hover:text-cyan-200">
        Reintentar carga
      </Link>
    </Card>
  );
}

export function OverviewModule(): ReactElement {
  const searchParams = useSearchParams();
  const stateParam = searchParams.get("state");
  const [isLoading, setIsLoading] = useState(stateParam !== "error");

  useEffect(() => {
    if (stateParam === "error") {
      return;
    }

    const timerId = window.setTimeout(() => setIsLoading(false), 900);
    return () => window.clearTimeout(timerId);
  }, [stateParam]);

  const isError = stateParam === "error";
  const isEmpty = stateParam === "empty";

  const metrics = useMemo<DashboardMetric[]>(() => {
    if (isEmpty) {
      return [
        { label: "Valor invertido", value: "$0.00" },
        { label: "Numero de NFTs", value: "0" },
        { label: "Rentas acumuladas", value: "$0.00" },
        { label: "Rentas claimables", value: "$0.00" }
      ];
    }

    return [
      { label: "Valor invertido", value: "$48,500.00" },
      { label: "Numero de NFTs", value: "7" },
      { label: "Rentas acumuladas", value: "$2,140.20" },
      { label: "Rentas claimables", value: "$365.10" }
    ];
  }, [isEmpty]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return <ErrorState />;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="space-y-1">
            <p className="text-xs uppercase tracking-[0.12em] text-white/60">{metric.label}</p>
            <p className="text-2xl font-semibold text-white">{metric.value}</p>
          </Card>
        ))}
      </div>

      {isEmpty ? (
        <EmptyState />
      ) : (
        <Card className="space-y-2">
          <h2 className="text-lg font-semibold text-white">Estado general</h2>
          <p className="text-sm text-white/75">
            Tus activos se encuentran activos y listos para gestionarse desde los modulos de Portfolio, Rentas y Stake.
          </p>
        </Card>
      )}
    </div>
  );
}
