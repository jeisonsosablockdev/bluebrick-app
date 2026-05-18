import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  requireWalletBoundAuth: vi.fn()
}));

const repositoryMocks = vi.hoisted(() => ({
  listWebPushSubscriptionsByWallet: vi.fn(),
  revokeWebPushSubscription: vi.fn(),
  upsertWebPushSubscription: vi.fn()
}));

vi.mock("@/lib/notifications/web-push-route-auth", () => ({
  requireWalletBoundAuth: authMocks.requireWalletBoundAuth
}));

vi.mock("@/lib/notifications/web-push-subscriptions-repository", () => ({
  WebPushSubscriptionRepositoryError: class WebPushSubscriptionRepositoryError extends Error {
    code: string;

    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
  listWebPushSubscriptionsByWallet: repositoryMocks.listWebPushSubscriptionsByWallet,
  revokeWebPushSubscription: repositoryMocks.revokeWebPushSubscription,
  upsertWebPushSubscription: repositoryMocks.upsertWebPushSubscription
}));

import { DELETE, GET, POST } from "@/app/api/notifications/subscriptions/route";

function createWalletAuthContext() {
  return {
    accountId: "account_123",
    walletPublicKey: "Wallet111"
  };
}

describe("/api/notifications/subscriptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.requireWalletBoundAuth.mockResolvedValue(createWalletAuthContext());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("rejects account-only sessions for subscription ownership routes", async () => {
    authMocks.requireWalletBoundAuth.mockResolvedValue(
      NextResponse.json(
        {
          ok: false,
          error: {
            code: "WALLET_AUTH_REQUIRED"
          }
        },
        { status: 403 }
      )
    );

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload).toMatchObject({
      ok: false,
      error: {
        code: "WALLET_AUTH_REQUIRED"
      }
    });
  });

  it("upserts a subscription using only server-resolved ownership", async () => {
    repositoryMocks.upsertWebPushSubscription.mockResolvedValue({
      id: "sub_123",
      accountId: "account_123",
      walletPublicKey: "Wallet111",
      endpoint: "https://push.example.com/subscriptions/abc",
      p256dh: "p256dh_abc",
      authSecret: "auth_abc",
      userAgent: "Vitest Browser",
      platformFamily: "ios",
      appMode: "standalone",
      status: "active",
      consentSource: "protected_profile",
      subscribedAt: "2026-05-11T00:00:00.000Z",
      lastSeenAt: "2026-05-11T00:00:00.000Z",
      lastSentAt: null,
      lastErrorCode: null,
      lastErrorAt: null,
      revokedAt: null
    });

    const request = new NextRequest("https://example.com/api/notifications/subscriptions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "Vitest Browser"
      },
      body: JSON.stringify({
        accountId: "evil_account",
        walletPublicKey: "evil_wallet",
        subscription: {
          endpoint: "https://push.example.com/subscriptions/abc",
          keys: {
            p256dh: "p256dh_abc",
            auth: "auth_abc"
          }
        },
        platformFamily: "ios",
        appMode: "standalone",
        consentSource: "protected_profile"
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(repositoryMocks.upsertWebPushSubscription).toHaveBeenCalledWith({
      accountId: "account_123",
      walletPublicKey: "Wallet111",
      endpoint: "https://push.example.com/subscriptions/abc",
      p256dh: "p256dh_abc",
      authSecret: "auth_abc",
      userAgent: "Vitest Browser",
      platformFamily: "ios",
      appMode: "standalone",
      consentSource: "protected_profile"
    });
    expect(payload.data.accountId).toBe("account_123");
    expect(payload.data.walletPublicKey).toBe("Wallet111");
  });

  it("lists wallet-bound subscriptions without leaking cryptographic keys back to the client", async () => {
    repositoryMocks.listWebPushSubscriptionsByWallet.mockResolvedValue([
      {
        id: "sub_123",
        accountId: "account_123",
        walletPublicKey: "Wallet111",
        endpoint: "https://push.example.com/subscriptions/abc",
        p256dh: "p256dh_abc",
        authSecret: "auth_abc",
        userAgent: "Vitest Browser",
        platformFamily: "desktop",
        appMode: "browser",
        status: "active",
        consentSource: "protected_profile",
        subscribedAt: "2026-05-11T00:00:00.000Z",
        lastSeenAt: "2026-05-11T00:00:00.000Z",
        lastSentAt: null,
        lastErrorCode: null,
        lastErrorAt: null,
        revokedAt: null
      }
    ]);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.items[0]).not.toHaveProperty("p256dh");
    expect(payload.data.items[0]).not.toHaveProperty("authSecret");
    expect(payload.data.items[0].endpoint).toBe("https://push.example.com/subscriptions/abc");
  });

  it("blocks registration when rollout disables new web push subscriptions", async () => {
    process.env.ENABLE_WEB_PUSH_SUBSCRIPTIONS = "false";

    const request = new NextRequest("https://example.com/api/notifications/subscriptions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "Vitest Browser"
      },
      body: JSON.stringify({
        subscription: {
          endpoint: "https://push.example.com/subscriptions/blocked",
          keys: {
            p256dh: "p256dh_blocked",
            auth: "auth_blocked"
          }
        }
      })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.error.code).toBe("WEB_PUSH_REGISTRATION_DISABLED");

    delete process.env.ENABLE_WEB_PUSH_SUBSCRIPTIONS;
  });

  it("revokes an owned endpoint and returns 404 when nothing exists", async () => {
    repositoryMocks.revokeWebPushSubscription.mockResolvedValueOnce({
      id: "sub_123",
      accountId: "account_123",
      walletPublicKey: "Wallet111",
      endpoint: "https://push.example.com/subscriptions/abc",
      p256dh: "p256dh_abc",
      authSecret: "auth_abc",
      userAgent: "Vitest Browser",
      platformFamily: "desktop",
      appMode: "browser",
      status: "revoked",
      consentSource: "protected_profile",
      subscribedAt: "2026-05-11T00:00:00.000Z",
      lastSeenAt: "2026-05-11T00:00:00.000Z",
      lastSentAt: null,
      lastErrorCode: null,
      lastErrorAt: null,
      revokedAt: "2026-05-11T01:00:00.000Z"
    });

    const firstResponse = await DELETE(
      new NextRequest("https://example.com/api/notifications/subscriptions", {
        method: "DELETE",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          endpoint: "https://push.example.com/subscriptions/abc"
        })
      })
    );

    expect(firstResponse.status).toBe(200);

    repositoryMocks.revokeWebPushSubscription.mockResolvedValueOnce(null);

    const secondResponse = await DELETE(
      new NextRequest("https://example.com/api/notifications/subscriptions", {
        method: "DELETE",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          endpoint: "https://push.example.com/subscriptions/missing"
        })
      })
    );

    const secondPayload = await secondResponse.json();
    expect(secondResponse.status).toBe(404);
    expect(secondPayload.error.code).toBe("SUBSCRIPTION_NOT_FOUND");
  });
});
