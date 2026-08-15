/**
 * Shared Solana Wallet Adapter & Standard Connection (@solana/kit)
 */

export interface WalletConnectionState {
  connected: boolean;
  publicKey: string | null;
  connecting: boolean;
}

import { getSolanaRpcUrl } from "@/lib/infrastructure/solana";

export function getSolanaNetworkRpcUrl(): string {
  return getSolanaRpcUrl();
}
