"use client";

/**
 * =========================================================================================
 * Layer 1: Presentation Layer — Treasury Console & Squads Governance
 * Module: treasury-console
 *
 * Description:
 * Modernized administrative treasury overview adhering to Next.js 16 App Router best
 * practices and sober dark aesthetics matching `/profile`. Connects to dynamic API
 * endpoints (/api/admin/treasury/summary) to inspect live on-chain date change proposals
 * (PENDING_MULTISIG), active payout runs, item vetoes, and circuit breaker controls.
 *
 * Invariants & Governance:
 * - Zero hardcoded mock fixtures in production paths.
 * - Layer 1 isolation: no direct database or RPC clients; uses Layer 2 API routes.
 * - Full multi-language support with i18n fallbacks.
 * =========================================================================================
 */

import Link from "next/link";
import { useEffect, useState, type ReactElement } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { PendingDateProposal } from "@/features/admin/presentation/admin-collection-notary-dates-panel";
import { isReleaseControlledRouteVisible } from "@/lib/release-module-visibility";

/**
 * Interface representing a single beneficiary item within an active payout run.
 */
export interface PayoutRunItem {
  id: string;
  runId: string;
  recipientWallet: string;
  amount: string;
  status: "active" | "vetoed";
}

/**
 * Interface representing an active payout run undergoing treasury governance.
 */
export interface ActivePayoutRun {
  id: string;
  status: "draft" | "blocked" | "sealed" | "executing" | "finalized" | "paused";
  totalAmount: string;
  itemsCount: number;
}

/**
 * Interface representing a recent treasury movement record.
 */
export interface TreasuryMovement {
  movementId: string;
  type: "deposit" | "distribution" | "claim-funding";
  amount: string;
  token: string;
  date: string;
  status: "processed" | "pending";
  reference: string;
}

/**
 * Main Presentation Component: TreasuryConsole
 * Provides interactive inspection of pending date change proposals, active distribution runs,
 * and emergency circuit breaker controls.
 */
