"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import { PhantomWalletName } from "@solana/wallet-adapter-phantom";

import { Button } from "@/components/ui/button";
import { fetchAuthMe, startSiws, type AuthMeResponse } from "@/lib/auth-client";
import { getWalletModalAutoClose } from "@/lib/solana";

type WalletModalProps = {
  initialAuth: AuthMeResponse;
};

type ActionPhase = "idle" | "connecting" | "signing" | "verifying" | "disconnecting";

const SIGN_IN_STATEMENT = "Sign this message to authenticate with the app.";

function truncatePublicKey(publicKey: string): string {
  return `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;
}

function getFriendlyWalletErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Something went wrong. Please try again.";
  }

  const message = error.message.toLowerCase();

  if (message.includes("rejected") || message.includes("cancelled") || message.includes("closed")) {
    return "Connection cancelled.";
  }

  if (message.includes("wallet not found")) {
    return "Phantom wallet was not found in this browser.";
  }

  return error.message;
}

function getStatusText(phase: ActionPhase): string | null {
  if (phase === "connecting") {
    return "Connecting...";
  }

  if (phase === "signing") {
    return "Signing...";
  }

  if (phase === "verifying") {
    return "Verifying...";
  }

  if (phase === "disconnecting") {
    return "Disconnecting...";
  }

  return null;
}

export function WalletModal({ initialAuth }: WalletModalProps) {
  const { wallet, wallets, publicKey, connected, connecting, disconnecting, connect, disconnect, select, signMessage } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [authState, setAuthState] = useState<AuthMeResponse>(initialAuth);
  const [phase, setPhase] = useState<ActionPhase>("idle");
  const [lastError, setLastError] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const wasConnectedRef = useRef(false);
  const autoCloseOnConnect = useMemo(() => getWalletModalAutoClose(), []);
  const walletPublicKey = publicKey?.toBase58() ?? null;
  const phantomWallet = useMemo(() => wallets.find((item) => item.adapter.name === PhantomWalletName), [wallets]);
  const isPhantomInstalled = phantomWallet?.readyState === WalletReadyState.Installed;
  const isConnected = connected && Boolean(walletPublicKey);
  const isBusy = phase !== "idle" || connecting || disconnecting;
  const statusText = getStatusText(phase) ?? (connecting ? "Connecting..." : disconnecting ? "Disconnecting..." : null);

  const menuEntries = useMemo(() => {
    if (!authState.authenticated) {
      return [{ href: "/", label: "Home" }];
    }

    const entries = [
      { href: "/", label: "Home" },
      { href: "/protected", label: "User Area" }
    ];

    if (authState.role === "admin") {
      entries.push({ href: "/admin", label: "Admin Dashboard" });
    }

    return entries;
  }, [authState.authenticated, authState.role]);

  const primaryLabel = useMemo(() => {
    if (authState.authenticated) {
      return "Signed in";
    }

    if (isConnected) {
      return "Sign in";
    }

    return "Connect & Sign in";
  }, [authState.authenticated, isConnected]);

  useEffect(() => {
    setAuthState(initialAuth);
  }, [initialAuth]);

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
        setLastError("Could not check current session.");
      }
    })();
  }, [isOpen]);

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
        statement: SIGN_IN_STATEMENT,
        onStatus: (status) => setPhase(status)
      });

      try {
        const currentAuth = await fetchAuthMe();
        setAuthState(currentAuth);
      } catch {
        setAuthState({ authenticated: true, pubkey: verifiedPublicKey, role: "user" });
      }
    } catch (error) {
      setLastError(getFriendlyWalletErrorMessage(error));
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
        disconnectError = getFriendlyWalletErrorMessage(error);
      }

      try {
        const logoutResponse = await fetch("/api/auth/logout", { method: "POST" });

        if (!logoutResponse.ok) {
          logoutError = "Could not clear session.";
        }
      } catch {
        logoutError = "Could not clear session.";
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

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 md:flex-row md:items-center md:justify-between">
        <nav className="flex flex-wrap items-center gap-2 text-xs text-white/80">
          {menuEntries.map((entry) => (
            <Link key={entry.href} href={entry.href} className="rounded-full border border-white/15 px-3 py-1 transition hover:bg-white/10">
              {entry.label}
            </Link>
          ))}
          {!authState.authenticated ? <span className="rounded-full bg-white/10 px-3 py-1">Sign in</span> : null}
        </nav>

        <div className="flex items-center justify-end gap-3">
          <p className="text-xs text-white/60" aria-live="polite">
            {authState.authenticated && authState.pubkey
              ? `${authState.role === "admin" ? "Admin" : "User"}: ${truncatePublicKey(authState.pubkey)}`
              : "Not signed in"}
          </p>
          <Button onClick={() => setIsOpen(true)}>{authState.authenticated ? "Wallet" : "Connect Wallet"}</Button>
        </div>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setIsOpen(false)} role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="wallet-modal-title"
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/20 bg-[#0b1021] p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 id="wallet-modal-title" className="text-lg font-semibold text-white">
                  Wallet Authentication
                </h2>
                <p className="text-sm text-white/70">Connect Phantom and sign in with SIWS.</p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md px-2 py-1 text-sm text-white/80 hover:bg-white/10"
                aria-label="Close wallet modal"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {statusText ? (
                <div className="flex items-center gap-2 text-sm text-cyan-300" role="status" aria-live="polite">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
                  {statusText}
                </div>
              ) : null}

              {isConnected ? (
                <div className="space-y-2">
                  <p className="text-sm text-white/80">Connected: {truncatePublicKey(walletPublicKey ?? "")}</p>
                  <Button variant="ghost" onClick={copyAddress} disabled={!walletPublicKey}>
                    Copy Address
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-white/70">Connect Phantom to continue with SIWS authentication.</p>
              )}

              {!isPhantomInstalled ? (
                <p className="text-sm text-amber-300">
                  Phantom is not installed. {" "}
                  <a className="underline hover:text-amber-200" href="https://phantom.app/" target="_blank" rel="noreferrer">
                    Install Phantom
                  </a>{" "}
                  and retry.
                </p>
              ) : null}

              <Button onClick={handlePrimaryAction} disabled={isBusy || authState.authenticated || !isPhantomInstalled}>
                {primaryLabel}
              </Button>

              <Button variant="outline" onClick={handleDisconnect} disabled={isBusy}>
                Logout & Disconnect
              </Button>

              {lastError ? (
                <p className="text-sm text-red-300" role="status">
                  {lastError}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
