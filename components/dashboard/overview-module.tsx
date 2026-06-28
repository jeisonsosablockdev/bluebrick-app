"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type OverviewDataStatus = "ready" | "partial" | "empty" | "wallet_required" | "sync_pending" | "error";
type StakeVisibleState = "disabled_unsupported" | "ready_to_stake" | "ready_to_unstake" | "sync_pending";

type InvestorOverviewPayload = {
  ok?: boolean;
  data?: InvestorOverview;
  error?: {
    code?: string;
    message?: string;
  };
};

type InvestorOverview = {
  walletPublicKey: string | null;
  accountStatus: "wallet_bound" | "wallet_required" | "session_conflict";
  profile: {
    kycStatus: string | null;
    complianceStatus: string | null;
    profileCompletedAt: string | null;
  };
  summary: {
    historicalInvestedMinor: string;
    historicalInvestedCurrency: string;
    currentlyOwnedFractions: number;
    readyToStakeCount: number;
    readyToUnstakeCount: number;
    syncPendingCount: number;
    unsupportedCount: number;
    preparedDistributionMinor: string;
    preparedDistributionCurrency: string | null;
  };
  holdingsPreview: Array<{
    assetAddress: string;
    propertyId: string;
    propertyTitle: string;
    collectionAddress: string;
    visibleState: StakeVisibleState;
    imageUrl: string | null;
  }>;
  recentActivity: Array<{
    id: string;
    type: "stake" | "unstake";
    propertyTitle: string;
    txSignature: string;
    validationStatus: string;
    occurredAt: string;
  }>;
  dataQuality: {
    status: OverviewDataStatus;
    degradedSources: string[];
    refreshedAt: string;
  };
};

type DashboardMetric = {
  label: string;
  value: string;
  detail: string;
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
            <div className="h-3 w-32 animate-pulse rounded bg-white/10" />
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
    <article className="marketplace-depth-card space-y-3 rounded-2xl p-5">
      <h2 className="text-lg font-semibold text-white">
        {t({ en: "No BRIDS NFTs in this wallet yet", es: "Aun no hay NFTs BRIDS en esta wallet", pt: "Ainda nao ha NFTs BRIDS nesta wallet" })}
      </h2>
      <p className="text-sm text-white/70">
        {t({
          en: "This Overview only summarizes BRIDS NFTs currently owned by the authenticated wallet and validated by the server inventory.",
          es: "Este Overview solo resume NFTs BRIDS actualmente poseidos por la wallet autenticada y validados por el inventario del servidor.",
          pt: "Este Overview resume apenas NFTs BRIDS atualmente possuidos pela wallet autenticada e validados pelo inventario do servidor."
        })}
      </p>
      <div className="flex flex-wrap gap-2">
        <Link href="/marketplace">
          <Button className="min-h-11" variant="primary">
            {t({ en: "Explore marketplace", es: "Explorar marketplace", pt: "Explorar marketplace" })}
          </Button>
        </Link>
        <Link href="/protected/perfil" className="inline-flex min-h-11 items-center text-sm text-cyan-300 hover:text-cyan-200">
          {t({ en: "Review profile", es: "Revisar perfil", pt: "Revisar perfil" })}
        </Link>
      </div>
    </article>
  );
}

function ErrorState({ message, t }: { message: string; t: TranslateFn }): ReactElement {
  return (
    <Card className="space-y-3 border-red-400/40 bg-red-500/5">
      <h2 className="text-lg font-semibold text-white">
        {t({ en: "Could not load dashboard", es: "No se pudo cargar el dashboard", pt: "Nao foi possivel carregar o dashboard" })}
      </h2>
      <p className="text-sm text-white/80">{message}</p>
      <Button className="min-h-11 w-full sm:w-auto" variant="outline" onClick={() => window.location.reload()}>
        {t({ en: "Retry", es: "Reintentar", pt: "Tentar novamente" })}
      </Button>
    </Card>
  );
}

function WalletRequiredState({ t }: { t: TranslateFn }): ReactElement {
  return (
    <Card className="space-y-3 border-cyan-400/30 bg-cyan-500/5">
      <h2 className="text-lg font-semibold text-white">
        {t({ en: "Wallet required", es: "Wallet requerida", pt: "Wallet necessaria" })}
      </h2>
      <p className="text-sm text-white/75">
        {t({
          en: "Connect and authenticate a wallet to load investor metrics. Federated account data alone is not enough to read holdings.",
          es: "Conecta y autentica una wallet para cargar metricas de inversionista. La cuenta federada sola no basta para leer holdings.",
          pt: "Conecte e autentique uma wallet para carregar metricas de investidor. A conta federada sozinha nao basta para ler holdings."
        })}
      </p>
    </Card>
  );
}

