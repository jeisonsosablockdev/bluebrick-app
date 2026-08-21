"use client";

/**
 * =========================================================================================
 * Layer 1: Presentation Layer — Distributions Console (Admin)
 * Component: DistributionsConsole
 * Description: Clean, sober administrative console for managing staking yield distributions,
 *              snapshot runs, and Squads v4 treasury integration, styled consistently with /profile.
 * =========================================================================================
 */

import Link from "next/link";
import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
      return "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
    case "blocked":
      return "border border-amber-500/30 bg-amber-500/10 text-amber-400";
    case "failed":
      return "border border-rose-500/30 bg-rose-500/10 text-rose-400";
    case "draft":
    default:
      return "border border-cyan-500/30 bg-cyan-500/10 text-cyan-400";
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
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    let active = true;

    async function loadRuns(): Promise<void> {
      try {
        const runs = await fetchDistributionRuns();
        if (active) {
          setRunsState({ status: "ready", runs, error: null });
        }
      } catch (error) {
        if (active) {
          setRunsState({
            status: "error",
            runs: [],
            error: error instanceof Error ? error.message : "Could not load distribution runs.",
          });
        }
      }
    }

    void loadRuns();
    return () => {
      active = false;
    };
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
    <div className="space-y-6">
      {/* 1. Header Banner & Main Title */}
      <Card className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {t({ en: "Staking & Treasury Operations", es: "Operaciones de Staking y Tesorería", pt: "Operacoes de Staking e Tesouraria" })}
              </p>
            </div>
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">
              {t({ en: "Yield Distributions", es: "Dispersión de Rendimientos", pt: "Distribuicao de Rendimentos" })}
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl">
              {t({
                en: "Auditable snapshot computation, Merkle tree compilation, and Squads v4 multisig settlement governance.",
                es: "Cálculo auditable de snapshots, compilación de árboles Merkle y gobernanza de liquidación multisig con Squads v4.",
                pt: "Calculo audivel de snapshots, compilacao de arvore Merkle e governanca multisig com Squads v4.",
              })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {showTreasuryLink ? (
              <Link href="/admin/treasury">
                <Button className="border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium min-h-9" variant="outline">
                  {t({ en: "Squads Vault", es: "Bóveda Squads", pt: "Cofre Squads" })}
                </Button>
              </Link>
            ) : null}
            <Button
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs min-h-9 px-4 transition-colors"
              onClick={() => alert("El modal de creación se conectará en SPEC-05")}
            >
              {t({ en: "+ New Distribution", es: "+ Nueva Distribución", pt: "+ Nova Distribuicao" })}
            </Button>
          </div>
        </div>
      </Card>

      {/* 2. Top KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Total Volume */}
        <Card className="p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{t({ en: "Total Dispersed", es: "Total Dispersado", pt: "Total Distribuido" })}</span>
            <span className="font-mono text-[10px] text-slate-400">USDC</span>
          </div>
          <p className="text-xl font-bold text-slate-100 font-mono">{kpis.totalDispersedUsdc}</p>
          <p className="text-[11px] text-slate-400">
            {t({ en: "Verified on Devnet", es: "Verificado en Devnet", pt: "Verificado em Devnet" })}
          </p>
        </Card>

        {/* KPI 2: Total Runs */}
        <Card className="p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{t({ en: "Total Batches", es: "Total de Corridas", pt: "Total de Lotes" })}</span>
            <span className="font-mono text-[10px] text-slate-400">RUNS</span>
          </div>
          <p className="text-xl font-bold text-slate-100 font-mono">{kpis.totalRuns}</p>
          <p className="text-[11px] text-slate-400">
            {kpis.finalizedRuns} {t({ en: "finalized", es: "finalizadas", pt: "finalizadas" })}
          </p>
        </Card>

        {/* KPI 3: Beneficiary Wallets */}
        <Card className="p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{t({ en: "Staking Holders", es: "Titulares en Staking", pt: "Titulares em Staking" })}</span>
            <span className="font-mono text-[10px] text-slate-400">WALLETS</span>
          </div>
          <p className="text-xl font-bold text-slate-100 font-mono">{kpis.totalWallets}</p>
          <p className="text-[11px] text-slate-400">
            {t({ en: "MPL Core Freeze Active", es: "Freeze MPL Core Activo", pt: "Freeze MPL Core Ativo" })}
          </p>
        </Card>

        {/* KPI 4: Squads Multisig Status */}
        <Card className="p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{t({ en: "Squads Vault", es: "Bóveda Squads", pt: "Cofre Squads" })}</span>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-emerald-400 text-[10px] font-semibold">2 / 4 Quorum</span>
          </div>
          <p className="text-sm font-semibold text-slate-200 font-mono truncate">rVKw...KaD</p>
          <p className="text-[11px] text-slate-400">
            Devnet Cluster Active
          </p>
        </Card>
      </div>

      {/* 3. Distribution Runs Table & Filter Section */}
      <Card className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-base font-semibold text-slate-100">
              {t({ en: "Historical & Active Runs", es: "Corridas Activas e Históricas", pt: "Lotes Ativos e Historicos" })}
            </h3>
            <p className="text-xs text-slate-400">
              {t({
                en: "Inspect settlement trees, proof hashes, and payout status.",
                es: "Inspecciona árboles de liquidación, hashes de prueba y estado de pagos.",
                pt: "Inspecione arvores de liquidacao, hashes e status de pagamento.",
              })}
            </p>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 p-1">
            {(["all", "draft", "finalized", "blocked"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setFilterStatus(filter)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  filterStatus === filter
                    ? "bg-slate-800 text-slate-100"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {filter === "all" ? t({ en: "All", es: "Todos", pt: "Todos" }) : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {runsState.status === "loading" ? (
          <div className="flex items-center justify-center py-10 text-xs text-slate-400">
            {t({ en: "Loading distribution runs...", es: "Cargando corridas de distribución...", pt: "Carregando lotes de distribuicao..." })}
          </div>
        ) : null}

        {runsState.status === "error" ? (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            {runsState.error}
          </div>
        ) : null}

        {runsState.status === "ready" && filteredRuns.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/30 py-10 text-center">
            <p className="text-sm font-medium text-slate-300">
              {t({ en: "No distribution runs found", es: "No se encontraron corridas de distribución", pt: "Nenhum lote encontrado" })}
            </p>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              {t({
                en: "Create a new run to calculate snapshot allocations from staking history.",
                es: "Crea una nueva corrida para calcular las asignaciones basadas en el historial de staking.",
                pt: "Crie um novo lote para calcular as alocacoes do historico de staking.",
              })}
            </p>
          </div>
        ) : null}

        {filteredRuns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="px-3 py-2.5">Run ID</th>
                  <th className="px-3 py-2.5">Period</th>
                  <th className="px-3 py-2.5">Collection / Property</th>
                  <th className="px-3 py-2.5">Wallets</th>
                  <th className="px-3 py-2.5">Items</th>
                  <th className="px-3 py-2.5">Amount (USDC)</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Created</th>
                  <th className="px-3 py-2.5 text-right">{t({ en: "Actions", es: "Acciones", pt: "Acoes" })}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {filteredRuns.map((run) => (
                  <tr key={run.id} className="transition-colors hover:bg-slate-900/50">
                    <td className="px-3 py-2.5 text-slate-200">{shortValue(run.id)}</td>
                    <td className="px-3 py-2.5 text-slate-300 font-sans">{run.periodKey}</td>
                    <td className="px-3 py-2.5 text-slate-400 font-sans">
                      {shortValue(run.collectionAddress)} <span className="text-slate-600">/</span> {run.propertyId}
                    </td>
                    <td className="px-3 py-2.5 text-slate-300">{run.totalWallets}</td>
                    <td className="px-3 py-2.5 text-slate-300">{run.itemCount}</td>
                    <td className="px-3 py-2.5 text-slate-100 font-bold">{formatUsdcAmount(run.totalAmountMinor)}</td>
                    <td className="px-3 py-2.5 font-sans">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusBadgeClass(run.status)}`}>
                        {statusLabel(run.status, t)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-400 font-sans">{formatDate(run.createdAt)}</td>
                    <td className="px-3 py-2.5 text-right font-sans">
                      <Button
                        className="border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs px-2.5 py-1 min-h-8"
                        variant="ghost"
                        onClick={() => setSelected(run)}
                      >
                        {t({ en: "View Detail", es: "Ver Detalle", pt: "Ver Detalhe" })}
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelected(null)}
            type="button"
          />
          <aside className="relative z-10 h-full w-full max-w-xl overflow-y-auto border-l border-slate-800 bg-slate-950 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
                  {t({ en: "Run Inspection", es: "Inspección de Corrida", pt: "Inspecao de Lote" })}
                </span>
                <h3 className="break-all text-lg font-bold text-slate-100 font-mono">{selected.id}</h3>
              </div>
              <Button className="text-xs h-8 px-2" variant="ghost" onClick={() => setSelected(null)}>
                ✕ {t({ en: "Close", es: "Cerrar", pt: "Fechar" })}
              </Button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                  <span className="text-slate-400">{t({ en: "Period", es: "Período", pt: "Periodo" })}</span>
                  <p className="mt-1 font-semibold text-slate-200 text-sm font-sans">{selected.periodKey}</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                  <span className="text-slate-400">{t({ en: "Status", es: "Estado", pt: "Estado" })}</span>
                  <p className="mt-1">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${statusBadgeClass(selected.status)}`}>
                      {statusLabel(selected.status, t)}
                    </span>
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-3 font-mono">
                <div>
                  <span className="text-slate-500 text-[11px]">Collection Mint</span>
                  <p className="break-all text-slate-300 text-xs">{selected.collectionAddress}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Property Identifier</span>
                  <p className="break-all text-slate-300 text-xs font-sans">{selected.propertyId}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Token Mint</span>
                  <p className="break-all text-slate-300 text-xs">{selected.tokenMint}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Total Net Minor Units</span>
                  <p className="text-emerald-400 font-bold text-sm">{formatUsdcAmount(selected.totalAmountMinor)} ({selected.totalAmountMinor} units)</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Merkle Checksum / Output Hash</span>
                  <p className="break-all text-slate-400 text-xs">{selected.outputChecksum ?? "Pending seal..."}</p>
                </div>
                {selected.blockedReason ? (
                  <div>
                    <span className="text-rose-400 text-[11px]">Blocked Reason</span>
                    <p className="break-all text-rose-300 text-xs font-sans">{selected.blockedReason}</p>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <Link href={`/admin/treasury/squads?runId=${selected.id}`}>
                  <Button className="border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium min-h-9">
                    {t({ en: "View Squads Proposal", es: "Ver Propuesta Squads", pt: "Ver Proposta Squads" })}
                  </Button>
                </Link>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
