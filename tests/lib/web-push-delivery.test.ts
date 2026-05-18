import { beforeEach, describe, expect, it, vi } from "vitest";

const webPushMocks = vi.hoisted(() => ({
  sendNotification: vi.fn(),
  setVapidDetails: vi.fn()
}));

vi.mock("web-push", () => ({
  default: {
    sendNotification: webPushMocks.sendNotification,
    setVapidDetails: webPushMocks.setVapidDetails
  }
}));

import {
  __resetWebPushClientForTests,
  buildWebPushPayload,
  sendWebPushEnvelope
} from "@/lib/notifications/web-push-delivery";

describe("lib/notifications/web-push-delivery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetWebPushClientForTests();
    process.env.WEB_PUSH_VAPID_SUBJECT = "mailto:test@example.com";
    process.env.WEB_PUSH_VAPID_PUBLIC_KEY = "public_key";
    process.env.WEB_PUSH_VAPID_PRIVATE_KEY = "private_key";
  });

  it("builds the expected push payload contract", () => {
    const payload = JSON.parse(
      buildWebPushPayload({
        title: "KYC aprobada",
        body: "Tu verificacion fue completada.",
        destinationUrl: "/protected/perfil",
        notificationType: "kyc_status_changed",
        metadata: {
          caseId: "case_123"
        }
      })
    );

    expect(payload).toEqual({
      title: "KYC aprobada",
      body: "Tu verificacion fue completada.",
      url: "/protected/perfil",
      notificationType: "kyc_status_changed",
      metadata: {
        caseId: "case_123"
      }
    });
  });

  it("returns delivered when the push provider accepts the message", async () => {
    webPushMocks.sendNotification.mockResolvedValueOnce({
      statusCode: 201
    });

    const result = await sendWebPushEnvelope(
      {
        endpoint: "https://push.example.com/subscriptions/abc",
        p256dh: "p256dh_abc",
        authSecret: "auth_abc"
      },
      {
        title: "Reward disponible",
        body: "Ya puedes usarlo.",
        destinationUrl: "/protected",
        notificationType: "onboarding_reward_earned"
      }
    );

    expect(webPushMocks.setVapidDetails).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      outcome: "delivered",
      httpStatus: 201,
      errorCode: null,
      errorMessage: null
    });
  });

  it("classifies 410 responses as prunable endpoints", async () => {
    webPushMocks.sendNotification.mockRejectedValueOnce({
      statusCode: 410,
      body: "Gone"
    });

    const result = await sendWebPushEnvelope(
      {
        endpoint: "https://push.example.com/subscriptions/dead",
        p256dh: "p256dh_dead",
        authSecret: "auth_dead"
      },
      {
        title: "Reward disponible",
        body: "Ya puedes usarlo.",
        destinationUrl: "/protected",
        notificationType: "onboarding_reward_earned"
      }
    );

    expect(result).toEqual({
      outcome: "pruned",
      httpStatus: 410,
      errorCode: "HTTP_410",
      errorMessage: "Gone"
    });
  });

  it("classifies non-terminal provider failures without pruning the endpoint", async () => {
    webPushMocks.sendNotification.mockRejectedValueOnce({
      statusCode: 503,
      message: "Provider unavailable"
    });

    const result = await sendWebPushEnvelope(
      {
        endpoint: "https://push.example.com/subscriptions/retry",
        p256dh: "p256dh_retry",
        authSecret: "auth_retry"
      },
      {
        title: "Checkout actualizado",
        body: "Revisa el estado de tu orden.",
        destinationUrl: "/protected/checkout",
        notificationType: "checkout_status_changed"
      }
    );

    expect(result).toEqual({
      outcome: "failed",
      httpStatus: 503,
      errorCode: "HTTP_503",
      errorMessage: "Provider unavailable"
    });
  });
});
