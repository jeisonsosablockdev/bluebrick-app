"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import {
  formatOnboardingRewardRemainingWindow,
  formatUsdByLocale,
  type OnboardingRewardStatus
} from "@/lib/onboarding-reward-copy";

type OnboardingRewardSnapshot = {
  status: OnboardingRewardStatus;
  rewardAmountUsdSnapshot: number;
  nextDeadlineAt: string | null;
  remainingSeconds: number | null;
  shouldShowReminder: boolean;
};

type ProfilePayload = {
  ok?: boolean;
  data?: {
    onboardingReward?: OnboardingRewardSnapshot | null;
  };
};

export function OnboardingRewardReminder(): ReactElement | null {
  const { locale, t } = useI18n();
  const [reward, setReward] = useState<OnboardingRewardSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile(): Promise<void> {
      const response = await fetch("/api/protected/profile", { cache: "no-store" }).catch(() => null);
      if (!response?.ok) {
        return;
      }

      const payload = (await response.json().catch(() => null)) as ProfilePayload | null;
      if (!payload?.data?.onboardingReward || cancelled) {
        return;
      }

      setReward(payload.data.onboardingReward);
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const remainingWindowLabel = useMemo(
    () => formatOnboardingRewardRemainingWindow(reward?.remainingSeconds ?? null, locale),
    [locale, reward?.remainingSeconds]
  );

  if (!reward?.shouldShowReminder) {
    return null;
  }

  const body =
    reward.status === "pending_review"
      ? t({
          en: "Your KYC was already submitted. If Stripe approves it inside the operating window, the discount is earned automatically.",
          es: "Tu KYC ya fue enviado. Si Stripe lo aprueba dentro de la ventana operativa, el descuento queda ganado automáticamente.",
          pt: "Seu KYC já foi enviado. Se a Stripe aprovar dentro da janela operacional, o desconto é ganho automaticamente."
        })
      : reward.status === "pending_kyc"
        ? t({
            en: "Your profile is almost ready. Complete KYC to unlock the onboarding discount.",
            es: "Tu perfil ya está casi listo. Completa KYC para desbloquear el descuento de onboarding.",
            pt: "Seu perfil já está quase pronto. Complete o KYC para desbloquear o desconto de onboarding."
          })
        : t({
            en: "Complete your profile and move forward with KYC to earn your onboarding discount.",
            es: "Completa tu perfil y avanza con KYC para ganar tu descuento de onboarding.",
            pt: "Complete seu perfil e avance com o KYC para ganhar seu desconto de onboarding."
          });

  return (
    <div className="rounded-[28px] border border-emerald-400/30 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_rgba(15,23,42,0.94)_58%,_rgba(2,6,23,0.98)_100%)] p-4 shadow-[0_20px_50px_rgba(16,185,129,0.12)] sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
            {t({ en: "Onboarding reward", es: "Beneficio de onboarding", pt: "Benefício de onboarding" })}
          </p>
          <h2 className="text-xl font-semibold text-white">
            {t({
              en: `Complete your profile and earn ${formatUsdByLocale(reward.rewardAmountUsdSnapshot, locale)} USD`,
              es: `Completa tu perfil y gana ${formatUsdByLocale(reward.rewardAmountUsdSnapshot, locale)} USD`,
              pt: `Complete seu perfil e ganhe ${formatUsdByLocale(reward.rewardAmountUsdSnapshot, locale)} USD`
            })}
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-white/78">{body}</p>
          {remainingWindowLabel ? (
            <p className="text-xs text-emerald-100/85">
              {t({
                en: `Remaining window: ${remainingWindowLabel}`,
                es: `Ventana restante: ${remainingWindowLabel}`,
                pt: `Janela restante: ${remainingWindowLabel}`
              })}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/profile/perfil">
            <Button className="reward-cta-pulse min-h-11">
              {t({ en: "Complete profile", es: "Completar perfil", pt: "Completar perfil" })}
            </Button>
          </Link>
          <Link href="/marketplace">
            <Button className="min-h-11" variant="ghost">
              {t({ en: "Explore properties", es: "Explorar propiedades", pt: "Explorar propriedades" })}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
