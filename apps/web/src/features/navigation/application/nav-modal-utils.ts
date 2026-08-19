/**
 * features/navigation/application/nav-modal-utils.ts
 *
 * Utilidades puras de la feature Navigation.
 * Sin efectos secundarios ni dependencias de React.
 * Extraídas de main-top-navigation-modal.tsx (Layer 3 → Layer 2 Application).
 */

import type { ActionPhase, Translate } from "@/features/navigation/domain/nav-modal-types";
import type { MessageSignerWalletAdapter } from "@solana/wallet-adapter-base";

export function truncatePublicKey(publicKey: string): string {
  return `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;
}

export function buildPathWithoutQueryParam(
  pathname: string,
  searchParams: URLSearchParams,
  paramName: string
): string {
  const nextParams = new URLSearchParams(searchParams.toString());
  nextParams.delete(paramName);
  const query = nextParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function buildPathWithQueryParam(
  pathname: string,
  searchParams: URLSearchParams,
  paramName: string,
  value: string
): string {
  const nextParams = new URLSearchParams(searchParams.toString());
  nextParams.set(paramName, value);
  const query = nextParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function getFriendlyWalletErrorMessage(error: unknown, t: Translate): string {
  if (!(error instanceof Error)) {
    return t({
      en: "Something went wrong. Please try again.",
      es: "Ocurrio un problema. Intentalo de nuevo.",
      pt: "Algo deu errado. Tente novamente."
    });
  }

  const message = error.message.toLowerCase();

  if (message.includes("rejected") || message.includes("cancelled") || message.includes("closed")) {
    return t({
      en: "Connection cancelled.",
      es: "Conexion cancelada.",
      pt: "Conexao cancelada."
    });
  }

  if (message.includes("wallet not found")) {
    return t({
      en: "Phantom wallet was not found in this browser.",
      es: "No se encontro Phantom en este navegador.",
      pt: "A carteira Phantom nao foi encontrada neste navegador."
    });
  }

  if (message.includes("public key is unavailable")) {
    return t({
      en: "Wallet connected but public key is unavailable.",
      es: "La wallet se conecto, pero no hay una clave publica disponible.",
      pt: "A carteira conectou, mas nao ha chave publica disponivel."
    });
  }

  if (message.includes("does not support message signing")) {
    return t({
      en: "Current wallet does not support message signing.",
      es: "La wallet actual no soporta firma de mensajes.",
      pt: "A carteira atual nao suporta assinatura de mensagens."
    });
  }

  if (message.includes("could not check current session")) {
    return t({
      en: "Could not check current session.",
      es: "No se pudo verificar la sesion actual.",
      pt: "Nao foi possivel verificar a sessao atual."
    });
  }

  if (message.includes("could not clear session")) {
    return t({
      en: "Could not clear session.",
      es: "No se pudo cerrar la sesion.",
      pt: "Nao foi possivel encerrar a sessao."
    });
  }

  if (message.includes("authentication failed")) {
    return t({
      en: "Authentication failed.",
      es: "La autenticacion fallo.",
      pt: "A autenticacao falhou."
    });
  }

  return error.message;
}

export function getStatusText(phase: ActionPhase, t: Translate): string | null {
  if (phase === "connecting") {
    return t({ en: "Connecting...", es: "Conectando...", pt: "Conectando..." });
  }
  if (phase === "signing") {
    return t({ en: "Signing...", es: "Firmando...", pt: "Assinando..." });
  }
  if (phase === "verifying") {
    return t({ en: "Verifying...", es: "Verificando...", pt: "Verificando..." });
  }
  if (phase === "disconnecting") {
    return t({ en: "Disconnecting...", es: "Desconectando...", pt: "Desconectando..." });
  }
  return null;
}

export function getWalletIntentPrimaryLabel(input: {
  phase: ActionPhase;
  hasWalletSession: boolean;
  isConnected: boolean;
  t: Translate;
}): string {
  if (input.phase === "connecting") {
    return input.t({ en: "Opening Phantom", es: "Abriendo Phantom", pt: "Abrindo Phantom" });
  }
  if (input.phase === "signing") {
    return input.t({ en: "Waiting for Phantom confirmation", es: "Esperando confirmacion en Phantom", pt: "Aguardando confirmacao no Phantom" });
  }
  if (input.phase === "verifying") {
    return input.t({ en: "Creating BRIDS session", es: "Creando sesion BRIDS", pt: "Criando sessao BRIDS" });
  }
  if (input.hasWalletSession && !input.isConnected) {
    return input.t({ en: "Reconnect Phantom", es: "Reconectar Phantom", pt: "Reconectar Phantom" });
  }
  if (input.isConnected) {
    return input.t({ en: "Request signature in Phantom", es: "Solicitar firma en Phantom", pt: "Solicitar assinatura no Phantom" });
  }
  return input.t({ en: "Connect Phantom", es: "Conectar Phantom", pt: "Conectar Phantom" });
}

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function adapterSupportsMessageSigning(adapter: unknown): adapter is MessageSignerWalletAdapter {
  return typeof (adapter as { signMessage?: unknown } | null)?.signMessage === "function";
}
