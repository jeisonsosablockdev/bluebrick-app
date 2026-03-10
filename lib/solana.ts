import { clusterApiUrl } from "@solana/web3.js";

const DEFAULT_DEVNET_RPC = clusterApiUrl("devnet");
const FORBIDDEN_RPC_MARKERS = ["mainnet", "testnet", "localnet", "localhost", "127.0.0.1"];
const SOLSCAN_BASE_URL = "https://solscan.io";
const SOLSCAN_DEVNET_QUERY = "cluster=devnet";
export const METAPLEX_CORE_PROGRAM_ID = "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d";

export function getSolanaRpcUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_SOLANA_RPC?.trim();

  if (!configuredUrl) {
    return DEFAULT_DEVNET_RPC;
  }

  if (!configuredUrl.toLowerCase().includes("devnet")) {
    throw new Error("NEXT_PUBLIC_SOLANA_RPC must target devnet.");
  }

  if (FORBIDDEN_RPC_MARKERS.some((marker) => configuredUrl.toLowerCase().includes(marker) && marker !== "devnet")) {
    throw new Error("Only devnet RPC endpoints are allowed.");
  }

  return configuredUrl;
}

export function getWalletModalAutoClose(): boolean {
  return process.env.NEXT_PUBLIC_WALLET_MODAL_AUTO_CLOSE === "true";
}

export function getSolscanTransactionUrl(signature: string): string {
  return `${SOLSCAN_BASE_URL}/tx/${encodeURIComponent(signature)}?${SOLSCAN_DEVNET_QUERY}`;
}

export function getSolscanAccountUrl(address: string): string {
  return `${SOLSCAN_BASE_URL}/account/${encodeURIComponent(address)}?${SOLSCAN_DEVNET_QUERY}`;
}
