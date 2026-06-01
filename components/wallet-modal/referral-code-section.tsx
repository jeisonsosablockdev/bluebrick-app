"use client";

import { ReferralCodeField } from "@/components/wallet-modal/referral-code-field";
import type { LocaleText } from "@/lib/i18n";

type Translate = (text: LocaleText) => string;

type ReferralCodeSectionProps = {
  inputId: string;
  isVisible: boolean;
  t: Translate;
  value: string;
  onChange: (nextValue: string) => void;
  onToggle: () => void;
};

export function ReferralCodeSection({
  inputId,
  isVisible,
  t,
  value,
  onChange,
  onToggle
}: ReferralCodeSectionProps) {
  return (
    <ReferralCodeField
      inputId={inputId}
      value={value}
      isVisible={isVisible}
      onToggle={onToggle}
      onChange={onChange}
      toggleLabel={t({ en: "Enter your referral code (optional)", es: "Ingresa tu codigo de referido (opcional)", pt: "Digite seu codigo de indicacao (opcional)" })}
      inputPlaceholder={t({
        en: "Paste or edit your invite code",
        es: "Pega o edita tu codigo de invitacion",
        pt: "Cole ou edite seu codigo de convite"
      })}
      helpText={t({
        en: "If you arrived through a referral link, the code is prefilled and you can still adjust it before your first sign-in.",
        es: "Si llegaste por un link de referido, el codigo se precarga y aun puedes ajustarlo antes de tu primer inicio de sesion.",
        pt: "Se voce chegou por um link de referido, o codigo e preenchido automaticamente e ainda pode ser ajustado antes do primeiro login."
      })}
    />
  );
}
