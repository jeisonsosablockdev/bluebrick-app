export type PurchaseAntiBotErrorCode = "INVALID_CHALLENGE" | "RATE_LIMITED";

export class PurchaseAntiBotError extends Error {
  readonly code: PurchaseAntiBotErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: PurchaseAntiBotErrorCode,
    message: string,
    status: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "PurchaseAntiBotError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export type PurchaseAntiBotConfig = {
  challengeTtlSeconds: number;
  rateLimitWindowSeconds: number;
  rateLimitMaxByWallet: number;
  rateLimitMaxByIp: number;
};

const DEFAULT_CHALLENGE_TTL_SECONDS = 120;
const DEFAULT_RATE_LIMIT_WINDOW_SECONDS = 60;
const DEFAULT_RATE_LIMIT_MAX_BY_WALLET = 8;
const DEFAULT_RATE_LIMIT_MAX_BY_IP = 20;

export function parseEnvInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export function getPurchaseAntiBotConfig(): PurchaseAntiBotConfig {
  return {
    challengeTtlSeconds: parseEnvInt("PURCHASE_CHALLENGE_TTL_SECONDS", DEFAULT_CHALLENGE_TTL_SECONDS),
    rateLimitWindowSeconds: parseEnvInt("PURCHASE_RATE_LIMIT_WINDOW_SECONDS", DEFAULT_RATE_LIMIT_WINDOW_SECONDS),
    rateLimitMaxByWallet: parseEnvInt("PURCHASE_RATE_LIMIT_MAX_BY_WALLET", DEFAULT_RATE_LIMIT_MAX_BY_WALLET),
    rateLimitMaxByIp: parseEnvInt("PURCHASE_RATE_LIMIT_MAX_BY_IP", DEFAULT_RATE_LIMIT_MAX_BY_IP)
  };
}
