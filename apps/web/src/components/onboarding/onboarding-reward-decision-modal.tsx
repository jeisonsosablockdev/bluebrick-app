"use client";

import type { ReactElement } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { formatUsdByLocale } from "@/lib/onboarding-reward-copy";

type OnboardingRewardDecisionModalProps = {
  open: boolean;
  rewardAmountUsd: number;
  qualificationDeadlineLabel: string | null;
  walletConnected?: boolean;
  onExplore: () => void;
  onCompleteProfile: () => void;
  onClose: () => void;
};

export function OnboardingRewardDecisionModal({
  open,
  rewardAmountUsd,
  qualificationDeadlineLabel,
  walletConnected = true,
  onExplore,
  onCompleteProfile,
  onClose
}: OnboardingRewardDecisionModalProps): ReactElement | null {
  const { locale, t } = useI18n();

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-slate-950/78 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md sm:items-center sm:p-6"
      data-testid="onboarding-reward-modal-overlay"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-reward-modal-title"
        className="glass-surface relative max-h-[calc(100svh-1.5rem)] w-full max-w-3xl overflow-hidden sm:max-h-[90vh]"
      >
        <div className="pointer-events-none absolute -left-10 top-6 h-28 w-28 rounded-full bg-cyan-300/12 blur-3xl" />
        <div className="pointer-events-none absolute -right-12 bottom-10 h-32 w-32 rounded-full bg-fuchsia-300/10 blur-3xl" />

        <div className="relative z-10 flex max-h-[calc(100svh-1.5rem)] flex-col overflow-hidden sm:max-h-[90vh]">
          <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 pb-3 pt-4 sm:gap-4 sm:px-7 sm:pb-5 sm:pt-6">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200/90">
                {t({ en: "Welcome to BRIDS", es: "Bienvenido a BRIDS", pt: "Bem-vindo à BRIDS" })}
              </p>
              <h2 id="onboarding-reward-modal-title" className="max-w-[18ch] text-[1.32rem] font-semibold leading-[1.08] text-white sm:text-[2.05rem] lg:text-[2.15rem]">
                {t({
                  en: "Do you want to explore or complete your profile?",
                  es: "¿Quieres explorar o completar tu perfil?",
                  pt: "Você quer explorar ou completar seu perfil?"
                })}
              </h2>
            </div>
            <button
              aria-label={t({ en: "Close modal", es: "Cerrar modal", pt: "Fechar modal" })}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 px-3 text-lg text-white/80 transition hover:bg-white/16"
              onClick={onClose}
              type="button"
            >
              ×
            </button>
          </div>

          <div className="overflow-y-auto px-4 pb-4 pt-3 sm:px-7 sm:pb-7 sm:pt-5">
            <div className="space-y-4">
              <section className="rounded-2xl border border-white/12 bg-[linear-gradient(180deg,rgba(14,21,37,0.92),rgba(8,12,23,0.96))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:rounded-[26px] sm:p-6">
                <div className="space-y-5 md:grid md:grid-cols-[1.18fr_0.82fr] md:items-center md:gap-6 md:space-y-0">
                  <p className="max-w-[30ch] text-[13px] leading-7 text-white/72 sm:max-w-[34ch] sm:text-[14px] sm:leading-7 md:max-w-none md:text-[15px] md:leading-8">
                    {walletConnected
                      ? t({
                          en: "Your wallet is already connected. You can keep exploring the platform now or complete your profile to move faster through verification and purchase.",
                          es: "Ya conectaste tu wallet. Puedes seguir explorando la plataforma ahora mismo o completar tu perfil para avanzar más rápido en verificación y compra.",
                          pt: "Sua wallet já está conectada. Você pode continuar explorando a plataforma agora mesmo ou completar seu perfil para avançar mais rápido na verificação e compra."
                        })
                      : t({
                          en: "Your BRIDS account is ready. You can explore the platform now or complete your profile first to move faster when you link your wallet later.",
                          es: "Tu cuenta BRIDS ya esta lista. Puedes explorar la plataforma ahora o completar primero tu perfil para avanzar más rápido cuando vincules tu wallet después.",
                          pt: "Sua conta BRIDS já está pronta. Você pode explorar a plataforma agora ou completar primeiro seu perfil para avançar mais rápido quando vincular sua carteira depois."
                        })}
                  </p>

                  <div className="flex flex-col gap-3 md:justify-self-end md:w-full md:max-w-[19rem] md:justify-center">
                    <Button className="min-h-11 rounded-full border border-white/10 bg-white/[0.04] text-white/90 hover:bg-white/[0.1]" onClick={onExplore} variant="ghost">
                      {t({ en: "Explore now", es: "Explorar ahora", pt: "Explorar agora" })}
                    </Button>
                    <Button className="min-h-11 rounded-full" onClick={onCompleteProfile}>
                      {t({ en: "Continue with my profile", es: "Continuar con mi perfil", pt: "Continuar com meu perfil" })}
                    </Button>
                  </div>
                </div>
              </section>

              <section className="reward-cta-pulse relative overflow-hidden rounded-2xl border border-emerald-400/24 bg-[linear-gradient(180deg,rgba(16,185,129,0.08),rgba(10,16,31,0.72)_24%,rgba(8,12,24,0.92)_100%)] p-4 shadow-[0_18px_45px_rgba(16,185,129,0.14)] sm:rounded-[26px] sm:p-6">
                <div className="pointer-events-none absolute inset-x-8 bottom-0 h-16 rounded-full bg-emerald-400/18 blur-3xl" />
                <div className="relative z-10 space-y-4 md:grid md:grid-cols-[1.02fr_0.98fr] md:items-start md:gap-6 md:space-y-0">
                  <div className="space-y-3">
                    <p className="text-[13px] font-semibold uppercase tracking-[0.34em] text-emerald-200/92 sm:text-[14px]">
                      {t({ en: "Onboarding reward", es: "Beneficio de onboarding", pt: "Benefício de onboarding" })}
                    </p>
                    <h3 className="max-w-[13ch] text-[1.42rem] font-semibold leading-[1.04] text-white sm:max-w-[12.5ch] sm:text-[1.68rem] md:max-w-[11.5ch] md:text-[1.82rem] lg:text-[2.02rem]">
                      {t({
                        en: `Complete your profile and earn ${formatUsdByLocale(rewardAmountUsd, locale)} USD`,
                        es: `Completa tu perfil y gana ${formatUsdByLocale(rewardAmountUsd, locale)} USD`,
                        pt: `Complete seu perfil e ganhe ${formatUsdByLocale(rewardAmountUsd, locale)} USD`
                      })}
                    </h3>
                  </div>

                  <div className="space-y-3 md:pt-1 md:self-center">
                    <p className="text-[11.5px] leading-5 text-emerald-50/82 sm:text-[12.5px] sm:leading-6 md:max-w-[33ch]">
                      {t({
                        en: "The benefit stays attached to your profile and applies once as a discount toward your tokenized fraction purchase.",
                        es: "El beneficio queda guardado en tu perfil y se aplica una sola vez como descuento para la compra de tu fracción tokenizada.",
                        pt: "O benefício fica salvo no seu perfil e é aplicado uma única vez como desconto para a compra da sua fração tokenizada."
                      })}
                    </p>

                    <p className="text-[10.5px] leading-5 text-emerald-100/72 sm:text-[11.5px] sm:leading-6 md:max-w-[35ch]">
                      {t({
                        en: "* Valid only toward the purchase of your tokenized fraction. You must complete registration and KYC to earn it.",
                        es: "* Válidos para la compra de tu fracción tokenizada. Hay que completar el registro y el KYC para poder ganarlos.",
                        pt: "* Válido para a compra da sua fração tokenizada. Você precisa concluir o cadastro e o KYC para ganhar esse benefício."
                      })}
                      {qualificationDeadlineLabel
                        ? t({
                            en: ` You have until ${qualificationDeadlineLabel} to qualify.`,
                            es: ` Tienes hasta ${qualificationDeadlineLabel} para calificar.`,
                            pt: ` Você tem até ${qualificationDeadlineLabel} para se qualificar.`
                          })
                        : t({
                            en: " You have one week after your initial connection to qualify.",
                            es: " Tienes una semana después de tu conexión inicial para calificar.",
                            pt: " Você tem uma semana após sua conexão inicial para se qualificar."
                          })}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
