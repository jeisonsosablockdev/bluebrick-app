"use client";

/**
 * features/shared/auth/application/use-wallet-disconnect.ts
 *
 * Hook de la capa Application para desconexión de wallet y logout de sesión.
 * Extraído de main-top-navigation-modal.tsx (líneas ~1036-1114).
 *
 * Responsabilidades:
 * - handleDisconnect: desconectar wallet adapter + llamar /api/auth/logout
 *   - Si hay sesión federada → redirige a /sign-out
 *   - Si es sesión wallet-only → limpia estado local, broadcast logout, refresca router
 * - handleStartFederatedLink: redirige a /api/auth/link/federated/start
 */

import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";

import { ANONYMOUS_AUTH_STATE, type AuthMeResponse } from "@/lib/auth-client";
import { broadcastAuthSync } from "@/lib/auth-sync";
import { getFriendlyWalletErrorMessage } from "@/features/navigation/application/nav-modal-utils";
import { POST_LOGOUT_PUBLIC_HREF, shouldRedirectToPublicAfterLogout } from "@/lib/navigation/private-routes";
import type { ActionPhase, Translate } from "@/features/navigation/domain/nav-modal-types";
import { useWalletSigningHelpers } from "@/features/shared/wallet/application/use-wallet-signing-helpers";
import { usePathname } from "next/navigation";

type UseWalletDisconnectParams = {
  authState: AuthMeResponse;
  hasFederatedSession: boolean;
  hasWalletSession: boolean;
  walletPublicKey: string | null;
  t: Translate;
  setPhase: (phase: ActionPhase) => void;
  setLastError: (error: string | null) => void;
  setIsOpen: (open: boolean) => void;
  setAuthState: (updater: (prev: AuthMeResponse) => AuthMeResponse) => void;
  setSuppressedWalletPublicKey: (key: string | null) => void;
  refreshAuthState: (options?: { silent?: boolean }) => Promise<void>;
};

type UseWalletDisconnectResult = {
  handleDisconnect: () => Promise<void>;
  handleStartFederatedLink: () => void;
};

export function useWalletDisconnect(params: UseWalletDisconnectParams): UseWalletDisconnectResult {
  const {
    hasFederatedSession,
    walletPublicKey,
    t,
    setPhase,
    setLastError,
    setAuthState,
    setSuppressedWalletPublicKey,
    refreshAuthState,
  } = params;

  const router = useRouter();
  const pathname = usePathname();
  const { connected, disconnect } = useWallet();
  const { resolveCurrentWalletPublicKey } = useWalletSigningHelpers();

  const isConnected = connected && Boolean(walletPublicKey);

  async function handleDisconnect(): Promise<void> {
    setPhase("disconnecting");
    setLastError(null);

    let disconnectError: string | null = null;
    let logoutError: string | null = null;
    let disconnectedPublicKey: string | null = null;

    try {
      try {
        const adapterPublicKey = resolveCurrentWalletPublicKey();

        if (isConnected || adapterPublicKey) {
          await disconnect();
          disconnectedPublicKey = adapterPublicKey;
        }
      } catch (error) {
        disconnectError = getFriendlyWalletErrorMessage(error, t);
      }

      try {
        const logoutResponse = await fetch("/api/auth/logout", { method: "POST" });

        if (!logoutResponse.ok) {
          logoutError = t({
            en: "Could not clear session.",
            es: "No se pudo cerrar la sesion.",
            pt: "Nao foi possivel encerrar a sessao.",
          });
        }
      } catch {
        logoutError = t({
          en: "Could not clear session.",
          es: "No se pudo cerrar la sesion.",
          pt: "Nao foi possivel encerrar a sessao.",
        });
      }

      if (disconnectError || logoutError) {
        setLastError(disconnectError ?? logoutError);
      } else if (hasFederatedSession && typeof window !== "undefined") {
        const returnTo = shouldRedirectToPublicAfterLogout(pathname)
          ? POST_LOGOUT_PUBLIC_HREF
          : pathname || POST_LOGOUT_PUBLIC_HREF;
        window.location.assign(`/sign-out?returnTo=${encodeURIComponent(returnTo)}`);
      } else {
        setSuppressedWalletPublicKey(disconnectedPublicKey);
        setAuthState((_previous) => ({
          ...ANONYMOUS_AUTH_STATE,
          federatedAvailable: _previous.federatedAvailable,
        }));
        broadcastAuthSync("logout", walletPublicKey);
        if (shouldRedirectToPublicAfterLogout(pathname)) {
          router.push(POST_LOGOUT_PUBLIC_HREF);
        } else {
          router.refresh();
        }
      }
    } finally {
      setPhase("idle");
    }
  }

  function handleStartFederatedLink(): void {
    if (typeof window === "undefined") {
      return;
    }
    window.location.assign("/api/auth/link/federated/start");
  }

  return {
    handleDisconnect,
    handleStartFederatedLink,
  };
}
