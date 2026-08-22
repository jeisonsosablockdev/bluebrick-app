"use client";

/**
 * =========================================================================================
 * Layer 1: Presentation Layer — Distributions Console (Admin)
 * Component: DistributionsConsole
 * Description: High-fidelity administrative console matching the exact visual cards,
 *              marketplace-depth-card styling, and sober layout of /profile (overview-module).
 * =========================================================================================
 */

import Link from "next/link";
import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreateDistributionModal } from "@/features/admin/presentation/create-distribution-modal";
import { isReleaseControlledRouteVisible } from "@/lib/release-module-visibility";

type DistributionRunStatus = "draft" | "blocked" | "finalized" | "failed";

type DistributionRun = {
  id: string;
  periodKey: string;
  collectionAddress: string;
  propertyId: string;
  tokenMint: string;
  totalAmountMinor: string;
  status: DistributionRunStatus;
  blockedReason: string | null;
  outputChecksum: string | null;
  itemCount: number;
  totalWallets: number;
  createdAt: string;
  finalizedAt: string | null;
};

type DistributionRunsState =
  | { status: "loading"; runs: DistributionRun[]; error: null }
  | { status: "ready"; runs: DistributionRun[]; error: null }
  | { status: "error"; runs: DistributionRun[]; error: string };

const initialState: DistributionRunsState = {
  status: "loading",
  runs: [],
  error: null,
};

function statusBadgeClass(status: DistributionRunStatus): string {
  switch (status) {
    case "finalized":
      return "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30";
    case "blocked":
      return "bg-amber-500/15 text-amber-300 border border-amber-500/30";
    case "failed":
      return "bg-rose-500/15 text-rose-300 border border-rose-500/30";
    case "draft":
    default:
      return "bg-cyan-500/15 text-cyan-200 border border-cyan-500/30";
  }
}

function statusLabel(status: DistributionRunStatus, t: ReturnType<typeof useI18n>["t"]): string {
  if (status === "draft") return t({ en: "Draft", es: "Borrador", pt: "Rascunho" });
  if (status === "blocked") return t({ en: "Blocked", es: "Bloqueado", pt: "Bloqueado" });
  if (status === "finalized") return t({ en: "Finalized", es: "Finalizado", pt: "Finalizado" });
  return t({ en: "Failed", es: "Fallido", pt: "Falhou" });
}

