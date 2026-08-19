export type StripeIdentitySession = {
  id: string;
  url: string;
  status: string;
};

export type StripeIdentitySessionInput = {
  walletPublicKey: string;
  returnUrl: string;
};

export type StripeRateLimitInput = {
  walletPublicKey: string;
  clientIp: string;
};

export type StripeRateLimitDecision = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export class StripeIdentityError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

type RateLimitBucket = {
  count: number;
  windowStartedAt: number;
};

const rateLimitBuckets = new Map<string, RateLimitBucket>();

function parsePositiveInteger(input: string | undefined, fallback: number): number {
  const parsed = Number(input);

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function getRateLimitWindowSeconds(): number {
  return parsePositiveInteger(process.env.STRIPE_IDENTITY_RATE_LIMIT_WINDOW_SECONDS, 600);
}

function getRateLimitMaxAttempts(): number {
  return parsePositiveInteger(process.env.STRIPE_IDENTITY_RATE_LIMIT_MAX_ATTEMPTS, 3);
}

function buildRateLimitKey(input: StripeRateLimitInput): string {
  return `${input.walletPublicKey}:${input.clientIp}`;
}

export function consumeStripeSessionRateLimit(input: StripeRateLimitInput): StripeRateLimitDecision {
  const key = buildRateLimitKey(input);
  const now = Math.floor(Date.now() / 1000);
  const windowSeconds = getRateLimitWindowSeconds();
  const maxAttempts = getRateLimitMaxAttempts();

  const current = rateLimitBuckets.get(key);

  if (!current || now - current.windowStartedAt >= windowSeconds) {
    rateLimitBuckets.set(key, {
      count: 1,
      windowStartedAt: now
    });

    return {
      allowed: true,
      retryAfterSeconds: 0
    };
  }

  if (current.count >= maxAttempts) {
    const elapsed = now - current.windowStartedAt;
    const retryAfterSeconds = Math.max(windowSeconds - elapsed, 1);

    return {
      allowed: false,
      retryAfterSeconds
    };
  }

  current.count += 1;
  rateLimitBuckets.set(key, current);

  return {
    allowed: true,
    retryAfterSeconds: 0
  };
}

function getStripeApiUrl(): string {
  return process.env.STRIPE_IDENTITY_API_URL?.trim() || "https://api.stripe.com/v1/identity/verification_sessions";
}

function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY?.trim();

  if (!key) {
    throw new StripeIdentityError(
      "KYC_PROVIDER_MISCONFIGURED",
      "Missing STRIPE_SECRET_KEY for Stripe Identity integration.",
      500
    );
  }

  return key;
}

type StripeApiResponse = {
  id?: string;
  url?: string;
  status?: string;
  error?: {
    message?: string;
  };
};

export async function createStripeIdentityVerificationSession(
  input: StripeIdentitySessionInput
): Promise<StripeIdentitySession> {
  const secretKey = getStripeSecretKey();
  const form = new URLSearchParams();

  form.set("type", "document");
  form.set("metadata[wallet_public_key]", input.walletPublicKey);
  form.set("options[document][require_matching_selfie]", "true");
  form.set("return_url", input.returnUrl);

  const response = await fetch(getStripeApiUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: form.toString(),
    cache: "no-store"
  });

  const payload = (await response.json().catch(() => null)) as StripeApiResponse | null;

  if (!response.ok) {
    const message = payload?.error?.message || "Stripe Identity session creation failed.";
    throw new StripeIdentityError("KYC_PROVIDER_ERROR", message, response.status || 502);
  }

  if (!payload?.id || !payload.url || typeof payload.status !== "string") {
    throw new StripeIdentityError(
      "KYC_PROVIDER_ERROR",
      "Stripe Identity response is missing required session fields.",
      502
    );
  }

  return {
    id: payload.id,
    url: payload.url,
    status: payload.status
  };
}
