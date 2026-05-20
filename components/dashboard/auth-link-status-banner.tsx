"use client";

import type { ReactElement } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import { Card } from "@/components/ui/card";

type AuthLinkStatusBannerProps = {
  status: string | null;
};

export function AuthLinkStatusBanner({ status }: AuthLinkStatusBannerProps): ReactElement | null {
  const { t } = useI18n();

  if (!status) {
    return null;
  }

  if (status === "federated_linked") {
    return (
      <Card className="border-cyan-300/25 bg-cyan-400/10 text-cyan-100">
        {t({
          en: "Email sign-in is now linked to this wallet-backed account.",
          es: "El ingreso por email ya quedo vinculado a esta cuenta respaldada por wallet.",
          pt: "O login por email agora esta vinculado a esta conta com wallet."
        })}
      </Card>
    );
  }

  const message =
    status === "review_required"
      ? t({
          en: "This account needs manual review before it can be consolidated.",
          es: "Esta cuenta necesita revision manual antes de poder consolidarse.",
          pt: "Esta conta precisa de revisao manual antes de ser consolidada."
        })
      : status === "link_expired"
        ? t({
            en: "The linking session expired. Start the flow again from your wallet session.",
            es: "La sesion de vinculacion expiro. Inicia el flujo otra vez desde tu sesion wallet.",
            pt: "A sessao de vinculacao expirou. Inicie o fluxo novamente pela sessao da wallet."
          })
        : status === "wallet_required"
          ? t({
              en: "An active wallet session is required to link email sign-in.",
              es: "Se requiere una sesion wallet activa para vincular el ingreso por email.",
              pt: "Uma sessao wallet ativa e necessaria para vincular o login por email."
            })
          : status === "already_linked"
            ? t({
                en: "This wallet account already has an email sign-in linked.",
                es: "Esta cuenta wallet ya tiene un ingreso por email vinculado.",
                pt: "Esta conta com wallet ja possui login por email vinculado."
              })
            : status === "federated_unavailable"
              ? t({
                  en: "Email sign-in is not available in this environment.",
                  es: "El ingreso por email no esta disponible en este entorno.",
                  pt: "O login por email nao esta disponivel neste ambiente."
                })
              : status === "federated_required"
                ? t({
                    en: "Complete the email sign-in flow to finish linking.",
                    es: "Completa el ingreso por email para terminar la vinculacion.",
                    pt: "Conclua o login por email para finalizar a vinculacao."
                  })
                : null;

  if (!message) {
    return null;
  }

  return <Card className="border-amber-300/25 bg-amber-400/10 text-amber-100">{message}</Card>;
}
