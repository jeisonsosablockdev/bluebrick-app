"use client";

/**
 * features/navigation/application/use-nav-modal-visibility.ts
 *
 * Hook de visibilidad y labels del modal de navegación.
 * Extraído de main-top-navigation-modal.tsx (L366-395, L397-458, L1155-1162).
 * Layer 2 — Application: derived boolean flags, labels y menuEntries.
 */

import { useMemo } from "react";

import { getAuthLinkStatusContent } from "@/lib/auth-link-status";
import type { AuthLinkStatus } from "@/lib/auth-link-status";
import type { AuthMeResponse } from "@/lib/auth-client";
import {
  getStatusText,
  getWalletIntentPrimaryLabel,
  truncatePublicKey
} from "@/features/navigation/application/nav-modal-utils";
import type { ActionPhase, NavEntry, Translate } from "@/features/navigation/domain/nav-modal-types";

export type UseNavModalVisibilityParams = {
  authState: AuthMeResponse;
  phase: ActionPhase;
  connected: boolean;
  walletPublicKey: string | null;
  connecting: boolean;
  disconnecting: boolean;
  hasWalletAuthIntent: boolean;
  suppressedWalletPublicKey: string | null;
  statusText: string | null;
  lastError: string | null;
  authLinkStatus: AuthLinkStatus | null;
  t: Translate;
};

export type UseNavModalVisibilityResult = {
  // session booleans
  hasWalletSession: boolean;
  hasFederatedSession: boolean;
  hasAccountSession: boolean;
  isFederatedLoginAvailable: boolean;
  hasWalletSessionAdapterMismatch: boolean;
  isConnected: boolean;
  isBusy: boolean;
  // render flags
  shouldShowAnonymousAuthEntry: boolean;
  shouldShowDirectAuthEntryActions: boolean;
  shouldShowWalletIntentCard: boolean;
  shouldShowWalletPrimaryAction: boolean;
  shouldShowDisconnectButton: boolean;
  shouldShowConnectedWalletPendingAuth: boolean;
  isWalletAuthInProgress: boolean;
  // labels
  menuEntries: NavEntry[];
  headerWalletCtaLabel: string;
  walletPrimaryLabel: string;
  walletConnectionStatusText: string | null;
  copyableWalletPublicKey: string | null;
  disconnectLabel: string;
  walletDisconnectActionLabel: string;
  accountStatusText: string;
  topFeedbackText: string | null;
  isTopFeedbackStatus: boolean;
  authLinkStatusContent: ReturnType<typeof getAuthLinkStatusContent>;
};

