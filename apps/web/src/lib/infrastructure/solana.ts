/**
 * @file apps/web/src/lib/infrastructure/solana.ts
 * @description Layer 4: Infrastructure - Solana RPC Configuration & Network Helpers.
 * Configures the canonical Solana connection endpoint and explorer URL generators.
 */

/**
 * Canonical default Solana Devnet RPC endpoint.
 */
export const DEFAULT_SOLANA_DEVNET_RPC = "https://api.devnet.solana.com";

/**
 * Retrieves the configured Solana RPC URL with strict Devnet fallback.
 *
 * @returns The active Solana RPC endpoint URL string.
 */
export function getSolanaRpcUrl(): string {
  // Step 1: Check environment variable override
  const configuredRpc = process.env.NEXT_PUBLIC_SOLANA_RPC || process.env.SOLANA_RPC_URL;
  if (configuredRpc && configuredRpc.trim().length > 0) {
    return configuredRpc.trim();
  }

  // Step 2: Fall back to canonical public Devnet RPC
  return DEFAULT_SOLANA_DEVNET_RPC;
}

/**
 * Generates an explorer link for a given Solana transaction signature.
 *
 * @param signature - Base58 transaction signature string.
 * @param cluster - Target Solana cluster (default: 'devnet').
 * @returns Full URL to inspect the transaction on Solscan.
 */
export function getSolscanTransactionUrl(signature: string, cluster: string = "devnet"): string {
  // Step 1: Build parameterized Solscan explorer URL
  const base = "https://solscan.io/tx";
  return `${base}/${signature}?cluster=${encodeURIComponent(cluster)}`;
}

/**
 * Generates an explorer link for a given Solana account public key.
 *
 * @param address - Base58 account address string.
 * @param cluster - Target Solana cluster (default: 'devnet').
 * @returns Full URL to inspect the account on Solscan.
 */
export function getSolscanAccountUrl(address: string, cluster: string = "devnet"): string {
  // Step 1: Build parameterized Solscan explorer URL
  const base = "https://solscan.io/account";
  return `${base}/${address}?cluster=${encodeURIComponent(cluster)}`;
}
