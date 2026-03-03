import { randomBytes } from "crypto";

type NonceRecord = {
  expiresAt: number;
};

type SessionRecord = {
  publicKey: string;
  expiresAt: number;
};

const NONCE_TTL_MS = 5 * 60 * 1000;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

type AuthStoreState = {
  nonces: Map<string, NonceRecord>;
  sessions: Map<string, SessionRecord>;
};

function getStore(): AuthStoreState {
  const scopedGlobal = globalThis as typeof globalThis & { __authStore?: AuthStoreState };
  scopedGlobal.__authStore ??= { nonces: new Map(), sessions: new Map() };
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

  for (const [sessionToken, record] of store.sessions) {
    if (record.expiresAt <= now) {
      store.sessions.delete(sessionToken);
    }
  }
}

function generateToken(size = 24): string {
  return randomBytes(size).toString("base64url");
}

export function issueNonce(): string {
  purgeExpired();
  const nonce = generateToken(18);
  getStore().nonces.set(nonce, { expiresAt: Date.now() + NONCE_TTL_MS });
  return nonce;
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
  const sessionToken = generateToken(32);
  getStore().sessions.set(sessionToken, {
    publicKey,
    expiresAt: Date.now() + SESSION_TTL_MS
  });
  return sessionToken;
}

export function getSessionPublicKey(sessionToken: string): string | null {
  purgeExpired();
  const session = getStore().sessions.get(sessionToken);
  return session?.publicKey ?? null;
}

export function revokeSession(sessionToken: string): void {
  getStore().sessions.delete(sessionToken);
}

export function getSessionMaxAgeSeconds(): number {
  return Math.floor(SESSION_TTL_MS / 1000);
}

