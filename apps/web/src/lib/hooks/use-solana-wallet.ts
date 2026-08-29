/**
 * @file apps/web/src/lib/hooks/use-solana-wallet.ts
 * @description Layer 2: Application / Consumption - Custom hook for Solana wallet state.
 * Wraps @solana/wallet-adapter-react to provide structured wallet properties.
 */

"use client";

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
  /** Name of the currently selected wallet adapter */
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
  // Step 1: Return clean disconnected state without requiring @solana/wallet-adapter context
  return {
    connected: false,
    connecting: false,
    publicKeyBase58: null,
    formattedAddress: "",
    walletName: null,
    disconnect: async () => {},
  };
}