async function parseResponse<T>(response: Response): Promise<T> {
  return (await response.json().catch(() => null)) as T;
}

async function fetchOverview(): Promise<InvestorOverview> {
  const response = await fetch("/api/protected/overview", {
    method: "GET",
    cache: "no-store"
  });
  const payload = await parseResponse<InvestorOverviewPayload>(response);

  if (!response.ok || !payload.data) {
    throw new Error(payload.error?.message ?? "Could not load investor overview.");
  }

  return payload.data;
}

function formatInteger(value: string | number): string {
  const parsed = typeof value === "number" ? value : Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return "0";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0
  }).format(parsed);
}

function formatOptionalStatus(value: string | null, t: TranslateFn): string {
  if (!value) {
    return t({ en: "Not available yet", es: "No disponible todavia", pt: "Ainda nao disponivel" });
  }

  return value.replace(/_/g, " ");
}

function formatStateLabel(state: StakeVisibleState, t: TranslateFn): string {
  if (state === "ready_to_stake") {
    return t({ en: "Ready to stake", es: "Listo para stake", pt: "Pronto para stake" });
  }

  if (state === "ready_to_unstake") {
    return t({ en: "Ready to unstake", es: "Listo para unstake", pt: "Pronto para unstake" });
  }

  if (state === "sync_pending") {
    return t({ en: "Sync pending", es: "Sincronizacion pendiente", pt: "Sincronizacao pendente" });
  }

  return t({ en: "Unsupported", es: "No soportado", pt: "Nao suportado" });
}

function buildMetrics(overview: InvestorOverview, t: TranslateFn): DashboardMetric[] {
  const hasPreparedDistributionRun = Boolean(overview.summary.preparedDistributionCurrency);

  return [
    {
      label: t({ en: "Historical invested", es: "Invertido historico", pt: "Investido historico" }),
      value: formatInteger(overview.summary.historicalInvestedMinor),
      detail: overview.summary.historicalInvestedCurrency
    },
    {
      label: t({ en: "Currently owned Fractions", es: "Fracciones actualmente poseidas", pt: "Frações atualmente possuidas" }),
      value: formatInteger(overview.summary.currentlyOwnedFractions),
      detail: t({ en: "Server-validated wallet inventory", es: "Inventario de wallet validado por servidor", pt: "Inventario de wallet validado pelo servidor" })
    },
    {
      label: t({ en: "Prepared distributions", es: "Distribuciones preparadas", pt: "Distribuicoes preparadas" }),
      value: hasPreparedDistributionRun ? formatInteger(overview.summary.preparedDistributionMinor) : t({ en: "Not available yet", es: "No disponible todavia", pt: "Ainda nao disponivel" }),
      detail: overview.summary.preparedDistributionCurrency ?? t({
        en: "No prepared distribution run yet",
        es: "Aun no hay corrida de distribucion preparada",
        pt: "Ainda nao ha rodada de distribuicao preparada"
      })
    },
    {
      label: t({ en: "Operational status", es: "Estado operativo", pt: "Estado operacional" }),
      value: formatInteger(overview.summary.readyToStakeCount + overview.summary.readyToUnstakeCount),
      detail: t({ en: "Stake-ready plus unstake-ready", es: "Listos para stake mas unstake", pt: "Prontos para stake mais unstake" })
    }
  ];
}

function StatusBanner({ overview, t }: { overview: InvestorOverview; t: TranslateFn }): ReactElement | null {
  const partialBanner = overview.dataQuality.status === "partial"
    ? (
      <Card className="space-y-1 border-amber-400/30 bg-amber-500/5">
        <p className="text-sm font-semibold text-amber-100">{t({ en: "Partial data", es: "Datos parciales", pt: "Dados parciais" })}</p>
        <p className="text-sm text-amber-100/80">
          {t({ en: "Some secondary sources are degraded:", es: "Algunas fuentes secundarias estan degradadas:", pt: "Algumas fontes secundarias estao degradadas:" })}{" "}
          {overview.dataQuality.degradedSources.join(", ")}
        </p>
      </Card>
    )
    : null;

  const syncPendingBanner = overview.summary.syncPendingCount > 0 || overview.dataQuality.status === "sync_pending"
    ? (
      <Card className="space-y-1 border-indigo-400/30 bg-indigo-500/5">
        <p className="text-sm font-semibold text-indigo-100">{t({ en: "Sync pending", es: "Sincronizacion pendiente", pt: "Sincronizacao pendente" })}</p>
        <p className="text-sm text-indigo-100/80">
          {t({
            en: "At least one on-chain action is confirmed but still syncing into the profile projection.",
            es: "Al menos una accion on-chain esta confirmada pero sigue sincronizando hacia la proyeccion de perfil.",
            pt: "Ao menos uma acao on-chain esta confirmada mas ainda sincronizando para a projecao de perfil."
          })}
        </p>
      </Card>
    )
    : null;

  if (partialBanner || syncPendingBanner) {
    return (
      <>
        {partialBanner}
        {syncPendingBanner}
      </>
    );
  }

  return null;
}

