"use client";

/**
 * =========================================================================================
 * Layer 1: Presentation Layer — Squads Multisig Console (Admin)
 * Component: SquadsMultisigConsole
 *
 * Description:
 * Minimalist multisig governance console for Squads v4 treasury payout proposals,
 * date audit warning inspection, global expansion toggle, and single-button unified execution.
 * Evaluates quorum progress and performs automated 1-signature or 2-signature execution flow.
 * =========================================================================================
 */

import Link from "next/link";
import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { dispatchOpenWalletModal } from "@/lib/auth-ui-events";
import {
  deserializeLegacyVersionedTransaction,
  serializeLegacyVersionedTransaction
} from "@/lib/solana-kit/compat/web3-transactions";
import { getSolscanTransactionUrl } from "@/lib/infrastructure/solana";
import {
  evaluateDateAuditWarning,
  evaluateQuorumStatus,
  evaluateUnifiedMultisigAction,
  type SquadsProposalDTO
} from "@/features/admin/domain/squads-multisig-types";

/**
 * Props for the SquadsMultisigConsole component.
 */
export type SquadsMultisigConsoleProps = {
  initialDto?: SquadsProposalDTO | null;
  runId?: string;
};

/**
 * Formats minor USDC token units to a localized currency string.
 *
 * @param amountMinorStr - The numeric string representing micro-USDC (6 decimals)
 * @returns Formatted currency string
 */
function formatUsdcAmount(amountMinorStr: string): string {
  try {
    const numeric = Number(amountMinorStr) / 1_000_000;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2
    }).format(numeric);
  } catch {
    return "$0.00";
  }
}

/**
 * Main Presentation Component: SquadsMultisigConsole
 */
