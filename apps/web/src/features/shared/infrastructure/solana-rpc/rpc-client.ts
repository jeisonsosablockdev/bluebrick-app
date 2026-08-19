import { getSolanaRpcUrl } from "@/lib/infrastructure/solana";

export function getSolanaRpcEndpoint(): string {
  return getSolanaRpcUrl();
}
