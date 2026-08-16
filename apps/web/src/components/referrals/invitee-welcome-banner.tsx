"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactElement } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { normalizeReferralCodeInput } from "@/features/referral-marketing/application/client-state";

type ReferralPreviewResponse = {
  ok?: boolean;
  data?: {
    code: string;
    referrerWalletDisplay: string;
  };
};

export function InviteeWelcomeBanner(): ReactElement | null {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const [referrerWalletDisplay, setReferrerWalletDisplay] = useState<string | null>(null);
  const referralCode = useMemo(() => {
    const raw = searchParams.get("ref");
    return raw ? normalizeReferralCodeInput(raw) : "";
  }, [searchParams]);

  useEffect(() => {
    if (!referralCode) {
      return;
    }

    let cancelled = false;

    void fetch(`/api/referrals/preview?code=${encodeURIComponent(referralCode)}`, {
      method: "GET",
      cache: "no-store"
    })
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }

        const payload = (await response.json()) as ReferralPreviewResponse;
        return payload.data?.referrerWalletDisplay ?? null;
      })
      .then((display) => {
        if (!cancelled) {
          setReferrerWalletDisplay(display);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReferrerWalletDisplay(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [referralCode]);

  if (!referralCode) {
    return null;
  }

  return (
    <Card className="mb-5 border-cyan-300/25 bg-cyan-400/10">
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">
        {t({ en: "Referral welcome", es: "Bienvenida de referido", pt: "Boas-vindas de referido" })}
      </p>
      <p className="mt-2 text-sm text-white/85">
        {referrerWalletDisplay
          ? t({
              en: `You were invited by ${referrerWalletDisplay}. Connect your wallet to begin.`,
              es: `Has sido invitado por ${referrerWalletDisplay}. Conecta tu wallet para comenzar.`,
              pt: `Voce foi convidado por ${referrerWalletDisplay}. Conecte sua wallet para comecar.`
            })
          : t({
              en: "A referral link was detected. Connect your wallet to continue the onboarding flow.",
              es: "Se detecto un link de referido. Conecta tu wallet para continuar el onboarding.",
              pt: "Um link de referido foi detectado. Conecte sua wallet para continuar o onboarding."
            })}
      </p>
    </Card>
  );
}
