import { createHmac, randomBytes, timingSafeEqual } from "crypto";

type NonceRecord = {
  expiresAt: number;
};

const NONCE_TTL_MS = 5 * 60 * 1000;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const NONCE_TOKEN_KIND = "siws-nonce";
const SESSION_TOKEN_KIND = "siws-session";
const WALLET_LINK_TOKEN_KIND = "wallet-link";

type WalletLinkContextRecord = {
  accountId: string;
  workosUserId: string;
  workosSessionId: string;
  nonce: string;
  expiresAt: number;
};

type AuthStoreState = {
  nonces: Map<string, NonceRecord>;
  revokedSessionTokens: Map<string, number>;
  walletLinkContexts: Map<string, WalletLinkContextRecord>;
};

function getStore(): AuthStoreState {
  const scopedGlobal = globalThis as typeof globalThis & { __authStore?: AuthStoreState };
  scopedGlobal.__authStore ??= {
    nonces: new Map(),
    revokedSessionTokens: new Map(),
    walletLinkContexts: new Map()
  };
  return scopedGlobal.__authStore;
}

function purgeExpired(): void {
  const now = Date.now();
  const store = getStore();

  for (const [nonce, record] of store.nonces) {
    if (record.expiresAt <= now) {
      store.nonces.delete(nonce);
    }
  }

  for (const [sessionToken, expiresAt] of store.revokedSessionTokens) {
    if (expiresAt <= now) {
      store.revokedSessionTokens.delete(sessionToken);
    }
  }

  for (const [contextId, context] of store.walletLinkContexts) {
    if (context.expiresAt <= now) {
      store.walletLinkContexts.delete(contextId);
    }
  }
}

function generateToken(size = 24): string {
  return randomBytes(size).toString("base64url");
}

type SignedAuthPayload = {
  kind: typeof NONCE_TOKEN_KIND | typeof SESSION_TOKEN_KIND | typeof WALLET_LINK_TOKEN_KIND;
  exp: number;
  nonce?: string;
  pubkey?: string;
  contextId?: string;
};

function getSiwsTokenSecret(): string {
  const envSecret = process.env.SIWS_TOKEN_SECRET?.trim();
  if (envSecret) {
    return envSecret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("SIWS_TOKEN_SECRET is required in production.");
  }

  return "dev-insecure-siws-token-secret-change-me";
}

function signTokenPayload(payloadB64: string): string {
  return createHmac("sha256", getSiwsTokenSecret()).update(payloadB64).digest("base64url");
}

function encodeSignedToken(payload: SignedAuthPayload): string {
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signatureB64 = signTokenPayload(payloadB64);
  return `${payloadB64}.${signatureB64}`;
}

