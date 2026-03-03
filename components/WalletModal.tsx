"use client";

import { useEffect, useRef, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { buildSiwsMessage } from "@/lib/siws";

type PhantomProvider = {
  isPhantom?: boolean;
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  signMessage: (message: Uint8Array, display?: "utf8" | "hex") => Promise<{ signature: Uint8Array }>;
};

type WalletModalProps = {
  authenticatedPublicKey: string | null;
};

const SIGN_IN_STATEMENT = "Sign this message to authenticate with the app.";

function getPhantomProvider(): PhantomProvider | null {
  if (typeof window === "undefined") {
    return null;
  }

  const candidate = (window as Window & { phantom?: { solana?: PhantomProvider } }).phantom?.solana;
  return candidate?.isPhantom ? candidate : null;
}

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function truncatePublicKey(publicKey: string): string {
  return `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;
}

async function getNonce(): Promise<string> {
  const response = await fetch("/api/auth/nonce", { method: "GET" });
  const payload = (await response.json()) as { nonce?: string };

  if (!response.ok || !payload.nonce) {
    throw new Error("Could not fetch nonce.");
  }

  return payload.nonce;
}

export function WalletModal({ authenticatedPublicKey }: WalletModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletPublicKey, setWalletPublicKey] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const isSignedIn = Boolean(authenticatedPublicKey);

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

  async function connectWallet(): Promise<void> {
    setError(null);
    const provider = getPhantomProvider();

    if (!provider) {
      setError("Phantom wallet is not available.");
      return;
    }

    const connected = await provider.connect();
    setWalletPublicKey(connected.publicKey.toBase58());
  }

  async function disconnectWallet(): Promise<void> {
    setError(null);
    const provider = getPhantomProvider();

    if (!provider) {
      setWalletPublicKey(null);
      return;
    }

    await provider.disconnect();
    setWalletPublicKey(null);
  }

  async function copyAddress(): Promise<void> {
    if (!walletPublicKey) {
      return;
    }

    await navigator.clipboard.writeText(walletPublicKey);
  }

  async function signIn(): Promise<void> {
    setBusy(true);
    setError(null);

    try {
      const provider = getPhantomProvider();

      if (!provider) {
        throw new Error("Phantom wallet is not available.");
      }

      const activeWallet = walletPublicKey ?? (await provider.connect()).publicKey.toBase58();
      setWalletPublicKey(activeWallet);

      const nonce = await getNonce();
      const message = buildSiwsMessage({
        domain: window.location.host,
        publicKey: activeWallet,
        statement: SIGN_IN_STATEMENT,
        nonce,
        issuedAt: new Date().toISOString()
      });

      const signature = await provider.signMessage(new TextEncoder().encode(message), "utf8");
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          signature: toBase64(signature.signature),
          publicKey: activeWallet
        })
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Authentication failed.");
      }

      setIsOpen(false);
      router.refresh();
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : "Authentication failed.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function logout(): Promise<void> {
    setBusy(true);
    setError(null);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setIsOpen(false);
      router.refresh();
    } catch {
      setError("Could not log out.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-end gap-3">
        <p className="text-xs text-white/60" aria-live="polite">
          {isSignedIn ? `Logged in: ${truncatePublicKey(authenticatedPublicKey ?? "")}` : "Not signed in"}
        </p>
        <Button onClick={() => setIsOpen(true)}>{isSignedIn ? "Wallet" : "Connect Wallet"}</Button>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setIsOpen(false)} role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="wallet-modal-title"
            className="w-full max-w-md rounded-2xl border border-white/20 bg-[#0b1021] p-5 shadow-2xl"
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
              <div className="flex flex-wrap gap-2">
                <Button onClick={connectWallet} disabled={busy}>
                  Connect Phantom
                </Button>
                <Button variant="outline" onClick={disconnectWallet} disabled={busy || !walletPublicKey}>
                  Disconnect
                </Button>
                <Button variant="ghost" onClick={copyAddress} disabled={!walletPublicKey}>
                  Copy Address
                </Button>
              </div>

              {walletPublicKey ? <p className="text-sm text-white/80">Connected: {truncatePublicKey(walletPublicKey)}</p> : null}

              {!isSignedIn ? (
                <Button onClick={signIn} disabled={busy || !walletPublicKey}>
                  {busy ? "Signing..." : "Sign in"}
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-emerald-300">Logged in as {truncatePublicKey(authenticatedPublicKey ?? "")}</p>
                  <Button variant="outline" onClick={logout} disabled={busy}>
                    {busy ? "Working..." : "Logout"}
                  </Button>
                </div>
              )}

              {error ? <p className="text-sm text-red-300" role="status">{error}</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
