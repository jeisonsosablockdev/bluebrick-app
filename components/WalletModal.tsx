"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WalletReadyState, type MessageSignerWalletAdapter } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import { PhantomWalletName } from "@solana/wallet-adapter-phantom";
import { useReducedMotion } from "motion/react";

import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useI18n } from "@/components/i18n/locale-provider";
import { OnboardingRewardDecisionModal } from "@/components/onboarding/onboarding-reward-decision-modal";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { recordNavigationOriginFromClick } from "@/components/motion/navigation-origin";
import { AuthEntryActionCard } from "@/components/wallet-modal/auth-entry-action-card";
import { PHANTOM_INSTALL_URL } from "@/components/wallet-modal/constants";
import { ReferralCodeSection } from "@/components/wallet-modal/referral-code-section";
import { WalletModalShell } from "@/components/wallet-modal/wallet-modal-shell";
import { WalletProofPanel } from "@/components/wallet-modal/wallet-proof-panel";
import type { LocaleText } from "@/lib/i18n";
import { ANONYMOUS_AUTH_STATE, fetchAuthMe, persistReferralIntent, startSiws, type AuthMeResponse } from "@/lib/auth-client";
import {
  buildPhantomBrowseDeepLink,
  buildReferralAuthMetadata,
  buildStoredReferralHint,
  clearStoredReferralHint,
  deriveReferralAttributionSource,
  normalizeReferralCodeInput,
  readStoredReferralHint,
  type ReferralHintOrigin,
  writeStoredReferralHint
} from "@/lib/referrals/client-state";
import {
  AUTH_SYNC_STORAGE_KEY,
  broadcastAuthSync,
  createAuthSyncBroadcastChannel,
  parseAuthSyncPayload,
  parseAuthSyncPayloadFromUnknown
} from "@/lib/auth-sync";
import { getAuthLinkStatusContent, parseAuthLinkStatus } from "@/lib/auth-link-status";
import { getWalletModalAutoClose } from "@/lib/solana";
import {
  formatOnboardingRewardDeadlineLabel,
  type OnboardingRewardStatus
} from "@/lib/onboarding-reward-copy";
import {
  ONBOARDING_REWARD_COMPLETE_PROFILE_HREF,
  ONBOARDING_REWARD_EXPLORE_HREF
} from "@/lib/onboarding-reward-navigation";
import { WALLET_MODAL_OPEN_EVENT, type WalletModalOpenDetail } from "@/lib/auth-ui-events";
import { areAuthMeResponsesEquivalent } from "@/lib/auth-state";
import { shouldUseReducedMotion } from "@/lib/motion";
import { POST_LOGOUT_PUBLIC_HREF, shouldRedirectToPublicAfterLogout } from "@/lib/navigation/private-routes";
import { cn } from "@/lib/utils";

type WalletModalProps = {
  initialAuth?: AuthMeResponse;
};

const WALLET_MODAL_IDLE_TIMEOUT_MS = 30_000;
const MOBILE_MEDIA_QUERY = "(max-width: 639px)";
const MOBILE_USER_AGENT_PATTERN = /android|iphone|ipad|ipod|mobile/i;
const PHANTOM_USER_AGENT_PATTERN = /phantom/i;
const POST_AUTH_DECISION_QUERY_PARAM = "postAuthDecision";

type ActionPhase = "idle" | "connecting" | "signing" | "verifying" | "disconnecting";
type MessageSigner = (message: Uint8Array) => Promise<Uint8Array>;

type NavEntry = {
  href: string;
  label: string;
};

type Translate = (text: LocaleText) => string;

const PRIMARY_NAV_LINK_BASE_CLASSNAME =
  "inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full border px-4 text-sm font-medium transition";
const PRIMARY_NAV_LINK_STABLE_WIDTH_CLASSNAME = "sm:w-[6.75rem] sm:px-2.5 sm:justify-center";

function WalletCtaIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
      <path
        d="M3.75 7.5A2.25 2.25 0 0 1 6 5.25h10.5A2.25 2.25 0 0 1 18.75 7.5v1.125H6A2.25 2.25 0 0 0 3.75 10.875V7.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 8.625H6A2.25 2.25 0 0 0 3.75 10.875v5.625A2.25 2.25 0 0 0 6 18.75h12A2.25 2.25 0 0 0 20.25 16.5v-5.625A2.25 2.25 0 0 0 18 8.625Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.125 13.5h.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailMethodIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
      <path
        d="M4.5 6.75h15A1.5 1.5 0 0 1 21 8.25v7.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 15.75v-7.5a1.5 1.5 0 0 1 1.5-1.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m4.5 8.25 7.5 5.25 7.5-5.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type OnboardingRewardSnapshot = {
  status: OnboardingRewardStatus;
  rewardAmountUsdSnapshot: number;
  qualificationDeadlineAt: string;
  shouldShowReminder: boolean;
  isProfileComplete: boolean;
};

type ProtectedProfileResponse = {
  ok?: boolean;
  data?: {
    firstName: string | null;
    email: string | null;
    phone: string | null;
    onboardingReward?: OnboardingRewardSnapshot | null;
  };
};

