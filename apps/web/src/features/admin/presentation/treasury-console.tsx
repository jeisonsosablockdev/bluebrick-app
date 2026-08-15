"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { isReleaseControlledRouteVisible } from "@/lib/release-module-visibility";

const MOVEMENTS = [
  {
    movementId: "MV-1001",
    type: "deposit",
    amount: "$120,000",
    token: "USDC",
    date: "2026-03-01",
    status: "processed",
    reference: "Bank wire"
  },
  {
    movementId: "MV-1002",
    type: "distribution",
    amount: "$18,540",
    token: "USDC",
    date: "2026-03-04",
    status: "processed",
    reference: "Batch D-2026-03"
  },
  {
    movementId: "MV-1003",
    type: "claim-funding",
    amount: "$3,200",
    token: "USDC",
    date: "2026-03-05",
    status: "pending",
    reference: "Claim pool top-up"
  }
];

export function TreasuryConsole(): ReactElement {
  const { t } = useI18n();
  const showDistributionsLink = isReleaseControlledRouteVisible("/admin/distributions");

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <h2 className="text-lg font-semibold text-white">{t({ en: "Treasury", es: "Tesoreria", pt: "Tesouraria" })}</h2>
        <p className="text-sm text-white/75">{t({ en: "Financial visibility for mint and distribution operations.", es: "Visibilidad financiera para operacion de mint y distribucion.", pt: "Visibilidade financeira para operacoes de mint e distribuicao." })}</p>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="space-y-1">
          <p className="text-xs uppercase tracking-[0.12em] text-white/60">{t({ en: "Total USDC balance", es: "Balance total USDC", pt: "Saldo total USDC" })}</p>
          <p className="text-2xl font-semibold text-white">$842,120</p>
        </Card>
        <Card className="space-y-1">
          <p className="text-xs uppercase tracking-[0.12em] text-white/60">{t({ en: "Committed funds", es: "Fondos comprometidos", pt: "Fundos comprometidos" })}</p>
          <p className="text-2xl font-semibold text-white">$296,400</p>
        </Card>
        <Card className="space-y-1">
          <p className="text-xs uppercase tracking-[0.12em] text-white/60">{t({ en: "Available funds", es: "Fondos disponibles", pt: "Fundos disponiveis" })}</p>
          <p className="text-2xl font-semibold text-white">$545,720</p>
        </Card>
      </div>

      <Card className="space-y-3">
        <p className="text-sm font-semibold text-white">{t({ en: "Recent movements", es: "Movimientos recientes", pt: "Movimentos recentes" })}</p>
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
        <p className="text-sm font-semibold text-white">{t({ en: "Visual actions", es: "Acciones visuales", pt: "Acoes visuais" })}</p>
        <div className="flex flex-wrap gap-2">
          <Button className="min-h-11" variant="outline">
            {t({ en: "View movements", es: "Ver movimientos", pt: "Ver movimentos" })}
          </Button>
          <Button className="min-h-11" variant="outline">
            {t({ en: "View proposal in Squads", es: "Ver propuesta en Squads", pt: "Ver proposta no Squads" })}
          </Button>
          {showDistributionsLink ? (
            <Link href="/admin/distributions">
              <Button className="min-h-11">{t({ en: "Go to distribution", es: "Ir a distribucion", pt: "Ir para distribuicao" })}</Button>
            </Link>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