export function SquadsMultisigConsole({ initialDto = null, runId }: SquadsMultisigConsoleProps): ReactElement {
  const { t } = useI18n();
  const { publicKey, connected, signTransaction } = useWallet();

  // Step 1: Initialize component state with dynamic props or null
  const [dto, setDto] = useState<SquadsProposalDTO | null>(initialDto);
  const [isLoading, setIsLoading] = useState<boolean>(!initialDto);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [allExpanded, setAllExpanded] = useState<boolean>(false);
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step 2: Sync initialDto if provided
  useEffect(() => {
    if (initialDto) {
      setDto(initialDto);
      setIsLoading(false);
    }
  }, [initialDto]);

  // Step 3: Fetch active proposal data from API if not provided in initialDto
  useEffect(() => {
    let active = true;

    async function loadProposalData() {
      if (initialDto) return;

      setIsLoading(true);
      setErrorMessage(null);
      try {
        const targetUrl = runId
          ? `/api/admin/distributions/runs/${encodeURIComponent(runId)}`
          : "/api/admin/treasury/squads/proposals";

        const response = await fetch(targetUrl);
        const json = await response.json();

        if (!active) return;

        if (response.ok && json.data) {
          const raw = json.data;
          const parsedDto: SquadsProposalDTO = Array.isArray(raw) ? raw[0] : raw;
          setDto(parsedDto ?? null);
        } else {
          setDto(null);
        }
      } catch (err) {
        if (active) {
          setErrorMessage(err instanceof Error ? err.message : "Error al cargar la propuesta multisig.");
          setDto(null);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadProposalData();

    return () => {
      active = false;
    };
  }, [runId, initialDto]);

  // Step 4: Evaluate date audit status and quorum
  const dateAudit = useMemo(() => (dto ? evaluateDateAuditWarning(dto) : null), [dto]);
  const quorum = useMemo(() => (dto ? evaluateQuorumStatus(dto) : null), [dto]);

  // Step 5: Check current connected user wallet
  const userPubkey = publicKey ? publicKey.toBase58() : null;
  const unifiedAction = useMemo(() => (dto ? evaluateUnifiedMultisigAction(dto, userPubkey) : null), [dto, userPubkey]);

  // Step 6: Toggle single row expansion
  const toggleRow = (claimId: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [claimId]: !prev[claimId]
    }));
  };

  // Step 7: Toggle all rows expansion
  const toggleAll = () => {
    if (!dto) return;
    const nextState = !allExpanded;
    setAllExpanded(nextState);
    const newExpanded: Record<string, boolean> = {};
    dto.beneficiaries.forEach((b) => {
      newExpanded[b.claimId] = nextState;
    });
    setExpandedRows(newExpanded);
  };

  // Step 8: Handle single unified action (Real Solana Devnet On-Chain Transaction)
  const handleUnifiedAction = async () => {
    // Step 8a: If wallet is not connected, open BRIDS native wallet modal for reconnection
    if (!publicKey || !connected) {
      dispatchOpenWalletModal({ loginMethod: "wallet" });
      return;
    }

    if (!dto || unifiedAction?.disabled) return;

    setIsProcessingAction(true);
    setActionSuccessMessage(null);
    setErrorMessage(null);

    try {
      const signerWallet = publicKey.toBase58();
      const isExecuteAction = unifiedAction?.type === "READY_TO_EXECUTE";

      // Step 8b: Prepare unsigned VersionedTransaction from Devnet RPC for Squads v4
      const prepareRes = await fetch("/api/admin/treasury/squads/prepare-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId: dto.runId,
          transactionIndex: dto.transactionIndex,
          signerWallet,
          collectionAddress: dto.treasuryPolicyPda || dto.vaultPda,
          newStartAt: dto.dbDates.projectStartAt,
          newEndAt: dto.dbDates.projectEndAt,
          action: isExecuteAction ? "EXECUTE" : "VOTE"
        })
      });

      const prepareJson = await prepareRes.json();
      if (!prepareRes.ok || !prepareJson.data?.transactionBase64) {
        throw new Error(prepareJson.message ?? "Error al preparar la transacción en Solana Devnet.");
      }

      // Step 8c: Request wallet cryptographic signature (Phantom / Solflare popup)
      let signedTransactionBase64: string | undefined;
      if (signTransaction) {
        const rawBytes = Buffer.from(prepareJson.data.transactionBase64, "base64");
        const unsignedTx = deserializeLegacyVersionedTransaction(new Uint8Array(rawBytes));
        const signedTx = await signTransaction(unsignedTx);
        const signedBytes = serializeLegacyVersionedTransaction(signedTx);
        signedTransactionBase64 = Buffer.from(signedBytes).toString("base64");
      }

      // Step 8d: Broadcast signed transaction to Solana Devnet RPC
      const res = await fetch("/api/admin/treasury/squads/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId: dto.runId,
          signerWallet,
          signedTransactionBase64
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message ?? "Error al procesar la acción multisig en Solana Devnet.");
      }

      // Step 8e: Update local DTO state with on-chain execution proof and Solscan link
      const isExecuted = isExecuteAction || json.data?.executed === true;
      const txSignature = json.data?.txSignature;
      const solscanUrl = json.data?.solscanUrl ?? (txSignature ? getSolscanTransactionUrl(txSignature) : undefined);
      const confirmedSlot = json.data?.slot;

      setDto((prev) =>
        prev
          ? {
              ...prev,
              approvedMembers: isExecuteAction ? prev.approvedMembers : Array.from(new Set([...prev.approvedMembers, signerWallet])),
              executed: isExecuted,
              status: isExecuted ? "Executed" : (prev.approvedMembers.length + 1 >= prev.threshold ? "Approved" : "Active"),
              txSignature,
              solscanUrl,
              confirmedSlot
            }
          : null
      );

      setActionSuccessMessage(
        json.data?.message ??
          (isExecuted
            ? `Ejecución completada exitosamente en Solana Devnet. Fechas del PDA Notario actualizadas. Transacción: ${txSignature}`
            : `Voto registrado exitosamente en Solana Devnet con wallet ${signerWallet.slice(0, 4)}...${signerWallet.slice(-4)}.`)
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al procesar la acción multisig.";
      if (
        msg.toLowerCase().includes("user rejected") ||
        msg.toLowerCase().includes("rejected the request") ||
        msg.toLowerCase().includes("user cancel")
      ) {
        setErrorMessage("Cancelaste la solicitud de firma en la wallet.");
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Step 9: Render loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="marketplace-depth-card p-6 rounded-2xl animate-pulse">
          <div className="h-4 w-40 bg-white/10 rounded mb-3" />
          <div className="h-6 w-64 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  // Step 9: Render clean empty state when no active proposal exists
  if (!dto) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/40 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Consola Multisig (Squads v4)
              </h1>
              {publicKey && connected && (
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-mono text-emerald-400">
                  ● {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Gobernanza multisig y autorización de dispersiones de tesorería en Solana Devnet.
            </p>
          </div>

          <div className="flex gap-2">
            <Link href="/admin/treasury">
              <Button variant="outline" className="border-border hover:bg-secondary/40 min-h-9 px-3.5 py-1.5 text-xs">
                Volver a Tesorería
              </Button>
            </Link>
          </div>
        </div>

        <Card className="p-12 text-center border-dashed border-border/40">
          <p className="text-sm text-muted-foreground">
            No hay propuestas de dispersión de Squads activas en este momento.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link href="/admin/distributions">
              <Button variant="primary" className="min-h-9 px-4 py-2 text-xs">
                Crear Nueva Distribución
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="squads-multisig-console">
      {/* Header & Status */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Consola Multisig (Squads v4)
            </h1>
            {publicKey && connected && (
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-mono text-emerald-400">
                ● {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Propuesta de dispersión para la corrida <span className="font-mono text-foreground font-semibold">{dto.runId}</span> (Tx Index #{dto.transactionIndex ?? "1"})
          </p>

          {/* On-Chain Proposals Switcher */}
          {dto.nativeProposals && dto.nativeProposals.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-border/20">
              <span className="text-xs font-medium text-muted-foreground">Propuestas Squads v4:</span>
              <div className="flex flex-wrap gap-1.5">
                {dto.nativeProposals.map((np) => {
                  const isSelected = np.transactionIndex === dto.transactionIndex;
                  const badgeColor =
                    np.status === "Executed"
                      ? "bg-neutral-800/80 text-neutral-400 border-neutral-700"
                      : np.status === "Approved"
                      ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                      : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
                  return (
                    <button
                      key={np.transactionIndex}
                      type="button"
                      onClick={() => {
                        setIsLoading(true);
                        fetch(`/api/admin/treasury/squads/proposals?index=${np.transactionIndex}`)
                          .then((res) => res.json())
                          .then((json) => {
                            if (json.data) setDto(json.data);
                          })
                          .finally(() => setIsLoading(false));
                      }}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-mono transition-all ${
                        isSelected
                          ? "border-primary bg-primary/20 text-white font-bold ring-1 ring-primary"
                          : `${badgeColor} hover:opacity-80`
                      }`}
                    >
                      Tx #{np.transactionIndex} ({np.status})
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/admin/treasury">
            <Button variant="outline" className="border-border hover:bg-secondary/40 min-h-9 px-3.5 py-1.5 text-xs">
              Volver a Tesorería
            </Button>
          </Link>
        </div>
      </div>

      {/* Date Audit Alert Banner */}
      {dateAudit?.isWarning && (
        <div
          data-testid="date-audit-warning-banner"
          className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-200 text-sm space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-semibold text-amber-400">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Solicitud de Cambio de Fechas On-Chain Pendiente de Aprobación Multisig
            </div>
            <Link href={`/admin/collections/${dto.runId}`}>
              <Button variant="outline" className="border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs px-3 py-1 min-h-7">
                Ver Colección
              </Button>
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 text-xs bg-black/20 p-3 rounded-lg border border-amber-500/20">
            <div>
              <span className="text-muted-foreground block text-[11px]">Fechas On-Chain Actuales:</span>
              <span className="font-mono text-foreground font-medium">
                {dto.onChainDates?.projectStartAt ? dto.onChainDates.projectStartAt.slice(0, 10) : "N/A"} →{" "}
                {dto.onChainDates?.projectEndAt ? dto.onChainDates.projectEndAt.slice(0, 10) : "N/A"}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px]">Fechas Nuevas Propuestas:</span>
              <span className="font-mono text-amber-300 font-medium">
                {dto.dbDates.projectStartAt ? dto.dbDates.projectStartAt.slice(0, 10) : "N/A"} →{" "}
                {dto.dbDates.projectEndAt ? dto.dbDates.projectEndAt.slice(0, 10) : "N/A"}
              </span>
            </div>

            {dto.dbDates.modificationReason && (
              <div className="sm:col-span-2 border-t border-amber-500/10 pt-2 mt-1">
                <span className="text-muted-foreground text-[11px] block">Motivo / Justificación:</span>
                <span className="text-foreground italic">{dto.dbDates.modificationReason}</span>
              </div>
            )}

            {/* Requester & Fee Details */}
            <div
              data-testid="proposal-squads-governance-badge"
              className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-t border-amber-500/10 pt-2 mt-1 text-[11px]"
            >
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Solicitado por:</span>
                <span className="font-mono text-foreground">
                  {dto.requesterWallet ? `${dto.requesterWallet.slice(0, 4)}...${dto.requesterWallet.slice(-4)}` : "Comité"}
                </span>
              </div>
              <span className="font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                Fee: 0.10 USDC (On-Chain)
              </span>
            </div>
          </div>

          {/* Direct Single Unified Governance Control */}
          <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-amber-500/20">
            <Button
              variant="primary"
              disabled={isProcessingAction || unifiedAction?.disabled}
              onClick={handleUnifiedAction}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2 min-h-8"
            >
              {isProcessingAction ? "Procesando Firma..." : unifiedAction?.label ?? "Aprobar Propuesta"}
            </Button>
          </div>
        </div>
      )}

      {/* Action Notification with Solscan On-Chain Proof */}
      {actionSuccessMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-400 text-sm space-y-2">
          <div>{actionSuccessMessage}</div>
          {dto.solscanUrl && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-500/20 text-xs">
              <span className="text-emerald-300/80">Verificación On-Chain:</span>
              <a
                href={dto.solscanUrl}
                target="_blank"
                rel="noreferrer"
                className="underline font-mono text-emerald-300 hover:text-emerald-100 transition-colors"
              >
                Ver Transacción en Solscan Devnet ↗
              </a>
              {dto.confirmedSlot ? (
                <span className="text-[11px] font-mono text-emerald-400/70">
                  (Slot: {dto.confirmedSlot})
                </span>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-400 text-sm">
          {errorMessage}
        </div>
      )}

      {/* Quorum & Governance KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 space-y-1">
          <div className="text-xs text-muted-foreground">Umbral Requerido</div>
          <div className="text-xl font-bold font-mono">
            Quórum {dto.threshold} de {dto.membersCount}
          </div>
          <div className="text-[11px] text-muted-foreground">Firmas requeridas en Devnet</div>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="text-xs text-muted-foreground">Aprobaciones Registradas</div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {dto.approvedMembers.length} / {dto.threshold}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {quorum?.quorumReached ? "Quórum alcanzado" : `Faltan ${Math.max(0, dto.threshold - dto.approvedMembers.length)} firma(s)`}
          </div>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="text-xs text-muted-foreground">Tu Estado de Firma</div>
          <div className="text-xl font-bold font-mono">
            {userPubkey && dto.approvedMembers.includes(userPubkey) ? (
              <span className="text-emerald-400">Firmado</span>
            ) : (
              <span className="text-amber-400">Sin Firmar</span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {publicKey ? "Wallet activa" : "Conexión requerida"}
          </div>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="text-xs text-muted-foreground">Estado de Ejecución</div>
          <div className="text-xl font-bold font-mono">
            {dto.executed ? (
              <span className="text-emerald-400">Ejecutado</span>
            ) : (
              <span className="text-cyan-400">Pendiente</span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground">Squads Vault PDA</div>
        </Card>
      </div>

      {/* Beneficiaries Table */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Beneficiarios de la Dispersión ({dto.beneficiaries.length})
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Desglose verificado por tiempo de stake y cálculo pro-rata.
            </p>
          </div>

          {dto.beneficiaries.length > 0 && (
            <Button
              variant="outline"
              onClick={toggleAll}
              className="text-xs px-3 py-1.5 min-h-8 border-border hover:bg-secondary/40"
            >
              {allExpanded ? "Ocultar Todos" : "Expandir Todos"}
            </Button>
          )}
        </div>

        {dto.beneficiaries.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground border border-dashed border-border/40 rounded-lg">
            Esta propuesta no contiene beneficiarios asociados en este momento.
          </div>
        ) : (
          <div className="divide-y divide-border/30 border border-border/40 rounded-lg overflow-hidden">
            {dto.beneficiaries.map((b) => {
              const isExpanded = expandedRows[b.claimId] ?? false;

              return (
                <div key={b.claimId} className="bg-card/40 hover:bg-card/80 transition-colors">
                  <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => toggleRow(b.claimId)}>
                    <div className="flex items-center gap-3">
                      <button type="button" className="text-muted-foreground hover:text-foreground text-xs p-1">
                        {isExpanded ? "▼" : "▶"}
                      </button>
                      <div>
                        <div className="text-sm font-medium text-foreground">{b.holderName}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {b.stakingDays} días en stake ({b.stakingPeriod})
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold font-mono text-emerald-400">
                        {formatUsdcAmount(b.netAmountMinor)}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {b.payoutWallet.slice(0, 4)}...{b.payoutWallet.slice(-4)}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-6 pb-4 pt-1 bg-secondary/10 border-t border-border/20 grid gap-3 sm:grid-cols-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Wallet Origen:</span>{" "}
                        <span className="font-mono text-foreground">{b.originWallet}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Wallet Pago:</span>{" "}
                        <span className="font-mono text-foreground">{b.payoutWallet}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">NFT Mint:</span>{" "}
                        <span className="font-mono text-foreground">{b.assetMint}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fecha Mint:</span>{" "}
                        <span className="text-foreground">{b.mintDate} ({b.daysSinceMint} días)</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Bruto:</span>{" "}
                        <span className="font-mono text-foreground">{formatUsdcAmount(b.grossAmountMinor)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Comisión Retenida:</span>{" "}
                        <span className="font-mono text-rose-400">{formatUsdcAmount(b.feeAmountMinor)}</span>
                      </div>
                      {b.overrideCaseNumber && (
                        <div className="sm:col-span-2">
                          <span className="text-muted-foreground">Ticket Compliance:</span>{" "}
                          <span className="font-mono text-cyan-400">{b.overrideCaseNumber}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Single Unified Action Control */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-border/30">
          <Button
            variant="primary"
            disabled={isProcessingAction || unifiedAction?.disabled}
            onClick={handleUnifiedAction}
            className="bg-emerald-600 hover:bg-emerald-500 text-white min-h-9 px-5 py-2 text-xs"
          >
            {isProcessingAction ? "Procesando Firma..." : unifiedAction?.label ?? "Aprobar Propuesta"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
