import Link from "next/link";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const MOVEMENTS = [
  { movementId: "MV-1001", type: "deposit", amount: "$120,000", token: "USDC", date: "2026-03-01", status: "processed", reference: "Bank wire" },
  { movementId: "MV-1002", type: "distribution", amount: "$18,540", token: "USDC", date: "2026-03-04", status: "processed", reference: "Batch D-2026-03" },
  { movementId: "MV-1003", type: "claim-funding", amount: "$3,200", token: "USDC", date: "2026-03-05", status: "pending", reference: "Claim pool top-up" }
];

export function TreasuryConsole(): ReactElement {
  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <h2 className="text-lg font-semibold text-white">Tesoreria</h2>
        <p className="text-sm text-white/75">Visibilidad financiera para operacion de mint y distribucion.</p>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="space-y-1">
          <p className="text-xs uppercase tracking-[0.12em] text-white/60">Balance total USDC</p>
          <p className="text-2xl font-semibold text-white">$842,120</p>
        </Card>
        <Card className="space-y-1">
          <p className="text-xs uppercase tracking-[0.12em] text-white/60">Fondos comprometidos</p>
          <p className="text-2xl font-semibold text-white">$296,400</p>
        </Card>
        <Card className="space-y-1">
          <p className="text-xs uppercase tracking-[0.12em] text-white/60">Fondos disponibles</p>
          <p className="text-2xl font-semibold text-white">$545,720</p>
        </Card>
      </div>

      <Card className="space-y-3">
        <p className="text-sm font-semibold text-white">Movimientos recientes</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/60">
                <th className="px-2 py-2 font-medium">movementId</th>
                <th className="px-2 py-2 font-medium">type</th>
                <th className="px-2 py-2 font-medium">amount</th>
                <th className="px-2 py-2 font-medium">token</th>
                <th className="px-2 py-2 font-medium">date</th>
                <th className="px-2 py-2 font-medium">status</th>
                <th className="px-2 py-2 font-medium">reference</th>
              </tr>
            </thead>
            <tbody>
              {MOVEMENTS.map((row) => (
                <tr key={row.movementId} className="border-b border-white/10">
                  <td className="px-2 py-2 text-white">{row.movementId}</td>
                  <td className="px-2 py-2 text-white">{row.type}</td>
                  <td className="px-2 py-2 text-white">{row.amount}</td>
                  <td className="px-2 py-2 text-white">{row.token}</td>
                  <td className="px-2 py-2 text-white">{row.date}</td>
                  <td className="px-2 py-2 text-white">{row.status}</td>
                  <td className="px-2 py-2 text-white/80">{row.reference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="space-y-2">
        <p className="text-sm font-semibold text-white">Acciones visuales</p>
        <div className="flex flex-wrap gap-2">
          <Button className="min-h-11" variant="outline">
            Ver movimientos
          </Button>
          <Button className="min-h-11" variant="outline">
            Ver propuesta en Squads
          </Button>
          <Link href="/admin/distributions">
            <Button className="min-h-11">Ir a distribucion</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
