import { describe, expect, it } from "vitest";

import {
  clearWalletLinkContext,
  consumeNonce,
  createWalletLinkContext,
  createSession,
  getSessionMaxAgeSeconds,
  getSessionPublicKey,
  hasUsableNonce,
  issueNonce,
  readWalletLinkContext,
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

  it("creates wallet link contexts that are single-use", () => {
    const context = createWalletLinkContext({
      accountId: "account_123",
      workosUserId: "user_123",
      workosSessionId: "session_123"
    });

    const resolved = readWalletLinkContext(context.token);

    expect(resolved).toMatchObject({
      accountId: "account_123",
      workosUserId: "user_123",
      workosSessionId: "session_123",
      nonce: context.nonce
    });

    clearWalletLinkContext(resolved?.contextId ?? "");
    expect(readWalletLinkContext(context.token)).toBeNull();
  });

  it("allows wallet link contexts without a stable WorkOS session id", () => {
    const context = createWalletLinkContext({
      accountId: "account_123",
      workosUserId: "user_123"
    });

    const resolved = readWalletLinkContext(context.token);

    expect(resolved).toMatchObject({
      accountId: "account_123",
      workosUserId: "user_123",
      nonce: context.nonce
    });
  });
});
