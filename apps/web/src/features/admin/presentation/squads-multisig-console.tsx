"use client";

/**
 * =========================================================================================
 * Layer 1: Presentation Layer — Squads Multisig Console (Admin)
 * Component: SquadsMultisigConsole
 * Description: Minimalist multisig governance console for Squads v4 treasury payout proposals,
 *              date audit warning inspection, global expansion toggle, and quorum execution.
 * =========================================================================================
 */

import Link from "next/link";
import type { ReactElement } from "react";
import { useMemo, useState } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  evaluateDateAuditWarning,
  evaluateQuorumStatus,
  type SquadsProposalDTO
} from "@/tests/components/squads-multisig-console.test";

type SquadsMultisigConsoleProps = {
  initialDto?: SquadsProposalDTO;
  runId?: string;
};

const DEFAULT_MOCK_PROPOSAL: SquadsProposalDTO = {
  runId: "RUN-2026-08",
  treasuryPolicyPda: "Bay3rtZ9nhDR6CgpiHKnSdCiksuFUHz7ttuzQpF1D71K",
  multisigPda: "rVKwqnxyq2RuU4sTBdXhifrZB9oY9mGoqw5oA6EHKaD",
  vaultPda: "D9i1XNftRpB68WTYrpCau5fEYYS2eiJa8Q738N5idSXB",
  threshold: 2,
  membersCount: 4,
  approvedMembers: ["3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd"],
  executed: false,
  onChainDates: {
    projectStartAt: "2026-03-15T00:00:00Z",
    projectEndAt: "2028-12-31T23:59:59Z"
  },
  dbDates: {
    projectStartAt: "2026-03-15T00:00:00Z",
    projectEndAt: "2028-12-31T23:59:59Z"
  },
  beneficiaries: [
    {
      claimId: "CLAIM-001",
      holderName: "Carlos Mendoza",
      originWallet: "3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd",
      payoutWallet: "7mQ1...p4N9",
      assetMint: "9xP2...v4M1",
      mintDate: "2026-01-15",
      daysSinceMint: 40,
      stakingDays: 15,
      stakingPeriod: "01/08/2026 al 15/08/2026",
      grossAmountMinor: "1200000000",
      feeAmountMinor: "24000000",
      netAmountMinor: "1176000000",
      overrideCaseNumber: "CASE-2026-0891"
    },
    {
      claimId: "CLAIM-002",
      holderName: "Maria Rodriguez",
      originWallet: "AdNNTBSMy4yndiSNVmgEBTkJJuXLBrb7PKFWCdEf8Kxi",
      payoutWallet: "AdNNTBSMy4yndiSNVmgEBTkJJuXLBrb7PKFWCdEf8Kxi",
      assetMint: "4kL1...w8Q2",
      mintDate: "2026-02-01",
      daysSinceMint: 25,
      stakingDays: 30,
      stakingPeriod: "01/08/2026 al 30/08/2026",
      grossAmountMinor: "2400000000",
      feeAmountMinor: "48000000",
      netAmountMinor: "2352000000"
    }
  ]
};

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

