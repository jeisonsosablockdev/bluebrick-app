/**
 * Shared Solana Wallet Adapter & Standard Connection (@solana/kit)
 */

export interface WalletConnectionState {
  connected: boolean;
  publicKey: string | null;
  connecting: boolean;
}

export function getSolanaNetworkRpcUrl(): string {
  return process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
}
