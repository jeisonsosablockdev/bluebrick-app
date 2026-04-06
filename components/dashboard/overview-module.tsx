"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";

import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type DashboardMetric = {
  label: string;
  value: string;
};

type TranslateFn = ReturnType<typeof useI18n>["t"];

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

function EmptyState({ t }: { t: TranslateFn }): ReactElement {
  return (
    <Card className="space-y-3 border-dashed">
      <p className="text-sm font-medium text-white">{t({ en: "You do not have assets in your account yet.", es: "Aun no tienes activos en tu cuenta.", pt: "Voce ainda nao tem ativos na sua conta." })}</p>
      <p className="text-sm text-white/70">
        {t({
          en: "When you complete your first investment, your Fractions, accumulated yield and recent events will appear here.",
          es: "Cuando completes tu primera inversion, aqui veras tus Fracciones, rentas acumuladas y eventos recientes.",
          pt: "Quando voce concluir seu primeiro investimento, aqui voce vera seus Frações, rendas acumuladas e eventos recentes."
        })}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button className="min-h-11" variant="primary">
          {t({ en: "Explore properties", es: "Explorar propiedades", pt: "Explorar propriedades" })}
        </Button>
        <Link href="/" className="inline-flex min-h-11 items-center text-sm text-cyan-300 hover:text-cyan-200">
          {t({ en: "Back to home", es: "Volver al inicio", pt: "Voltar ao inicio" })}
        </Link>
      </div>
    </Card>
  );
}

function ErrorState({ t }: { t: TranslateFn }): ReactElement {
  return (
    <Card className="space-y-3 border-red-400/40 bg-red-500/5">
      <h2 className="text-lg font-semibold text-white">{t({ en: "Could not load dashboard", es: "No se pudo cargar el dashboard", pt: "Nao foi possivel carregar o dashboard" })}</h2>
      <p className="text-sm text-white/80">
        {t({
          en: "An error occurred while fetching your summary. Try again in a few seconds.",
          es: "Ocurrio un error al recuperar tu resumen. Intenta de nuevo en unos segundos.",
          pt: "Ocorreu um erro ao carregar seu resumo. Tente novamente em alguns segundos."
        })}
      </p>
      <Link href="/protected" className="text-sm text-cyan-300 hover:text-cyan-200">
        {t({ en: "Retry", es: "Reintentar carga", pt: "Tentar novamente" })}
      </Link>
    </Card>
  );
}

export function OverviewModule(): ReactElement {
  const { t } = useI18n();
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
        { label: t({ en: "Invested value", es: "Valor invertido", pt: "Valor investido" }), value: "$0.00" },
        { label: t({ en: "Number of Fractions", es: "Numero de Fracciones", pt: "Numero de Frações" }), value: "0" },
        { label: t({ en: "Accumulated yield", es: "Rentas acumuladas", pt: "Rendas acumuladas" }), value: "$0.00" },
        { label: t({ en: "Claimable yield", es: "Rentas claimables", pt: "Rendas disponiveis" }), value: "$0.00" }
      ];
    }

    return [
      { label: t({ en: "Invested value", es: "Valor invertido", pt: "Valor investido" }), value: "$48,500.00" },
      { label: t({ en: "Number of Fractions", es: "Numero de Fracciones", pt: "Numero de Frações" }), value: "7" },
      { label: t({ en: "Accumulated yield", es: "Rentas acumuladas", pt: "Rendas acumuladas" }), value: "$2,140.20" },
      { label: t({ en: "Claimable yield", es: "Rentas claimables", pt: "Rendas disponiveis" }), value: "$365.10" }
    ];
  }, [isEmpty, t]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return <ErrorState t={t} />;
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
        <EmptyState t={t} />
      ) : (
        <>
          <Card className="space-y-2">
            <h2 className="text-lg font-semibold text-white">{t({ en: "General status", es: "Estado general", pt: "Estado geral" })}</h2>
            <p className="text-sm text-white/75">
              {t({
                en: "Your assets are active and ready to be managed from Portfolio, Yield and Stake modules.",
                es: "Tus activos se encuentran activos y listos para gestionarse desde los modulos de Portfolio, Rentas y Stake.",
                pt: "Seus ativos estao ativos e prontos para serem gerenciados nos modulos de Portfolio, Rendas e Stake."
              })}
            </p>
          </Card>
          <DashboardCharts context="user" />
        </>
      )}
    </div>
  );
}
