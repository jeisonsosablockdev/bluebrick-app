import { describe, expect, it } from "vitest";

import {
  assertWebPushDeliveryEnabled,
  assertWebPushRegistrationEnabled,
  isPwaInstallabilityEnabled
} from "@/lib/notifications/rollout";

describe("lib/notifications/rollout", () => {
  it("treats installability as enabled unless the public flag disables it", () => {
    delete process.env.NEXT_PUBLIC_ENABLE_PWA_INSTALLABILITY;
    expect(isPwaInstallabilityEnabled()).toBe(true);

    process.env.NEXT_PUBLIC_ENABLE_PWA_INSTALLABILITY = "false";
    expect(isPwaInstallabilityEnabled()).toBe(false);
  });

  it("blocks registration and delivery when rollout switches are disabled", () => {
    process.env.ENABLE_WEB_PUSH_SUBSCRIPTIONS = "false";
    process.env.ENABLE_WEB_PUSH_DELIVERY = "false";

    expect(() => assertWebPushRegistrationEnabled()).toThrow(/disabled/i);
    expect(() => assertWebPushDeliveryEnabled()).toThrow(/disabled/i);
  });
});
