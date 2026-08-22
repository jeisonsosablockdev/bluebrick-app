"use client";

/**
 * =========================================================================================
 * Layer 1: Presentation Layer — RentasModule Component
 * Description: Displays investor yield balance, historical stream records, claim quotes,
 *              and provides an active "Cancel Claim" action for pending requests.
 * =========================================================================================
 */

import { useSearchParams } from "next/navigation";
import type { ReactElement } from "react";
import { useCallback, useMemo, useState } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";

type MonthlyRent = {
  id?: string;
  period: string;
  generated: string;
  claimed: string;
  status: "pending" | "claimed" | "canceled";
};

type Stream = {
  id: string;
  property: string;
  nextPayoutDate: string;
  monthlyEstimate: string;
  status: "active" | "paused";
};

const MONTHLY_HISTORY: MonthlyRent[] = [
  { id: "CLM-2026-01", period: "2026-01", generated: "$142.00", claimed: "$142.00", status: "claimed" },
  { id: "CLM-2026-02", period: "2026-02", generated: "$156.80", claimed: "$0.00", status: "pending" },
  { id: "CLM-2026-03", period: "2026-03", generated: "$166.30", claimed: "$0.00", status: "pending" }
];

const ACTIVE_STREAMS: Stream[] = [
  { id: "STM-0192", property: "Torre Magnolia Medellin", nextPayoutDate: "2026-03-12", monthlyEstimate: "$81.40", status: "active" },
  { id: "STM-0280", property: "Vista Mar Cartagena", nextPayoutDate: "2026-03-14", monthlyEstimate: "$52.10", status: "active" },
  { id: "STM-0451", property: "Parque Central Bogota", nextPayoutDate: "2026-03-20", monthlyEstimate: "$32.80", status: "paused" }
];

/**
 * Loading skeleton component for yield records.
 * What: Renders pulse loading placeholders.
 * How: Uses CSS animation-pulse on container elements.
 */
function LoadingState(): ReactElement {
  return (
    <div className="space-y-4">
      <article className="marketplace-depth-card space-y-2 rounded-2xl p-5">
        <div className="h-5 w-48 animate-pulse rounded bg-white/10" />
        <div className="h-4 w-full animate-pulse rounded bg-white/10" />
      </article>
      <article className="marketplace-depth-card space-y-2 rounded-2xl p-5">
        <div className="h-44 w-full animate-pulse rounded bg-white/10" />
      </article>
    </div>
  );
}

/**
 * Error state card component.
 * What: Displays error message with retry button.
 * How: Renders rose-bordered container with localized text.
 */
function ErrorState({ t }: { t: ReturnType<typeof useI18n>["t"] }): ReactElement {
  return (
    <article className="marketplace-depth-card space-y-2 rounded-2xl p-5 border-rose-400/40 bg-rose-500/5">
      <h2 className="text-lg font-semibold text-white">{t({ en: "Could not load your yield", es: "No se pudieron cargar tus rentas", pt: "Nao foi possivel carregar suas rendas" })}</h2>
      <p className="text-sm text-white/75">{t({ en: "Try again in a few minutes.", es: "Intenta nuevamente en unos minutos.", pt: "Tente novamente em algunos minutos." })}</p>
      <Button className="min-h-11 w-full sm:w-auto" variant="outline">
        {t({ en: "Retry", es: "Reintentar", pt: "Tentar novamente" })}
      </Button>
    </article>
  );
}

/**
 * Empty state card component.
 * What: Displays empty notice when no yields are present.
 * How: Renders dashed container with informational text.
 */
function EmptyState({ t }: { t: ReturnType<typeof useI18n>["t"] }): ReactElement {
  return (
    <article className="marketplace-depth-card space-y-2 rounded-2xl p-5 border-dashed">
      <h2 className="text-lg font-semibold text-white">{t({ en: "No yield available", es: "Sin rentas disponibles", pt: "Sem rendas disponiveis" })}</h2>
      <p className="text-sm text-white/75">{t({ en: "You do not have generated yield to claim in this period yet.", es: "Todavia no tienes rentas generadas para reclamar en este periodo.", pt: "Voce ainda nao tem rendas geradas para reclamar neste periodo." })}</p>
    </article>
  );
}

/**
 * RentasModule Component
 * What: Investor yield and distribution claim overview module.
 * How: Calculates claimable totals, lists monthly stream history, and allows cancellation of pending claims.
 */
