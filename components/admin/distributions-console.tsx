"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { useState } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type DistributionStatus = "draft" | "calculated" | "ready" | "executing" | "completed" | "failed";

type DistributionBatch = {
  distributionId: string;
  period: string;
  assetCount: number;
  eligibleWallets: number;
  totalAmount: string;
  status: DistributionStatus;
  createdAt: string;
  executedAt: string;
};

const BATCHES: DistributionBatch[] = [
  {
    distributionId: "D-2026-03",
    period: "2026-03",
    assetCount: 9,
    eligibleWallets: 624,
    totalAmount: "$18,540",
    status: "ready",
    createdAt: "2026-03-05",
    executedAt: "-"
  },
  {
    distributionId: "D-2026-02",
    period: "2026-02",
    assetCount: 8,
    eligibleWallets: 588,
    totalAmount: "$17,102",
    status: "completed",
    createdAt: "2026-02-05",
    executedAt: "2026-02-07"
  }
];

function statusClass(status: DistributionStatus): string {
  if (status === "completed") return "bg-emerald-500/20 text-emerald-200";
  if (status === "failed") return "bg-rose-500/20 text-rose-200";
  if (status === "ready") return "bg-indigo-500/20 text-indigo-200";
  if (status === "executing") return "bg-amber-500/20 text-amber-200";
  return "bg-slate-500/20 text-slate-200";
}

function statusLabel(status: DistributionStatus, t: ReturnType<typeof useI18n>["t"]): string {
  if (status === "draft") return t({ en: "Draft", es: "Borrador", pt: "Rascunho" });
  if (status === "calculated") return t({ en: "Calculated", es: "Calculado", pt: "Calculado" });
  if (status === "ready") return t({ en: "Ready", es: "Listo", pt: "Pronto" });
  if (status === "executing") return t({ en: "Executing", es: "Ejecutando", pt: "Executando" });
  if (status === "completed") return t({ en: "Completed", es: "Completado", pt: "Concluido" });
  return t({ en: "Failed", es: "Fallido", pt: "Falhou" });
}

export function DistributionsConsole(): ReactElement {
  const { t } = useI18n();
  const [selected, setSelected] = useState<DistributionBatch | null>(null);

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <h2 className="text-lg font-semibold text-white">{t({ en: "Distribution", es: "Distribucion", pt: "Distribuicao" })}</h2>
        <p className="text-sm text-white/75">{t({ en: "Manage distribution batches and execution status.", es: "Gestion de lotes de distribucion y estado de ejecucion.", pt: "Gestao de lotes de distribuicao e status de execucao." })}</p>
      </Card>

      <Card className="space-y-3">
        <p className="text-sm font-semibold text-white">{t({ en: "Distribution batches", es: "Lotes de distribucion", pt: "Lotes de distribuicao" })}</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/60">
                <th className="px-2 py-2 font-medium">distributionId</th>
                <th className="px-2 py-2 font-medium">period</th>
                <th className="px-2 py-2 font-medium">assetCount</th>
                <th className="px-2 py-2 font-medium">eligibleWallets</th>
                <th className="px-2 py-2 font-medium">totalAmount</th>
                <th className="px-2 py-2 font-medium">status</th>
                <th className="px-2 py-2 font-medium">createdAt</th>
                <th className="px-2 py-2 font-medium">executedAt</th>
                <th className="px-2 py-2 font-medium">{t({ en: "actions", es: "acciones", pt: "acoes" })}</th>
              </tr>
            </thead>
            <tbody>
              {BATCHES.map((row) => (
                <tr key={row.distributionId} className="border-b border-white/10">
                  <td className="px-2 py-2 text-white">{row.distributionId}</td>
                  <td className="px-2 py-2 text-white">{row.period}</td>
                  <td className="px-2 py-2 text-white">{row.assetCount}</td>
                  <td className="px-2 py-2 text-white">{row.eligibleWallets}</td>
                  <td className="px-2 py-2 text-white">{row.totalAmount}</td>
                  <td className="px-2 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs ${statusClass(row.status)}`}>{statusLabel(row.status, t)}</span>
                  </td>
                  <td className="px-2 py-2 text-white">{row.createdAt}</td>
                  <td className="px-2 py-2 text-white">{row.executedAt}</td>
                  <td className="px-2 py-2">
                    <div className="flex flex-wrap gap-1">
                      <Button className="min-h-9 px-3 py-1 text-xs" variant="ghost">
                        {t({ en: "Generate preview", es: "Generar preview", pt: "Gerar preview" })}
                      </Button>
                      <Button className="min-h-9 px-3 py-1 text-xs" variant="ghost">
                        {t({ en: "View eligible", es: "Ver elegibles", pt: "Ver elegiveis" })}
                      </Button>
                      <Button className="min-h-9 px-3 py-1 text-xs" variant="outline">
                        {t({ en: "Run batch", es: "Ejecutar lote", pt: "Executar lote" })}
                      </Button>
                      <Button className="min-h-9 px-3 py-1 text-xs" variant="ghost" onClick={() => setSelected(row)}>
                        {t({ en: "View detail", es: "Ver detalle", pt: "Ver detalhe" })}
                      </Button>
                      <Button className="min-h-9 px-3 py-1 text-xs" variant="ghost">
                        {t({ en: "Retry", es: "Reintentar", pt: "Tentar novamente" })}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="space-y-2">
        <p className="text-sm text-white/75">
          {t({ en: "Planned integrations", es: "Integraciones previstas", pt: "Integracoes previstas" })}: <span className="font-semibold text-white">Squads</span> ({t({ en: "proposals", es: "propuestas", pt: "propostas" })}){" "}
          {t({ en: "and", es: "y", pt: "e" })} <span className="font-semibold text-white">Streamflow</span> ({t({ en: "streams by wallet", es: "streams por wallet", pt: "streams por wallet" })}).
        </p>
        <Link href="/admin/treasury">
          <Button className="min-h-11" variant="outline">
            {t({ en: "Go to treasury", es: "Ir a tesoreria", pt: "Ir para tesouraria" })}
          </Button>
        </Link>
      </Card>

      {selected && (
        <div className="fixed inset-0 z-50">
          <button
            aria-label={t({ en: "Close distribution detail", es: "Cerrar detalle distribucion", pt: "Fechar detalhe de distribuicao" })}
            className="absolute inset-0 bg-black/70"
            onClick={() => setSelected(null)}
            type="button"
          />
          <aside className="relative ml-auto h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-[#070b14] p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{t({ en: "Batch detail", es: "Detalle de lote", pt: "Detalhe do lote" })} {selected.distributionId}</h3>
              <Button className="min-h-11" variant="ghost" onClick={() => setSelected(null)}>
                {t({ en: "Close", es: "Cerrar", pt: "Fechar" })}
              </Button>
            </div>
            <Card className="mt-4 space-y-2 text-sm text-white/80">
              <p>{t({ en: "Period summary", es: "Resumen del periodo", pt: "Resumo do periodo" })}: {selected.period}</p>
              <p>{t({ en: "Eligible wallets", es: "Wallets elegibles", pt: "Wallets elegiveis" })}: {selected.eligibleWallets}</p>
              <p>{t({ en: "Total amount", es: "Monto total", pt: "Valor total" })}: {selected.totalAmount}</p>
              <p>{t({ en: "Stream status", es: "Estado de streams", pt: "Status dos streams" })}: ready</p>
              <p>{t({ en: "Errors", es: "Errores", pt: "Erros" })}: {t({ en: "none", es: "ninguno", pt: "nenhum" })}</p>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
