"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReactElement } from "react";

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

export function DistributionsConsole(): ReactElement {
  const [selected, setSelected] = useState<DistributionBatch | null>(null);

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <h2 className="text-lg font-semibold text-white">Distribucion</h2>
        <p className="text-sm text-white/75">Gestion de lotes de distribucion y estado de ejecucion.</p>
      </Card>

      <Card className="space-y-3">
        <p className="text-sm font-semibold text-white">Lotes de distribucion</p>
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
                <th className="px-2 py-2 font-medium">acciones</th>
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
                    <span className={`rounded-full px-2 py-1 text-xs ${statusClass(row.status)}`}>{row.status}</span>
                  </td>
                  <td className="px-2 py-2 text-white">{row.createdAt}</td>
                  <td className="px-2 py-2 text-white">{row.executedAt}</td>
                  <td className="px-2 py-2">
                    <div className="flex flex-wrap gap-1">
                      <Button className="min-h-9 px-3 py-1 text-xs" variant="ghost">
                        Generar preview
                      </Button>
                      <Button className="min-h-9 px-3 py-1 text-xs" variant="ghost">
                        Ver elegibles
                      </Button>
                      <Button className="min-h-9 px-3 py-1 text-xs" variant="outline">
                        Ejecutar lote
                      </Button>
                      <Button className="min-h-9 px-3 py-1 text-xs" variant="ghost" onClick={() => setSelected(row)}>
                        Ver detalle
                      </Button>
                      <Button className="min-h-9 px-3 py-1 text-xs" variant="ghost">
                        Reintentar
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
          Integraciones previstas: <span className="font-semibold text-white">Squads</span> (propuestas) y{" "}
          <span className="font-semibold text-white">Streamflow</span> (streams por wallet).
        </p>
        <Link href="/admin/treasury">
          <Button className="min-h-11" variant="outline">
            Ir a tesoreria
          </Button>
        </Link>
      </Card>

      {selected && (
        <div className="fixed inset-0 z-50">
          <button aria-label="Cerrar detalle distribucion" className="absolute inset-0 bg-black/70" onClick={() => setSelected(null)} type="button" />
          <aside className="relative ml-auto h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-[#070b14] p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Detalle de lote {selected.distributionId}</h3>
              <Button className="min-h-11" variant="ghost" onClick={() => setSelected(null)}>
                Cerrar
              </Button>
            </div>
            <Card className="mt-4 space-y-2 text-sm text-white/80">
              <p>Resumen del periodo: {selected.period}</p>
              <p>Wallets elegibles: {selected.eligibleWallets}</p>
              <p>Monto total: {selected.totalAmount}</p>
              <p>Estado de streams: ready</p>
              <p>Errores: ninguno</p>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