export function SquadsMultisigConsole({ initialDto, runId: _runId }: SquadsMultisigConsoleProps): ReactElement {
  const { t } = useI18n();
  const dto = initialDto ?? DEFAULT_MOCK_PROPOSAL;

  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [allExpanded, setAllExpanded] = useState(false);

  // Evaluate date audit status vs on-chain Notario PDA
  const dateAudit = useMemo(() => evaluateDateAuditWarning(dto), [dto]);

  // Evaluate quorum status (2-of-4)
  const quorum = useMemo(() => evaluateQuorumStatus(dto), [dto]);

  // Toggle single row expansion
  const toggleRow = (claimId: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [claimId]: !prev[claimId]
    }));
  };

  // Toggle all rows expansion
  const toggleAll = () => {
    const nextState = !allExpanded;
    setAllExpanded(nextState);
    const newExpanded: Record<string, boolean> = {};
    dto.beneficiaries.forEach((b) => {
      newExpanded[b.claimId] = nextState;
    });
    setExpandedRows(newExpanded);
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Date Inspection & Audit Warning Banner */}
      {dateAudit.isWarning ? (
        <article className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-200 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300">
              {t({
                en: "Project Dates Audit Warning",
                es: "Alerta de Auditoría de Fechas del Proyecto",
                pt: "Alerta de Auditoria de Datas do Projeto"
              })}
            </h3>
          </div>
          <p className="text-xs text-amber-100/90 leading-relaxed">
            {t({
              en: "The operating project dates in database differ from the on-chain Notary PDA truth or RPC is unavailable.",
              es: "Las fechas operativas del proyecto en base de datos difieren de la verdad on-chain de la PDA Notario o RPC no responde.",
              pt: "As datas operacionais do projeto diferem da verdade on-chain da PDA Notario ou RPC indisponivel."
            })}
          </p>
          <div className="rounded-lg bg-amber-950/40 border border-amber-500/20 p-3 text-xs font-mono">
            <span className="text-amber-400 font-sans font-semibold">{t({ en: "Recorded Reason", es: "Motivo Registrado", pt: "Motivo Registrado" })}:</span> {dateAudit.reason}
          </div>
        </article>
      ) : null}

      {/* 2. Top Summary KPI Cards (matching /profile marketplace-depth-card) */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="marketplace-depth-card space-y-1 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-white/60">
            {t({ en: "Multisig Quorum", es: "Quórum Multisig", pt: "Quorum Multisig" })}
          </p>
          <p className="text-2xl font-semibold text-white">
            {quorum.approvalsCount} / {dto.threshold} {t({ en: "Signed", es: "Firmas", pt: "Assinaturas" })}
          </p>
          <p className="text-xs text-white/55">
            {quorum.quorumReached
              ? t({ en: "✓ Quorum reached (ready)", es: "✓ Quórum alcanzado (listo)", pt: "✓ Quorum alcancado" })
              : t({ en: "Pending approvals", es: "Aprobaciones pendientes", pt: "Aprovacoes pendentes" })}
          </p>
        </article>

        <article className="marketplace-depth-card space-y-1 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-white/60">
            {t({ en: "Total Settlement", es: "Total Liquidación", pt: "Total Liquidacao" })}
          </p>
          <p className="text-2xl font-semibold text-white">
            {formatUsdcAmount(dto.beneficiaries.reduce((acc, b) => acc + Number(b.netAmountMinor), 0).toString())}
          </p>
          <p className="text-xs text-white/55">USDC · Devnet Escrow</p>
        </article>

        <article className="marketplace-depth-card space-y-1 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-white/60">
            {t({ en: "Beneficiaries", es: "Beneficiarios", pt: "Beneficiarios" })}
          </p>
          <p className="text-2xl font-semibold text-white">{dto.beneficiaries.length}</p>
          <p className="text-xs text-white/55">{t({ en: "Verified Stakers", es: "Stakers Verificados", pt: "Stakers Verificados" })}</p>
        </article>

        <article className="marketplace-depth-card space-y-1 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-white/60">
            {t({ en: "Vault Account", es: "Cuenta Vault", pt: "Conta Vault" })}
          </p>
          <p className="text-2xl font-semibold text-white font-mono truncate">{dto.vaultPda}</p>
          <p className="text-xs text-white/55">Squads v4 Program</p>
        </article>
      </div>

      {/* 3. Action Bar with Voting / Execution Controls */}
      <Card className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {t({ en: "Squads v4 Proposal Authorization", es: "Autorización de Propuesta Squads v4", pt: "Autorizacao de Proposta Squads v4" })}
            </h2>
            <p className="text-sm text-white/75">
              {t({
                en: "Execute on-chain initialize_policy and seal Merkle root with multi-signature authority.",
                es: "Ejecuta initialize_policy on-chain y sella la raíz Merkle con autoridad multifirma.",
                pt: "Execute initialize_policy on-chain e sele a raiz Merkle com autoridade multifirma."
              })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/admin/distributions">
              <Button className="min-h-11" variant="outline">
                {t({ en: "Back to runs", es: "Volver a corridas", pt: "Voltar para lotes" })}
              </Button>
            </Link>
            <Button
              className="min-h-11"
              variant="outline"
              onClick={() => alert("Voto de aprobación emitido en Devnet")}
            >
              ✍️ {t({ en: "Vote / Approve", es: "Votar / Aprobar", pt: "Votar / Aprovar" })}
            </Button>
            <Button
              className="min-h-11"
              variant="primary"
              disabled={!quorum.canExecute}
              onClick={() => alert("Ejecutando propuesta y sellando run en Devnet")}
            >
              🚀 {t({ en: "Execute & Seal Run", es: "Ejecutar y Sellar Run", pt: "Executar e Selar Lote" })}
            </Button>
          </div>
        </div>
      </Card>

      {/* 4. Minimalist Beneficiaries Table with Global Expansion Toggle */}
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-base font-semibold text-white">
              {t({ en: "Eligible Claims Breakdown", es: "Desglose de Claims Elegibles", pt: "Detalhamento de Claims Elegiveis" })}
            </h3>
            <p className="text-xs text-white/60">
              {t({
                en: "Inspect individual staking periods, origin and payout wallets.",
                es: "Inspecciona períodos de staking individuales, wallets de origen y pago.",
                pt: "Inspecione periodos de staking, carteiras de origem e pagamento."
              })}
            </p>
          </div>

          <Button
            className="min-h-9 px-3 text-xs"
            variant="ghost"
            onClick={toggleAll}
          >
            {allExpanded
              ? t({ en: "▲ Collapse All", es: "▲ Ocultar Todos", pt: "▲ Ocultar Todos" })
              : t({ en: "▼ Expand All", es: "▼ Expandir Todos", pt: "▼ Expandir Todos" })}
          </Button>
        </div>

        <div className="space-y-2">
          {dto.beneficiaries.map((beneficiary) => {
            const isExpanded = Boolean(expandedRows[beneficiary.claimId]);

            return (
              <div
                key={beneficiary.claimId}
                className="rounded-xl border border-white/10 bg-white/5 transition-colors overflow-hidden"
              >
                {/* Minimalist Summary Row */}
                <div
                  className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-white/[0.04] transition-colors"
                  onClick={() => toggleRow(beneficiary.claimId)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-white/60 font-mono">
                      {isExpanded ? "▲" : "▼"}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{beneficiary.holderName}</p>
                      <p className="text-xs text-white/55 font-mono truncate">
                        {beneficiary.payoutWallet}
                        {beneficiary.overrideCaseNumber ? (
                          <span className="ml-2 rounded-full bg-amber-500/20 text-amber-300 px-2 py-0.5 text-[10px] font-sans font-semibold">
                            {beneficiary.overrideCaseNumber}
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 text-right">
                    <div>
                      <p className="font-bold text-white text-sm">{formatUsdcAmount(beneficiary.netAmountMinor)}</p>
                      <p className="text-xs text-white/55">{beneficiary.stakingDays} {t({ en: "days staked", es: "días en stake", pt: "dias em stake" })}</p>
                    </div>
                  </div>
                </div>

                {/* Expanded Detailed Audit Panel */}
                {isExpanded ? (
                  <div className="border-t border-white/10 bg-black/30 p-4 space-y-3 text-xs font-mono">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-white/50 text-[11px] font-sans">1. Dirección de Origen (Titular):</span>
                        <p className="text-white break-all">{beneficiary.originWallet}</p>
                      </div>
                      <div>
                        <span className="text-white/50 text-[11px] font-sans">2. Dirección a Pagar (Destino):</span>
                        <p className="text-cyan-300 break-all">{beneficiary.payoutWallet}</p>
                      </div>
                      <div>
                        <span className="text-white/50 text-[11px] font-sans">3. Dirección del NFT (Asset Mint):</span>
                        <p className="text-white break-all">{beneficiary.assetMint}</p>
                      </div>
                      <div>
                        <span className="text-white/50 text-[11px] font-sans">4. Fecha y Días desde Mint:</span>
                        <p className="text-white">{beneficiary.mintDate} ({beneficiary.daysSinceMint} días)</p>
                      </div>
                      <div>
                        <span className="text-white/50 text-[11px] font-sans">5. Intervalo de Staking:</span>
                        <p className="text-white">{beneficiary.stakingPeriod} ({beneficiary.stakingDays} días)</p>
                      </div>
                      <div>
                        <span className="text-white/50 text-[11px] font-sans">6. Desglose Financiero:</span>
                        <p className="text-white">
                          Bruto: {formatUsdcAmount(beneficiary.grossAmountMinor)} · Fee: {formatUsdcAmount(beneficiary.feeAmountMinor)} · <span className="text-emerald-400 font-bold">Neto: {formatUsdcAmount(beneficiary.netAmountMinor)}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