export function useNavModalVisibility(params: UseNavModalVisibilityParams): UseNavModalVisibilityResult {
  const {
    authState,
    phase,
    connected,
    walletPublicKey,
    connecting,
    disconnecting,
    hasWalletAuthIntent,
    statusText,
    lastError,
    authLinkStatus,
    t
  } = params;

  // --- Derived session booleans (L366-380) ---
  const isConnected = connected && Boolean(walletPublicKey);
  const isBusy = phase !== "idle" || connecting || disconnecting;

  const hasConnectedWalletAdapter = isConnected;
  const hasAuthenticatedWalletSession =
    authState.walletAuthenticated ?? Boolean(authState.authenticated && authState.pubkey);
  const hasAuthenticatedFederatedSession = Boolean(authState.federatedAuthenticated);
  const hasAuthenticatedAccountSession =
    authState.accountAuthenticated ?? (hasAuthenticatedWalletSession || hasAuthenticatedFederatedSession);

  const hasWalletSession = hasAuthenticatedWalletSession;
  const hasFederatedSession = hasAuthenticatedFederatedSession;
  const hasAccountSession = hasAuthenticatedAccountSession;
  const isFederatedLoginAvailable = Boolean(authState.federatedAvailable);

  const hasWalletSessionAdapterMismatch = Boolean(
    hasAuthenticatedWalletSession &&
      hasConnectedWalletAdapter &&
      authState.pubkey &&
      walletPublicKey &&
      authState.pubkey !== walletPublicKey
  );

  // --- Render flags (L381-395) ---
  const shouldShowAnonymousAuthEntry =
    isFederatedLoginAvailable && !hasAuthenticatedWalletSession && !hasAuthenticatedFederatedSession && !hasWalletAuthIntent;
  const shouldShowConnectedWalletPendingAuth =
    hasWalletAuthIntent && hasConnectedWalletAdapter && !hasAuthenticatedWalletSession;
  const shouldShowAuthenticatedWalletActions =
    hasAuthenticatedWalletSession && hasConnectedWalletAdapter && !hasWalletSessionAdapterMismatch;
  const shouldShowDirectAuthEntryActions = shouldShowAnonymousAuthEntry;
  const shouldShowDisconnectButton = hasAuthenticatedAccountSession || shouldShowConnectedWalletPendingAuth;
  const shouldShowWalletPrimaryAction =
    !shouldShowDirectAuthEntryActions &&
    !hasWalletSessionAdapterMismatch &&
    (shouldShowConnectedWalletPendingAuth || !shouldShowAuthenticatedWalletActions);
  const shouldShowWalletIntentCard =
    !shouldShowDirectAuthEntryActions &&
    (hasWalletAuthIntent || hasAuthenticatedWalletSession || hasAuthenticatedFederatedSession || !isFederatedLoginAvailable);
  const isWalletAuthInProgress = phase === "connecting" || phase === "signing" || phase === "verifying";

  // --- authLinkStatusContent (L392) ---
  const authLinkStatusContent = useMemo(
    () => getAuthLinkStatusContent(authLinkStatus, t),
    [authLinkStatus, t]
  );

  // --- menuEntries (L397-411) ---
  const menuEntries = useMemo<NavEntry[]>(() => {
    const entries: NavEntry[] = [{ href: "/marketplace", label: t({ en: "Marketplace", es: "Marketplace", pt: "Marketplace" }) }];

    if (!hasAccountSession) {
      return entries;
    }

    entries.push({ href: "/profile", label: t({ en: "Profile", es: "Perfil", pt: "Perfil" }) });

    if (hasWalletSession && authState.role === "admin") {
      entries.push({ href: "/admin", label: t({ en: "Dashboard", es: "Dashboard", pt: "Dashboard" }) });
    }

    return entries;
  }, [authState.role, hasAccountSession, hasWalletSession, t]);

  // --- Labels (L413-448) ---
  const headerWalletCtaLabel = hasWalletSession
    ? t({ en: "Wallet", es: "Wallet", pt: "Wallet" })
    : hasAccountSession
      ? t({ en: "Account", es: "Cuenta", pt: "Conta" })
      : t({ en: "Sign in", es: "Ingresar", pt: "Entrar" });

  const walletPrimaryLabel = useMemo(
    () =>
      getWalletIntentPrimaryLabel({
        phase,
        hasWalletSession,
        isConnected,
        t
      }),
    [hasWalletSession, isConnected, phase, t]
  );

  const walletConnectionStatusText =
    hasWalletSessionAdapterMismatch && walletPublicKey
      ? `${t({ en: "Connected wallet mismatch", es: "Wallet conectada no coincide", pt: "Carteira conectada nao corresponde" })}: ${truncatePublicKey(walletPublicKey)}`
      : hasAuthenticatedWalletSession && hasConnectedWalletAdapter && authState.pubkey
        ? `${t({ en: "Wallet session active", es: "Sesion wallet activa", pt: "Sessao wallet ativa" })}: ${truncatePublicKey(authState.pubkey)}`
        : shouldShowConnectedWalletPendingAuth
          ? `${t({ en: "Connected", es: "Conectada", pt: "Conectada" })}: ${truncatePublicKey(walletPublicKey ?? "")}`
          : null;

  const copyableWalletPublicKey = hasWalletSessionAdapterMismatch
    ? null
    : hasWalletSession && authState.pubkey
      ? authState.pubkey
      : walletPublicKey;

  const disconnectLabel =
    hasFederatedSession && !hasWalletSession && !isConnected
      ? t({ en: "Sign out", es: "Cerrar sesion", pt: "Sair" })
      : hasWalletSession || isConnected
        ? t({ en: "Sign out & disconnect wallet", es: "Cerrar sesion y desconectar wallet", pt: "Sair e desconectar carteira" })
        : t({ en: "Disconnect wallet", es: "Desconectar wallet", pt: "Desconectar carteira" });

  const walletDisconnectActionLabel =
    shouldShowConnectedWalletPendingAuth && !hasWalletSession
      ? t({ en: "Cancel and disconnect wallet", es: "Cancelar y desconectar wallet", pt: "Cancelar e desconectar carteira" })
      : disconnectLabel;

  // --- Account / feedback text (L1155-1162) ---
  const accountStatusText =
    hasWalletSession && authState.pubkey
      ? `${authState.role === "admin" ? t({ en: "Admin", es: "Admin", pt: "Admin" }) : t({ en: "User", es: "Usuario", pt: "Usuario" })}: ${truncatePublicKey(authState.pubkey)}`
      : hasFederatedSession
        ? `${t({ en: "Account", es: "Cuenta", pt: "Conta" })}: ${authState.email ?? t({ en: "Federated session", es: "Sesion federada", pt: "Sessao federada" })}`
        : t({ en: "Not signed in", es: "Sin sesion iniciada", pt: "Sem sessao iniciada" });

  const effectivePhase = phase !== "idle" ? phase : connecting ? "connecting" : disconnecting ? "disconnecting" : "idle";
  const computedStatusText = statusText ?? getStatusText(effectivePhase, t);
  const topFeedbackText = computedStatusText ?? authLinkStatusContent?.message ?? lastError;
  const isTopFeedbackStatus = Boolean(computedStatusText || authLinkStatusContent);

  return {
    hasWalletSession,
    hasFederatedSession,
    hasAccountSession,
    isFederatedLoginAvailable,
    hasWalletSessionAdapterMismatch,
    isConnected,
    isBusy,
    shouldShowAnonymousAuthEntry,
    shouldShowDirectAuthEntryActions,
    shouldShowWalletIntentCard,
    shouldShowWalletPrimaryAction,
    shouldShowDisconnectButton,
    shouldShowConnectedWalletPendingAuth,
    isWalletAuthInProgress,
    menuEntries,
    headerWalletCtaLabel,
    walletPrimaryLabel,
    walletConnectionStatusText,
    copyableWalletPublicKey,
    disconnectLabel,
    walletDisconnectActionLabel,
    accountStatusText,
    topFeedbackText,
    isTopFeedbackStatus,
    authLinkStatusContent
  };
}
