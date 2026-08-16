"use client";

/**
 * features/shared/auth/application/use-wallet-sign-in.ts
 *
 * Hook de la capa Application para el flujo SIWS (Sign-In With Solana).
 * Extraído de main-top-navigation-modal.tsx.
 *
 * Responsabilidades:
 * - Orquestar la conexión del wallet adapter (Phantom)
 * - Ejecutar el protocolo SIWS (nonce → sign → verify)
 * - Manejar el caso de link de wallet a sesión federada existente
 * - Resolver la decisión post-auth: mostrar onboarding reward o navegar a /profile
 *
 * @spec BRI-154 § 4 Identity Linking
 * @spec BRI-154 § 7 Login Resolution Decision
 */

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { PhantomWalletName } from "@solana/wallet-adapter-phantom";

import {
  startSiws,
  persistReferralIntent,
  type AuthMeResponse,
} from "@/lib/auth-client";
import { broadcastAuthSync } from "@/lib/auth-sync";
import { clearStoredReferralHint } from "@/features/referral-marketing/application/client-state";
import { buildReferralAuthPayload } from "@/features/referral-marketing/application/client-state";
import { resolvePostAuthDecision, type PostAuthOnboardingReward } from "@/lib/post-auth-decision";
import { resolveWalletSigningPreparation } from "@/lib/wallet-signing-prep";
import { getFriendlyWalletErrorMessage } from "@/features/navigation/application/nav-modal-utils";
import { useWalletSigningHelpers } from "@/features/shared/wallet/application/use-wallet-signing-helpers";
import type {
  ActionPhase,
  ProtectedProfileResponse,
  Translate,
} from "@/features/navigation/domain/nav-modal-types";
import type { ReferralHintOrigin } from "@/features/referral-marketing/application/client-state";

type UseWalletSignInParams = {
  authState: AuthMeResponse;
  isPhantomInstalled: boolean;
  hasFederatedSession: boolean;
  hasWalletSession: boolean;
  hasWalletSessionAdapterMismatch: boolean;
  referralCode: string;
  referralOrigin: ReferralHintOrigin;
  currentLandingPath: string;
  isMobileUserAgent: boolean;
  isInPhantomApp: boolean;
  signInStatement: string;
  walletLinkStatement: string;
  t: Translate;
  setPhase: (phase: ActionPhase) => void;
  setLastError: (error: string | null) => void;
  setIsOpen: (open: boolean) => void;
  setPostAuthDecisionReward: (reward: PostAuthOnboardingReward | null) => void;
  setAuthState: (updater: (prev: AuthMeResponse) => AuthMeResponse) => void;
  setSuppressedWalletPublicKey: (key: string | null) => void;
  setHasWalletAuthIntent: (intent: boolean) => void;
  refreshAuthState: (options?: { silent?: boolean }) => Promise<void>;
};

