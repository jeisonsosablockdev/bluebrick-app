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
 * Invariants:
 * - Sober, emoji-free aesthetic matching /profile and admin panels.
 * - Read-only on-chain state visualization with explicit version indicator.
 * - Date change proposals require reason/justification and enforce start_at <= end_at.
 * =========================================================================================
 */

import type { ReactElement } from "react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { localize, type AppLocale } from "@/lib/i18n";
import type { ProjectConfigPdaState } from "@/lib/solana-kit/pda/project-config-reader";

type AdminCollectionNotaryDatesPanelProps = {
  collectionId: string;
  collectionAddress: string | null;
  locale: AppLocale;
};

function formatIsoDate(unixSeconds: bigint | number | null | undefined): string {
  if (unixSeconds === null || unixSeconds === undefined) return "No configurado";
  const ms = Number(unixSeconds) * 1000;
  return new Date(ms).toISOString().slice(0, 10);
}

function truncateAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export function AdminCollectionNotaryDatesPanel({
  collectionId,
  collectionAddress,
  locale
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

  // Step 1: Fetch on-chain Notary PDA state on mount
  useEffect(() => {
    let isMounted = true;

    async function loadNotaryState() {
      if (!collectionAddress && !collectionId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const target = collectionAddress || collectionId;
        const res = await fetch(`/api/admin/collections/${target}/date-change-request`);
        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.onChainState && isMounted) {
            setOnChainState(data.onChainState);
            if (data.onChainState.startAtUnixSeconds) {
              setProposedStartDate(new Date(Number(data.onChainState.startAtUnixSeconds) * 1000).toISOString().slice(0, 10));
            }
            if (data.onChainState.endAtUnixSeconds) {
              setProposedEndDate(new Date(Number(data.onChainState.endAtUnixSeconds) * 1000).toISOString().slice(0, 10));
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

      const target = collectionAddress || collectionId;
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

      setProposalSuccessMessage(
        localize(locale, {
          en: `Solicitud registrada con éxito. Estado: ${data.data?.status || "PENDING_MULTISIG"}. El comité de Squads revisará la propuesta.`,
          es: `Solicitud registrada con éxito. Estado: ${data.data?.status || "PENDING_MULTISIG"}. El comité de Squads revisará la propuesta.`,
          pt: `Solicitação registrada com sucesso. Status: ${data.data?.status || "PENDING_MULTISIG"}. O comitê da Squads revisará a proposta.`
        })
      );
    } catch (err) {
      setProposalErrorMessage(err instanceof Error ? err.message : "Error inesperado al enviar propuesta.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] via-white/[0.03] to-transparent p-5 space-y-4">
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
        {onChainState ? (
          <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            Notarizado On-Chain (v{onChainState.version})
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
            Pendiente de Inicializar On-Chain
          </span>
        )}
      </div>

      {/* Dates Grid */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/10 p-3.5">
          <p className="text-[11px] uppercase tracking-wider text-neutral-400">
            {localize(locale, { en: "Start Date", es: "Fecha Inicio", pt: "Data Início" })}
          </p>
          <p className="mt-1 font-mono text-sm font-medium text-white">
            {isLoading ? "..." : formatIsoDate(onChainState?.startAtUnixSeconds)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/10 p-3.5">
          <p className="text-[11px] uppercase tracking-wider text-neutral-400">
            {localize(locale, { en: "End Date", es: "Fecha Fin", pt: "Data Fim" })}
          </p>
          <p className="mt-1 font-mono text-sm font-medium text-white">
            {isLoading ? "..." : formatIsoDate(onChainState?.endAtUnixSeconds)}
          </p>
        </div>

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
          {localize(locale, {
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
            onClick={() => setIsModalOpen(false)}
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
                    pt: "Cria uma proposta formal PENDING_MULTISIG para votação do comitê da Squads."
                  })}
                </p>
              </div>
              <Button className="min-h-8 px-3 text-xs" variant="ghost" onClick={() => setIsModalOpen(false)}>
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
                  onClick={() => setIsModalOpen(false)}
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
