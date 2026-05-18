import { NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  requireWalletBoundAuth: vi.fn()
}));

const rolloutMocks = vi.hoisted(() => ({
  assertWebPushRegistrationEnabled: vi.fn()
}));

const runtimeConfigMocks = vi.hoisted(() => ({
  getRequiredNotificationEnv: vi.fn()
}));

const repositoryMocks = vi.hoisted(() => ({
  listWebPushSubscriptionsByWallet: vi.fn()
}));

vi.mock("@/lib/notifications/web-push-route-auth", () => ({
  requireWalletBoundAuth: authMocks.requireWalletBoundAuth
}));

vi.mock("@/lib/notifications/rollout", () => ({
  NotificationsRolloutError: class NotificationsRolloutError extends Error {
    status: number;
    code: string;

    constructor(message: string, status = 503, code = "WEB_PUSH_REGISTRATION_DISABLED") {
      super(message);
      this.status = status;
      this.code = code;
    }
  },
  assertWebPushRegistrationEnabled: rolloutMocks.assertWebPushRegistrationEnabled
}));

vi.mock("@/lib/notifications/runtime-config", () => ({
  getRequiredNotificationEnv: runtimeConfigMocks.getRequiredNotificationEnv
}));

vi.mock("@/lib/notifications/web-push-subscriptions-repository", () => ({
  listWebPushSubscriptionsByWallet: repositoryMocks.listWebPushSubscriptionsByWallet
}));

import { GET } from "@/app/api/notifications/subscriptions/bootstrap/route";

describe("GET /api/notifications/subscriptions/bootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.requireWalletBoundAuth.mockResolvedValue({
      accountId: "account_123",
      walletPublicKey: "Wallet111"
    });
    rolloutMocks.assertWebPushRegistrationEnabled.mockReturnValue(undefined);
    runtimeConfigMocks.getRequiredNotificationEnv.mockReturnValue("test_public_key");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns vapid bootstrap data plus existing wallet-bound subscription records", async () => {
    repositoryMocks.listWebPushSubscriptionsByWallet.mockResolvedValue([
      {
        id: "sub_123",
        endpoint: "https://push.example.com/subscriptions/abc",
        platformFamily: "ios",
        appMode: "standalone",
        status: "active",
        consentSource: "protected_profile_standalone",
        subscribedAt: "2026-05-13T00:00:00.000Z",
        lastSeenAt: "2026-05-13T00:00:00.000Z",
        lastSentAt: null,
        lastErrorCode: null,
        lastErrorAt: null,
        revokedAt: null
      }
    ]);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.vapidPublicKey).toBe("test_public_key");
    expect(payload.data.items[0]).toMatchObject({
      endpoint: "https://push.example.com/subscriptions/abc",
      status: "active",
      platformFamily: "ios",
      appMode: "standalone"
    });
  });

  it("returns the auth response directly when wallet-bound auth is missing", async () => {
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
    expect(payload.error.code).toBe("WALLET_AUTH_REQUIRED");
  });
});
