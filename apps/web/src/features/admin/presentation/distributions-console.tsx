"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";

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
  error: null
};

function statusClass(status: DistributionRunStatus): string {
  if (status === "finalized") return "bg-emerald-500/20 text-emerald-200";
  if (status === "failed") return "bg-rose-500/20 text-rose-200";
  if (status === "blocked") return "bg-amber-500/20 text-amber-200";
  return "bg-slate-500/20 text-slate-200";
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

  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "-";
  }

  return new Date(value).toISOString().slice(0, 10);
}

async function fetchDistributionRuns(): Promise<DistributionRun[]> {
  const response = await fetch("/api/admin/distributions/runs", {
    cache: "no-store"
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
            error: error instanceof Error ? error.message : "Could not load distribution runs."
          });
        }
      }
    }

    void loadRuns();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <h2 className="text-lg font-semibold text-white">{t({ en: "Distribution", es: "Distribucion", pt: "Distribuicao" })}</h2>
        <p className="text-sm text-white/75">{t({ en: "Manage prepared distribution runs and finalization status.", es: "Gestiona corridas de distribucion preparadas y estado de finalizacion.", pt: "Gerencie corridas de distribuicao preparadas e status de finalizacao." })}</p>
      </Card>

      <Card className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-white">{t({ en: "Distribution runs", es: "Corridas de distribucion", pt: "Corridas de distribuicao" })}</p>
          {runsState.status === "loading" ? (
            <span className="text-xs text-cyan-100">{t({ en: "Loading real runs...", es: "Cargando corridas reales...", pt: "Carregando corridas reais..." })}</span>
          ) : null}
        </div>

        {runsState.status === "error" ? (
          <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 p-4 text-sm text-rose-100">
            {runsState.error}
          </div>
        ) : null}

        {runsState.status === "ready" && runsState.runs.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/75">
            {t({ en: "No distribution runs yet", es: "Aun no hay corridas de distribucion", pt: "Ainda nao ha corridas de distribuicao" })}
          </div>
        ) : null}

        {runsState.runs.length > 0 ? (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-white/60">
                    <th className="px-2 py-2 font-medium">runId</th>
                    <th className="px-2 py-2 font-medium">period</th>
                    <th className="px-2 py-2 font-medium">scope</th>
                    <th className="px-2 py-2 font-medium">wallets</th>
                    <th className="px-2 py-2 font-medium">items</th>
                    <th className="px-2 py-2 font-medium">amountMinor</th>
                    <th className="px-2 py-2 font-medium">status</th>
                    <th className="px-2 py-2 font-medium">createdAt</th>
                    <th className="px-2 py-2 font-medium">{t({ en: "actions", es: "acciones", pt: "acoes" })}</th>
                  </tr>
                </thead>
                <tbody>
                  {runsState.runs.map((run) => (
                    <tr key={run.id} className="border-b border-white/10">
                      <td className="px-2 py-2 text-white">{shortValue(run.id)}</td>
                      <td className="px-2 py-2 text-white">{run.periodKey}</td>
                      <td className="px-2 py-2 text-white">{shortValue(run.collectionAddress)} / {run.propertyId}</td>
                      <td className="px-2 py-2 text-white">{run.totalWallets}</td>
                      <td className="px-2 py-2 text-white">{run.itemCount}</td>
                      <td className="px-2 py-2 text-white">{run.totalAmountMinor}</td>
                      <td className="px-2 py-2">
                        <span className={`rounded-full px-2 py-1 text-xs ${statusClass(run.status)}`}>{statusLabel(run.status, t)}</span>
                      </td>
                      <td className="px-2 py-2 text-white">{formatDate(run.createdAt)}</td>
                      <td className="px-2 py-2">
                        <Button className="min-h-9 px-3 py-1 text-xs" variant="ghost" onClick={() => setSelected(run)}>
                          {t({ en: "View detail", es: "Ver detalle", pt: "Ver detalhe" })}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 lg:hidden">
              {runsState.runs.map((run) => (
                <article key={run.id} className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-all text-sm font-semibold text-white">{run.id}</p>
                      <p className="text-xs text-white/60">{run.periodKey}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-xs ${statusClass(run.status)}`}>{statusLabel(run.status, t)}</span>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/70">
                    <div>
                      <dt className="text-white/45">wallets</dt>
                      <dd className="text-white">{run.totalWallets}</dd>
                    </div>
                    <div>
                      <dt className="text-white/45">items</dt>
                      <dd className="text-white">{run.itemCount}</dd>
                    </div>
                    <div className="col-span-2 min-w-0">
                      <dt className="text-white/45">scope</dt>
                      <dd className="break-all text-white">{run.collectionAddress} / {run.propertyId}</dd>
                    </div>
                  </dl>
                  <Button className="mt-3 min-h-10 w-full" variant="ghost" onClick={() => setSelected(run)}>
                    {t({ en: "View detail", es: "Ver detalle", pt: "Ver detalhe" })}
                  </Button>
                </article>
              ))}
            </div>
          </>
        ) : null}
      </Card>

      <Card className="space-y-2">
        <p className="text-sm text-white/75">
          {t({ en: "Prepared runs are server-owned records. Payment execution remains outside this module.", es: "Las corridas preparadas son registros controlados por el servidor. La ejecucion de pagos queda fuera de este modulo.", pt: "As corridas preparadas sao registros controlados pelo servidor. A execucao de pagamentos fica fora deste modulo." })}
        </p>
        {showTreasuryLink ? (
          <Link href="/admin/treasury">
            <Button className="min-h-11" variant="outline">
              {t({ en: "Go to treasury", es: "Ir a tesoreria", pt: "Ir para tesouraria" })}
            </Button>
          </Link>
        ) : null}
      </Card>

      {selected ? (
        <div className="fixed inset-0 z-50">
          <button
            aria-label={t({ en: "Close distribution detail", es: "Cerrar detalle distribucion", pt: "Fechar detalhe de distribuicao" })}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelected(null)}
            type="button"
          />
          <aside className="glass-drawer-surface relative ml-auto h-full w-full max-w-xl overflow-y-auto p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="min-w-0 break-all text-lg font-semibold text-white">{t({ en: "Run detail", es: "Detalle de corrida", pt: "Detalhe da corrida" })} {selected.id}</h3>
              <Button className="min-h-11 shrink-0" variant="ghost" onClick={() => setSelected(null)}>
                {t({ en: "Close", es: "Cerrar", pt: "Fechar" })}
              </Button>
            </div>
            <Card className="mt-4 space-y-2 text-sm text-white/80">
              <p>{t({ en: "Period", es: "Periodo", pt: "Periodo" })}: {selected.periodKey}</p>
              <p className="break-all">collection: {selected.collectionAddress}</p>
              <p className="break-all">property: {selected.propertyId}</p>
              <p>{t({ en: "Eligible wallets", es: "Wallets elegibles", pt: "Wallets elegiveis" })}: {selected.totalWallets}</p>
              <p>{t({ en: "Prepared items", es: "Items preparados", pt: "Itens preparados" })}: {selected.itemCount}</p>
              <p>{t({ en: "Amount minor units", es: "Monto en unidades menores", pt: "Valor em unidades menores" })}: {selected.totalAmountMinor}</p>
              <p>{t({ en: "Finalized at", es: "Finalizado en", pt: "Finalizado em" })}: {formatDate(selected.finalizedAt)}</p>
              <p className="break-all">checksum: {selected.outputChecksum ?? "-"}</p>
              {selected.blockedReason ? <p className="break-all">blockedReason: {selected.blockedReason}</p> : null}
            </Card>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
