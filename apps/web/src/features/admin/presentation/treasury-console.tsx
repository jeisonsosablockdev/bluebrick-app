"use client";

/**
 * =========================================================================================
 * Layer 1: Presentation Layer — Treasury Console & Exception Controls
 * Description: Admin treasury overview with framework proposal rejection, granular pre-seal
 *              item veto, and dual-layer emergency circuit breaker controls.
 * Aesthetics: Sober, minimal dark UI aligned with /profile styling (zero emojis).
 * =========================================================================================
 */

import Link from "next/link";
import { useState, type ReactElement } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { isReleaseControlledRouteVisible } from "@/lib/release-module-visibility";

interface PayoutRunItem {
  id: string;
  runId: string;
  recipientWallet: string;
  amount: string;
  status: "active" | "vetoed";
}

interface ActivePayoutRun {
  id: string;
  status: "draft" | "blocked" | "sealed" | "executing" | "finalized" | "paused";
  totalAmount: string;
  itemsCount: number;
}

const SAMPLE_RUN: ActivePayoutRun = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  status: "draft",
  totalAmount: "$296,400",
  itemsCount: 142
};

const SAMPLE_ITEMS: PayoutRunItem[] = [
  {
    id: "item-001",
    runId: "550e8400-e29b-41d4-a716-446655440000",
    recipientWallet: "3tW8...siATd",
    amount: "$2,400",
    status: "active"
  },
  {
    id: "item-002",
    runId: "550e8400-e29b-41d4-a716-446655440000",
    recipientWallet: "7xKX...sgAsU",
    amount: "$1,850",
    status: "active"
  }
];

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

  const [activeRun, setActiveRun] = useState<ActivePayoutRun>(SAMPLE_RUN);
  const [items, setItems] = useState<PayoutRunItem[]>(SAMPLE_ITEMS);
  const [isRejecting, setIsRejecting] = useState(false);
  const [vetoingItemId, setVetoingItemId] = useState<string | null>(null);
  const [isTriggeringCircuitBreaker, setIsTriggeringCircuitBreaker] = useState(false);
  const [circuitBreakerActive, setCircuitBreakerActive] = useState(false);
  const [pausePayload, setPausePayload] = useState<Record<string, unknown> | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Rejects an active proposal run globally.
   * What: Sends rejection request to backend API.
   * How: POST to /api/admin/payout-runs/[id]/reject and updates run status to blocked.
   */
  const handleRejectProposal = async () => {
    setIsRejecting(true);
    setActionMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/admin/payout-runs/${activeRun.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Rejected by admin from Treasury Console" })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message ?? "Failed to reject proposal");
      }

      setActiveRun((prev) => ({ ...prev, status: "blocked" }));
      setActionMessage("Proposal successfully rejected and unblocked.");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error rejecting proposal");
    } finally {
      setIsRejecting(false);
    }
  };

  /**
   * Vetoes an individual item pre-seal.
   * What: Calls veto endpoint for single recipient.
   * How: POST to /api/admin/payout-runs/[id]/veto and updates item status locally.
   */
  const handleVetoItem = async (itemId: string) => {
    setVetoingItemId(itemId);
    setActionMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/admin/payout-runs/${activeRun.id}/veto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, reason: "Vetoed by admin from Treasury Console" })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message ?? "Failed to veto item");
      }

      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, status: "vetoed" } : item))
      );
      setActionMessage(`Item ${itemId} vetoed successfully.`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error vetoing item");
    } finally {
      setVetoingItemId(null);
    }
  };

  /**
   * Triggers emergency circuit breaker.
   * What: Stops local crank bot and generates emergency on-chain pause payload.
   * How: POST to /api/admin/payout-runs/[id]/circuit-breaker and stores pause payload.
   */
  const handleTriggerCircuitBreaker = async () => {
    setIsTriggeringCircuitBreaker(true);
    setActionMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/admin/payout-runs/${activeRun.id}/circuit-breaker`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: "Emergency halt triggered from Treasury Console",
          ttlSeconds: 300
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message ?? "Failed to trigger circuit breaker");
      }

      setCircuitBreakerActive(true);
      setPausePayload(json.data.emergencyPausePayload);
      setActionMessage("Circuit breaker activated. Local bot paused.");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error triggering circuit breaker");
    } finally {
      setIsTriggeringCircuitBreaker(false);
    }
  };

  const isPreSeal = ["draft", "blocked"].includes(activeRun.status);

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <h2 className="text-lg font-semibold text-white">
          {t({ en: "Treasury", es: "Tesoreria", pt: "Tesouraria" })}
        </h2>
        <p className="text-sm text-white/75">
          {t({
            en: "Financial visibility for mint and distribution operations.",
            es: "Visibilidad financiera para operacion de mint y distribucion.",
            pt: "Visibilidade financeira para operacoes de mint e distribuicao."
          })}
        </p>
      </Card>

      {actionMessage ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
          {actionMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
          {errorMessage}
        </div>
      ) : null}

      {circuitBreakerActive ? (
        <Card className="border-amber-500/30 bg-amber-500/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              {t({ en: "Circuit Breaker Active", es: "Freno de Emergencia Activo", pt: "Freio de Emergencia Ativo" })}
            </span>
            <span className="rounded bg-amber-400/20 px-2 py-0.5 text-xs text-amber-300">
              {t({ en: "Local Bot Halted", es: "Bot Local Detenido", pt: "Bot Local Parado" })}
            </span>
          </div>
          <p className="text-xs text-amber-200/80">
            {t({
              en: "Emergency fast-pause payload prepared. TTL: 300s. Broadcast on-chain via pause_run.",
              es: "Payload de pausa rapida listo. TTL: 300s. Retransmitir on-chain mediante pause_run.",
              pt: "Payload de pausa rapida pronto. TTL: 300s. Retransmitir on-chain via pause_run."
            })}
          </p>
          {pausePayload ? (
            <pre className="overflow-x-auto rounded bg-black/40 p-2 text-[11px] text-white/80 font-mono">
              {JSON.stringify(pausePayload, null, 2)}
            </pre>
          ) : null}
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="space-y-1">
          <p className="text-xs uppercase tracking-[0.12em] text-white/60">
            {t({ en: "Total USDC balance", es: "Balance total USDC", pt: "Saldo total USDC" })}
          </p>
          <p className="text-2xl font-semibold text-white">$842,120</p>
        </Card>
        <Card className="space-y-1">
          <p className="text-xs uppercase tracking-[0.12em] text-white/60">
            {t({ en: "Committed funds", es: "Fondos comprometidos", pt: "Fundos comprometidos" })}
          </p>
          <p className="text-2xl font-semibold text-white">{activeRun.totalAmount}</p>
        </Card>
        <Card className="space-y-1">
          <p className="text-xs uppercase tracking-[0.12em] text-white/60">
            {t({ en: "Available funds", es: "Fondos disponibles", pt: "Fundos disponiveis" })}
          </p>
          <p className="text-2xl font-semibold text-white">$545,720</p>
        </Card>
      </div>

      {/* Active Proposal Exception & Veto Controls */}
      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-white">
              {t({ en: "Active Distribution Run", es: "Lote de Distribucion Activo", pt: "Lote de Distribuicao Ativo" })}
            </p>
            <p className="text-xs text-white/60">
              Run: {activeRun.id} | Status: <span className="text-white font-medium">{activeRun.status}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isPreSeal ? (
              <Button
                variant="outline"
                className="min-h-9 border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs"
                onClick={handleRejectProposal}
                disabled={isRejecting}
              >
                {isRejecting ? t({ en: "Rejecting...", es: "Rechazando...", pt: "Rejeitando..." }) : t({ en: "Reject Proposal", es: "Rechazar Propuesta", pt: "Rejeitar Proposta" })}
              </Button>
            ) : null}
            <Button
              variant="outline"
              className="min-h-9 border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs"
              onClick={handleTriggerCircuitBreaker}
              disabled={isTriggeringCircuitBreaker || circuitBreakerActive}
            >
              {isTriggeringCircuitBreaker ? t({ en: "Halting...", es: "Deteniendo...", pt: "Parando..." }) : t({ en: "Emergency Pause", es: "Freno de Emergencia", pt: "Freio de Emergencia" })}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/60">
                <th className="px-2 py-2 font-medium">Item ID</th>
                <th className="px-2 py-2 font-medium">Recipient</th>
                <th className="px-2 py-2 font-medium">Amount</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-white/10">
                  <td className="px-2 py-2 text-white">{item.id}</td>
                  <td className="px-2 py-2 text-white">{item.recipientWallet}</td>
                  <td className="px-2 py-2 text-white">{item.amount}</td>
                  <td className="px-2 py-2 text-white">
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs ${
                        item.status === "vetoed"
                          ? "bg-rose-500/20 text-rose-400"
                          : "bg-emerald-500/20 text-emerald-400"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    {isPreSeal && item.status === "active" ? (
                      <Button
                        variant="outline"
                        className="min-h-7 px-2 text-xs text-rose-400 hover:bg-rose-500/10"
                        onClick={() => handleVetoItem(item.id)}
                        disabled={vetoingItemId === item.id}
                      >
                        {vetoingItemId === item.id
                          ? t({ en: "Vetoing...", es: "Vetando...", pt: "Vetando..." })
                          : t({ en: "Veto", es: "Vetar", pt: "Vetar" })}
                      </Button>
                    ) : (
                      <span className="text-xs text-white/40">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="space-y-3">
        <p className="text-sm font-semibold text-white">
          {t({ en: "Recent movements", es: "Movimientos recientes", pt: "Movimentos recentes" })}
        </p>
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

      {/* Project Governance & Notary Dates Section */}
      <Card className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-white">
            {t({
              en: "Project Dates & Notary Governance",
              es: "Fechas de Proyecto y Gobernanza Notarial",
              pt: "Datas do Projeto e Governanca Notarial"
            })}
          </p>
          <p className="text-xs text-white/60">
            {t({
              en: "Project start and end dates are governed on-chain via Squads multisig and ProjectConfig PDA. Direct database mutations are blocked.",
              es: "Las fechas de inicio y fin estan gobernadas on-chain mediante el multisig de Squads y la PDA ProjectConfig. Las mutaciones directas a base de datos estan bloqueadas.",
              pt: "As datas de inicio e fim sao governadas on-chain via multisig do Squads e PDA ProjectConfig. Mutacoes diretas ao banco de dados estao bloqueadas."
            })}
          </p>
        </div>

        <div className="rounded border border-white/10 bg-white/[0.02] p-3 text-xs space-y-2">
          <div className="flex items-center justify-between text-white/80">
            <span className="text-white/60">
              {t({ en: "Source of Truth", es: "Fuente de Verdad", pt: "Fonte da Verdade" })}:
            </span>
            <span className="font-mono text-emerald-400">Solana Devnet PDA (134 bytes)</span>
          </div>
          <div className="flex items-center justify-between text-white/80">
            <span className="text-white/60">
              {t({ en: "Read-Model Cache", es: "Cache Read-Model", pt: "Cache Read-Model" })}:
            </span>
            <span className="text-white font-mono">Postgres Read Replica</span>
          </div>
          <div className="flex items-center justify-between text-white/80">
            <span className="text-white/60">
              {t({ en: "Governance Mechanism", es: "Mecanismo de Gobernanza", pt: "Mecanismo de Governanca" })}:
            </span>
            <span className="text-white">Squads v4 Multisig CPI</span>
          </div>
        </div>
      </Card>

      <Card className="space-y-2">
        <p className="text-sm font-semibold text-white">
          {t({ en: "Visual actions", es: "Acciones visuales", pt: "Acoes visuais" })}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button className="min-h-11" variant="outline">
            {t({ en: "View movements", es: "Ver movimientos", pt: "Ver movimentos" })}
          </Button>
          <Button className="min-h-11" variant="outline">
            {t({ en: "View proposal in Squads", es: "Ver propuesta en Squads", pt: "Ver proposta no Squads" })}
          </Button>
          {showDistributionsLink ? (
            <Link href="/admin/distributions">
              <Button className="min-h-11">
                {t({ en: "Go to distribution", es: "Ir a distribucion", pt: "Ir para distribuicao" })}
              </Button>
            </Link>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
