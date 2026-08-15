"use client";

/**
 * features/shared/wallet/application/use-wallet-signing-helpers.ts
 *
 * Hooks de bajo nivel para resolución de capacidades del wallet adapter.
 * Extraídos de main-top-navigation-modal.tsx.
 *
 * Resuelven la public key y el signer desde el wallet adapter de Phantom,
 * con estrategia de polling para el caso en que el adapter actualice
 * su estado de forma asíncrona tras connect().
 */

import { useCallback } from "react";
import { type Wallet, useWallet } from "@solana/wallet-adapter-react";
import { PhantomWalletName } from "@solana/wallet-adapter-phantom";

import { adapterSupportsMessageSigning } from "@/features/navigation/application/nav-modal-utils";
import type { MessageSigner } from "@/features/navigation/domain/nav-modal-types";

const POLLING_MAX_ATTEMPTS = 20;
const POLLING_INTERVAL_MS = 50;

function resolvePublicKeyFromWallet(wallet: Wallet | null, wallets: Wallet[]): string | null {
  return (
    wallet?.adapter.publicKey?.toBase58()
    ?? wallets.find((item) => item.adapter.name === PhantomWalletName)?.adapter.publicKey?.toBase58()
    ?? null
  );
}

export function useWalletSigningHelpers() {
  const { wallet, wallets, publicKey, signMessage } = useWallet();

  const resolveCurrentWalletPublicKey = useCallback((): string | null => {
    return (
      publicKey?.toBase58()
      ?? resolvePublicKeyFromWallet(wallet, wallets)
    );
  }, [publicKey, wallet, wallets]);

  const waitForWalletPublicKey = useCallback(async (): Promise<string | null> => {
    const immediate = resolveCurrentWalletPublicKey();
    if (immediate) return immediate;

    for (let attempt = 0; attempt < POLLING_MAX_ATTEMPTS; attempt += 1) {
      await new Promise<void>((resolve) => window.setTimeout(resolve, POLLING_INTERVAL_MS));
      const next = resolveCurrentWalletPublicKey();
      if (next) return next;
    }
    return null;
  }, [resolveCurrentWalletPublicKey]);

  const resolveCurrentSignMessage = useCallback((): MessageSigner | null => {
    if (signMessage) return signMessage;

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
    const immediate = resolveCurrentSignMessage();
    if (immediate) return immediate;

    for (let attempt = 0; attempt < POLLING_MAX_ATTEMPTS; attempt += 1) {
      await new Promise<void>((resolve) => window.setTimeout(resolve, POLLING_INTERVAL_MS));
      const next = resolveCurrentSignMessage();
      if (next) return next;
    }
    return null;
  }, [resolveCurrentSignMessage]);

  return {
    resolveCurrentWalletPublicKey,
    waitForWalletPublicKey,
    resolveCurrentSignMessage,
    waitForSignMessage,
  };
}
