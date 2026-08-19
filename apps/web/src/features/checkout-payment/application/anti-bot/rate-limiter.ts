import {
  countRecentPurchaseRateLimitEvents,
  createPurchaseRateLimitEvent,
  type PurchaseRateLimitEndpoint
} from "@/features/checkout-payment/infrastructure/purchase-rate-limit-repository";
import { getPurchaseAntiBotConfig, PurchaseAntiBotError } from "./config";

export async function assertPurchaseRateLimit(input: {
  endpoint: PurchaseRateLimitEndpoint;
  walletPublicKey: string;
  clientIp: string;
}): Promise<void> {
  const config = getPurchaseAntiBotConfig();
  const ipAddress = input.clientIp.trim() || "unknown";

  const recent = await countRecentPurchaseRateLimitEvents({
    endpoint: input.endpoint,
    walletPublicKey: input.walletPublicKey,
    ipAddress,
    windowSeconds: config.rateLimitWindowSeconds
  });

  if (recent.walletCount >= config.rateLimitMaxByWallet) {
    throw new PurchaseAntiBotError(
      "RATE_LIMITED",
      "Too many purchase attempts from this wallet. Please wait a moment.",
      429,
      {
        scope: "wallet",
        endpoint: input.endpoint,
        limit: config.rateLimitMaxByWallet,
        windowSeconds: config.rateLimitWindowSeconds
      }
    );
  }

  if (recent.ipCount >= config.rateLimitMaxByIp) {
    throw new PurchaseAntiBotError(
      "RATE_LIMITED",
      "Too many purchase attempts from this IP. Please wait a moment.",
      429,
      {
        scope: "ip",
        endpoint: input.endpoint,
        limit: config.rateLimitMaxByIp,
        windowSeconds: config.rateLimitWindowSeconds
      }
    );
  }

  await createPurchaseRateLimitEvent({
    endpoint: input.endpoint,
    walletPublicKey: input.walletPublicKey,
    ipAddress
  });
}
