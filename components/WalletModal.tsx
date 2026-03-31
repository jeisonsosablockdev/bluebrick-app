"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import { PhantomWalletName } from "@solana/wallet-adapter-phantom";

import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useI18n } from "@/components/i18n/locale-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import type { LocaleText } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { fetchAuthMe, startSiws, type AuthMeResponse } from "@/lib/auth-client";
import { getWalletModalAutoClose } from "@/lib/solana";

type WalletModalProps = {
  initialAuth: AuthMeResponse;
};

const WALLET_MODAL_IDLE_TIMEOUT_MS = 30_000;

type ActionPhase = "idle" | "connecting" | "signing" | "verifying" | "disconnecting";

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

export function WalletModal({ initialAuth }: WalletModalProps) {
  const { t } = useI18n();
  const { wallet, wallets, publicKey, connected, connecting, disconnecting, connect, disconnect, select, signMessage } = useWallet();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authState, setAuthState] = useState<AuthMeResponse>(initialAuth);
  const [phase, setPhase] = useState<ActionPhase>("idle");
  const [lastError, setLastError] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const inactivityTimeoutRef = useRef<number | null>(null);
  const wasConnectedRef = useRef(false);
  const autoCloseOnConnect = useMemo(() => getWalletModalAutoClose(), []);
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

  useEffect(() => {
    setAuthState(initialAuth);
  }, [initialAuth]);

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

    void (async () => {
      try {
        const currentAuth = await fetchAuthMe();
        setAuthState(currentAuth);
      } catch {
        setLastError(
          t({
            en: "Could not check current session.",
            es: "No se pudo verificar la sesion actual.",
            pt: "Nao foi possivel verificar a sessao atual."
          })
        );
      }
    })();
  }, [isOpen, t]);

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

      let activePublicKey = walletPublicKey;

      if (!activePublicKey) {
        setPhase("connecting");

        if (!wallet || wallet.adapter.name !== PhantomWalletName) {
          select(PhantomWalletName);
          await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
        }

        await connect();
        activePublicKey = publicKey?.toBase58() ?? null;
      }

      if (!activePublicKey) {
        throw new Error("Wallet connected but public key is unavailable.");
      }

      if (!signMessage) {
        throw new Error("Current wallet does not support message signing.");
      }

      const verifiedPublicKey = await startSiws({
        publicKey: activePublicKey,
        signMessage,
        statement: signInStatement,
        onStatus: (status) => setPhase(status)
      });

      try {
        const currentAuth = await fetchAuthMe();
        setAuthState(currentAuth);
      } catch {
        setAuthState({ authenticated: true, pubkey: verifiedPublicKey, role: "user" });
      }

      try {
        const profileResponse = await fetch("/api/protected/profile", { method: "GET" });
        if (profileResponse.ok) {
          const profilePayload = await profileResponse.json();
          const p = profilePayload?.data;
          
          if (p && (!p.firstName || !p.email || !p.country)) {
            setIsOpen(false);
            router.push("/protected/perfil");
          }
        }
      } catch (profileFetchError) {
        // Ignore redirect fetch failures quietly 
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
