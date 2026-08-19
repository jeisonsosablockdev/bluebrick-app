"use client";

import type { ReactElement } from "react";
import { useRouter } from "next/navigation";

import { useI18n } from "@/components/i18n/locale-provider";
import { PwaCapabilityCard } from "@/components/pwa/pwa-capability-card";
import { Button } from "@/components/ui/button";
import { dispatchOpenWalletModal } from "@/lib/auth-ui-events";

type AccountProfileSupportModuleProps = {
  email: string | null;
};

export function AccountProfileSupportModule({ email }: AccountProfileSupportModuleProps): ReactElement {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <article className="marketplace-depth-card relative w-full overflow-hidden rounded-3xl p-0 shadow-[0_30px_90px_rgba(5,10,20,0.45)]">
      <div className="pointer-events-none absolute -left-8 top-8 h-24 w-24 rounded-full bg-cyan-300/12 blur-3xl" />
      <div className="pointer-events-none absolute -right-8 bottom-8 h-28 w-28 rounded-full bg-emerald-300/10 blur-3xl" />

      <div className="relative z-10 flex items-start justify-between gap-4 border-b border-white/10 px-5 pb-4 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200/90">
            {t({ en: "Profile / Support", es: "Perfil / Soporte", pt: "Perfil / Suporte" })}
          </p>
          <h2 className="max-w-[28ch] text-[1.7rem] font-semibold leading-[1.06] text-white sm:text-[1.95rem]">
            {t({
              en: "Connect your wallet to unlock profile completion and KYC",
              es: "Conecta tu wallet para desbloquear perfil y KYC",
              pt: "Conecte sua wallet para liberar perfil e KYC"
            })}
          </h2>
        </div>

        <button
          aria-label={t({ en: "Close modal", es: "Cerrar modal", pt: "Fechar modal" })}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 px-3 text-lg text-white/80 transition hover:bg-white/16"
          onClick={() => router.push("/profile")}
          type="button"
        >
          ×
        </button>
      </div>

          <div className="relative z-10 space-y-5 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
            <p className="text-sm leading-7 text-white/78 sm:text-[15px]">
              {t({
                en: "Your BRIDS account is already active. The next step is linking your Solana wallet from this same account so you can complete profile data and continue into regulated verification.",
                es: "Tu cuenta BRIDS ya esta activa. El siguiente paso es vincular tu wallet de Solana desde esta misma cuenta para completar tus datos y continuar con la verificacion regulada.",
                pt: "Sua conta BRIDS já está ativa. O próximo passo é vincular sua wallet Solana nesta mesma conta para completar seus dados e continuar para a verificação regulada."
              })}
            </p>

            <div className="marketplace-depth-card rounded-2xl p-4 sm:p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-white/55">
                {t({ en: "Current account", es: "Cuenta actual", pt: "Conta atual" })}
              </p>
              <p className="mt-2 break-all text-sm font-medium text-white sm:text-base">
                {email
                  ? email
                  : t({
                      en: "Federated account session",
                      es: "Sesion de cuenta federada",
                      pt: "Sessão de conta federada"
                    })}
              </p>
            </div>

            <div className="marketplace-depth-card rounded-2xl border-amber-400/18 bg-amber-400/8 p-4 sm:p-5">
              <p className="text-sm font-medium text-amber-100">
                {t({
                  en: "KYC stays blocked until a wallet is linked.",
                  es: "KYC sigue bloqueado hasta vincular una wallet.",
                  pt: "O KYC continua bloqueado até vincular uma wallet."
                })}
              </p>
              <p className="mt-2 text-sm leading-7 text-amber-50/78">
                {t({
                  en: "Once the wallet is connected, this same route will switch automatically to the full profile and compliance flow.",
                  es: "Una vez la wallet quede conectada, esta misma ruta cambiara automaticamente al flujo completo de perfil y compliance.",
                  pt: "Assim que a wallet estiver conectada, esta mesma rota mudará automaticamente para o fluxo completo de perfil e compliance."
                })}
              </p>
            </div>

            <PwaCapabilityCard audience="account-linking" />

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                className="min-h-11 flex-1 rounded-full"
                onClick={() => dispatchOpenWalletModal({ loginMethod: "wallet" })}
                type="button"
              >
                {t({ en: "Connect wallet now", es: "Conectar wallet ahora", pt: "Conectar wallet agora" })}
              </Button>
              <Button
                className="min-h-11 rounded-full border border-white/12 bg-white/[0.04] text-white/90 hover:bg-white/[0.1] sm:px-6"
                onClick={() => router.push("/profile")}
                type="button"
                variant="ghost"
              >
                {t({ en: "Back to overview", es: "Volver al resumen", pt: "Voltar ao resumo" })}
              </Button>
            </div>
        </div>
      </article>
  );
}
