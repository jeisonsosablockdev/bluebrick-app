import { describe, expect, it } from "vitest";

import type { AuthMeResponse } from "@/lib/auth-client";
import { areAuthMeResponsesEquivalent } from "@/features/shared/auth/domain/auth-state";

const BASE_AUTH: AuthMeResponse = {
  authenticated: true,
  accountAuthenticated: true,
  federatedAuthenticated: false,
  walletAuthenticated: true,
  federatedAvailable: true,
  authMethod: "wallet",
  accountId: "account_123",
  workosUserId: null,
  email: null,
  pubkey: "Wallet11111111111111111111111111111111111",
  role: "user"
};

describe("auth state helpers", () => {
  it("treats equivalent auth payloads as unchanged", () => {
    expect(areAuthMeResponsesEquivalent(BASE_AUTH, { ...BASE_AUTH })).toBe(true);
  });

  it("detects auth role changes", () => {
    expect(areAuthMeResponsesEquivalent(BASE_AUTH, { ...BASE_AUTH, role: "admin" })).toBe(false);
  });

  it("detects public key changes", () => {
    expect(areAuthMeResponsesEquivalent(BASE_AUTH, {
      ...BASE_AUTH,
      pubkey: "Wallet22222222222222222222222222222222222"
    })).toBe(false);
  });

  it("detects federated availability changes", () => {
    expect(areAuthMeResponsesEquivalent(BASE_AUTH, {
      ...BASE_AUTH,
      federatedAvailable: false
    })).toBe(false);
  });

  it("detects optional account flag changes", () => {
    expect(areAuthMeResponsesEquivalent(BASE_AUTH, {
      ...BASE_AUTH,
      accountAuthenticated: false
    })).toBe(false);
  });
});
