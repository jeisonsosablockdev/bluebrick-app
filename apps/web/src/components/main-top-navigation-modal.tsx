"use client";

/**
 * components/main-top-navigation-modal.tsx
 * Layer 1 — Presentation: slim orchestrator (~90 LOC).
 *
 * Refactored from a 1500-line monolith. All business logic lives in feature hooks:
 *  - features/shared/auth/application/use-auth-sync
 *  - features/shared/auth/application/use-wallet-sign-in
 *  - features/shared/auth/application/use-wallet-disconnect
 *  - features/shared/auth/application/use-post-auth-decision
 *  - features/navigation/application/use-nav-modal-visibility
 *  - features/navigation/application/use-mobile-wallet-detection
 *  - features/referral-marketing/application/use-referral-capture
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import { PhantomWalletName } from "@solana/wallet-adapter-phantom";
import { useReducedMotion } from "motion/react";

import { useI18n } from "@/components/i18n/locale-provider";
import { OnboardingRewardDecisionModal } from "@/components/onboarding/onboarding-reward-decision-modal";
import { AuthEntryActionCard } from "@/components/wallet-modal/auth-entry-action-card";
import { ReferralCodeSection } from "@/components/wallet-modal/referral-code-section";
import { WalletModalShell } from "@/components/wallet-modal/wallet-modal-shell";
import { WalletProofPanel } from "@/components/wallet-modal/wallet-proof-panel";

import { ANONYMOUS_AUTH_STATE, type AuthMeResponse } from "@/lib/auth-client";
import { normalizeReferralCodeInput } from "@/features/referral-marketing/application/client-state";
import { parseAuthLinkStatus } from "@/lib/auth-link-status";
import { getWalletModalAutoClose } from "@/lib/infrastructure/solana";
import { formatOnboardingRewardDeadlineLabel } from "@/lib/onboarding-reward-copy";
import { WALLET_MODAL_OPEN_EVENT, type WalletModalOpenDetail } from "@/lib/auth-ui-events";
import { shouldUseReducedMotion } from "@/lib/motion";
import { POST_LOGOUT_PUBLIC_HREF, shouldRedirectToPublicAfterLogout } from "@/lib/navigation/private-routes";

import { useAuthSync } from "@/features/shared/auth/application/use-auth-sync";
import { useWalletSignIn } from "@/features/shared/auth/application/use-wallet-sign-in";
import { useWalletDisconnect } from "@/features/shared/auth/application/use-wallet-disconnect";
import { usePostAuthDecision } from "@/features/shared/auth/application/use-post-auth-decision";
import { useNavModalVisibility } from "@/features/navigation/application/use-nav-modal-visibility";
import { useMobileWalletDetection } from "@/features/navigation/application/use-mobile-wallet-detection";
import { useReferralCapture } from "@/features/referral-marketing/application/use-referral-capture";
import { TopNavHeader } from "@/features/navigation/presentation/top-nav-header";
import { MailMethodIcon, WalletCtaIcon } from "@/features/navigation/presentation/nav-modal-icons";
import { buildPathWithQueryParam } from "@/features/navigation/application/nav-modal-utils";
import { WALLET_MODAL_IDLE_TIMEOUT_MS, POST_AUTH_DECISION_QUERY_PARAM } from "@/features/navigation/domain/nav-modal-constants";

type WalletModalProps = {
  initialAuth?: AuthMeResponse;
};

export function MainTopNavigationModal({ initialAuth = ANONYMOUS_AUTH_STATE }: WalletModalProps) {
  const { locale, t } = useI18n();
  const { wallet, wallets, publicKey, connected, connecting, disconnecting } = useWallet();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const shouldReduceMotion = shouldUseReducedMotion(prefersReducedMotion);

  // --- Modal open/close state ---
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [phase, setPhase] = useState<"idle" | "connecting" | "signing" | "verifying" | "disconnecting">("idle");
  const [hasWalletAuthIntent, setHasWalletAuthIntent] = useState(false);
  const [suppressedWalletPublicKey, setSuppressedWalletPublicKey] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const inactivityTimeoutRef = useRef<number | null>(null);
  const wasConnectedRef = useRef(false);

  const rawWalletPublicKey = publicKey?.toBase58() ?? null;
  const walletPublicKey = rawWalletPublicKey && rawWalletPublicKey !== suppressedWalletPublicKey ? rawWalletPublicKey : null;
  const phantomWallet = useMemo(() => wallets.find((w) => w.adapter.name === PhantomWalletName), [wallets]);
  const isPhantomInstalled = phantomWallet?.readyState === WalletReadyState.Installed;
  const autoCloseOnConnect = useMemo(() => getWalletModalAutoClose(), []);

  // --- Derived URL state ---
  const queryReferralCode = useMemo(() => {
    const raw = searchParams.get("ref");
    return raw ? normalizeReferralCodeInput(raw) : "";
  }, [searchParams]);
  const shouldPromptPostAuthDecision = searchParams.get(POST_AUTH_DECISION_QUERY_PARAM) === "1";
  const authLinkStatus = parseAuthLinkStatus(searchParams.get("authLinkStatus"));
  const cleanCurrentLandingPath = useMemo(() => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete(POST_AUTH_DECISION_QUERY_PARAM);
    nextParams.delete("authLinkStatus");
    const query = nextParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);
  const currentLandingPath = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);
  const federatedSignInReturnTo = useMemo(
    () => buildPathWithQueryParam(pathname, new URLSearchParams(searchParams.toString()), POST_AUTH_DECISION_QUERY_PARAM, "1"),
    [pathname, searchParams]
  );

  // --- Feature hooks ---
  const { authState, setAuthState, refreshAuthState, lastError, setLastError } = useAuthSync({
    initialAuth,
    isOpen,
    t,
  });

  const { referralCode, referralOrigin, isReferralFieldVisible, setIsReferralFieldVisible, handleReferralCodeChange } =
    useReferralCapture({ authState, queryReferralCode, cleanCurrentLandingPath });

  const [postAuthDecisionReward, setPostAuthDecisionReward] = useState<import("@/lib/post-auth-decision").PostAuthOnboardingReward | null>(null);

  const { handleExploreAfterAuth, handleCompleteProfileAfterAuth } = usePostAuthDecision({
    shouldPromptPostAuthDecision,
    hasFederatedSession: authState.federatedAuthenticated ?? false,
    hasWalletSession: authState.walletAuthenticated ?? false,
    postAuthDecisionReward,
    cleanCurrentLandingPath,
    setPostAuthDecisionReward,
  });

  const visibility = useNavModalVisibility({
    authState,
    phase,
    connected,
    walletPublicKey,
    connecting,
    disconnecting,
    hasWalletAuthIntent,
    suppressedWalletPublicKey,
    statusText: null,
    lastError,
    authLinkStatus,
    t,
  });

  const { isSmallViewport, isMobileUserAgent, isInPhantomApp, showPhantomFallback, setShowPhantomFallback, shouldShowPhantomOpenPill, handleOpenInPhantom } =
    useMobileWalletDetection();

  const signInStatement = t({
    en: "Sign this message to authenticate with the app.",
    es: "Firma este mensaje para autenticarte en la app.",
    pt: "Assine esta mensagem para se autenticar no app.",
  });
  const walletLinkStatement = t({
    en: "Sign this message to link your wallet to this BRIDS account.",
    es: "Firma este mensaje para vincular tu wallet a esta cuenta BRIDS.",
    pt: "Assine esta mensagem para vincular sua carteira a esta conta BRIDS.",
  });

  const [postAuthReward, setPostAuthReward] = useState<typeof postAuthDecisionReward>(null);

  const { handleWalletPrimaryAction, handleStartWalletSignIn } = useWalletSignIn({
    authState,
    isPhantomInstalled: isPhantomInstalled ?? false,
    hasFederatedSession: visibility.hasFederatedSession,
    hasWalletSession: visibility.hasWalletSession,
    hasWalletSessionAdapterMismatch: visibility.hasWalletSessionAdapterMismatch,
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
    setPostAuthDecisionReward: setPostAuthReward,
    setAuthState,
    setSuppressedWalletPublicKey,
    setHasWalletAuthIntent,
    refreshAuthState,
  });

  const { handleDisconnect, handleStartFederatedLink } = useWalletDisconnect({
    authState,
    hasFederatedSession: visibility.hasFederatedSession,
    hasWalletSession: visibility.hasWalletSession,
    walletPublicKey,
    t,
    setPhase,
    setLastError,
    setIsOpen,
    setAuthState,
    setSuppressedWalletPublicKey,
    refreshAuthState,
  });

  // --- Modal open/close effects ---
  const handleStartMailSignIn = useCallback((): void => {
    if (typeof window === "undefined" || visibility.isBusy) return;
    window.location.assign(`/sign-in?returnTo=${encodeURIComponent(federatedSignInReturnTo)}`);
  }, [federatedSignInReturnTo, visibility.isBusy]);

  useEffect(() => { setIsMobileMenuOpen(false); }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setIsOpen(false); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus({ preventScroll: true });
    window.addEventListener("keydown", handleEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", handleEscape); };
  }, [isOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleExternalOpen = (event: Event) => {
      const customEvent = event as CustomEvent<WalletModalOpenDetail>;
      const nextLoginMethod = customEvent.detail?.loginMethod;
      if (nextLoginMethod === "mail") { handleStartMailSignIn(); return; }
      setIsOpen(true);
      setHasWalletAuthIntent(nextLoginMethod === "wallet");
      setLastError(null);
    };
    window.addEventListener(WALLET_MODAL_OPEN_EVENT, handleExternalOpen as EventListener);
    return () => window.removeEventListener(WALLET_MODAL_OPEN_EVENT, handleExternalOpen as EventListener);
  }, [handleStartMailSignIn, setLastError]);

  useEffect(() => {
    if (!isOpen) return;
    const resetTimeout = () => {
      if (inactivityTimeoutRef.current !== null) window.clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = window.setTimeout(() => setIsOpen(false), WALLET_MODAL_IDLE_TIMEOUT_MS);
    };
    const events = ["pointerdown", "keydown", "touchstart", "wheel"] as const;
    events.forEach((e) => window.addEventListener(e, resetTimeout));
    resetTimeout();
    return () => {
      if (inactivityTimeoutRef.current !== null) { window.clearTimeout(inactivityTimeoutRef.current); inactivityTimeoutRef.current = null; }
      events.forEach((e) => window.removeEventListener(e, resetTimeout));
    };
  }, [isOpen]);

  useEffect(() => {
    const hasConnectedNow = connected && Boolean(walletPublicKey);
    const transitioned = !wasConnectedRef.current && hasConnectedNow;
    wasConnectedRef.current = hasConnectedNow;
    if (transitioned && autoCloseOnConnect && isOpen) {
      const t = window.setTimeout(() => setIsOpen(false), 450);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [autoCloseOnConnect, connected, isOpen, walletPublicKey]);

  async function copyAddress(): Promise<void> {
    if (!visibility.copyableWalletPublicKey) return;
    await navigator.clipboard.writeText(visibility.copyableWalletPublicKey);
  }

  const activeReward = postAuthReward ?? postAuthDecisionReward;

  return (
    <>
      <TopNavHeader
        pathname={pathname}
        t={t}
        menuEntries={visibility.menuEntries}
        headerWalletCtaLabel={visibility.headerWalletCtaLabel}
        accountStatusText={visibility.accountStatusText}
        hasAccountSession={visibility.hasAccountSession}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        onOpenWalletModal={() => { setHasWalletAuthIntent(false); setIsOpen(true); }}
        shouldShowPhantomOpenPill={shouldShowPhantomOpenPill}
        showPhantomFallback={showPhantomFallback}
        onOpenInPhantom={handleOpenInPhantom}
        onClosePhantomFallback={() => setShowPhantomFallback(false)}
      />

      <WalletModalShell
        isOpen={isOpen}
        closeButtonRef={closeButtonRef}
        closeLabel={t({ en: "Close wallet modal", es: "Cerrar modal de wallet", pt: "Fechar modal da wallet" })}
        feedback={visibility.topFeedbackText && !(visibility.isTopFeedbackStatus && visibility.shouldShowWalletIntentCard)
          ? { text: visibility.topFeedbackText, isStatus: visibility.isTopFeedbackStatus }
          : null}
        shouldReduceMotion={shouldReduceMotion}
        title={t({ en: "Access your account", es: "Accede a tu cuenta", pt: "Acesse sua conta" })}
        onClose={() => setIsOpen(false)}
      >
        {visibility.shouldShowDirectAuthEntryActions ? (
          <>
            <AuthEntryActionCard
              title={t({ en: "Access your BRIDS account", es: "Ingresa a tu cuenta BRIDS", pt: "Entre na sua conta BRIDS" })}
              mailLabel={t({ en: "Mail", es: "Mail", pt: "Mail" })}
              walletLabel={t({ en: "Wallet", es: "Wallet", pt: "Wallet" })}
              mailIcon={<MailMethodIcon />}
              walletIcon={<WalletCtaIcon />}
              onMailClick={handleStartMailSignIn}
              onWalletClick={handleStartWalletSignIn}
              disabled={visibility.isBusy}
            />
            <ReferralCodeSection
              inputId="wallet-referral-code"
              isVisible={isReferralFieldVisible}
              t={t}
              value={referralCode}
              onChange={handleReferralCodeChange}
              onToggle={() => setIsReferralFieldVisible((prev) => !prev)}
            />
          </>
        ) : null}

        {visibility.shouldShowWalletIntentCard ? (
          <WalletProofPanel
            t={t}
            session={{
              phase,
              hasWalletSession: visibility.hasWalletSession,
              hasWalletSessionAdapterMismatch: visibility.hasWalletSessionAdapterMismatch,
              hasFederatedSession: visibility.hasFederatedSession,
              hasWalletAuthIntent,
              isWalletAuthInProgress: visibility.isWalletAuthInProgress,
            }}
            connection={{
              isConnected: visibility.isConnected,
              isBusy: visibility.isBusy,
              isFederatedLoginAvailable: visibility.isFederatedLoginAvailable,
              isPhantomInstalled: isPhantomInstalled ?? false,
              walletConnectionStatusText: visibility.walletConnectionStatusText,
              walletPublicKey: visibility.copyableWalletPublicKey,
            }}
            referral={{
              code: referralCode,
              isVisible: isReferralFieldVisible,
              onChange: handleReferralCodeChange,
              onToggle: () => setIsReferralFieldVisible((prev) => !prev),
            }}
            actions={{
              primaryLabel: visibility.walletPrimaryLabel,
              disconnectLabel: visibility.walletDisconnectActionLabel,
              shouldShowWalletPrimaryAction: visibility.shouldShowWalletPrimaryAction,
              shouldShowDisconnectButton: visibility.shouldShowDisconnectButton,
              onCopyAddress: copyAddress,
              onDisconnect: handleDisconnect,
              onStartFederatedLink: handleStartFederatedLink,
              onStartWalletSignIn: handleStartWalletSignIn,
            }}
          />
        ) : null}
      </WalletModalShell>

      <OnboardingRewardDecisionModal
        open={Boolean(activeReward)}
        qualificationDeadlineLabel={formatOnboardingRewardDeadlineLabel(activeReward?.qualificationDeadlineAt ?? null, locale)}
        rewardAmountUsd={activeReward?.rewardAmountUsdSnapshot ?? 10}
        walletConnected={visibility.hasWalletSession}
        onClose={handleExploreAfterAuth}
        onExplore={handleExploreAfterAuth}
        onCompleteProfile={handleCompleteProfileAfterAuth}
      />
    </>
  );
}
