import "server-only";

type AirwallexEnv = "demo" | "prod";
export type AirwallexRuntimeMode = "sandbox" | "live";

type AirwallexAuthResponse = {
  token: string;
  expires_at?: string;
};

type AirwallexPaymentIntentResponse = {
  id: string;
  request_id?: string;
  amount: number;
  currency: string;
  status: string;
  client_secret?: string;
  merchant_order_id?: string;
  created_at?: string;
  updated_at?: string;
};

export type CreateAirwallexPaymentIntentInput = {
  requestId: string;
  merchantOrderId: string;
  amount: number;
  currency: string;
  returnUrl?: string;
  customer?: {
    email?: string;
    first_name?: string;
    last_name?: string;
  };
  metadata?: Record<string, string>;
};

export type CreateAirwallexPaymentIntentResult = {
  intentId: string;
  clientSecret: string | null;
  status: string;
  amount: number;
  currency: string;
  env: AirwallexEnv;
};

export type RetrieveAirwallexPaymentIntentResult = {
  intentId: string;
  status: string;
  amount: number;
  currency: string;
};

const cachedTokens = new Map<string, { token: string; expiresAtMs: number }>();

function resolveEnv(mode: AirwallexRuntimeMode): AirwallexEnv {
  if (mode === "sandbox") {
    return "demo";
  }

  const env = process.env.AIRWALLEX_ENV?.trim().toLowerCase();

  if (env === "prod" || env === "production") {
    return "prod";
  }

  return "demo";
}

function getApiBaseUrl(env: AirwallexEnv): string {
  if (env === "prod") {
    return "https://api.airwallex.com";
  }

  return "https://api-demo.airwallex.com";
}

function getRequiredConfig(mode: AirwallexRuntimeMode): {
  env: AirwallexEnv;
  clientId: string;
  apiKey: string;
  cacheKey: string;
} {
  const clientId =
    mode === "sandbox"
      ? process.env.AIRWALLEX_SANDBOX_CLIENT_ID?.trim() || process.env.AIRWALLEX_CLIENT_ID?.trim()
      : process.env.AIRWALLEX_LIVE_CLIENT_ID?.trim() || process.env.AIRWALLEX_CLIENT_ID?.trim();
  const apiKey =
    mode === "sandbox"
      ? process.env.AIRWALLEX_SANDBOX_API_KEY?.trim() || process.env.AIRWALLEX_API_KEY?.trim()
      : process.env.AIRWALLEX_LIVE_API_KEY?.trim() || process.env.AIRWALLEX_API_KEY?.trim();

  if (!clientId || !apiKey) {
    if (mode === "sandbox") {
      throw new Error(
        "AIRWALLEX_SANDBOX_CLIENT_ID and AIRWALLEX_SANDBOX_API_KEY are required (or fallback AIRWALLEX_CLIENT_ID/AIRWALLEX_API_KEY)."
      );
    }

    throw new Error(
      "AIRWALLEX_CLIENT_ID and AIRWALLEX_API_KEY are required for live mode (or AIRWALLEX_LIVE_*)."
    );
  }

  return {
    env: resolveEnv(mode),
    clientId,
    apiKey,
    cacheKey: `${mode}:${clientId}`
  };
}

function parseExpiryMs(expiresAt?: string): number {
  if (!expiresAt) {
    return Date.now() + 25 * 60 * 1_000;
  }

  const parsed = new Date(expiresAt).getTime();
  if (Number.isNaN(parsed)) {
    return Date.now() + 25 * 60 * 1_000;
  }

  return parsed - 15_000;
}

async function getAccessToken(mode: AirwallexRuntimeMode): Promise<string> {
  const config = getRequiredConfig(mode);
  const cachedToken = cachedTokens.get(config.cacheKey);
  if (cachedToken && cachedToken.expiresAtMs > Date.now()) {
    return cachedToken.token;
  }

  const baseUrl = getApiBaseUrl(config.env);

  const response = await fetch(`${baseUrl}/api/v1/authentication/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": config.clientId,
      "x-api-key": config.apiKey
    }
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Airwallex auth failed (${response.status}): ${errorText || "unknown error"}`);
  }

  const payload = (await response.json()) as AirwallexAuthResponse;
  if (!payload.token) {
    throw new Error("Airwallex auth response did not include token.");
  }

  cachedTokens.set(config.cacheKey, {
    token: payload.token,
    expiresAtMs: parseExpiryMs(payload.expires_at)
  });

  return payload.token;
}

function buildIntentRequestBody(input: CreateAirwallexPaymentIntentInput): Record<string, unknown> {
  const body: Record<string, unknown> = {
    request_id: input.requestId,
    amount: input.amount,
    currency: input.currency,
    merchant_order_id: input.merchantOrderId
  };

  if (input.returnUrl) {
    body.return_url = input.returnUrl;
  }

  if (input.customer) {
    body.customer = input.customer;
  }

  if (input.metadata && Object.keys(input.metadata).length > 0) {
    body.metadata = input.metadata;
  }

  return body;
}

export async function createAirwallexPaymentIntent(
  input: CreateAirwallexPaymentIntentInput,
  mode: AirwallexRuntimeMode = "live"
): Promise<CreateAirwallexPaymentIntentResult> {
  const config = getRequiredConfig(mode);
  const baseUrl = getApiBaseUrl(config.env);
  const token = await getAccessToken(mode);

  const response = await fetch(`${baseUrl}/api/v1/pa/payment_intents/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(buildIntentRequestBody(input))
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Airwallex create intent failed (${response.status}): ${errorText || "unknown error"}`);
  }

  const payload = (await response.json()) as AirwallexPaymentIntentResponse;

  return {
    intentId: payload.id,
    clientSecret: payload.client_secret ?? null,
    status: payload.status,
    amount: Number(payload.amount),
    currency: payload.currency,
    env: config.env
  };
}

export async function retrieveAirwallexPaymentIntent(
  intentId: string,
  mode: AirwallexRuntimeMode = "live"
): Promise<RetrieveAirwallexPaymentIntentResult> {
  const normalizedId = intentId.trim();
  if (!normalizedId) {
    throw new Error("intentId is required.");
  }

  const config = getRequiredConfig(mode);
  const baseUrl = getApiBaseUrl(config.env);
  const token = await getAccessToken(mode);

  const response = await fetch(`${baseUrl}/api/v1/pa/payment_intents/${encodeURIComponent(normalizedId)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Airwallex retrieve intent failed (${response.status}): ${errorText || "unknown error"}`);
  }

  const payload = (await response.json()) as AirwallexPaymentIntentResponse;

  return {
    intentId: payload.id,
    status: payload.status,
    amount: Number(payload.amount),
    currency: payload.currency
  };
}

export function getAirwallexCheckoutEnv(): AirwallexEnv {
  return resolveEnv("live");
}

export function resolveAirwallexCheckoutEnv(mode: AirwallexRuntimeMode): AirwallexEnv {
  return resolveEnv(mode);
}
