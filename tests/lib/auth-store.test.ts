import { describe, expect, it } from "vitest";

import {
  consumeNonce,
  createSession,
  getSessionMaxAgeSeconds,
  getSessionPublicKey,
  hasUsableNonce,
  issueNonce,
  revokeSession
} from "@/lib/auth-store";

describe("lib/auth-store", () => {
  it("issues nonces that can be consumed once", () => {
    const nonce = issueNonce();

    expect(hasUsableNonce(nonce)).toBe(true);
    expect(consumeNonce(nonce)).toBe(true);
    expect(hasUsableNonce(nonce)).toBe(false);
    expect(consumeNonce(nonce)).toBe(false);
  });

  it("creates and revokes sessions", () => {
    const walletPubkey = "wallet-pubkey-test";
    const sessionToken = createSession(walletPubkey);

    expect(getSessionPublicKey(sessionToken)).toBe(walletPubkey);

    revokeSession(sessionToken);
    expect(getSessionPublicKey(sessionToken)).toBeNull();
  });

  it("exposes session TTL as max-age seconds", () => {
    expect(getSessionMaxAgeSeconds()).toBe(86400);
  });
});
