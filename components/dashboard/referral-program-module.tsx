"use client";

import type { ReactElement } from "react";
import { useEffect, useState } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ReferralDashboardSummary = {
  referralCode: string;
  sharePath: string;
  pendingInviteesCount: number;
  completedInviteesCount: number;
  notificationCount: number;
  totalAccruedUsdc: number;
  totalPendingDistributionUsdc: number;
  totalPaidUsdc: number;
  nextMilestone: {
    targetCount: number;
    progressCount: number;
    progressPercent: number;
  };
};

type ReferralDashboardInviteeRecord = {
  inviteeWalletDisplay: string;
  state: "pending" | "completed";
  attributionStatus: string;
  rewardStatus: string | null;
  rewardAmountUsdc: number;
  boundDay: string;
  qualifiedDay: string | null;
};

type ReferralDashboardInviteePage = {
  items: ReferralDashboardInviteeRecord[];
  totalCount: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

type SummaryPayload = {
  ok?: boolean;
  data?: ReferralDashboardSummary;
  error?: {
    message?: string;
  };
};

type InviteesPayload = {
  ok?: boolean;
  data?: ReferralDashboardInviteePage;
  error?: {
    message?: string;
  };
};

const INVITEE_PAGE_LIMIT = 5;

function formatUsdc(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

function buildFunctionalShareUrl(referralCode: string, sharePath: string): string {
  const relativeTarget = sharePath?.trim() || `/?ref=${encodeURIComponent(referralCode)}`;

  if (typeof window === "undefined") {
    return relativeTarget;
  }

  return new URL(relativeTarget, window.location.origin).toString();
}

function buildMailtoHref(input: {
  shareUrl: string;
  subject: string;
  body: string;
}): string {
  return `mailto:?subject=${encodeURIComponent(input.subject)}&body=${encodeURIComponent(`${input.body}\n\n${input.shareUrl}`)}`;
}

function rewardStatusLabel(
  value: string | null,
  t: ReturnType<typeof useI18n>["t"]
): string {
  if (value === "paid") {
    return t({ en: "Paid", es: "Pagado", pt: "Pago" });
  }

  if (value === "pending_admin_distribution") {
    return t({ en: "Pending admin distribution", es: "Pendiente de distribucion admin", pt: "Pendente de distribuicao admin" });
  }

  if (value === "accrued") {
    return t({ en: "Accrued", es: "Acumulado", pt: "Acumulado" });
  }

  if (value === "pending_settlement") {
    return t({ en: "Pending settlement", es: "Pendiente de settlement", pt: "Pendente de settlement" });
  }

  if (value === "pending_qualification") {
    return t({ en: "Pending qualification", es: "Pendiente de calificacion", pt: "Pendente de qualificacao" });
  }

  return t({ en: "Awaiting qualification", es: "Esperando calificacion", pt: "Aguardando qualificacao" });
}

function stateClassName(state: "pending" | "completed"): string {
  return state === "completed"
    ? "bg-emerald-500/15 text-emerald-200"
    : "bg-amber-500/15 text-amber-200";
}

function ReferralModuleSkeleton(): ReactElement {
  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
          <div className="h-8 w-44 animate-pulse rounded bg-white/10" />
        </div>
        <div className="flex gap-2">
          <div className="h-11 w-28 animate-pulse rounded-full bg-white/10" />
          <div className="h-11 w-28 animate-pulse rounded-full bg-white/10" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={`referral-skeleton-${index}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
            <div className="mt-3 h-8 w-16 animate-pulse rounded bg-white/10" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function ReferralProgramModule(): ReactElement {
  const { t } = useI18n();
  const [summary, setSummary] = useState<ReferralDashboardSummary | null>(null);
  const [inviteesPage, setInviteesPage] = useState<ReferralDashboardInviteePage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteesLoading, setIsInviteesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function loadInitialState(): Promise<void> {
    setIsLoading(true);
    setError(null);

    try {
      const [summaryResponse, inviteesResponse] = await Promise.all([
        fetch("/api/protected/referrals/summary", { method: "GET", cache: "no-store" }),
        fetch(`/api/protected/referrals/invitees?limit=${INVITEE_PAGE_LIMIT}&offset=0`, {
          method: "GET",
          cache: "no-store"
        })
      ]);

      const summaryPayload = (await summaryResponse.json()) as SummaryPayload;
      const inviteesPayload = (await inviteesResponse.json()) as InviteesPayload;

      if (!summaryResponse.ok || !summaryPayload.data) {
        throw new Error(summaryPayload.error?.message || "Could not load referral summary.");
      }

      if (!inviteesResponse.ok || !inviteesPayload.data) {
        throw new Error(inviteesPayload.error?.message || "Could not load referral invitees.");
      }

      setSummary(summaryPayload.data);
      setInviteesPage(inviteesPayload.data);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not load referral data.");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadInviteesPage(offset: number): Promise<void> {
    setIsInviteesLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/protected/referrals/invitees?limit=${INVITEE_PAGE_LIMIT}&offset=${Math.max(0, offset)}`,
        {
          method: "GET",
          cache: "no-store"
        }
      );
      const payload = (await response.json()) as InviteesPayload;

      if (!response.ok || !payload.data) {
        throw new Error(payload.error?.message || "Could not load referral invitees.");
      }

      setInviteesPage(payload.data);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not load referral invitees.");
    } finally {
      setIsInviteesLoading(false);
    }
  }

  async function handleCopyShareLink(): Promise<void> {
    if (!summary || !navigator?.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(buildFunctionalShareUrl(summary.referralCode, summary.sharePath));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  useEffect(() => {
    void loadInitialState();
  }, []);

  if (isLoading) {
    return <ReferralModuleSkeleton />;
  }

  if (error && !summary) {
    return (
      <Card className="space-y-3 border-red-400/40 bg-red-500/5">
        <h2 className="text-lg font-semibold text-white">
          {t({ en: "Could not load referrals", es: "No se pudieron cargar los referidos", pt: "Nao foi possivel carregar os indicados" })}
        </h2>
        <p className="text-sm text-white/80">{error}</p>
        <div>
          <Button className="min-h-11" variant="outline" onClick={() => void loadInitialState()}>
            {t({ en: "Retry", es: "Reintentar", pt: "Tentar novamente" })}
          </Button>
        </div>
      </Card>
    );
  }

  if (!summary || !inviteesPage) {
    return <ReferralModuleSkeleton />;
  }

  const shareUrl = buildFunctionalShareUrl(summary.referralCode, summary.sharePath);
  const mailtoHref = buildMailtoHref({
    shareUrl,
    subject: t({
      en: "Join me on BRIDS",
      es: "Unete conmigo a BRIDS",
      pt: "Junte-se a mim na BRIDS"
    }),
    body: t({
      en: "Use my referral link to start your onboarding flow on BRIDS.",
      es: "Usa mi enlace de referido para comenzar tu onboarding en BRIDS.",
      pt: "Use meu link de indicacao para iniciar seu onboarding na BRIDS."
    })
  });
  const nextOffset = inviteesPage.offset + inviteesPage.limit;
  const previousOffset = Math.max(0, inviteesPage.offset - inviteesPage.limit);

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
                {t({ en: "Referral Program", es: "Programa de referidos", pt: "Programa de indicacoes" })}
              </p>
              {summary.notificationCount > 0 ? (
                <span className="inline-flex min-h-6 items-center rounded-full bg-emerald-500/15 px-2 text-xs font-medium text-emerald-200">
                  {summary.notificationCount} {t({ en: "new", es: "nuevo", pt: "novo" })}
                </span>
              ) : null}
            </div>
            <h2 className="text-2xl font-semibold text-white">
              {t({ en: "Share and track your referrals", es: "Comparte y sigue tus referidos", pt: "Compartilhe e acompanhe suas indicacoes" })}
            </h2>
            <p className="max-w-2xl text-sm text-white/70">
              {t({
                en: "Invite new investors with your referral code, monitor qualification progress, and track rewards without exposing invitee identities.",
                es: "Invita nuevos inversionistas con tu codigo, monitorea el avance de calificacion y sigue recompensas sin exponer identidades de invitados.",
                pt: "Convide novos investidores com seu codigo, monitore o progresso de qualificacao e acompanhe recompensas sem expor identidades dos convidados."
              })}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button className="min-h-11" variant="primary" onClick={() => void handleCopyShareLink()}>
              {copied
                ? t({ en: "Copied link", es: "Enlace copiado", pt: "Link copiado" })
                : t({ en: "Copy link", es: "Copiar enlace", pt: "Copiar link" })}
            </Button>
            <a
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/25 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/10"
              href={mailtoHref}
            >
              {t({ en: "Share by email", es: "Compartir por correo", pt: "Compartilhar por email" })}
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-white/55">
            {t({ en: "Referral code", es: "Codigo de referido", pt: "Codigo de indicacao" })}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <code className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white">{summary.referralCode}</code>
            <p className="text-xs text-white/60">{shareUrl}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-white/55">
              {t({ en: "Pending invitees", es: "Invitados pendientes", pt: "Convidados pendentes" })}
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">{summary.pendingInviteesCount}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-white/55">
              {t({ en: "Completed invitees", es: "Invitados completados", pt: "Convidados concluidos" })}
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">{summary.completedInviteesCount}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-white/55">
              {t({ en: "Accrued rewards", es: "Recompensas acumuladas", pt: "Recompensas acumuladas" })}
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">{formatUsdc(summary.totalAccruedUsdc)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-white/55">
              {t({ en: "Paid rewards", es: "Recompensas pagadas", pt: "Recompensas pagas" })}
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">{formatUsdc(summary.totalPaidUsdc)}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white">
                {t({ en: "Next milestone", es: "Siguiente hito", pt: "Proximo marco" })}
              </p>
              <p className="text-sm text-white/65">
                {summary.nextMilestone.progressCount} / {summary.nextMilestone.targetCount}{" "}
                {t({ en: "completed referrals", es: "referidos completados", pt: "indicacoes concluidas" })}
              </p>
            </div>
            <p className="text-sm font-semibold text-cyan-200">{summary.nextMilestone.progressPercent}%</p>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
            <div
              aria-label={t({ en: "Milestone progress", es: "Progreso del hito", pt: "Progresso do marco" })}
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-emerald-300 to-cyan-200 transition-all"
              style={{ width: `${summary.nextMilestone.progressPercent}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-white/55">
            {t({ en: "Pending admin distribution", es: "Pendiente de distribucion admin", pt: "Pendente de distribuicao admin" })}:{" "}
            <span className="font-medium text-white">{formatUsdc(summary.totalPendingDistributionUsdc)}</span>
          </p>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {t({ en: "Invitee activity", es: "Actividad de invitados", pt: "Atividade dos convidados" })}
            </h3>
            <p className="text-sm text-white/70">
              {t({
                en: "This feed stays privacy-safe by truncating identities and exposing dates only at day granularity.",
                es: "Este feed mantiene privacidad truncando identidades y mostrando fechas solo con granularidad de dia.",
                pt: "Este feed preserva a privacidade truncando identidades e expondo datas apenas com granularidade de dia."
              })}
            </p>
          </div>
          {isInviteesLoading ? <span className="text-xs text-white/55">{t({ en: "Loading...", es: "Cargando...", pt: "Carregando..." })}</span> : null}
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/5 px-4 py-3 text-sm text-red-100">{error}</div>
        ) : null}

        {inviteesPage.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 px-4 py-5 text-sm text-white/70">
            {t({
              en: "No invitees have entered your referral funnel yet.",
              es: "Todavia no hay invitados dentro de tu funnel de referidos.",
              pt: "Ainda nao ha convidados no seu funil de indicacoes."
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {inviteesPage.items.map((invitee) => (
              <div key={`${invitee.inviteeWalletDisplay}-${invitee.boundDay}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">{invitee.inviteeWalletDisplay}</p>
                    <p className="text-xs text-white/60">
                      {t({ en: "Joined", es: "Ingreso", pt: "Entrou" })}: {invitee.boundDay}
                      {invitee.qualifiedDay ? ` · ${t({ en: "Qualified", es: "Calificado", pt: "Qualificado" })}: ${invitee.qualifiedDay}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex min-h-7 items-center rounded-full px-3 text-xs font-medium ${stateClassName(invitee.state)}`}>
                      {invitee.state === "completed"
                        ? t({ en: "Completed", es: "Completado", pt: "Concluido" })
                        : t({ en: "Pending", es: "Pendiente", pt: "Pendente" })}
                    </span>
                    <span className="inline-flex min-h-7 items-center rounded-full bg-white/10 px-3 text-xs font-medium text-white/80">
                      {rewardStatusLabel(invitee.rewardStatus, t)}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
                  <p className="text-white/70">
                    {t({ en: "Attribution status", es: "Estado de atribucion", pt: "Status de atribuicao" })}:{" "}
                    <span className="font-medium text-white">{invitee.attributionStatus}</span>
                  </p>
                  <p className="font-semibold text-cyan-200">{formatUsdc(invitee.rewardAmountUsdc)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
          <p className="text-xs text-white/55">
            {t({ en: "Showing", es: "Mostrando", pt: "Mostrando" })} {inviteesPage.items.length} / {inviteesPage.totalCount}
          </p>
          <div className="flex gap-2">
            <Button
              className="min-h-11"
              disabled={isInviteesLoading || inviteesPage.offset === 0}
              variant="outline"
              onClick={() => void loadInviteesPage(previousOffset)}
            >
              {t({ en: "Previous", es: "Anterior", pt: "Anterior" })}
            </Button>
            <Button
              className="min-h-11"
              disabled={isInviteesLoading || !inviteesPage.hasMore}
              variant="outline"
              onClick={() => void loadInviteesPage(nextOffset)}
            >
              {t({ en: "Next", es: "Siguiente", pt: "Seguinte" })}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
