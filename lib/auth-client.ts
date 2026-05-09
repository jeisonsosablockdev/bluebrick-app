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

export type AuthMeResponse = {
  authenticated: boolean;
  pubkey: string | null;
  role?: "user" | "admin";
};

type StartSiwsArgs = {
  publicKey: string;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  statement: string;
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

export async function fetchNonce(): Promise<string> {
  const response = await fetch("/api/auth/nonce", { method: "GET" });
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
  referralCode?: string;
  attributionSource?: "link" | "manual" | "deep_link" | "unknown";
  attributionMetadata?: Record<string, unknown>;
}): Promise<{ publicKey: string; isNewUser: boolean; referralBindingOutcome?: string | null }> {
  const response = await fetch("/api/auth/verify", {
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
  const nonce = await fetchNonce();
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
    referralCode: args.referralCode,
    attributionSource: args.attributionSource,
    attributionMetadata: args.attributionMetadata
  });
}