function truncatePublicKey(publicKey: string): string {
  return `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;
}

function buildPathWithoutQueryParam(pathname: string, searchParams: URLSearchParams, paramName: string): string {
  const nextParams = new URLSearchParams(searchParams.toString());
  nextParams.delete(paramName);
  const query = nextParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function buildPathWithQueryParam(
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

function getFriendlyWalletErrorMessage(error: unknown, t: Translate): string {
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

function getStatusText(phase: ActionPhase, t: Translate): string | null {
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

function getWalletIntentPrimaryLabel(input: {
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

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function adapterSupportsMessageSigning(adapter: unknown): adapter is MessageSignerWalletAdapter {
  return typeof (adapter as { signMessage?: unknown } | null)?.signMessage === "function";
}

export function WalletModal({ initialAuth = ANONYMOUS_AUTH_STATE }: WalletModalProps) {
  const { locale, t } = useI18n();
  const { wallet, wallets, publicKey, connected, connecting, disconnecting, connect, disconnect, select, signMessage } = useWallet();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const shouldReduceMotion = shouldUseReducedMotion(prefersReducedMotion);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authState, setAuthState] = useState<AuthMeResponse>(initialAuth);
  const [phase, setPhase] = useState<ActionPhase>("idle");
  const [lastError, setLastError] = useState<string | null>(null);
  const [postAuthDecisionReward, setPostAuthDecisionReward] = useState<OnboardingRewardSnapshot | null>(null);
  const [referralCode, setReferralCode] = useState("");
  const [referralOrigin, setReferralOrigin] = useState<ReferralHintOrigin>("auto");
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const inactivityTimeoutRef = useRef<number | null>(null);
  const phantomFallbackTimerRef = useRef<number | null>(null);
  const wasConnectedRef = useRef(false);
  const authRefreshPromiseRef = useRef<Promise<void> | null>(null);
  const persistedReferralIntentSignatureRef = useRef<string | null>(null);
  const autoCloseOnConnect = useMemo(() => getWalletModalAutoClose(), []);
  const [isSmallViewport, setIsSmallViewport] = useState(false);
  const [isMobileUserAgent, setIsMobileUserAgent] = useState(false);
  const [isInPhantomApp, setIsInPhantomApp] = useState(false);
  const [showPhantomFallback, setShowPhantomFallback] = useState(false);
  const [isReferralFieldVisible, setIsReferralFieldVisible] = useState(false);
  const [hasWalletAuthIntent, setHasWalletAuthIntent] = useState(false);
  const [suppressedWalletPublicKey, setSuppressedWalletPublicKey] = useState<string | null>(null);
  const rawWalletPublicKey = publicKey?.toBase58() ?? null;
  const walletPublicKey = rawWalletPublicKey && rawWalletPublicKey !== suppressedWalletPublicKey ? rawWalletPublicKey : null;
  const phantomWallet = useMemo(() => wallets.find((item) => item.adapter.name === PhantomWalletName), [wallets]);
  const isPhantomInstalled = phantomWallet?.readyState === WalletReadyState.Installed;
  const isConnected = connected && Boolean(walletPublicKey);
  const isBusy = phase !== "idle" || connecting || disconnecting;
  const statusText = getStatusText(phase, t)
    ?? (
      connecting
        ? t({ en: "Connecting...", es: "Conectando...", pt: "Conectando..." })
        : disconnecting
          ? t({ en: "Disconnecting...", es: "Desconectando...", pt: "Desconectando..." })
          : null
    );
  const queryReferralCode = useMemo(() => {
    const raw = searchParams.get("ref");
    return raw ? normalizeReferralCodeInput(raw) : "";
  }, [searchParams]);
  const shouldPromptPostAuthDecision = searchParams.get(POST_AUTH_DECISION_QUERY_PARAM) === "1";
  const authLinkStatus = parseAuthLinkStatus(searchParams.get("authLinkStatus"));
  const cleanCurrentLandingPath = useMemo(
    () => {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete(POST_AUTH_DECISION_QUERY_PARAM);
      nextParams.delete("authLinkStatus");
      const query = nextParams.toString();
      return query ? `${pathname}?${query}` : pathname;
    },
    [pathname, searchParams]
  );
  const currentLandingPath = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);
  const federatedSignInReturnTo = useMemo(
    () => buildPathWithQueryParam(pathname, new URLSearchParams(searchParams.toString()), POST_AUTH_DECISION_QUERY_PARAM, "1"),
    [pathname, searchParams]
  );
  const hasConnectedWalletAdapter = isConnected;
  const hasAuthenticatedWalletSession = authState.walletAuthenticated ?? Boolean(authState.authenticated && authState.pubkey);
  const hasAuthenticatedFederatedSession = Boolean(authState.federatedAuthenticated);
  const hasAuthenticatedAccountSession = authState.accountAuthenticated ?? (hasAuthenticatedWalletSession || hasAuthenticatedFederatedSession);
  const hasWalletSession = hasAuthenticatedWalletSession;
  const hasFederatedSession = hasAuthenticatedFederatedSession;
  const hasAccountSession = hasAuthenticatedAccountSession;
  const isFederatedLoginAvailable = Boolean(authState.federatedAvailable);
  const hasWalletSessionAdapterMismatch = Boolean(
    hasAuthenticatedWalletSession
    && hasConnectedWalletAdapter
    && authState.pubkey
    && walletPublicKey
    && authState.pubkey !== walletPublicKey
  );
  const shouldShowAnonymousAuthEntry = isFederatedLoginAvailable
    && !hasAuthenticatedWalletSession
    && !hasAuthenticatedFederatedSession
    && !hasWalletAuthIntent;
  const shouldShowConnectedWalletPendingAuth = hasWalletAuthIntent && hasConnectedWalletAdapter && !hasAuthenticatedWalletSession;
  const shouldShowAuthenticatedWalletActions = hasAuthenticatedWalletSession && hasConnectedWalletAdapter && !hasWalletSessionAdapterMismatch;
  const shouldShowDirectAuthEntryActions = shouldShowAnonymousAuthEntry;
  const shouldShowDisconnectButton = hasAuthenticatedAccountSession || shouldShowConnectedWalletPendingAuth;
  const shouldShowWalletPrimaryAction = !shouldShowDirectAuthEntryActions
    && !hasWalletSessionAdapterMismatch
    && (shouldShowConnectedWalletPendingAuth || !shouldShowAuthenticatedWalletActions);
  const authLinkStatusContent = useMemo(() => getAuthLinkStatusContent(authLinkStatus, t), [authLinkStatus, t]);
  const shouldShowWalletIntentCard = !shouldShowDirectAuthEntryActions
    && (hasWalletAuthIntent || hasAuthenticatedWalletSession || hasAuthenticatedFederatedSession || !isFederatedLoginAvailable);
  const isWalletAuthInProgress = phase === "connecting" || phase === "signing" || phase === "verifying";

  const menuEntries = useMemo<NavEntry[]>(() => {
    const entries: NavEntry[] = [{ href: "/marketplace", label: t({ en: "Marketplace", es: "Marketplace", pt: "Marketplace" }) }];

    if (!hasAccountSession) {
      return entries;
    }

    entries.push({ href: "/protected", label: t({ en: "Profile", es: "Perfil", pt: "Perfil" }) });

    if (hasWalletSession && authState.role === "admin") {
      entries.push({ href: "/admin", label: t({ en: "Dashboard", es: "Dashboard", pt: "Dashboard" }) });
    }

    return entries;
  }, [authState.role, hasAccountSession, hasWalletSession, t]);

  const headerWalletCtaLabel = hasWalletSession
    ? t({ en: "Wallet", es: "Wallet", pt: "Wallet" })
    : hasAccountSession
      ? t({ en: "Account", es: "Cuenta", pt: "Conta" })
      : t({ en: "Sign in", es: "Ingresar", pt: "Entrar" });

  const walletPrimaryLabel = useMemo(() => {
    return getWalletIntentPrimaryLabel({
      phase,
      hasWalletSession,
      isConnected,
      t
    });
  }, [hasWalletSession, isConnected, phase, t]);

  const walletConnectionStatusText = hasWalletSessionAdapterMismatch && walletPublicKey
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

  const disconnectLabel = hasFederatedSession && !hasWalletSession && !isConnected
    ? t({ en: "Sign out", es: "Cerrar sesion", pt: "Sair" })
    : hasWalletSession || isConnected
      ? t({ en: "Sign out & disconnect wallet", es: "Cerrar sesion y desconectar wallet", pt: "Sair e desconectar carteira" })
      : t({ en: "Disconnect wallet", es: "Desconectar wallet", pt: "Desconectar carteira" });
  const walletDisconnectActionLabel = shouldShowConnectedWalletPendingAuth && !hasWalletSession
    ? t({ en: "Cancel and disconnect wallet", es: "Cancelar y desconectar wallet", pt: "Cancelar e desconectar carteira" })
    : disconnectLabel;

  const signInStatement = t({
    en: "Sign this message to authenticate with the app.",
    es: "Firma este mensaje para autenticarte en la app.",
    pt: "Assine esta mensagem para se autenticar no app."
  });
  const walletLinkStatement = t({
    en: "Sign this message to link your wallet to this BRIDS account.",
    es: "Firma este mensaje para vincular tu wallet a esta cuenta BRIDS.",
    pt: "Assine esta mensagem para vincular sua carteira a esta conta BRIDS."
  });
  const handleStartMailSignIn = useCallback((): void => {
    if (typeof window === "undefined" || isBusy) {
      return;
    }

    window.location.assign(`/sign-in?returnTo=${encodeURIComponent(federatedSignInReturnTo)}`);
  }, [federatedSignInReturnTo, isBusy]);

  const resolveCurrentWalletPublicKey = useCallback((): string | null => {
    return (
      publicKey?.toBase58()
      ?? wallet?.adapter.publicKey?.toBase58()
      ?? wallets.find((item) => item.adapter.name === PhantomWalletName)?.adapter.publicKey?.toBase58()
      ?? null
    );
  }, [publicKey, wallet, wallets]);

  const waitForWalletPublicKey = useCallback(async (): Promise<string | null> => {
    const immediatePublicKey = resolveCurrentWalletPublicKey();
    if (immediatePublicKey) {
      return immediatePublicKey;
    }

    const maxAttempts = 20;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      await new Promise<void>((resolve) => window.setTimeout(resolve, 50));
      const nextPublicKey = resolveCurrentWalletPublicKey();
      if (nextPublicKey) {
        return nextPublicKey;
      }
    }

    return null;
  }, [resolveCurrentWalletPublicKey]);

  const resolveCurrentSignMessage = useCallback((): MessageSigner | null => {
    if (signMessage) {
      return signMessage;
    }

    if (wallet && adapterSupportsMessageSigning(wallet.adapter)) {
      return wallet.adapter.signMessage.bind(wallet.adapter);
    }

    const phantomAdapter = wallets.find((item) => item.adapter.name === PhantomWalletName)?.adapter;
    if (phantomAdapter && adapterSupportsMessageSigning(phantomAdapter)) {
      return phantomAdapter.signMessage.bind(phantomAdapter);
    }

    return null;
  }, [signMessage, wallet, wallets]);

  const waitForSignMessage = useCallback(async (): Promise<MessageSigner | null> => {
    const immediateSignMessage = resolveCurrentSignMessage();
    if (immediateSignMessage) {
      return immediateSignMessage;
    }

    const maxAttempts = 20;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      await new Promise<void>((resolve) => window.setTimeout(resolve, 50));
      const nextSignMessage = resolveCurrentSignMessage();
      if (nextSignMessage) {
        return nextSignMessage;
      }
    }

    return null;
  }, [resolveCurrentSignMessage]);

  const refreshAuthState = useCallback(async (options?: { silent?: boolean }): Promise<void> => {
    if (authRefreshPromiseRef.current) {
      return authRefreshPromiseRef.current;
    }

    const silent = Boolean(options?.silent);
    const refreshPromise = (async () => {
      try {
        const currentAuth = await fetchAuthMe();
        setAuthState((previous) => areAuthMeResponsesEquivalent(previous, currentAuth) ? previous : currentAuth);

        if (!silent) {
          setLastError(null);
        }
      } catch (error) {
        if (!silent) {
          setLastError(getFriendlyWalletErrorMessage(error, t));
        }
      }
    })();

    authRefreshPromiseRef.current = refreshPromise.finally(() => {
      authRefreshPromiseRef.current = null;
    });

    return authRefreshPromiseRef.current;
  }, [t]);

  useEffect(() => {
    setAuthState(initialAuth);
  }, [initialAuth]);

  useEffect(() => {
    if (queryReferralCode) {
      const hint = buildStoredReferralHint({
        referralCode: queryReferralCode,
        origin: "auto",
        landingPath: cleanCurrentLandingPath
      });

      if (hint) {
        writeStoredReferralHint(hint);
        setReferralCode(hint.referralCode);
        setReferralOrigin("auto");
      }

      return;
    }

    const storedHint = readStoredReferralHint();
    if (!storedHint) {
      return;
    }

    setReferralCode(storedHint.referralCode);
    setReferralOrigin(storedHint.origin);
  }, [cleanCurrentLandingPath, queryReferralCode]);

  useEffect(() => {
    if (referralCode) {
      setIsReferralFieldVisible(true);
    }
  }, [referralCode]);

  useEffect(() => {
    if (!authState.federatedAuthenticated || authState.walletAuthenticated || !authState.accountId) {
      return;
    }

    const storedHint = readStoredReferralHint();
    if (!storedHint) {
      return;
    }

    const normalizedReferralCode = normalizeReferralCodeInput(storedHint.referralCode);
    if (!normalizedReferralCode) {
      clearStoredReferralHint();
      return;
    }

    const attributionSource = deriveReferralAttributionSource({
      origin: storedHint.origin,
      isMobileWalletFlow: false
    });
    const signature = [
      authState.accountId,
      normalizedReferralCode,
      storedHint.capturedAt,
      storedHint.origin,
      storedHint.landingPath ?? ""
    ].join(":");

    if (persistedReferralIntentSignatureRef.current === signature) {
      return;
    }

    persistedReferralIntentSignatureRef.current = signature;

    void persistReferralIntent({
      referralCode: normalizedReferralCode,
      attributionSource,
      capturedAt: storedHint.capturedAt,
      metadata: buildReferralAuthMetadata({
        landingPath: storedHint.landingPath,
        origin: storedHint.origin,
        source: attributionSource
      })
    })
      .then(() => {
        clearStoredReferralHint();
      })
      .catch(() => {
        persistedReferralIntentSignatureRef.current = null;
      });
  }, [authState.accountId, authState.federatedAuthenticated, authState.walletAuthenticated]);

  useEffect(() => {
    if (!shouldPromptPostAuthDecision || !hasFederatedSession || hasWalletSession || postAuthDecisionReward) {
      return;
    }

    let cancelled = false;

    const fallbackReward: OnboardingRewardSnapshot = {
      status: "pending_profile",
      rewardAmountUsdSnapshot: 10,
      qualificationDeadlineAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      shouldShowReminder: true,
      isProfileComplete: false
    };

    const openDecisionModal = async (): Promise<void> => {
      try {
        const profileRes = await fetch("/api/protected/profile");
        if (cancelled) {
          return;
        }

        if (profileRes.ok) {
          const profileData = (await profileRes.json()) as ProtectedProfileResponse;
          setPostAuthDecisionReward(profileData.data?.onboardingReward ?? fallbackReward);
        } else {
          setPostAuthDecisionReward(fallbackReward);
        }
      } catch {
        if (!cancelled) {
          setPostAuthDecisionReward(fallbackReward);
        }
      } finally {
        if (!cancelled && typeof window !== "undefined") {
          window.history.replaceState(null, "", cleanCurrentLandingPath);
        }
      }
    };

    void openDecisionModal();

    return () => {
      cancelled = true;
    };
  }, [
    cleanCurrentLandingPath,
    hasFederatedSession,
    hasWalletSession,
    postAuthDecisionReward,
    shouldPromptPostAuthDecision
  ]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus({ preventScroll: true });
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleExternalOpen = (event: Event): void => {
      const customEvent = event as CustomEvent<WalletModalOpenDetail>;
      const nextLoginMethod = customEvent.detail?.loginMethod;

      if (nextLoginMethod === "mail") {
        handleStartMailSignIn();
        return;
      }

      setIsOpen(true);
      setHasWalletAuthIntent(nextLoginMethod === "wallet");
      setLastError(null);
    };

    window.addEventListener(WALLET_MODAL_OPEN_EVENT, handleExternalOpen as EventListener);

    return () => {
      window.removeEventListener(WALLET_MODAL_OPEN_EVENT, handleExternalOpen as EventListener);
    };
  }, [handleStartMailSignIn]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const resetInactivityTimeout = (): void => {
      if (inactivityTimeoutRef.current !== null) {
        window.clearTimeout(inactivityTimeoutRef.current);
      }

      inactivityTimeoutRef.current = window.setTimeout(() => {
        setIsOpen(false);
      }, WALLET_MODAL_IDLE_TIMEOUT_MS);
    };

    const handleInteraction = (): void => {
      resetInactivityTimeout();
    };

    const interactionEvents = ["pointerdown", "keydown", "touchstart", "wheel"] as const;
    interactionEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleInteraction);
    });
    resetInactivityTimeout();

    return () => {
      if (inactivityTimeoutRef.current !== null) {
        window.clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }

      interactionEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleInteraction);
      });
    };
  }, [isOpen]);

  useEffect(() => {
    if (!wallet) {
      select(PhantomWalletName);
    }
  }, [wallet, select]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    void refreshAuthState();
  }, [isOpen, refreshAuthState]);

  useEffect(() => {
    void refreshAuthState({ silent: true });
  }, [refreshAuthState]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const handleFocus = (): void => {
      void refreshAuthState({ silent: true });
    };

    const handleVisibilityChange = (): void => {
      if (!document.hidden) {
        void refreshAuthState({ silent: true });
      }
    };

    const handleStorage = (event: StorageEvent): void => {
      if (event.key !== AUTH_SYNC_STORAGE_KEY) {
        return;
      }

      if (!parseAuthSyncPayload(event.newValue)) {
        return;
      }

      void refreshAuthState({ silent: true });
    };

    const channel = createAuthSyncBroadcastChannel();
    const handleChannelMessage = (event: MessageEvent<unknown>): void => {
      if (!parseAuthSyncPayloadFromUnknown(event.data)) {
        return;
      }

      void refreshAuthState({ silent: true });
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("storage", handleStorage);
    channel?.addEventListener("message", handleChannelMessage);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("storage", handleStorage);
      if (channel) {
        channel.removeEventListener("message", handleChannelMessage);
        channel.close();
      }
    };
  }, [refreshAuthState]);

  useEffect(() => {
    const hasConnectedNow = connected && Boolean(walletPublicKey);
    const hasTransitionedToConnected = !wasConnectedRef.current && hasConnectedNow;
    wasConnectedRef.current = hasConnectedNow;

    if (hasTransitionedToConnected && autoCloseOnConnect && isOpen) {
      const timeout = window.setTimeout(() => setIsOpen(false), 450);
      return () => window.clearTimeout(timeout);
    }

    return undefined;
  }, [autoCloseOnConnect, connected, isOpen, walletPublicKey]);

  async function handleWalletPrimaryAction(): Promise<void> {
    if (hasWalletSessionAdapterMismatch) {
      setLastError(t({
        en: "Connected wallet does not match the signed-in session. Sign out and reconnect the correct wallet.",
        es: "La wallet conectada no coincide con la sesion iniciada. Cierra sesion y reconecta la wallet correcta.",
        pt: "A carteira conectada nao corresponde a sessao iniciada. Saia e reconecte a carteira correta."
      }));
      return;
    }

    if (hasWalletSession && isConnected) {
      return;
    }

    setSuppressedWalletPublicKey(null);
    setLastError(null);

    try {
      if (!isPhantomInstalled) {
        throw new Error("Phantom wallet was not found in this browser.");
      }

      let activePublicKey = resolveCurrentWalletPublicKey();
      const needsWalletAdapterConnection = !activePublicKey || (hasWalletSession && !isConnected);

      if (needsWalletAdapterConnection) {
        setPhase("connecting");

        if (!wallet || wallet.adapter.name !== PhantomWalletName) {
          select(PhantomWalletName);
          await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
        }

        await connect();
        activePublicKey = await waitForWalletPublicKey();
      }

      if (!activePublicKey) {
        throw new Error("Wallet connected but public key is unavailable.");
      }

      if (hasWalletSession) {
        if (authState.pubkey && activePublicKey !== authState.pubkey) {
          throw new Error("Connected wallet does not match the signed-in session. Sign out and reconnect the correct wallet.");
        }

        setIsOpen(false);
        return;
      }

      const activeSignMessage = await waitForSignMessage();
      if (!activeSignMessage) {
        throw new Error("Current wallet does not support message signing.");
      }

      const normalizedReferralCode = normalizeReferralCodeInput(referralCode);
      const referralSource =
        normalizedReferralCode
          ? deriveReferralAttributionSource({
              origin: referralOrigin,
              isMobileWalletFlow: isMobileUserAgent || isInPhantomApp
            })
          : undefined;
      const referralMetadata =
        normalizedReferralCode && referralSource
          ? buildReferralAuthMetadata({
              landingPath: currentLandingPath,
              origin: referralOrigin,
              source: referralSource
            })
          : undefined;

      if (hasFederatedSession && normalizedReferralCode && referralSource) {
        await persistReferralIntent({
          referralCode: normalizedReferralCode,
          attributionSource: referralSource,
          metadata: referralMetadata
        });
      }

      const verifiedResult = await startSiws({
        publicKey: activePublicKey,
        signMessage: activeSignMessage,
        statement: hasFederatedSession ? walletLinkStatement : signInStatement,
        noncePath: hasFederatedSession ? "/api/auth/link/wallet/nonce" : "/api/auth/nonce",
        verifyPath: hasFederatedSession ? "/api/auth/link/wallet/verify" : "/api/auth/verify",
        referralCode: normalizedReferralCode || undefined,
        attributionSource: referralSource,
        attributionMetadata: referralMetadata,
        onStatus: (status) => setPhase(status)
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
        role: "user"
      }));
      broadcastAuthSync("login", verifiedResult.publicKey);
      void refreshAuthState({ silent: true });
      router.refresh();

      try {
        const profileRes = await fetch("/api/protected/profile");
        if (profileRes.ok) {
          const profileData = (await profileRes.json()) as ProtectedProfileResponse;
          const onboardingReward = profileData.data?.onboardingReward ?? null;
          const shouldShowDecision =
            Boolean(onboardingReward?.shouldShowReminder)
            || onboardingReward?.isProfileComplete === false
            || Boolean(
              !profileData.data?.firstName ||
              !profileData.data?.email ||
              !profileData.data?.phone
            );

          if (shouldShowDecision) {
            setPostAuthDecisionReward(onboardingReward);
            setIsOpen(false);
            return;
          }
        } else if (profileRes.status === 404) {
          setPostAuthDecisionReward({
            status: "pending_profile",
            rewardAmountUsdSnapshot: 10,
            qualificationDeadlineAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            shouldShowReminder: true,
            isProfileComplete: false
          });
          setIsOpen(false);
          return;
        }
      } catch {
        // Fail-open here: profile completion is checked server-side on protected routes.
      }

      if (verifiedResult.isNewUser) {
        setIsOpen(false);
        setPostAuthDecisionReward(null);
        router.push("/protected");
      }
    } catch (error) {
      setLastError(getFriendlyWalletErrorMessage(error, t));
    } finally {
      setPhase("idle");
    }
  }

  function handleStartWalletSignIn(): void {
    if (isBusy) {
      return;
    }

    setHasWalletAuthIntent(true);
    void handleWalletPrimaryAction();
  }

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
            pt: "Nao foi possivel encerrar a sessao."
          });
        }
      } catch {
        logoutError = t({
          en: "Could not clear session.",
          es: "No se pudo cerrar la sesion.",
          pt: "Nao foi possivel encerrar a sessao."
        });
      }

      if (disconnectError || logoutError) {
        setLastError(disconnectError ?? logoutError);
      } else if (hasFederatedSession && typeof window !== "undefined") {
        const returnTo = shouldRedirectToPublicAfterLogout(pathname)
          ? POST_LOGOUT_PUBLIC_HREF
          : currentLandingPath || POST_LOGOUT_PUBLIC_HREF;
        window.location.assign(`/sign-out?returnTo=${encodeURIComponent(returnTo)}`);
      } else {
        setSuppressedWalletPublicKey(disconnectedPublicKey);
        setHasWalletAuthIntent(false);
        setAuthState((previous) => ({
          authenticated: false,
          accountAuthenticated: false,
          federatedAuthenticated: false,
          walletAuthenticated: false,
          authMethod: "anonymous",
          accountId: null,
          workosUserId: null,
          email: null,
          pubkey: null,
          federatedAvailable: previous.federatedAvailable
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

  function handleReferralCodeChange(nextValue: string): void {
    const normalizedReferralCode = normalizeReferralCodeInput(nextValue);
    setReferralCode(normalizedReferralCode);
    setReferralOrigin("manual");

    if (!normalizedReferralCode) {
      clearStoredReferralHint();
      return;
    }

    const hint = buildStoredReferralHint({
      referralCode: normalizedReferralCode,
      origin: "manual",
      landingPath: cleanCurrentLandingPath
    });

    if (hint) {
      writeStoredReferralHint(hint);
    }
  }

  function handleExploreAfterAuth(): void {
    setPostAuthDecisionReward(null);
    router.push(ONBOARDING_REWARD_EXPLORE_HREF);
  }

  function handleCompleteProfileAfterAuth(): void {
    setPostAuthDecisionReward(null);
    router.push(ONBOARDING_REWARD_COMPLETE_PROFILE_HREF);
  }

  async function copyAddress(): Promise<void> {
    if (!copyableWalletPublicKey) {
      return;
    }

    await navigator.clipboard.writeText(copyableWalletPublicKey);
  }

  const accountStatusText = hasWalletSession && authState.pubkey
    ? `${authState.role === "admin" ? t({ en: "Admin", es: "Admin", pt: "Admin" }) : t({ en: "User", es: "Usuario", pt: "Usuario" })}: ${truncatePublicKey(authState.pubkey)}`
    : hasFederatedSession
      ? `${t({ en: "Account", es: "Cuenta", pt: "Conta" })}: ${authState.email ?? t({ en: "Federated session", es: "Sesion federada", pt: "Sessao federada" })}`
      : t({ en: "Not signed in", es: "Sin sesion iniciada", pt: "Sem sessao iniciada" });
  const topFeedbackText = statusText ?? authLinkStatusContent?.message ?? lastError;
  const isTopFeedbackStatus = Boolean(statusText || authLinkStatusContent);
  const shouldShowPhantomOpenPill = isSmallViewport && isMobileUserAgent && !isInPhantomApp;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateMobileSignals = (): void => {
      const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
      const userAgent = window.navigator.userAgent ?? "";
      const phantomWindow = window as Window & {
        phantom?: { solana?: { isPhantom?: boolean } };
      };
      const providerSaysPhantom = Boolean(phantomWindow.phantom?.solana?.isPhantom);

      setIsSmallViewport(mediaQuery.matches);
      setIsMobileUserAgent(MOBILE_USER_AGENT_PATTERN.test(userAgent));
      setIsInPhantomApp(providerSaysPhantom || PHANTOM_USER_AGENT_PATTERN.test(userAgent));
    };

    updateMobileSignals();
    window.addEventListener("resize", updateMobileSignals);

    return () => {
      window.removeEventListener("resize", updateMobileSignals);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (phantomFallbackTimerRef.current !== null) {
        window.clearTimeout(phantomFallbackTimerRef.current);
        phantomFallbackTimerRef.current = null;
      }
    };
  }, []);

  function handleOpenInPhantom(): void {
    if (!shouldShowPhantomOpenPill || typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    setShowPhantomFallback(false);

    if (phantomFallbackTimerRef.current !== null) {
      window.clearTimeout(phantomFallbackTimerRef.current);
      phantomFallbackTimerRef.current = null;
    }

    const deeplink = buildPhantomBrowseDeepLink(window.location.href);
    let phantomOpened = false;

    const onVisibilityChange = (): void => {
      if (document.hidden) {
        phantomOpened = true;
        document.removeEventListener("visibilitychange", onVisibilityChange);

        if (phantomFallbackTimerRef.current !== null) {
          window.clearTimeout(phantomFallbackTimerRef.current);
          phantomFallbackTimerRef.current = null;
        }
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    phantomFallbackTimerRef.current = window.setTimeout(() => {
      document.removeEventListener("visibilitychange", onVisibilityChange);

      if (!phantomOpened && !document.hidden) {
        setShowPhantomFallback(true);
      }

      phantomFallbackTimerRef.current = null;
    }, 1800);

    window.location.assign(deeplink);
  }

  return (
    <>
      <header className="sticky top-3 z-40 mb-5">
        <div className="glass-surface px-3 py-3 md:px-4">
          <div className="pointer-events-none absolute -left-8 top-0 h-24 w-24 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-8 bottom-0 h-24 w-24 rounded-full bg-fuchsia-300/20 blur-3xl" />

          <div className="relative z-10 flex items-center gap-2">
            <Link
              href="/"
              className="brand-pill inline-flex min-h-11 shrink-0 items-center rounded-full border border-white/15 bg-white/5 px-3 transition hover:bg-white/10"
              aria-label={t({ en: "Back to home", es: "Volver al inicio", pt: "Voltar para inicio" })}
            >
              <Image
                src="/brand/brids-mark.svg"
                alt="BRIDS mark"
                width={24}
                height={24}
                className="sm:hidden"
                style={{ height: "24px", width: "auto" }}
                priority
              />
              <Image src="/brand/brids-logo.svg" alt="BRIDS" width={124} height={41} className="hidden h-7 w-auto sm:block" priority />
            </Link>

            <nav className="hidden min-w-0 flex-1 sm:block" aria-label="Primary">
              <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
                {menuEntries.map((entry) => {
                  const active = isActivePath(pathname, entry.href);

                  return (
                    <Link
                      key={entry.href}
                      href={entry.href}
                      onClick={(event) => recordNavigationOriginFromClick(event, entry.href)}
                      className={cn(
                        PRIMARY_NAV_LINK_BASE_CLASSNAME,
                        PRIMARY_NAV_LINK_STABLE_WIDTH_CLASSNAME,
                        active
                          ? "border-cyan-300/45 bg-gradientPrimary text-white shadow-[0_10px_30px_rgba(59,130,246,0.25)]"
                          : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
                      )}
                    >
                      {entry.label}
                    </Link>
                  );
                })}
              </div>
            </nav>

            <button
              type="button"
              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20 sm:hidden"
              onClick={() => setIsMobileMenuOpen((previous) => !previous)}
              aria-label={
                isMobileMenuOpen
                  ? t({ en: "Close navigation menu", es: "Cerrar menu de navegacion", pt: "Fechar menu de navegacao" })
                  : t({ en: "Open navigation menu", es: "Abrir menu de navegacion", pt: "Abrir menu de navegacao" })
              }
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? "×" : "☰"}
            </button>

            <div className="hidden shrink-0 sm:block">
              <ThemeToggle />
            </div>

            <div className="hidden shrink-0 sm:block">
              <LanguageSwitcher />
            </div>

            <div className="group relative shrink-0">
              <Button
                data-testid="wallet-modal-open-button"
                onClick={() => {
                  setHasWalletAuthIntent(false);
                  setIsOpen(true);
                }}
                className="min-h-11 px-4"
              >
                <span className="inline-flex items-center gap-2">
                  <WalletCtaIcon />
                  <span>{headerWalletCtaLabel}</span>
                </span>
              </Button>
              {hasAccountSession ? (
                <div
                  className="pointer-events-none absolute right-0 top-full z-20 mt-2 w-max max-w-[22rem] rounded-xl border border-white/20 bg-slate-950/90 px-3 py-2 text-xs text-white/80 opacity-0 shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition group-hover:opacity-100 group-focus-within:opacity-100"
                  role="status"
                >
                  {accountStatusText}
                </div>
              ) : null}
            </div>
          </div>

          {isMobileMenuOpen ? (
            <nav className="relative z-10 mt-3 flex flex-wrap items-center gap-2 sm:hidden" aria-label="Mobile navigation">
              <div className="w-full">
                <ThemeToggle />
              </div>
              <div className="w-full">
                <LanguageSwitcher />
              </div>
              {menuEntries.map((entry) => {
                const active = isActivePath(pathname, entry.href);

                return (
                  <Link
                    key={`mobile-${entry.href}`}
                    href={entry.href}
                    onClick={(event) => recordNavigationOriginFromClick(event, entry.href)}
                    className={cn(
                      PRIMARY_NAV_LINK_BASE_CLASSNAME,
                      PRIMARY_NAV_LINK_STABLE_WIDTH_CLASSNAME,
                      active
                        ? "border-cyan-300/45 bg-gradientPrimary text-white shadow-[0_10px_30px_rgba(59,130,246,0.25)]"
                        : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
                    )}
                  >
                    {entry.label}
                  </Link>
                );
              })}
            </nav>
          ) : null}

          {shouldShowPhantomOpenPill ? (
            <div className="relative z-10 mt-3 sm:hidden">
              <button
                type="button"
                onClick={handleOpenInPhantom}
                className="quick-tour-pill inline-flex min-h-11 w-full items-center justify-center px-4 text-sm font-medium"
              >
                {t({
                  en: "Do you use Phantom? Open in app.",
                  es: "¿Usas Phantom? Abrir en la app.",
                  pt: "Usa Phantom? Abrir no app."
                })}
              </button>
            </div>
          ) : null}

          {showPhantomFallback && shouldShowPhantomOpenPill ? (
            <div className="relative z-10 mt-2 rounded-2xl border border-amber-300/30 bg-amber-500/10 p-3 text-sm text-amber-100 sm:hidden">
              <p>
                {t({
                  en: "Could not open Phantom automatically.",
                  es: "No se pudo abrir Phantom automaticamente.",
                  pt: "Nao foi possivel abrir o Phantom automaticamente."
                })}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <a
                  href={PHANTOM_INSTALL_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-amber-200/50 px-4 font-medium text-amber-50 transition hover:bg-amber-200/10"
                >
                  {t({ en: "Install Phantom", es: "Instalar Phantom", pt: "Instalar Phantom" })}
                </a>
                <button
                  type="button"
                  onClick={() => setShowPhantomFallback(false)}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 px-4 font-medium text-white/90 transition hover:bg-white/10"
                >
                  {t({ en: "Close", es: "Cerrar", pt: "Fechar" })}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </header>

      <WalletModalShell
        isOpen={isOpen}
        closeButtonRef={closeButtonRef}
        closeLabel={t({ en: "Close wallet modal", es: "Cerrar modal de wallet", pt: "Fechar modal da wallet" })}
        feedback={topFeedbackText && !(isTopFeedbackStatus && shouldShowWalletIntentCard)
          ? { text: topFeedbackText, isStatus: isTopFeedbackStatus }
          : null}
        shouldReduceMotion={shouldReduceMotion}
        title={t({ en: "Access your account", es: "Accede a tu cuenta", pt: "Acesse sua conta" })}
        onClose={() => setIsOpen(false)}
      >
        {shouldShowDirectAuthEntryActions ? (
          <>
            <AuthEntryActionCard
              title={t({ en: "Access your BRIDS account", es: "Ingresa a tu cuenta BRIDS", pt: "Entre na sua conta BRIDS" })}
              mailLabel={t({ en: "Mail", es: "Mail", pt: "Mail" })}
              walletLabel={t({ en: "Wallet", es: "Wallet", pt: "Wallet" })}
              mailIcon={<MailMethodIcon />}
              walletIcon={<WalletCtaIcon />}
              onMailClick={handleStartMailSignIn}
              onWalletClick={handleStartWalletSignIn}
              disabled={isBusy}
            />
            <ReferralCodeSection
              inputId="wallet-referral-code"
              isVisible={isReferralFieldVisible}
              t={t}
              value={referralCode}
              onChange={handleReferralCodeChange}
              onToggle={() => setIsReferralFieldVisible((previous) => !previous)}
            />
          </>
        ) : null}

        {shouldShowWalletIntentCard ? (
          <WalletProofPanel
            t={t}
            session={{
              phase,
              hasWalletSession,
              hasWalletSessionAdapterMismatch,
              hasFederatedSession,
              hasWalletAuthIntent,
              isWalletAuthInProgress
            }}
            connection={{
              isConnected,
              isBusy,
              isFederatedLoginAvailable,
              isPhantomInstalled,
              walletConnectionStatusText,
              walletPublicKey: copyableWalletPublicKey
            }}
            referral={{
              code: referralCode,
              isVisible: isReferralFieldVisible,
              onChange: handleReferralCodeChange,
              onToggle: () => setIsReferralFieldVisible((previous) => !previous)
            }}
            actions={{
              primaryLabel: walletPrimaryLabel,
              disconnectLabel: walletDisconnectActionLabel,
              shouldShowWalletPrimaryAction,
              shouldShowDisconnectButton,
              onCopyAddress: copyAddress,
              onDisconnect: handleDisconnect,
              onStartFederatedLink: handleStartFederatedLink,
              onStartWalletSignIn: handleStartWalletSignIn
            }}
          />
        ) : null}
      </WalletModalShell>

      <OnboardingRewardDecisionModal
        open={Boolean(postAuthDecisionReward)}
        qualificationDeadlineLabel={formatOnboardingRewardDeadlineLabel(postAuthDecisionReward?.qualificationDeadlineAt ?? null, locale)}
        rewardAmountUsd={postAuthDecisionReward?.rewardAmountUsdSnapshot ?? 10}
        walletConnected={hasWalletSession}
        onClose={handleExploreAfterAuth}
        onExplore={handleExploreAfterAuth}
        onCompleteProfile={handleCompleteProfileAfterAuth}
      />
    </>
  );
}
