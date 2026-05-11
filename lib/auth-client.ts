import { buildSiwsMessage } from "@/lib/siws";

type NonceResponse = {
  nonce?: string;
};

type VerifyResponse = {
  error?: string;
  publicKey?: string;
  isNewUser?: boolean;
  referralBindingOutcome?: string | null;
};

type ReferralIntentResponse = {
  ok?: boolean;
  error?: string;
  intent?: {
    id: string;
    accountId: string;
    referralCode: string;
    attributionSource: "link" | "manual" | "deep_link" | "unknown";
    capturedAt: string;
    status: string;
    metadata: Record<string, unknown>;
    resolvedAt: string | null;
    promotedAttributionId: string | null;
  };
};

export type AuthMeResponse = {
  authenticated: boolean;
  federatedAvailable?: boolean;
  accountAuthenticated?: boolean;
  federatedAuthenticated?: boolean;
  walletAuthenticated?: boolean;
  sessionConflict?: boolean;
  authMethod?: "anonymous" | "federated" | "wallet" | "hybrid";
  accountId?: string | null;
  workosUserId?: string | null;
  email?: string | null;
  pubkey: string | null;
  role?: "user" | "admin";
};

type StartSiwsArgs = {
  publicKey: string;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  statement: string;
  noncePath?: string;
  verifyPath?: string;
  referralCode?: string;
  attributionSource?: "link" | "manual" | "deep_link" | "unknown";
  attributionMetadata?: Record<string, unknown>;
  onStatus?: (status: "signing" | "verifying") => void;
};

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

async function readJsonPayload<T>(response: Response, fallbackMessage: string): Promise<T> {
  const rawBody = await response.text();

  if (!rawBody.trim()) {
    throw new Error(fallbackMessage);
  }

  try {
    return JSON.parse(rawBody) as T;
  } catch {
    throw new Error(fallbackMessage);
  }
}

export async function fetchAuthMe(): Promise<AuthMeResponse> {
  const response = await fetch("/api/auth/me", { method: "GET", cache: "no-store" });

  if (!response.ok) {
    throw new Error("Could not read auth session.");
  }

  return readJsonPayload<AuthMeResponse>(response, "Could not check current session.");
}

export async function fetchNonce(path = "/api/auth/nonce"): Promise<string> {
  const response = await fetch(path, { method: "GET" });
  const payload = await readJsonPayload<NonceResponse>(response, "Could not fetch nonce.");

  if (!response.ok || !payload.nonce) {
    throw new Error("Could not fetch nonce.");
  }

  return payload.nonce;
}

export async function verifySiwsMessage(input: {
  message: string;
  signature: string;
  publicKey: string;
  path?: string;
  referralCode?: string;
  attributionSource?: "link" | "manual" | "deep_link" | "unknown";
  attributionMetadata?: Record<string, unknown>;
}): Promise<{ publicKey: string; isNewUser: boolean; referralBindingOutcome?: string | null }> {
  const response = await fetch(input.path ?? "/api/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  const payload = await readJsonPayload<VerifyResponse>(response, "Authentication failed.");

  if (!response.ok) {
    throw new Error(payload.error ?? "Authentication failed.");
  }

  if (!payload.publicKey) {
    throw new Error("Auth response did not include public key.");
  }

  return {
    publicKey: payload.publicKey,
    isNewUser: payload.isNewUser ?? false,
    referralBindingOutcome: payload.referralBindingOutcome ?? null
  };
}

export async function startSiws(
  args: StartSiwsArgs
): Promise<{ publicKey: string; isNewUser: boolean; referralBindingOutcome?: string | null }> {
  const nonce = await fetchNonce(args.noncePath);
  const message = buildSiwsMessage({
    domain: window.location.host,
    publicKey: args.publicKey,
    statement: args.statement,
    nonce,
    issuedAt: new Date().toISOString()
  });

  args.onStatus?.("signing");
  const signature = await args.signMessage(new TextEncoder().encode(message));

  args.onStatus?.("verifying");
  return verifySiwsMessage({
    message,
    signature: toBase64(signature),
    publicKey: args.publicKey,
    path: args.verifyPath,
    referralCode: args.referralCode,
    attributionSource: args.attributionSource,
    attributionMetadata: args.attributionMetadata
  });
}

export async function persistReferralIntent(input: {
  referralCode: string;
  attributionSource: "link" | "manual" | "deep_link" | "unknown";
  capturedAt?: string;
  metadata?: Record<string, unknown>;
}): Promise<NonNullable<ReferralIntentResponse["intent"]>> {
  const response = await fetch("/api/auth/referral-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  const payload = await readJsonPayload<ReferralIntentResponse>(response, "Could not persist referral intent.");

  if (!response.ok || !payload.intent) {
    throw new Error(payload.error ?? "Could not persist referral intent.");
  }

  return payload.intent;
}