export function useWalletSignIn(params: UseWalletSignInParams) {
  const router = useRouter();
  const { wallet, wallets, connected, select, connect } = useWallet();
  const { resolveCurrentWalletPublicKey, waitForWalletPublicKey, waitForSignMessage } = useWalletSigningHelpers();

  const {
    authState,
    isPhantomInstalled,
    hasFederatedSession,
    hasWalletSession,
    hasWalletSessionAdapterMismatch,
    referralCode,
    referralOrigin,
    currentLandingPath,
    isMobileUserAgent,
    isInPhantomApp,
    signInStatement,
    walletLinkStatement,
    t,
    setPhase,
    setLastError,
    setIsOpen,
    setPostAuthDecisionReward,
    setAuthState,
    setSuppressedWalletPublicKey,
    setHasWalletAuthIntent,
    refreshAuthState,
  } = params;

  const isConnected = connected && Boolean(resolveCurrentWalletPublicKey());
  const isBusy = false; // caller manages isBusy guard before calling

  const handleWalletPrimaryAction = useCallback(async (): Promise<void> => {
    let activePublicKey = resolveCurrentWalletPublicKey();
    const initialSigningPreparation = resolveWalletSigningPreparation({
      activePublicKey,
      authenticatedPublicKey: authState.pubkey,
      hasWalletSession,
      hasWalletSessionAdapterMismatch,
      isConnected,
    });

    if (initialSigningPreparation.status === "mismatch") {
      setLastError(t({
        en: "Connected wallet does not match the signed-in session. Sign out and reconnect the correct wallet.",
        es: "La wallet conectada no coincide con la sesion iniciada. Cierra sesion y reconecta la wallet correcta.",
        pt: "A carteira conectada nao corresponde a sessao iniciada. Saia e reconecte a carteira correta.",
      }));
      return;
    }

    if (initialSigningPreparation.status === "already_authenticated") {
      return;
    }

    setSuppressedWalletPublicKey(null);
    setLastError(null);

    try {
      if (!isPhantomInstalled) {
        throw new Error("Phantom wallet was not found in this browser.");
      }

      setHasWalletAuthIntent?.(true);
      if (initialSigningPreparation.status === "needs_connection") {
        setPhase("connecting");

        const selectedOrPhantomAdapter =
          wallet?.adapter.name === PhantomWalletName
            ? wallet.adapter
            : wallets.find((w) => w.adapter.name === PhantomWalletName)?.adapter;

        if (!selectedOrPhantomAdapter) {
          throw new Error("Phantom wallet was not found in this browser.");
        }

        if (!wallet || wallet.adapter.name !== PhantomWalletName) {
          select(PhantomWalletName);
          await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
        }

        if (wallet?.adapter.name === PhantomWalletName) {
          await connect();
        } else if ("connect" in selectedOrPhantomAdapter && typeof selectedOrPhantomAdapter.connect === "function") {
          await selectedOrPhantomAdapter.connect();
        } else {
          await connect();
        }

        activePublicKey = await waitForWalletPublicKey();
      }

      if (!activePublicKey) {
        throw new Error("Wallet connected but public key is unavailable.");
      }

      if (hasWalletSession) {
        const sessionSigningPreparation = resolveWalletSigningPreparation({
          activePublicKey,
          authenticatedPublicKey: authState.pubkey,
          hasWalletSession,
          hasWalletSessionAdapterMismatch: false,
          isConnected: true,
        });

        if (sessionSigningPreparation.status === "mismatch") {
          throw new Error(
            "Connected wallet does not match the signed-in session. Sign out and reconnect the correct wallet."
          );
        }

        setIsOpen(false);
        return;
      }

      const activeSignMessage = await waitForSignMessage();
      if (!activeSignMessage) {
        throw new Error("Current wallet does not support message signing.");
      }

      const { normalizedReferralCode, referralSource, referralMetadata } = buildReferralAuthPayload({
        referralCode,
        origin: referralOrigin,
        landingPath: currentLandingPath,
        isMobileWalletFlow: isMobileUserAgent || isInPhantomApp,
      });

      if (hasFederatedSession && normalizedReferralCode && referralSource) {
        await persistReferralIntent({
          referralCode: normalizedReferralCode,
          attributionSource: referralSource,
          metadata: referralMetadata,
        });
      }

      setPhase("signing");

      const verifiedResult = await startSiws({
        publicKey: activePublicKey,
        signMessage: activeSignMessage,
        statement: hasFederatedSession ? walletLinkStatement : signInStatement,
        noncePath: hasFederatedSession ? "/api/auth/link/wallet/nonce" : "/api/auth/nonce",
        verifyPath: hasFederatedSession ? "/api/auth/link/wallet/verify" : "/api/auth/verify",
        referralCode: normalizedReferralCode || undefined,
        attributionSource: referralSource,
        attributionMetadata: referralMetadata,
        onStatus: (status) => setPhase(status),
      });

      if (normalizedReferralCode && verifiedResult.referralBindingOutcome) {
        clearStoredReferralHint();
      }

      setAuthState((previous) => ({
        authenticated: true,
        accountAuthenticated: true,
        federatedAuthenticated: previous.federatedAuthenticated,
        walletAuthenticated: true,
        authMethod: previous.federatedAuthenticated ? "hybrid" : "wallet",
        accountId: previous.accountId ?? null,
        workosUserId: previous.workosUserId ?? null,
        email: previous.email ?? null,
        pubkey: verifiedResult.publicKey,
        role: "user",
      }));

      broadcastAuthSync("login", verifiedResult.publicKey);
      void refreshAuthState({ silent: true });
      router.refresh();

      // Post-auth decision: show onboarding reward or navigate to /profile
      try {
        const profileRes = await fetch("/api/protected/profile");
        let postAuthDecision = resolvePostAuthDecision({ status: "error" });

        if (profileRes.ok) {
          const profileData = (await profileRes.json()) as ProtectedProfileResponse;
          postAuthDecision = resolvePostAuthDecision({ status: "ok", profile: profileData.data });
        } else if (profileRes.status === 404) {
          postAuthDecision = resolvePostAuthDecision({ status: "not_found" });
        }

        if (postAuthDecision.kind === "show") {
          setPostAuthDecisionReward(postAuthDecision.reward);
          setIsOpen(false);
          return;
        }
      } catch {
        // Fail-open: profile completion is enforced server-side on protected routes.
      }

      // Always navigate to /profile — new users AND returning users with complete profiles.
      setIsOpen(false);
      setPostAuthDecisionReward(null);
      router.push("/profile");
    } catch (error) {
      setLastError(getFriendlyWalletErrorMessage(error, t));
    } finally {
      setPhase("idle");
    }
  }, [
    authState,
    connect,
    currentLandingPath,
    hasFederatedSession,
    hasWalletSession,
    hasWalletSessionAdapterMismatch,
    isConnected,
    isInPhantomApp,
    isMobileUserAgent,
    isPhantomInstalled,
    referralCode,
    referralOrigin,
    refreshAuthState,
    resolveCurrentWalletPublicKey,
    router,
    select,
    setAuthState,
    setHasWalletAuthIntent,
    setIsOpen,
    setLastError,
    setPhase,
    setPostAuthDecisionReward,
    setSuppressedWalletPublicKey,
    signInStatement,
    t,
    waitForSignMessage,
    waitForWalletPublicKey,
    wallet,
    walletLinkStatement,
    wallets,
  ]);

  const handleStartWalletSignIn = useCallback((): void => {
    if (isBusy) return;
    setHasWalletAuthIntent(true);
    void handleWalletPrimaryAction();
  }, [isBusy, handleWalletPrimaryAction, setHasWalletAuthIntent]);

  return {
    handleWalletPrimaryAction,
    handleStartWalletSignIn,
  };
}
