import { clusterApiUrl } from "@solana/web3.js";

const DEFAULT_DEVNET_RPC = clusterApiUrl("devnet");
const FORBIDDEN_RPC_MARKERS = ["mainnet", "testnet", "localnet", "localhost", "127.0.0.1"];

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

export function isDevnetProofEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_DEVNET_PROOF === "true";
}
