"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WalletReadyState, type MessageSignerWalletAdapter } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import { PhantomWalletName } from "@solana/wallet-adapter-phantom";

import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useI18n } from "@/components/i18n/locale-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import type { LocaleText } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { fetchAuthMe, startSiws, type AuthMeResponse } from "@/lib/auth-client";
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
import { getWalletModalAutoClose } from "@/lib/solana";

type WalletModalProps = {
  initialAuth: AuthMeResponse;
};

const WALLET_MODAL_IDLE_TIMEOUT_MS = 30_000;
const PHANTOM_INSTALL_URL = "https://phantom.app/download";
const MOBILE_MEDIA_QUERY = "(max-width: 639px)";
const MOBILE_USER_AGENT_PATTERN = /android|iphone|ipad|ipod|mobile/i;
const PHANTOM_USER_AGENT_PATTERN = /phantom/i;

type ActionPhase = "idle" | "connecting" | "signing" | "verifying" | "disconnecting";
type MessageSigner = (message: Uint8Array) => Promise<Uint8Array>;

type NavEntry = {
  href: string;
  label: string;
};

type Translate = (text: LocaleText) => string;

function truncatePublicKey(publicKey: string): string {
  return `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;
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

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function adapterSupportsMessageSigning(adapter: unknown): adapter is MessageSignerWalletAdapter {
  return typeof (adapter as { signMessage?: unknown } | null)?.signMessage === "function";
}

export function WalletModal({ initialAuth }: WalletModalProps) {
  const { t } = useI18n();
  const { wallet, wallets, publicKey, connected, connecting, disconnecting, connect, disconnect, select, signMessage } = useWallet();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authState, setAuthState] = useState<AuthMeResponse>(initialAuth);
  const [phase, setPhase] = useState<ActionPhase>("idle");
  const [lastError, setLastError] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState("");
  const [referralOrigin, setReferralOrigin] = useState<ReferralHintOrigin>("auto");
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const inactivityTimeoutRef = useRef<number | null>(null);
  const phantomFallbackTimerRef = useRef<number | null>(null);
  const wasConnectedRef = useRef(false);
  const authRefreshPromiseRef = useRef<Promise<void> | null>(null);
  const autoCloseOnConnect = useMemo(() => getWalletModalAutoClose(), []);
  const [isSmallViewport, setIsSmallViewport] = useState(false);
  const [isMobileUserAgent, setIsMobileUserAgent] = useState(false);
  const [isInPhantomApp, setIsInPhantomApp] = useState(false);
  const [showPhantomFallback, setShowPhantomFallback] = useState(false);
  const walletPublicKey = publicKey?.toBase58() ?? null;
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
  const currentLandingPath = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  const menuEntries = useMemo<NavEntry[]>(() => {
    const entries: NavEntry[] = [{ href: "/marketplace", label: t({ en: "Marketplace", es: "Marketplace", pt: "Marketplace" }) }];

    if (!authState.authenticated) {
      return entries;
    }

    entries.push({ href: "/protected", label: t({ en: "Profile", es: "Perfil", pt: "Perfil" }) });

    if (authState.role === "admin") {
      entries.push({ href: "/admin", label: t({ en: "Dashboard", es: "Dashboard", pt: "Dashboard" }) });
    }

    return entries;
  }, [authState.authenticated, authState.role, t]);

  const primaryLabel = useMemo(() => {
    if (authState.authenticated) {
      return t({ en: "Signed in", es: "Sesion iniciada", pt: "Sessao iniciada" });
    }

    if (isConnected) {
      return t({ en: "Sign in", es: "Iniciar sesion", pt: "Entrar" });
    }

    return t({ en: "Connect & Sign in", es: "Conectar e iniciar sesion", pt: "Conectar e entrar" });
  }, [authState.authenticated, isConnected, t]);

  const signInStatement = t({
    en: "Sign this message to authenticate with the app.",
    es: "Firma este mensaje para autenticarte en la app.",
    pt: "Assine esta mensagem para se autenticar no app."
  });

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
        setAuthState((previous) => (
          previous.authenticated === currentAuth.authenticated
          && previous.pubkey === currentAuth.pubkey
          && previous.role === currentAuth.role
            ? previous
            : currentAuth
        ));

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
        landingPath: currentLandingPath
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
  }, [currentLandingPath, queryReferralCode]);

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
    closeButtonRef.current?.focus();
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

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

  async function handlePrimaryAction(): Promise<void> {
    if (authState.authenticated) {
      return;
    }

    setLastError(null);

    try {
      if (!isPhantomInstalled) {
        throw new Error("Phantom wallet was not found in this browser.");
      }

      let activePublicKey = resolveCurrentWalletPublicKey();

      if (!activePublicKey) {
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

      const verifiedResult = await startSiws({
        publicKey: activePublicKey,
        signMessage: activeSignMessage,
        statement: signInStatement,
        referralCode: normalizedReferralCode || undefined,
        attributionSource: referralSource,
        attributionMetadata:
          normalizedReferralCode && referralSource
            ? buildReferralAuthMetadata({
                landingPath: currentLandingPath,
                origin: referralOrigin,
                source: referralSource
              })
            : undefined,
        onStatus: (status) => setPhase(status)
      });

      if (normalizedReferralCode && verifiedResult.referralBindingOutcome) {
        clearStoredReferralHint();
      }

      setAuthState({ authenticated: true, pubkey: verifiedResult.publicKey, role: "user" });
      broadcastAuthSync("login", verifiedResult.publicKey);
      void refreshAuthState({ silent: true });

      try {
        const profileRes = await fetch("/api/protected/profile");
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (!profileData.firstName || !profileData.email || !profileData.phone) {
            setIsOpen(false);
            router.push("/protected/perfil");
            return;
          }
        } else if (profileRes.status === 404) {
          setIsOpen(false);
          router.push("/protected/perfil");
          return;
        }
      } catch {
        // Fail-open here: profile completion is checked server-side on protected routes.
      }

      if (verifiedResult.isNewUser) {
        setIsOpen(false);
        router.push("/protected/perfil");
      }
    } catch (error) {
      setLastError(getFriendlyWalletErrorMessage(error, t));
    } finally {
      setPhase("idle");
    }
  }

  async function handleDisconnect(): Promise<void> {
    setPhase("disconnecting");
    setLastError(null);

    let disconnectError: string | null = null;
    let logoutError: string | null = null;

    try {
      try {
        if (isConnected) {
          await disconnect();
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
      } else {
        setAuthState({ authenticated: false, pubkey: null });
        broadcastAuthSync("logout", walletPublicKey);
      }
    } finally {
      setPhase("idle");
    }
  }

  async function copyAddress(): Promise<void> {
    if (!walletPublicKey) {
      return;
    }

    await navigator.clipboard.writeText(walletPublicKey);
  }

  const accountStatusText = authState.authenticated && authState.pubkey
    ? `${authState.role === "admin" ? t({ en: "Admin", es: "Admin", pt: "Admin" }) : t({ en: "User", es: "Usuario", pt: "Usuario" })}: ${truncatePublicKey(authState.pubkey)}`
    : t({ en: "Not signed in", es: "Sin sesion iniciada", pt: "Sem sessao iniciada" });
  const topFeedbackText = statusText ?? lastError;
  const isTopFeedbackStatus = Boolean(statusText);
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
              <Image src="/brand/brids-mark.svg" alt="BRIDS mark" width={24} height={24} className="h-6 w-auto sm:hidden" priority />
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
                      className={cn(
                        "inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full border px-4 text-sm font-medium transition",
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
              <Button onClick={() => setIsOpen(true)} className="min-h-11 px-4">
                {t({ en: "Wallet", es: "Wallet", pt: "Wallet" })}
              </Button>
              {authState.authenticated && authState.pubkey ? (
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
                    className={cn(
                      "inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full border px-4 text-sm font-medium transition",
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

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 backdrop-blur-sm" onClick={() => setIsOpen(false)} role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="wallet-modal-title"
            className="glass-surface max-h-[85vh] w-full max-w-lg overflow-y-auto p-5 sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="pointer-events-none absolute -left-8 top-4 h-20 w-20 rounded-full bg-cyan-300/15 blur-3xl" />
            <div className="pointer-events-none absolute -right-8 bottom-4 h-20 w-20 rounded-full bg-fuchsia-300/15 blur-3xl" />

            <div className="relative z-10 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="wallet-modal-title" className="text-xl font-semibold text-white">
                    {t({ en: "Wallet Authentication", es: "Autenticacion de Wallet", pt: "Autenticacao de Wallet" })}
                  </h2>
                  <p className="text-sm text-white/70">
                    {t({
                      en: "Connect Phantom and sign in with SIWS.",
                      es: "Conecta Phantom e inicia sesion con SIWS.",
                      pt: "Conecte a Phantom e entre com SIWS."
                    })}
                  </p>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 px-3 text-sm text-white/80 transition hover:bg-white/20"
                  aria-label={t({ en: "Close wallet modal", es: "Cerrar modal de wallet", pt: "Fechar modal da wallet" })}
                >
                  ×
                </button>
              </div>

              {topFeedbackText ? (
                <div
                  className={cn(
                    "flex min-h-11 items-center gap-2 rounded-2xl border px-4 text-sm",
                    isTopFeedbackStatus
                      ? "border-cyan-300/30 bg-cyan-400/10 text-cyan-200"
                      : "border-red-300/35 bg-red-500/10 text-red-200"
                  )}
                  role={isTopFeedbackStatus ? "status" : "alert"}
                  aria-live={isTopFeedbackStatus ? "polite" : "assertive"}
                >
                  {isTopFeedbackStatus ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
                  ) : null}
                  {topFeedbackText}
                </div>
              ) : null}

              {isConnected ? (
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                  <p className="text-sm text-white/85">
                    {t({ en: "Connected", es: "Conectada", pt: "Conectada" })}: {truncatePublicKey(walletPublicKey ?? "")}
                  </p>
                </div>
              ) : (
                <p className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-white/70">
                  {t({
                    en: "Connect Phantom to continue with SIWS authentication.",
                    es: "Conecta Phantom para continuar con la autenticacion SIWS.",
                    pt: "Conecte a Phantom para continuar com a autenticacao SIWS."
                  })}
                </p>
              )}

              {!isPhantomInstalled ? (
                <p className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 text-sm text-amber-200">
                  {t({
                    en: "Phantom is not installed.",
                    es: "Phantom no esta instalada.",
                    pt: "A Phantom nao esta instalada."
                  })}{" "}
                  <a className="underline decoration-amber-200/70 underline-offset-2 hover:text-amber-100" href="https://phantom.app/" target="_blank" rel="noreferrer">
                    {t({ en: "Install Phantom", es: "Instalar Phantom", pt: "Instalar Phantom" })}
                  </a>{" "}
                  {t({ en: "and retry.", es: "y vuelve a intentarlo.", pt: "e tente novamente." })}
                </p>
              ) : null}

              <div className="space-y-2">
                <label htmlFor="wallet-referral-code" className="block text-sm font-medium text-white">
                  {t({ en: "Referral code (optional)", es: "Codigo de referido (opcional)", pt: "Codigo de referido (opcional)" })}
                </label>
                <input
                  id="wallet-referral-code"
                  type="text"
                  value={referralCode}
                  onChange={(event) => {
                    const nextValue = normalizeReferralCodeInput(event.target.value);
                    setReferralCode(nextValue);
                    setReferralOrigin("manual");

                    if (!nextValue) {
                      clearStoredReferralHint();
                      return;
                    }

                    const hint = buildStoredReferralHint({
                      referralCode: nextValue,
                      origin: "manual",
                      landingPath: currentLandingPath
                    });

                    if (hint) {
                      writeStoredReferralHint(hint);
                    }
                  }}
                  placeholder={t({
                    en: "Paste or edit your invite code",
                    es: "Pega o edita tu codigo de invitacion",
                    pt: "Cole ou edite seu codigo de convite"
                  })}
                  className="min-h-11 w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-cyan-300/45 focus:bg-white/15"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <p className="text-xs text-white/60">
                  {t({
                    en: "If you arrived through a referral link, the code is prefilled and you can still adjust it before your first sign-in.",
                    es: "Si llegaste por un link de referido, el codigo se precarga y aun puedes ajustarlo antes de tu primer inicio de sesion.",
                    pt: "Se voce chegou por um link de referido, o codigo e preenchido automaticamente e ainda pode ser ajustado antes do primeiro login."
                  })}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button onClick={handlePrimaryAction} disabled={isBusy || authState.authenticated || !isPhantomInstalled} className="min-h-11 w-full">
                  {primaryLabel}
                </Button>

                <Button variant="outline" onClick={handleDisconnect} disabled={isBusy} className="min-h-11 w-full">
                  {t({ en: "Logout & Disconnect", es: "Cerrar sesion y desconectar", pt: "Sair e desconectar" })}
                </Button>
              </div>

              <Button variant="ghost" onClick={copyAddress} disabled={!walletPublicKey} className="min-h-11 w-full border border-white/10 bg-white/10 hover:bg-white/15">
                {t({ en: "Copy Address", es: "Copiar direccion", pt: "Copiar endereco" })}
              </Button>

            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