export function RentasModule(): ReactElement {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  const initialClaimParam = searchParams.get("claim");

  const [claimState, setClaimState] = useState<string | null>(initialClaimParam);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);

  const isLoading = view === "loading";
  const isError = view === "error";
  const isEmpty = view === "empty";

  // Step 1: Calculate summary metrics
  const summary = useMemo(
    () => ({
      claimableBalance: isEmpty ? "$0.00" : "$323.10",
      monthlyGenerated: isEmpty ? "$0.00" : "$166.30",
      activeStreams: isEmpty ? 0 : ACTIVE_STREAMS.filter((stream) => stream.status === "active").length,
      alreadyClaimed: isEmpty ? "$0.00" : "$142.00"
    }),
    [isEmpty]
  );

  /**
   * Handles user-initiated claim request cancellation.
   * What: Sends cancellation request to backend API.
   * How: Posts to /api/claims/[claimId]/cancel, updates local UI state, and displays feedback.
   */
  const handleCancelClaim = useCallback(async (claimId: string) => {
    setIsCancelling(true);
    setCancelError(null);
    setCancelSuccess(null);

    try {
      const response = await fetch(`/api/claims/${claimId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to cancel claim request.");
      }

      setClaimState("canceled");
      setCancelSuccess(
        t({
          en: "Claim request successfully cancelled.",
          es: "Solicitud de reclamación cancelada exitosamente.",
          pt: "Solicitação de reivindicação cancelada com sucesso."
        })
      );
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Error cancelling claim.");
    } finally {
      setIsCancelling(false);
    }
  }, [t]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError) {
    return <ErrorState t={t} />;
  }

  if (isEmpty) {
    return <EmptyState t={t} />;
  }

  return (
    <div className="space-y-4">
      <article className="marketplace-depth-card space-y-2 rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-white">{t({ en: "Yield and Claim", es: "Rentas y Claim", pt: "Rendas e Claim" })}</h2>
        <p className="text-sm text-white/75">{t({ en: "Check what you can claim, what you already received and the status of active streams.", es: "Consulta cuanto puedes reclamar, cuanto ya recibiste y el estado de tus streams activos.", pt: "Consulte quanto voce pode reclamar, quanto ja recebeu e o status dos seus streams activos." })}</p>
      </article>

      {/* Status banner for pending, done or canceled claim */}
      {(claimState === "pending" || claimState === "done" || claimState === "canceled") && (
        <article className={`marketplace-depth-card space-y-3 rounded-2xl p-5 ${
          claimState === "pending"
            ? "border-amber-400/30 bg-amber-500/5"
            : claimState === "canceled"
            ? "border-slate-400/30 bg-slate-500/5"
            : "border-emerald-400/30 bg-emerald-500/5"
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className={`text-sm font-semibold ${
                claimState === "pending" ? "text-amber-100" : claimState === "canceled" ? "text-slate-200" : "text-emerald-100"
              }`}>
                {claimState === "pending"
                  ? t({ en: "Pending claim", es: "Claim pendiente", pt: "Claim pendente" })
                  : claimState === "canceled"
                  ? t({ en: "Claim cancelled", es: "Claim cancelado", pt: "Claim cancelado" })
                  : t({ en: "Claim completed", es: "Claim realizado", pt: "Claim realizado" })}
              </p>
              <p className={`text-sm ${
                claimState === "pending" ? "text-amber-100/80" : claimState === "canceled" ? "text-white/70" : "text-emerald-100/80"
              }`}>
                {claimState === "pending"
                  ? t({ en: "Your claim request is in confirmation. You can cancel it before on-chain execution.", es: "Tu solicitud de claim esta en confirmacion. Puedes cancelarla antes de la ejecucion on-chain.", pt: "Sua solicitacao de claim esta em confirmacao. Voce pode cancela-la antes da execucao on-chain." })
                  : claimState === "canceled"
                  ? (cancelSuccess || t({ en: "Your claim request has been cancelled.", es: "Tu solicitud de claim ha sido cancelada.", pt: "Sua solicitacao de claim foi cancelada." }))
                  : t({ en: "Your claim was processed correctly and now appears in history.", es: "Tu claim fue procesado correctamente y ya aparece en el historial.", pt: "Seu claim foi processado corretamente e ja aparece no historico." })}
              </p>
            </div>

            {/* Cancel Claim Action Button */}
            {claimState === "pending" && (
              <Button
                variant="outline"
                className="min-h-10 border-rose-500/30 text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
                onClick={() => handleCancelClaim("CLM-2026-03")}
                disabled={isCancelling}
              >
                {isCancelling
                  ? t({ en: "Cancelling...", es: "Cancelando...", pt: "Cancelando..." })
                  : t({ en: "Cancel Claim", es: "Cancelar Reclamación", pt: "Cancelar Reivindicação" })}
              </Button>
            )}
          </div>

          {cancelError && (
            <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2">
              {cancelError}
            </p>
          )}
        </article>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="marketplace-depth-card space-y-1 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-white/60">{t({ en: "Claimable balance", es: "Balance claimable", pt: "Saldo disponivel para claim" })}</p>
          <p className="text-2xl font-semibold text-white">{summary.claimableBalance}</p>
        </article>
        <article className="marketplace-depth-card space-y-1 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-white/60">{t({ en: "Monthly history", es: "Historico mensual", pt: "Historico mensal" })}</p>
          <p className="text-2xl font-semibold text-white">{summary.monthlyGenerated}</p>
        </article>
        <article className="marketplace-depth-card space-y-1 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-white/60">{t({ en: "Active streams", es: "Streams activos", pt: "Streams ativos" })}</p>
          <p className="text-2xl font-semibold text-white">{summary.activeStreams}</p>
        </article>
        <article className="marketplace-depth-card space-y-1 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-white/60">{t({ en: "Already claimed", es: "Rentas ya reclamadas", pt: "Rendas ja reclamadas" })}</p>
          <p className="text-2xl font-semibold text-white">{summary.alreadyClaimed}</p>
        </article>
      </div>

      <article className="marketplace-depth-card space-y-3 rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-white">{t({ en: "Claim CTA", es: "CTA de Claim", pt: "CTA de Claim" })}</h3>
          <Button className="min-h-11" variant="primary">
            Claim
          </Button>
        </div>
        <p className="text-sm text-white/70">{t({ en: "Claim is prepared to integrate wallet signature and payout backend.", es: "El claim queda preparado para integrar firma wallet y backend de payout.", pt: "O claim fica preparado para integrar assinatura wallet e backend de payout." })}</p>
      </article>

      <article className="marketplace-depth-card space-y-3 rounded-2xl p-5">
        <h3 className="text-base font-semibold text-white">{t({ en: "History by period", es: "Historial por periodo", pt: "Historico por periodo" })}</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/60">
                <th className="px-2 py-2 font-medium">{t({ en: "Period", es: "Periodo", pt: "Periodo" })}</th>
                <th className="px-2 py-2 font-medium">{t({ en: "Generated", es: "Generado", pt: "Gerado" })}</th>
                <th className="px-2 py-2 font-medium">{t({ en: "Claimed", es: "Reclamado", pt: "Reclamado" })}</th>
                <th className="px-2 py-2 font-medium">{t({ en: "Status", es: "Estado", pt: "Status" })}</th>
              </tr>
            </thead>
            <tbody>
              {MONTHLY_HISTORY.map((entry) => (
                <tr key={entry.period} className="border-b border-white/10">
                  <td className="px-2 py-2 text-white">{entry.period}</td>
                  <td className="px-2 py-2 text-white">{entry.generated}</td>
                  <td className="px-2 py-2 text-white">{entry.claimed}</td>
                  <td className="px-2 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs ${
                      entry.status === "pending"
                        ? "bg-amber-500/20 text-amber-200"
                        : entry.status === "canceled"
                        ? "bg-slate-500/20 text-slate-200"
                        : "bg-emerald-500/20 text-emerald-200"
                    }`}>
                      {entry.status === "pending"
                        ? t({ en: "Pending claim", es: "Claim pendiente", pt: "Claim pendente" })
                        : entry.status === "canceled"
                        ? t({ en: "Claim cancelled", es: "Claim cancelado", pt: "Claim cancelado" })
                        : t({ en: "Claim completed", es: "Claim realizado", pt: "Claim realizado" })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="marketplace-depth-card space-y-3 rounded-2xl p-5">
        <h3 className="text-base font-semibold text-white">{t({ en: "Active streams", es: "Streams activos", pt: "Streams ativos" })}</h3>
        <ul className="space-y-2">
          {ACTIVE_STREAMS.map((stream) => (
            <li key={stream.id} className="marketplace-depth-card rounded-2xl p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-white">{stream.property}</p>
                <span className={`rounded-full px-2 py-1 text-xs ${stream.status === "active" ? "bg-emerald-500/20 text-emerald-200" : "bg-slate-500/20 text-slate-200"}`}>
                  {stream.status === "active"
                    ? t({ en: "Active", es: "Activo", pt: "Ativo" })
                    : t({ en: "Paused", es: "Pausado", pt: "Pausado" })}
                </span>
              </div>
              <p className="text-white/70">
                {stream.id} · {t({ en: "Next payout", es: "Proximo pago", pt: "Proximo pagamento" })}: {stream.nextPayoutDate} · {t({ en: "Estimate", es: "Estimado", pt: "Estimado" })}: {stream.monthlyEstimate}
              </p>
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}
