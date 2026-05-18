import { afterEach, describe, expect, it } from "vitest";

import {
  __resetWebPushSubscriptionRepositoryStateForTests,
  findWebPushSubscriptionByEndpoint,
  listWebPushSubscriptionsByWallet,
  revokeWebPushSubscription,
  upsertWebPushSubscription,
  WebPushSubscriptionRepositoryError
} from "@/lib/notifications/web-push-subscriptions-repository";

function clearDatabaseUrl(): void {
  delete process.env.DATABASE_URL;
}

describe("lib/notifications/web-push-subscriptions-repository", () => {
  afterEach(() => {
    clearDatabaseUrl();
    __resetWebPushSubscriptionRepositoryStateForTests();
  });

  it("creates and lists wallet-bound subscriptions without a database", async () => {
    clearDatabaseUrl();

    const created = await upsertWebPushSubscription({
      accountId: "account_123",
      walletPublicKey: "Wallet111",
      endpoint: "https://push.example.com/subscriptions/abc",
      p256dh: "p256dh_abc",
      authSecret: "auth_abc",
      userAgent: "Mozilla/5.0",
      platformFamily: "ios",
      appMode: "standalone",
      consentSource: "protected_profile"
    });

    expect(created.status).toBe("active");
    expect(created.platformFamily).toBe("ios");
    expect(created.appMode).toBe("standalone");

    const items = await listWebPushSubscriptionsByWallet("account_123", "Wallet111");
    expect(items).toHaveLength(1);
    expect(items[0].endpoint).toBe("https://push.example.com/subscriptions/abc");
  });

  it("rejects endpoint ownership takeover attempts", async () => {
    clearDatabaseUrl();

    await upsertWebPushSubscription({
      accountId: "account_123",
      walletPublicKey: "Wallet111",
      endpoint: "https://push.example.com/subscriptions/shared",
      p256dh: "p256dh_abc",
      authSecret: "auth_abc",
      userAgent: "Mozilla/5.0",
      platformFamily: "desktop",
      appMode: "browser",
      consentSource: "protected_profile"
    });

    await expect(
      upsertWebPushSubscription({
        accountId: "account_999",
        walletPublicKey: "Wallet999",
        endpoint: "https://push.example.com/subscriptions/shared",
        p256dh: "p256dh_other",
        authSecret: "auth_other",
        userAgent: "OtherBrowser",
        platformFamily: "desktop",
        appMode: "browser",
        consentSource: "protected_profile"
      })
    ).rejects.toMatchObject({
      code: "SUBSCRIPTION_OWNERSHIP_MISMATCH"
    } satisfies Partial<WebPushSubscriptionRepositoryError>);
  });

  it("supports revoke and later re-register on the same endpoint", async () => {
    clearDatabaseUrl();

    await upsertWebPushSubscription({
      accountId: "account_123",
      walletPublicKey: "Wallet111",
      endpoint: "https://push.example.com/subscriptions/revive",
      p256dh: "p256dh_1",
      authSecret: "auth_1",
      userAgent: "Mozilla/5.0",
      platformFamily: "android",
      appMode: "browser",
      consentSource: "protected_profile"
    });

    const revoked = await revokeWebPushSubscription({
      accountId: "account_123",
      walletPublicKey: "Wallet111",
      endpoint: "https://push.example.com/subscriptions/revive"
    });

    expect(revoked?.status).toBe("revoked");
    expect(revoked?.revokedAt).not.toBeNull();

    const reRegistered = await upsertWebPushSubscription({
      accountId: "account_123",
      walletPublicKey: "Wallet111",
      endpoint: "https://push.example.com/subscriptions/revive",
      p256dh: "p256dh_2",
      authSecret: "auth_2",
      userAgent: "Mozilla/5.0",
      platformFamily: "android",
      appMode: "standalone",
      consentSource: "protected_profile"
    });

    expect(reRegistered.status).toBe("active");
    expect(reRegistered.revokedAt).toBeNull();
    expect(reRegistered.appMode).toBe("standalone");

    const resolved = await findWebPushSubscriptionByEndpoint("https://push.example.com/subscriptions/revive");
    expect(resolved?.status).toBe("active");
    expect(resolved?.p256dh).toBe("p256dh_2");
  });
});
