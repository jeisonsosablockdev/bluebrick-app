/**
 * @file apps/web/src/lib/hooks/use-solana-wallet.ts
 * @description Layer 2: Application / Consumption - Custom hook for Solana wallet state.
 * Wraps @solana/wallet-adapter-react to provide structured wallet properties.
 */

"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import { formatAddress } from "../utils";

/**
 * Normalized wallet state contract for UI presentation.
 */
export interface UseSolanaWalletResult {
  /** Indicates whether a wallet is currently connected */
  connected: boolean;
  /** Indicates whether a connection or disconnection is in progress */
  connecting: boolean;
  /** Base58 public key string of the connected wallet, or null */
  publicKeyBase58: string | null;
  /** Formatted/truncated public key string for UI display (e.g. "7xKX...gAsU") */
  formattedAddress: string;
  /** Name of the currently selected wallet adapter (e.g. "Phantom") */
  walletName: string | null;
  /** Disconnects the active wallet */
  disconnect: () => Promise<void>;
}

/**
 * React hook exposing sanitized Solana wallet connection state and actions.
 *
 * @returns {UseSolanaWalletResult} Formatted wallet state and control methods.
 */
export function useSolanaWallet(): UseSolanaWalletResult {
  // Step 1: Consume native wallet adapter context
  const { connected, connecting, publicKey, wallet, disconnect } = useWallet();

  // Step 2: Compute string representation of public key
  const publicKeyBase58 = useMemo(() => {
    return publicKey ? publicKey.toBase58() : null;
  }, [publicKey]);

  // Step 3: Compute truncated address for UI presentation
  const formattedAddress = useMemo(() => {
    return formatAddress(publicKeyBase58, 4);
  }, [publicKeyBase58]);

  return {
    connected,
    connecting,
    publicKeyBase58,
    formattedAddress,
    walletName: wallet?.adapter.name ?? null,
    disconnect,
  };
}