function shortValue(value: string): string {
  if (value.length <= 16) {
    return value;
  }
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function formatUsdcAmount(amountMinorStr: string): string {
  try {
    const numeric = Number(amountMinorStr) / 1_000_000;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(numeric);
  } catch {
    return "$0.00";
  }
}

function formatDate(value: string | null): string {
  if (!value) {
    return "-";
  }
  return new Date(value).toISOString().slice(0, 10);
}

async function fetchDistributionRuns(): Promise<DistributionRun[]> {
  const response = await fetch("/api/admin/distributions/runs", {
    cache: "no-store",
  });
  const payload = await response.json();

  if (!response.ok || !payload.ok) {
    throw new Error(payload.error?.message ?? "Could not load distribution runs.");
  }

  return payload.data as DistributionRun[];
}

export function DistributionsConsole(): ReactElement {
  const { t } = useI18n();
  const showTreasuryLink = isReleaseControlledRouteVisible("/admin/treasury");
  const [selected, setSelected] = useState<DistributionRun | null>(null);
  const [runsState, setRunsState] = useState<DistributionRunsState>(initialState);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [successRunId, setSuccessRunId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const loadRuns = async () => {
    try {
      setRunsState((prev) => ({ status: "loading", runs: prev.runs, error: null }));
      const runs = await fetchDistributionRuns();
      setRunsState({ status: "ready", runs, error: null });
    } catch (error) {
      setRunsState({
        status: "error",
        runs: [],
        error: error instanceof Error ? error.message : "Could not load distribution runs.",
      });
    }
  };

  useEffect(() => {
    void loadRuns();
  }, []);

  // Compute KPI metrics from loaded runs
  const kpis = useMemo(() => {
    const runs = runsState.runs;
    const totalAmount = runs.reduce((acc, r) => acc + Number(r.totalAmountMinor), 0);
    const finalizedCount = runs.filter((r) => r.status === "finalized").length;
    const totalWallets = runs.reduce((acc, r) => acc + r.totalWallets, 0);

    return {
      totalDispersedUsdc: formatUsdcAmount(String(totalAmount)),
      totalRuns: runs.length,
      finalizedRuns: finalizedCount,
      totalWallets,
    };
  }, [runsState.runs]);

  // Filtered runs
  const filteredRuns = useMemo(() => {
    if (filterStatus === "all") return runsState.runs;
    return runsState.runs.filter((r) => r.status === filterStatus);
  }, [runsState.runs, filterStatus]);

  return (
    <div className="space-y-4">
      {/* Success Notification Banner */}
      {successRunId ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-medium text-emerald-300 flex items-center justify-between">
          <span>✓ {t({ en: "Distribution run created successfully:", es: "Corrida de distribución creada exitosamente:", pt: "Lote criado com sucesso:" })} <span className="font-mono">{successRunId}</span></span>
          <button type="button" onClick={() => setSuccessRunId(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      ) : null}

      {/* 1. Top KPI Metrics Grid — Matching /profile Exactly */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {/* KPI 1 */}
        <article className="marketplace-depth-card space-y-1 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-white/60">
            {t({ en: "Total Dispersed", es: "Total Dispersado", pt: "Total Distribuido" })}
          </p>
          <p className="text-2xl font-semibold text-white">{kpis.totalDispersedUsdc}</p>
          <p className="text-xs text-white/55">
            USDC · {t({ en: "On-chain verified", es: "Verificado on-chain", pt: "Verificado on-chain" })}
          </p>
        </article>

        {/* KPI 2 */}
        <article className="marketplace-depth-card space-y-1 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-white/60">
            {t({ en: "Total Batches", es: "Total de Corridas", pt: "Total de Lotes" })}
          </p>
          <p className="text-2xl font-semibold text-white">{kpis.totalRuns}</p>
          <p className="text-xs text-white/55">
            {kpis.finalizedRuns} {t({ en: "finalized runs", es: "corridas finalizadas", pt: "lotes finalizados" })}
          </p>
        </article>

        {/* KPI 3 */}
        <article className="marketplace-depth-card space-y-1 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-white/60">
            {t({ en: "Staking Holders", es: "Titulares en Staking", pt: "Titulares em Staking" })}
          </p>
          <p className="text-2xl font-semibold text-white">{kpis.totalWallets}</p>
          <p className="text-xs text-white/55">
            {t({ en: "MPL Core Freeze Active", es: "Freeze MPL Core Activo", pt: "Freeze MPL Core Ativo" })}
          </p>
        </article>

        {/* KPI 4 */}
        <article className="marketplace-depth-card space-y-1 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-white/60">
            {t({ en: "Squads Vault", es: "Bóveda Squads", pt: "Cofre Squads" })}
          </p>
          <p className="text-2xl font-semibold text-white font-mono truncate">rVKw...KaD</p>
          <p className="text-xs text-white/55">
            2 / 4 Quorum · Devnet Active
          </p>
        </article>
      </div>

      {/* 2. Operations & Actions Card */}
      <Card className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {t({ en: "Yield Distributions", es: "Dispersión de Rendimientos", pt: "Distribuicao de Rendimentos" })}
            </h2>
            <p className="text-sm text-white/75">
              {t({
                en: "Auditable snapshot computation, Merkle tree compilation, and Squads v4 multisig settlement governance.",
                es: "Cálculo auditable de snapshots, compilación de árboles Merkle y gobernanza de liquidación multisig con Squads v4.",
                pt: "Calculo audivel de snapshots, compilacao de arvore Merkle e governanca multisig com Squads v4.",
              })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {showTreasuryLink ? (
              <Link href="/admin/treasury">
                <Button className="min-h-11" variant="outline">
                  {t({ en: "Squads Vault", es: "Bóveda Squads", pt: "Cofre Squads" })}
                </Button>
              </Link>
            ) : null}
            <Button
              className="min-h-11"
              variant="primary"
              onClick={() => setIsCreateModalOpen(true)}
            >
              {t({ en: "+ New Distribution", es: "+ Nueva Distribución", pt: "+ Nova Distribuicao" })}
            </Button>
          </div>
        </div>
      </Card>

      {/* 3. Table & Runs Section */}
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">
            {t({ en: "Historical & Active Runs", es: "Corridas Activas e Históricas", pt: "Lotes Ativos e Historicos" })}
          </h2>

          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
            {(["all", "draft", "finalized", "blocked"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setFilterStatus(filter)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                  filterStatus === filter
                    ? "bg-white/15 text-white"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {filter === "all" ? t({ en: "All", es: "Todos", pt: "Todos" }) : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {runsState.status === "loading" ? (
          <div className="py-8 text-center text-sm text-white/70">
            {t({ en: "Loading distribution runs...", es: "Cargando corridas de distribución...", pt: "Carregando lotes de distribuicao..." })}
          </div>
        ) : null}

        {runsState.status === "error" ? (
          <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 p-4 text-sm text-rose-100">
            {runsState.error}
          </div>
        ) : null}

        {runsState.status === "ready" && filteredRuns.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center text-sm text-white/75">
            {t({ en: "No distribution runs yet", es: "No hay corridas de distribución aún", pt: "Nenhum lote ainda" })}
          </div>
        ) : null}

        {filteredRuns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/60 text-xs">
                  <th className="px-3 py-2.5 font-medium">Run ID</th>
                  <th className="px-3 py-2.5 font-medium">Period</th>
                  <th className="px-3 py-2.5 font-medium">Collection / Property</th>
                  <th className="px-3 py-2.5 font-medium">Wallets</th>
                  <th className="px-3 py-2.5 font-medium">Items</th>
                  <th className="px-3 py-2.5 font-medium">Amount (USDC)</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Created</th>
                  <th className="px-3 py-2.5 font-medium text-right">{t({ en: "Actions", es: "Acciones", pt: "Acoes" })}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredRuns.map((run) => (
                  <tr key={run.id} className="transition-colors hover:bg-white/[0.02]">
                    <td className="px-3 py-3 font-mono text-white text-xs">{shortValue(run.id)}</td>
                    <td className="px-3 py-3 text-white text-xs">{run.periodKey}</td>
                    <td className="px-3 py-3 font-mono text-white/80 text-xs">
                      {shortValue(run.collectionAddress)} / {run.propertyId}
                    </td>
                    <td className="px-3 py-3 text-white text-xs">{run.totalWallets}</td>
                    <td className="px-3 py-3 text-white text-xs">{run.itemCount}</td>
                    <td className="px-3 py-3 font-semibold text-white text-xs">{formatUsdcAmount(run.totalAmountMinor)}</td>
                    <td className="px-3 py-3 text-xs">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(run.status)}`}>
                        {statusLabel(run.status, t)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-white/70 text-xs">{formatDate(run.createdAt)}</td>
                    <td className="px-3 py-3 text-right">
                      <Button
                        className="min-h-9 px-3 py-1 text-xs"
                        variant="ghost"
                        onClick={() => setSelected(run)}
                      >
                        {t({ en: "View detail", es: "Ver detalle", pt: "Ver detalhe" })}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>

      {/* 4. Side Drawer Modal for Run Detail */}
      {selected ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            aria-label={t({ en: "Close detail", es: "Cerrar detalle", pt: "Fechar detalhe" })}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelected(null)}
            type="button"
          />
          <aside className="glass-drawer-surface relative h-full w-full max-w-xl overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="break-all text-lg font-semibold text-white">
                {t({ en: "Run detail", es: "Detalle de corrida", pt: "Detalhe da corrida" })} {selected.id}
              </h3>
              <Button className="min-h-11 shrink-0" variant="ghost" onClick={() => setSelected(null)}>
                {t({ en: "Close", es: "Cerrar", pt: "Fechar" })}
              </Button>
            </div>

            <Card className="space-y-3 text-sm text-white/80">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <span className="text-white/60 text-xs">{t({ en: "Period", es: "Período", pt: "Periodo" })}</span>
                  <p className="font-semibold text-white mt-1">{selected.periodKey}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <span className="text-white/60 text-xs">{t({ en: "Status", es: "Estado", pt: "Estado" })}</span>
                  <p className="mt-1">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(selected.status)}`}>
                      {statusLabel(selected.status, t)}
                    </span>
                  </p>
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4 text-xs font-mono">
                <p className="break-all"><span className="text-white/60">Collection:</span> {selected.collectionAddress}</p>
                <p className="break-all"><span className="text-white/60">Property:</span> {selected.propertyId}</p>
                <p className="break-all"><span className="text-white/60">Token Mint:</span> {selected.tokenMint}</p>
                <p><span className="text-white/60">Eligible Wallets:</span> {selected.totalWallets}</p>
                <p><span className="text-white/60">Prepared Items:</span> {selected.itemCount}</p>
                <p><span className="text-white/60">Amount:</span> {formatUsdcAmount(selected.totalAmountMinor)} ({selected.totalAmountMinor} units)</p>
                <p className="break-all"><span className="text-white/60">Checksum:</span> {selected.outputChecksum ?? "-"}</p>
                {selected.blockedReason ? (
                  <p className="break-all text-amber-300"><span className="text-white/60">Blocked Reason:</span> {selected.blockedReason}</p>
                ) : null}
              </div>

              <div className="flex items-center justify-end pt-3">
                <Link href={`/admin/treasury/squads?runId=${selected.id}`}>
                  <Button className="min-h-11" variant="outline">
                    {t({ en: "View Squads Proposal", es: "Ver Propuesta Squads", pt: "Ver Proposta Squads" })}
                  </Button>
                </Link>
              </div>
            </Card>
          </aside>
        </div>
      ) : null}

      {/* 5. Create Distribution Run Modal Dialog */}
      <CreateDistributionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(newRunId) => {
          setSuccessRunId(newRunId);
          void loadRuns();
        }}
      />
    </div>
  );
}
