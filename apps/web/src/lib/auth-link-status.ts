import type { LocaleText } from "@/lib/i18n";

export const AUTH_LINK_STATUS_VALUES = [
  "federated_linked",
  "already_linked",
  "review_required",
  "link_expired",
  "wallet_required",
  "federated_required",
  "federated_unavailable"
] as const;

export type AuthLinkStatus = (typeof AUTH_LINK_STATUS_VALUES)[number];
export type AuthLinkStatusTone = "success" | "warning";

type Translate = (text: LocaleText) => string;

export function parseAuthLinkStatus(value: string | null | undefined): AuthLinkStatus | null {
  if (!value) {
    return null;
  }

  return AUTH_LINK_STATUS_VALUES.includes(value as AuthLinkStatus) ? (value as AuthLinkStatus) : null;
}

export function getAuthLinkStatusContent(
  status: AuthLinkStatus | null,
  t: Translate
): { message: string; tone: AuthLinkStatusTone } | null {
  switch (status) {
    case "federated_linked":
      return {
        tone: "success",
        message: t({
          en: "Email sign-in is now linked to this wallet-backed account.",
          es: "El ingreso por email ya quedo vinculado a esta cuenta respaldada por wallet.",
          pt: "O login por email agora esta vinculado a esta conta com wallet."
        })
      };
    case "already_linked":
      return {
        tone: "warning",
        message: t({
          en: "This wallet account already has an email sign-in linked.",
          es: "Esta cuenta wallet ya tiene un ingreso por email vinculado.",
          pt: "Esta conta com wallet ja possui login por email vinculado."
        })
      };
    case "review_required":
      return {
        tone: "warning",
        message: t({
          en: "This account needs manual review before it can be consolidated.",
          es: "Esta cuenta necesita revision manual antes de poder consolidarse.",
          pt: "Esta conta precisa de revisao manual antes de ser consolidada."
        })
      };
    case "link_expired":
      return {
        tone: "warning",
        message: t({
          en: "The linking session expired. Start the flow again from your wallet session.",
          es: "La sesion de vinculacion expiro. Inicia el flujo otra vez desde tu sesion wallet.",
          pt: "A sessao de vinculacao expirou. Inicie o fluxo novamente pela sessao da wallet."
        })
      };
    case "wallet_required":
      return {
        tone: "warning",
        message: t({
          en: "An active wallet session is required to link email sign-in.",
          es: "Se requiere una sesion wallet activa para vincular el ingreso por email.",
          pt: "Uma sessao wallet ativa e necessaria para vincular o login por email."
        })
      };
    case "federated_required":
      return {
        tone: "warning",
        message: t({
          en: "Complete the email sign-in flow to finish linking.",
          es: "Completa el ingreso por email para terminar la vinculacion.",
          pt: "Conclua o login por email para finalizar a vinculacao."
        })
      };
    case "federated_unavailable":
      return {
        tone: "warning",
        message: t({
          en: "Email sign-in is not available in this environment.",
          es: "El ingreso por email no esta disponible en este entorno.",
          pt: "O login por email nao esta disponivel neste ambiente."
        })
      };
    default:
      return null;
  }
}