function HoldingsPreview({ overview, t }: { overview: InvestorOverview; t: TranslateFn }): ReactElement {
  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-white">
          {t({ en: "Current holdings", es: "Holdings actuales", pt: "Holdings atuais" })}
        </h2>
        <Link href="/protected/stake" className="text-sm text-cyan-300 hover:text-cyan-200">
          {t({ en: "Open Stake / Unstake", es: "Abrir Stake / Unstake", pt: "Abrir Stake / Unstake" })}
        </Link>
      </div>
      <ul className="space-y-2">
        {overview.holdingsPreview.map((holding) => (
          <li key={holding.assetAddress} className="min-w-0 rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-white">{holding.propertyTitle}</p>
                <p className="break-all font-mono text-xs text-white/55">{holding.assetAddress}</p>
              </div>
              <span className="rounded-full bg-cyan-500/15 px-2 py-1 text-xs text-cyan-100">
                {formatStateLabel(holding.visibleState, t)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function RecentActivity({ overview, t }: { overview: InvestorOverview; t: TranslateFn }): ReactElement {
  return (
    <Card className="space-y-3">
      <h2 className="text-lg font-semibold text-white">
        {t({ en: "Recent activity", es: "Actividad reciente", pt: "Atividade recente" })}
      </h2>
      {overview.recentActivity.length === 0 ? (
        <p className="text-sm text-white/70">
          {t({
            en: "No stake or unstake events recorded for this wallet yet.",
            es: "Aun no hay eventos de stake o unstake registrados para esta wallet.",
            pt: "Ainda nao ha eventos de stake ou unstake registrados para esta wallet."
          })}
        </p>
      ) : (
        <ul className="space-y-2">
          {overview.recentActivity.map((event) => (
            <li key={event.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
              <p className="font-semibold text-white">{event.propertyTitle}</p>
              <p className="break-all text-white/70">
                {event.type} · {event.validationStatus} · {event.txSignature}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function OverviewModule(): ReactElement {
  const { t } = useI18n();
  const [overview, setOverview] = useState<InvestorOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOverview() {
      setIsLoading(true);
      setError(null);

      try {
        const nextOverview = await fetchOverview();
        if (!cancelled) {
          setOverview(nextOverview);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Could not load investor overview.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadOverview();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error || !overview) {
    return <ErrorState message={error ?? "Could not load investor overview."} t={t} />;
  }

  if (overview.accountStatus === "wallet_required") {
    return <WalletRequiredState t={t} />;
  }

  const metrics = buildMetrics(overview, t);

  return (
    <div className="space-y-4">
      <StatusBanner overview={overview} t={t} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article key={metric.label} className="marketplace-depth-card space-y-1 rounded-2xl p-5">
            <p className="text-xs uppercase tracking-[0.12em] text-white/60">{metric.label}</p>
            <p className="text-2xl font-semibold text-white">{metric.value}</p>
            <p className="text-xs text-white/55">{metric.detail}</p>
          </article>
        ))}
      </div>

      {overview.dataQuality.status === "empty" ? (
        <EmptyState t={t} />
      ) : (
        <>
          <Card className="space-y-2">
            <h2 className="text-lg font-semibold text-white">
              {t({ en: "Profile and compliance", es: "Perfil y compliance", pt: "Perfil e compliance" })}
            </h2>
            <p className="text-sm text-white/75">
              KYC: {formatOptionalStatus(overview.profile.kycStatus, t)} · Compliance: {formatOptionalStatus(overview.profile.complianceStatus, t)}
            </p>
          </Card>
          <HoldingsPreview overview={overview} t={t} />
          <RecentActivity overview={overview} t={t} />
        </>
      )}
    </div>
  );
}