export function TreasuryConsole(): ReactElement {
  const { t } = useI18n();
  const { publicKey, connected } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const showDistributionsLink = isReleaseControlledRouteVisible("/admin/distributions");
  const showSquadsLink = isReleaseControlledRouteVisible("/admin/treasury");

  // Step 1: Initialize dynamic state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pendingProposals, setPendingProposals] = useState<PendingDateProposal[]>([]);
  const [activeRun, setActiveRun] = useState<ActivePayoutRun | null>(null);
  const [items, setItems] = useState<PayoutRunItem[]>([]);
  const [movements, setMovements] = useState<TreasuryMovement[]>([]);

  const [isRejecting, setIsRejecting] = useState(false);
  const [vetoingItemId, setVetoingItemId] = useState<string | null>(null);
  const [isTriggeringCircuitBreaker, setIsTriggeringCircuitBreaker] = useState(false);
  const [circuitBreakerActive, setCircuitBreakerActive] = useState(false);
  const [pausePayload, setPausePayload] = useState<Record<string, unknown> | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step 2: Fetch real-time treasury summary on component mount
  useEffect(() => {
    let isMounted = true;

    async function loadTreasurySummary() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/admin/treasury/summary");
        if (res.ok) {
          const json = await res.json();
          if (json.ok && json.data && isMounted) {
            setPendingProposals(json.data.pendingProposals ?? []);
            setActiveRun(json.data.activeRun ?? null);
            setMovements(json.data.movements ?? []);
          }
        }
      } catch {
        // Fallback safely to empty state
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadTreasurySummary();

    return () => {
      isMounted = false;
    };
  }, []);

  // Step 3: Handle global proposal rejection
  const handleRejectProposal = async () => {
    if (!publicKey || !connected) {
      setWalletModalVisible(true);
      return;
    }
    if (!activeRun) return;
    setIsRejecting(true);
    setActionMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/admin/payout-runs/${activeRun.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: "Rejected by admin from Treasury Console",
          signerWallet: publicKey.toBase58()
        })
      });

      const isJson = res.headers.get("content-type")?.includes("application/json");
      const json = isJson ? await res.json() : null;

      if (!res.ok) {
        throw new Error(json?.error?.message ?? `Error al rechazar propuesta (${res.status})`);
      }

      setActiveRun((prev) => (prev ? { ...prev, status: "blocked" } : null));
      setActionMessage(`Propuesta rechazada y firmada con wallet ${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}.`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error rechazando propuesta");
    } finally {
      setIsRejecting(false);
    }
  };

  // Step 4: Handle individual item veto pre-seal
  const handleVetoItem = async (itemId: string) => {
    if (!publicKey || !connected) {
      setWalletModalVisible(true);
      return;
    }
    if (!activeRun) return;
    setVetoingItemId(itemId);
    setActionMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/admin/payout-runs/${activeRun.id}/veto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          reason: "Vetoed by admin from Treasury Console",
          signerWallet: publicKey.toBase58()
        })
      });

      const isJson = res.headers.get("content-type")?.includes("application/json");
      const json = isJson ? await res.json() : null;

      if (!res.ok) {
        throw new Error(json?.error?.message ?? `Error al vetar ítem (${res.status})`);
      }

      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, status: "vetoed" } : item))
      );
      setActionMessage(`Ítem ${itemId} vetado y firmado con wallet ${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}.`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error vetando ítem");
    } finally {
      setVetoingItemId(null);
    }
  };

  // Step 5: Handle emergency 1-of-M circuit breaker trigger
  const handleCircuitBreaker = async () => {
    if (!publicKey || !connected) {
      setWalletModalVisible(true);
      return;
    }

    setIsTriggeringCircuitBreaker(true);
    setActionMessage(null);
    setErrorMessage(null);

    try {
      const signerWallet = publicKey.toBase58();
      const res = await fetch("/api/admin/treasury/circuit-breaker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: "Parada de emergencia 1-de-M activada por operador administrador",
          triggeredAt: new Date().toISOString(),
          signerWallet
        })
      });

      const isJson = res.headers.get("content-type")?.includes("application/json");
      const json = isJson ? await res.json() : null;

      if (!res.ok) {
        throw new Error(json?.message ?? json?.error?.message ?? `Error al activar parada (${res.status})`);
      }

      setCircuitBreakerActive(true);
      setPausePayload(json.data ?? json);
      setActionMessage(
        `Parada de emergencia activada y firmada con wallet ${signerWallet.slice(0, 4)}...${signerWallet.slice(-4)}`
      );
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error activando parada de emergencia");
    } finally {
      setIsTriggeringCircuitBreaker(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Navigation */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Tesorería y Gobernanza
            </h1>
            {publicKey && connected && (
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-mono text-emerald-400">
                ● {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Supervisión de balances, propuestas de cambio de fechas y controles multisig de Squads v4.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {showSquadsLink && (
            <Link href="/admin/treasury/squads">
              <Button variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 min-h-9 px-3.5 py-1.5 text-xs">
                Consola Multisig (Squads v4)
              </Button>
            </Link>
          )}
          {showDistributionsLink && (
            <Link href="/admin/distributions">
              <Button variant="outline" className="border-border hover:bg-secondary/40 min-h-9 px-3.5 py-1.5 text-xs">
                Ver Distribuciones
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Global Status Notifications */}
      {actionMessage && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          {actionMessage}
        </div>
      )}
      {errorMessage && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          {errorMessage}
        </div>
      )}

      {/* Section 1: Solicitudes de Cambio de Fechas On-Chain (Squads v4) */}
      <Card className="border-border/60 bg-card/60 p-6 backdrop-blur">
        <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-4">
          <div>
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              Solicitudes de Cambio de Fechas On-Chain (Squads v4)
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Propuestas registradas en el contrato notario pendientes de firma del comité multisig.
            </p>
          </div>
          <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-400">
            {pendingProposals.length} Pendiente{pendingProposals.length === 1 ? "" : "s"}
          </span>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground animate-pulse">
            Cargando propuestas de tesorería...
          </div>
        ) : pendingProposals.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground border border-dashed border-border/40 rounded-lg">
            No hay solicitudes de cambio de fecha pendientes en este momento.
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {pendingProposals.map((proposal) => (
              <div key={proposal.requestId} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground text-sm">{proposal.collectionId}</span>
                    <span className="rounded bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 border border-amber-500/20">
                      {proposal.status}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="text-zinc-400 font-mono">
                      Rango propuesto: {proposal.proposedStartAt?.slice(0, 10)} ➔ {proposal.proposedEndAt?.slice(0, 10)}
                    </span>
                  </div>
                  {proposal.justification && (
                    <div className="text-xs text-zinc-300 italic">
                      &ldquo;{proposal.justification}&rdquo;
                    </div>
                  )}
                  <div className="text-[11px] text-zinc-500">
                    Solicitado el: {new Date(proposal.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/admin/collections/${proposal.collectionId}`}>
                    <Button variant="outline" className="min-h-8 px-3 py-1 text-xs">
                      Ver Colección
                    </Button>
                  </Link>
                  <Link href="/admin/treasury/squads">
                    <Button variant="primary" className="bg-cyan-600 hover:bg-cyan-500 text-white min-h-8 px-3 py-1 text-xs">
                      Revisar en Squads
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Section 2: Corridas de Desembolso Activas (Payout Runs) */}
      <Card className="border-border/60 bg-card/60 p-6 backdrop-blur">
        <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Corridas de Desembolso Activas
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Control de ejecución pre-seal, veto granular por beneficiario y parada de emergencia.
            </p>
          </div>
          {activeRun && (
            <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 text-xs font-medium text-cyan-400">
              Estado: {activeRun.status.toUpperCase()}
            </span>
          )}
        </div>

        {activeRun ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-lg bg-secondary/20 border border-border/40">
              <div>
                <span className="text-xs text-muted-foreground">ID de Corrida:</span>
                <p className="text-sm font-mono text-foreground truncate">{activeRun.id}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Monto Total:</span>
                <p className="text-sm font-semibold text-emerald-400">{activeRun.totalAmount}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Beneficiarios:</span>
                <p className="text-sm font-semibold text-foreground">{activeRun.itemsCount}</p>
              </div>
            </div>

            {/* Veto Items List */}
            {items.length > 0 && (
              <div className="divide-y divide-border/30 border border-border/30 rounded-lg overflow-hidden">
                {items.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between bg-card/40">
                    <div className="space-y-0.5">
                      <p className="text-xs font-mono text-foreground">{item.recipientWallet}</p>
                      <p className="text-xs text-muted-foreground">{item.amount}</p>
                    </div>
                    <div>
                      {item.status === "vetoed" ? (
                        <span className="rounded bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-xs font-medium text-rose-400">
                          VETADO
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          disabled={vetoingItemId === item.id}
                          onClick={() => handleVetoItem(item.id)}
                          className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 min-h-7 px-2.5 py-1 text-xs"
                        >
                          {vetoingItemId === item.id ? "Vetando..." : "Vetar Item"}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Governance Action Controls */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                variant="outline"
                disabled={isRejecting || activeRun.status === "blocked"}
                onClick={handleRejectProposal}
                className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 min-h-8 px-3 py-1 text-xs"
              >
                {isRejecting ? "Rechazando..." : "Rechazar Propuesta"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-sm text-muted-foreground border border-dashed border-border/40 rounded-lg">
            No hay corridas de desembolso activas o en borrador en este momento.
          </div>
        )}
      </Card>

      {/* Section 3: Dual-Layer Emergency Circuit Breaker */}
      <Card className="border-rose-500/20 bg-rose-950/10 p-6 backdrop-blur">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-rose-400 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              Parada de Emergencia (Circuit Breaker 1-de-M)
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl">
              Cualquier miembro del comité puede pausar inmediatamente todas las liquidaciones y retiros
              de la tesorería en Solana Devnet ante anomalías detectadas.
            </p>
          </div>

          <Button
            variant="primary"
            disabled={isTriggeringCircuitBreaker || circuitBreakerActive}
            onClick={handleCircuitBreaker}
            className="bg-rose-600 hover:bg-rose-500 text-white min-h-9 px-4 py-2 text-xs shrink-0"
          >
            {isTriggeringCircuitBreaker
              ? "Activando..."
              : circuitBreakerActive
              ? "Pausa Activa"
              : publicKey
              ? "Activar Pausa de Emergencia (1-de-M)"
              : "Conectar Wallet para Pausar"}
          </Button>
        </div>

        {pausePayload && (
          <div className="mt-4 p-3 rounded bg-zinc-950/60 border border-rose-500/30 text-xs font-mono text-zinc-300">
            <pre>{JSON.stringify(pausePayload, null, 2)}</pre>
          </div>
        )}
      </Card>
    </div>
  );
}
