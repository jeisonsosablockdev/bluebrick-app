import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const appAuthMocks = vi.hoisted(() => ({
  resolveAppAuthContext: vi.fn()
}));

vi.mock("@/lib/app-auth", () => ({
  resolveAppAuthContext: appAuthMocks.resolveAppAuthContext
}));

import { GET } from "@/app/api/auth/me/route";

describe("GET /api/auth/me", () => {
  beforeEach(() => {
    appAuthMocks.resolveAppAuthContext.mockResolvedValue({
      federatedAvailable: false,
      accountAuthenticated: false,
      federatedAuthenticated: false,
      walletAuthenticated: false,
      sessionConflict: false,
      accountId: null,
      workosUserId: null,
      workosSessionId: null,
      workosEmail: null,
      walletPublicKey: null,
      role: undefined,
      authMethod: "anonymous"
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns anonymous auth payload when no session exists", async () => {
    const response = await GET();
    const payload = await response.json();

    expect(payload).toEqual({
      authenticated: false,
      federatedAvailable: false,
      accountAuthenticated: false,
      federatedAuthenticated: false,
      walletAuthenticated: false,
      sessionConflict: false,
      authMethod: "anonymous",
      accountId: null,
      workosUserId: null,
      email: null,
      pubkey: null
    });
  });

  it("returns hybrid session details when both auth layers are active", async () => {
    appAuthMocks.resolveAppAuthContext.mockResolvedValue({
      federatedAvailable: true,
      accountAuthenticated: true,
      federatedAuthenticated: true,
      walletAuthenticated: true,
      sessionConflict: false,
      accountId: "account_123",
      workosUserId: "user_123",
      workosSessionId: "session_123",
      workosEmail: "user@example.com",
      walletPublicKey: "Wallet111",
      role: "admin",
      authMethod: "hybrid"
    });

    const response = await GET();
    const payload = await response.json();

    expect(payload).toMatchObject({
      authenticated: true,
      federatedAvailable: true,
      accountAuthenticated: true,
      federatedAuthenticated: true,
      walletAuthenticated: true,
      sessionConflict: false,
      accountId: "account_123",
      workosUserId: "user_123",
      email: "user@example.com",
      pubkey: "Wallet111",
      role: "admin",
      authMethod: "hybrid"
    });
  });

  it("reports sessionConflict when WorkOS and wallet sessions disagree", async () => {
    appAuthMocks.resolveAppAuthContext.mockResolvedValue({
      federatedAvailable: true,
      accountAuthenticated: false,
      federatedAuthenticated: true,
      walletAuthenticated: false,
      sessionConflict: true,
      accountId: null,
      workosUserId: "user_123",
      workosSessionId: "session_123",
      workosEmail: "user@example.com",
      walletPublicKey: null,
      role: undefined,
      authMethod: "anonymous"
    });

    const response = await GET();
    const payload = await response.json();

    expect(payload.sessionConflict).toBe(true);
    expect(payload.authenticated).toBe(false);
    expect(payload.pubkey).toBeNull();
  });
});
