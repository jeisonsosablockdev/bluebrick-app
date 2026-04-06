import { buildSiwsMessage } from "@/lib/siws";

type NonceResponse = {
  nonce?: string;
};

type VerifyResponse = {
  error?: string;
  publicKey?: string;
  isNewUser?: boolean;
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
  onStatus?: (status: "signing" | "verifying") => void;
};

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

export async function fetchAuthMe(): Promise<AuthMeResponse> {
  const response = await fetch("/api/auth/me", { method: "GET", cache: "no-store" });

  if (!response.ok) {
    throw new Error("Could not read auth session.");
  }

  return (await response.json()) as AuthMeResponse;
}

export async function fetchNonce(): Promise<string> {
  const response = await fetch("/api/auth/nonce", { method: "GET" });
  const payload = (await response.json()) as NonceResponse;

  if (!response.ok || !payload.nonce) {
    throw new Error("Could not fetch nonce.");
  }

  return payload.nonce;
}

export async function verifySiwsMessage(input: { message: string; signature: string; publicKey: string }): Promise<{ publicKey: string; isNewUser: boolean }> {
  const response = await fetch("/api/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  const payload = (await response.json()) as VerifyResponse;

  if (!response.ok) {
    throw new Error(payload.error ?? "Authentication failed.");
  }

  if (!payload.publicKey) {
    throw new Error("Auth response did not include public key.");
  }

  return { publicKey: payload.publicKey, isNewUser: payload.isNewUser ?? false };
}

export async function startSiws(args: StartSiwsArgs): Promise<{ publicKey: string; isNewUser: boolean }> {
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
    publicKey: args.publicKey
  });
}
