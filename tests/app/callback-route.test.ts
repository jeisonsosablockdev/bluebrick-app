import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authkitMocks = vi.hoisted(() => ({
  handleAuth: vi.fn()
}));

const accountRepositoryMocks = vi.hoisted(() => ({
  ensureFederatedAccount: vi.fn()
}));

const profileRepositoryMocks = vi.hoisted(() => ({
  applyFederatedEmailPrefill: vi.fn()
}));

const workosConfigMocks = vi.hoisted(() => ({
  isWorkosConfigured: vi.fn()
}));

vi.mock("@workos-inc/authkit-nextjs", () => ({
  handleAuth: authkitMocks.handleAuth
}));

vi.mock("@/lib/accounts/repository", () => ({
  ensureFederatedAccount: accountRepositoryMocks.ensureFederatedAccount
}));

vi.mock("@/lib/compliance/profile-repository", () => ({
  applyFederatedEmailPrefill: profileRepositoryMocks.applyFederatedEmailPrefill
}));

vi.mock("@/lib/workos/config", () => ({
  isWorkosConfigured: workosConfigMocks.isWorkosConfigured
}));

describe("GET /callback", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    authkitMocks.handleAuth.mockImplementation(() => vi.fn(async () => new NextResponse(null, { status: 204 })));
    workosConfigMocks.isWorkosConfigured.mockReturnValue(true);
    profileRepositoryMocks.applyFederatedEmailPrefill.mockResolvedValue(undefined);
  });

  it("redirects home when WorkOS is not configured", async () => {
    workosConfigMocks.isWorkosConfigured.mockReturnValue(false);
    const { GET } = await import("@/app/callback/route");

    const response = await GET(new NextRequest("https://example.com/callback?code=abc&state=xyz"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.com/");
  });

  it("prefills wallet profile email when the federated account already has a primary wallet", async () => {
    await import("@/app/callback/route");

    const config = authkitMocks.handleAuth.mock.calls[0][0] as {
      onSuccess: (params: {
        user: { id: string; email: string; emailVerified: boolean };
      }) => Promise<void>;
    };

    accountRepositoryMocks.ensureFederatedAccount.mockResolvedValue({
      account: {
        id: "account_123",
        primaryWalletPublicKey: "Wallet111"
      }
    });

    await config.onSuccess({
      user: {
        id: "user_123",
        email: "user@example.com",
        emailVerified: true
      }
    });

    expect(accountRepositoryMocks.ensureFederatedAccount).toHaveBeenCalledWith({
      workosUserId: "user_123",
      email: "user@example.com",
      emailVerified: true
    });
    expect(profileRepositoryMocks.applyFederatedEmailPrefill).toHaveBeenCalledWith({
      walletPublicKey: "Wallet111",
      email: "user@example.com"
    });
  });

  it("skips profile prefill when the federated account has no linked wallet yet", async () => {
    await import("@/app/callback/route");

    const config = authkitMocks.handleAuth.mock.calls[0][0] as {
      onSuccess: (params: {
        user: { id: string; email: string; emailVerified: boolean };
      }) => Promise<void>;
    };

    accountRepositoryMocks.ensureFederatedAccount.mockResolvedValue({
      account: {
        id: "account_123",
        primaryWalletPublicKey: null
      }
    });

    await config.onSuccess({
      user: {
        id: "user_123",
        email: "user@example.com",
        emailVerified: true
      }
    });

    expect(profileRepositoryMocks.applyFederatedEmailPrefill).not.toHaveBeenCalled();
  });
});