function parseSignedToken(token: string): SignedAuthPayload | null {
  const dotIndex = token.lastIndexOf(".");
  if (dotIndex <= 0 || dotIndex === token.length - 1) {
    return null;
  }

  const payloadB64 = token.slice(0, dotIndex);
  const signatureB64 = token.slice(dotIndex + 1);

  const expectedSignature = signTokenPayload(payloadB64);
  const provided = Buffer.from(signatureB64, "utf8");
  const expected = Buffer.from(expectedSignature, "utf8");

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as SignedAuthPayload;
    if (
      !payload
      || (payload.kind !== NONCE_TOKEN_KIND && payload.kind !== SESSION_TOKEN_KIND && payload.kind !== WALLET_LINK_TOKEN_KIND)
      || !Number.isFinite(payload.exp)
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function isPayloadExpired(payload: SignedAuthPayload): boolean {
  return payload.exp <= Date.now();
}

export function issueNonce(): string {
  purgeExpired();
  const nonce = generateToken(18);
  getStore().nonces.set(nonce, { expiresAt: Date.now() + NONCE_TTL_MS });
  return nonce;
}

export function getNonceMaxAgeSeconds(): number {
  return Math.floor(NONCE_TTL_MS / 1000);
}

export function createNonceToken(nonce: string): string {
  const normalizedNonce = nonce.trim();
  if (!normalizedNonce) {
    throw new Error("Nonce is required.");
  }

  return encodeSignedToken({
    kind: NONCE_TOKEN_KIND,
    nonce: normalizedNonce,
    exp: Date.now() + NONCE_TTL_MS
  });
}

export function readNonceFromToken(token: string): string | null {
  const payload = parseSignedToken(token);

  if (!payload || payload.kind !== NONCE_TOKEN_KIND || !payload.nonce || isPayloadExpired(payload)) {
    return null;
  }

  return payload.nonce;
}

export function hasUsableNonce(nonce: string): boolean {
  purgeExpired();
  return getStore().nonces.has(nonce);
}

export function consumeNonce(nonce: string): boolean {
  purgeExpired();
  return getStore().nonces.delete(nonce);
}

export function createSession(publicKey: string): string {
  purgeExpired();
  const normalizedPublicKey = publicKey.trim();

  if (!normalizedPublicKey) {
    throw new Error("Public key is required.");
  }

  return encodeSignedToken({
    kind: SESSION_TOKEN_KIND,
    pubkey: normalizedPublicKey,
    exp: Date.now() + SESSION_TTL_MS
  });
}

export function getSessionPublicKey(sessionToken: string): string | null {
  purgeExpired();
  if (getStore().revokedSessionTokens.has(sessionToken)) {
    return null;
  }

  const payload = parseSignedToken(sessionToken);

  if (!payload || payload.kind !== SESSION_TOKEN_KIND || !payload.pubkey || isPayloadExpired(payload)) {
    return null;
  }

  return payload.pubkey;
}

export function revokeSession(sessionToken: string): void {
  purgeExpired();
  const payload = parseSignedToken(sessionToken);

  if (payload && payload.kind === SESSION_TOKEN_KIND && Number.isFinite(payload.exp)) {
    getStore().revokedSessionTokens.set(sessionToken, payload.exp);
    return;
  }

  getStore().revokedSessionTokens.set(sessionToken, Date.now() + SESSION_TTL_MS);
}

export function getSessionMaxAgeSeconds(): number {
  return Math.floor(SESSION_TTL_MS / 1000);
}

export function createWalletLinkContext(input: {
  accountId: string;
  workosUserId: string;
  workosSessionId?: string | null;
}): {
  nonce: string;
  token: string;
  expiresAt: number;
} {
  purgeExpired();

  const accountId = input.accountId.trim();
  const workosUserId = input.workosUserId.trim();
  const workosSessionId = input.workosSessionId?.trim() || "";

  if (!accountId || !workosUserId) {
    throw new Error("Wallet link context requires account and WorkOS user ids.");
  }

  const contextId = generateToken(18);
  const nonce = generateToken(18);
  const expiresAt = Date.now() + NONCE_TTL_MS;

  getStore().walletLinkContexts.set(contextId, {
    accountId,
    workosUserId,
    workosSessionId,
    nonce,
    expiresAt
  });

  return {
    nonce,
    expiresAt,
    token: encodeSignedToken({
      kind: WALLET_LINK_TOKEN_KIND,
      contextId,
      exp: expiresAt
    })
  };
}

export function readWalletLinkContext(token: string): (WalletLinkContextRecord & { contextId: string }) | null {
  purgeExpired();
  const payload = parseSignedToken(token);

  if (!payload || payload.kind !== WALLET_LINK_TOKEN_KIND || !payload.contextId || isPayloadExpired(payload)) {
    return null;
  }

  const context = getStore().walletLinkContexts.get(payload.contextId);

  if (!context || context.expiresAt <= Date.now()) {
    return null;
  }

  return {
    contextId: payload.contextId,
    ...context
  };
}

export function clearWalletLinkContext(contextId: string): void {
  purgeExpired();
  getStore().walletLinkContexts.delete(contextId);
}
