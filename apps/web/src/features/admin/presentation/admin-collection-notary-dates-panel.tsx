"use client";

/**
 * =========================================================================================
 * Layer 1: Presentation Layer — On-Chain Project Dates Notary Panel & Request Modal
 * Component: AdminCollectionNotaryDatesPanel
 *
 * Description:
 * Renders the on-chain notarized operating dates (start_at, end_at) from Solana RPC,
 * along with the Squads Vault authority governance label and an interactive modal to
 * propose date changes (dispatching PENDING_MULTISIG proposals).
 *
 * Scenarios Handled:
 * 1. Pending Approval Banner: Displays an informative banner when a date change request is in review.
 * 2. Date Comparison: Displays both the current on-chain dates and the proposed new dates with requested timestamp.
 * 3. Uninitialized Baseline: When on-chain start_at is unconfigured, displays 'No configurado' and shows pending requested dates.
 *
 * Invariants:
 * - Sober, emoji-free aesthetic matching /profile and admin panels.
 * - Read-only on-chain state visualization with explicit version indicator.
 * - Auto-close timer with cleanup on submit success.
 * =========================================================================================
 */

import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { localize, type AppLocale } from "@/lib/i18n";
import type { ProjectConfigPdaState } from "@/lib/solana-kit/pda/project-config-reader";

export type PendingDateProposal = {
  requestId: string;
  collectionId: string;
  status: "PENDING_MULTISIG" | "APPROVED" | "REJECTED";
  proposedStartAt: string;
  proposedEndAt: string;
  justification: string;
  createdAt: string;
};

type AdminCollectionNotaryDatesPanelProps = {
  collectionId: string;
  collectionAddress: string | null;
  locale: AppLocale;
  initialPendingProposal?: PendingDateProposal | null;
};

function formatIsoDate(unixSeconds: bigint | number | null | undefined): string {
  if (unixSeconds === null || unixSeconds === undefined) return "No configurado";
  const ms = Number(unixSeconds) * 1000;
  return new Date(ms).toISOString().slice(0, 10);
}

function formatRawIsoString(isoString: string | null | undefined): string {
  if (!isoString) return "No configurado";
  return isoString.slice(0, 10);
}

function truncateAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export function AdminCollectionNotaryDatesPanel({
  collectionId,
  collectionAddress,
  locale,
  initialPendingProposal = null
}: AdminCollectionNotaryDatesPanelProps): ReactElement {
  const [onChainState, setOnChainState] = useState<ProjectConfigPdaState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Proposal form state (YYYY-MM-DD for date picker)
  const [proposedStartDate, setProposedStartDate] = useState<string>("2026-08-01");
  const [proposedEndDate, setProposedEndDate] = useState<string>("2026-08-31");
  const [justification, setJustification] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [proposalSuccessMessage, setProposalSuccessMessage] = useState<string | null>(null);
  const [proposalErrorMessage, setProposalErrorMessage] = useState<string | null>(null);

  // Active Pending Proposal State (Case 1, 2, 3)
  const [pendingProposal, setPendingProposal] = useState<PendingDateProposal | null>(initialPendingProposal);

  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function closeModal() {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
    setIsModalOpen(false);
  }

  // Cleanup auto-close timer on unmount
  useEffect(() => {
    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, []);

  // Step 1: Fetch on-chain Notary PDA state and pending proposals on mount
  useEffect(() => {
    let isMounted = true;

    async function loadNotaryState() {
      if (!collectionAddress && !collectionId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const target = collectionId || collectionAddress;
        const res = await fetch(`/api/admin/collections/${target}/date-change-request`);
        if (res.ok) {
          const data = await res.json();
          if (data.ok && isMounted) {
            if (data.onChainState) {
              setOnChainState(data.onChainState);
              if (data.onChainState.startAtUnixSeconds) {
                setProposedStartDate(new Date(Number(data.onChainState.startAtUnixSeconds) * 1000).toISOString().slice(0, 10));
              }
              if (data.onChainState.endAtUnixSeconds) {
                setProposedEndDate(new Date(Number(data.onChainState.endAtUnixSeconds) * 1000).toISOString().slice(0, 10));
              }
            }
            if (data.data && data.data.status === "PENDING_MULTISIG") {
              setPendingProposal(data.data);
            }
          }
        }
      } catch {
        // Fallback safely on error
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadNotaryState();

    return () => {
      isMounted = false;
    };
  }, [collectionAddress, collectionId]);

  // Step 2: Handle Proposal Submission
  async function handleProposalSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProposalErrorMessage(null);
    setProposalSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const proposedStartAt = new Date(`${proposedStartDate}T00:00:00.000Z`).toISOString();
      const proposedEndAt = new Date(`${proposedEndDate}T23:59:59.000Z`).toISOString();

      const target = collectionId || collectionAddress;
      const res = await fetch(`/api/admin/collections/${target}/date-change-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposedStartAt,
          proposedEndAt,
          justification
        })
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Error al enviar la solicitud de cambio de fecha.");
      }

      const proposalData = data.data as PendingDateProposal;
      setPendingProposal(proposalData);

      const successMsg = localize(locale, {
        en: `Solicitud registrada con éxito. Estado: ${proposalData?.status || "PENDING_MULTISIG"}. El comité de Squads revisará la propuesta.`,
        es: `Solicitud registrada con éxito. Estado: ${proposalData?.status || "PENDING_MULTISIG"}. El comité de Squads revisará la propuesta.`,
        pt: `Solicitação registrada com sucesso. Status: ${proposalData?.status || "PENDING_MULTISIG"}. O comitê da Squads revisará a proposta.`
      });

      setProposalSuccessMessage(successMsg);

      // Auto-close modal after 10 seconds
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
      autoCloseTimerRef.current = setTimeout(() => {
        setIsModalOpen(false);
      }, 10000);
    } catch (err) {
      setProposalErrorMessage(err instanceof Error ? err.message : "Error inesperado al enviar propuesta.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const hasOnChainConfig = Boolean(onChainState && onChainState.startAtUnixSeconds);
  const isPendingApproval = pendingProposal?.status === "PENDING_MULTISIG";

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] via-white/[0.03] to-transparent p-5 space-y-4">
      {/* Caso 1: Pending Approval Banner */}
      {isPendingApproval ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="inline-flex items-center rounded-full border border-amber-400/40 bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-300">
              {localize(locale, {
                en: "Pending Multisig Approval (Squads v4)",
                es: "Pendiente de Aprobación Multisig (Squads v4)",
                pt: "Pendente de Aprovação Multisig (Squads v4)"
              })}
            </span>
            <span className="font-mono text-xs text-amber-200/80">
              {localize(locale, { en: "Requested on", es: "Solicitado el", pt: "Solicitado em" })}:{" "}
              {pendingProposal?.createdAt ? new Date(pendingProposal.createdAt).toLocaleDateString() : "Recientemente"}
            </span>
          </div>

          {/* Caso 2 & 3: Comparación de Fechas en el Banner */}
          <div className="text-xs text-amber-200/90 pt-1 space-y-1">
            <p>
              <span className="font-medium text-amber-100">
                {localize(locale, { en: "Proposed new date range:", es: "Nueva fecha solicitada:", pt: "Novo intervalo solicitado:" })}
              </span>{" "}
              <span className="font-mono font-semibold text-white">
                {formatRawIsoString(pendingProposal?.proposedStartAt)} ➔ {formatRawIsoString(pendingProposal?.proposedEndAt)}
              </span>
            </p>
            {pendingProposal?.justification ? (
              <p className="text-[11px] text-amber-300/80 italic">
                &ldquo;{pendingProposal.justification}&rdquo;
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Success Notification Banner on Main Card (when modal is closed) */}
      {!isModalOpen && proposalSuccessMessage && !isPendingApproval ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 flex items-center justify-between">
          <span>{proposalSuccessMessage}</span>
          <button
            type="button"
            className="text-emerald-400 hover:text-white ml-2 text-xs"
            onClick={() => setProposalSuccessMessage(null)}
          >
            ✕
          </button>
        </div>
      ) : null}

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-sm font-semibold text-white">
            {localize(locale, {
              en: "On-chain Notarized Project Dates (project_config_notary)",
              es: "Fechas Operativas Notarizadas On-Chain (project_config_notary)",
              pt: "Datas Operacionais Notarizadas On-Chain (project_config_notary)"
            })}
          </h4>
          <p className="text-xs text-neutral-400">
            {localize(locale, {
              en: "Governed by Squads Multisig Vault PDA. Immutable against direct database changes.",
              es: "Gobernado por la Vault PDA de Squads Multisig. Inmutable ante cambios directos en base de datos.",
              pt: "Governado pela Vault PDA da Squads Multisig. Imutável contra alterações diretas no banco de dados."
            })}
          </p>
        </div>

        {/* Status Badge */}
        {hasOnChainConfig ? (
          <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            Notarizado On-Chain (v{onChainState?.version || 1})
          </span>
        ) : isPendingApproval ? (
          <span className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-300">
            {localize(locale, {
              en: "Pending Approval",
              es: "Pendiente por Aprobar",
              pt: "Pendente por Aprovar"
            })}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full border border-neutral-500/30 bg-neutral-500/10 px-3 py-1 text-xs font-medium text-neutral-400">
            {localize(locale, {
              en: "Uninitialized On-Chain",
              es: "Pendiente de Inicializar On-Chain",
              pt: "Pendente de Inicialização On-Chain"
            })}
          </span>
        )}
      </div>

      {/* Dates Grid (Handling Caso 2 & Caso 3) */}
      <div className="grid gap-3 sm:grid-cols-3">
        {/* Start Date Card */}
        <div className="rounded-2xl border border-white/10 bg-black/10 p-3.5">
          <p className="text-[11px] uppercase tracking-wider text-neutral-400">
            {localize(locale, { en: "Current Start Date", es: "Fecha Inicio Actual", pt: "Data Início Atual" })}
          </p>
          <p className="mt-1 font-mono text-sm font-medium text-white">
            {isLoading ? "..." : formatIsoDate(onChainState?.startAtUnixSeconds)}
          </p>
        </div>

        {/* End Date Card */}
        <div className="rounded-2xl border border-white/10 bg-black/10 p-3.5">
          <p className="text-[11px] uppercase tracking-wider text-neutral-400">
            {localize(locale, { en: "Current End Date", es: "Fecha Fin Actual", pt: "Data Fim Atual" })}
          </p>
          <p className="mt-1 font-mono text-sm font-medium text-white">
            {isLoading ? "..." : formatIsoDate(onChainState?.endAtUnixSeconds)}
          </p>
        </div>

        {/* Authority Vault Card */}
        <div className="rounded-2xl border border-white/10 bg-black/10 p-3.5">
          <p className="text-[11px] uppercase tracking-wider text-neutral-400">
            {localize(locale, { en: "Authority Vault", es: "Vault de Autoridad", pt: "Vault de Autoridade" })}
          </p>
          <p className="mt-1 font-mono text-xs font-medium text-neutral-300">
            {onChainState?.authorityVault ? truncateAddress(onChainState.authorityVault) : "Squads Vault PDA"}
          </p>
        </div>
      </div>

      {/* Action CTA */}
      <div className="pt-2">
        <Button
          type="button"
          variant="outline"
          className="min-h-10 text-xs text-white/90 hover:text-white"
          onClick={() => {
            setProposalSuccessMessage(null);
            setProposalErrorMessage(null);
            setIsModalOpen(true);
          }}
        >
          {isPendingApproval
            ? localize(locale, {
                en: "Propose Another Date Change (Squads)",
                es: "Modificar Solicitud de Fecha (Squads)",
                pt: "Modificar Pedido de Data (Squads)"
              })
            : localize(locale, {
                en: "Request Date Change (Squads Multisig)",
                es: "Solicitar Cambio de Fechas (Squads Multisig)",
                pt: "Solicitar Mudança de Datas (Squads Multisig)"
              })}
        </Button>
      </div>

      {/* Date Change Proposal Modal */}
      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            aria-label="Cerrar diálogo"
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={closeModal}
            type="button"
          />

          <Card className="relative z-10 w-full max-w-lg space-y-4 rounded-2xl border border-white/15 bg-panel/95 p-6 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-semibold text-white">
                  {localize(locale, {
                    en: "Propose New Project Date Range",
                    es: "Proponer Nuevo Rango de Fechas",
                    pt: "Propor Novo Intervalo de Datas"
                  })}
                </h3>
                <p className="text-xs text-neutral-400">
                  {localize(locale, {
                    en: "Creates a formal PENDING_MULTISIG proposal for Squads committee vote.",
                    es: "Crea una propuesta formal PENDING_MULTISIG para votación del comité de Squads.",
                    pt: "Cria uma propuesta formal PENDING_MULTISIG para votación del comité de Squads."
                  })}
                </p>
              </div>
              <Button className="min-h-8 px-3 text-xs" variant="ghost" onClick={closeModal}>
                ✕
              </Button>
            </div>

            {proposalErrorMessage ? (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                {proposalErrorMessage}
              </div>
            ) : null}

            {proposalSuccessMessage ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                {proposalSuccessMessage}
              </div>
            ) : null}

            <form onSubmit={handleProposalSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                    {localize(locale, {
                      en: "Construction / Operating Start Date",
                      es: "Fecha de inicio de construcción / operación",
                      pt: "Data de início da construção / operação"
                    })}
                  </label>
                  <input
                    required
                    type="date"
                    value={proposedStartDate}
                    onChange={(e) => setProposedStartDate(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-neutral-900/90 px-3 py-2 text-sm font-mono text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 [color-scheme:dark]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                    {localize(locale, {
                      en: "Estimated Delivery / End Date",
                      es: "Fecha estimada de entrega / cierre",
                      pt: "Data estimada de entrega / encerramento"
                    })}
                  </label>
                  <input
                    required
                    type="date"
                    value={proposedEndDate}
                    onChange={(e) => setProposedEndDate(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-neutral-900/90 px-3 py-2 text-sm font-mono text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                  {localize(locale, { en: "Change Justification", es: "Justificación del Cambio", pt: "Justificativa da Mudança" })}
                </label>
                <textarea
                  required
                  rows={3}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Motivo del cambio de fechas operativas..."
                  className="w-full rounded-lg border border-white/15 bg-neutral-900/90 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-10 text-xs"
                  onClick={closeModal}
                >
                  {localize(locale, { en: "Close", es: "Cerrar", pt: "Fechar" })}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="min-h-10 text-xs"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? localize(locale, { en: "Submitting...", es: "Enviando...", pt: "Enviando..." })
                    : localize(locale, { en: "Submit Proposal to Squads", es: "Enviar Propuesta a Squads", pt: "Enviar Proposta à Squads" })}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
