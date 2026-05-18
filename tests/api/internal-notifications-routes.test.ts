import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => {
  class MockWebPushDeliveryJobError extends Error {
    readonly status: number;
    readonly code: string;

    constructor(message: string, status = 400, code = "WEB_PUSH_DELIVERY_ERROR") {
      super(message);
      this.name = "WebPushDeliveryJobError";
      this.status = status;
      this.code = code;
    }
  }

  return {
    createOrGetTransactionalWebPushJob: vi.fn(),
    enqueueTransactionalWebPushJob: vi.fn(),
    hasNotificationQueueConfig: vi.fn(),
    processTransactionalWebPushJobBatch: vi.fn(),
    resolveNotificationActor: vi.fn(),
    isNotificationsWorkerRequest: vi.fn(),
    getRequestRole: vi.fn(),
    WebPushDeliveryJobError: MockWebPushDeliveryJobError
  };
});

vi.mock("@/lib/notifications/delivery-jobs", () => ({
  createOrGetTransactionalWebPushJob: routeMocks.createOrGetTransactionalWebPushJob,
  enqueueTransactionalWebPushJob: routeMocks.enqueueTransactionalWebPushJob,
  hasNotificationQueueConfig: routeMocks.hasNotificationQueueConfig,
  isNotificationsWorkerRequest: routeMocks.isNotificationsWorkerRequest,
  processTransactionalWebPushJobBatch: routeMocks.processTransactionalWebPushJobBatch,
  resolveNotificationActor: routeMocks.resolveNotificationActor,
  WebPushDeliveryJobError: routeMocks.WebPushDeliveryJobError
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

import { POST as enqueueRoute } from "@/app/api/internal/notifications/enqueue/route";
import { POST as processRoute } from "@/app/api/internal/notifications/process/route";

const VALID_UUID = "8fbead23-3231-4cb3-84c5-f7394f5df7ef";

function createJsonRequest(url: string, body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers
    },
    body: JSON.stringify(body)
  });
}

describe("internal notifications routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.resolveNotificationActor.mockReturnValue({
      createdByType: "admin",
      createdById: "AdminPubkey111"
    });
    routeMocks.hasNotificationQueueConfig.mockReturnValue(true);
    routeMocks.isNotificationsWorkerRequest.mockReturnValue(false);
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: "AdminPubkey111"
    });
    routeMocks.createOrGetTransactionalWebPushJob.mockResolvedValue({
      inserted: true,
      job: {
        id: VALID_UUID,
        status: "queued"
      }
    });
    routeMocks.enqueueTransactionalWebPushJob.mockResolvedValue(undefined);
    routeMocks.processTransactionalWebPushJobBatch.mockResolvedValue({
      job: {
        id: VALID_UUID,
        status: "completed"
      },
      processedInBatch: 1,
      deliveredInBatch: 1,
      prunedInBatch: 0,
      failedInBatch: 0,
      needsRequeue: false
    });
  });

  it("rejects enqueue when caller is neither admin nor worker", async () => {
    routeMocks.resolveNotificationActor.mockReturnValueOnce(null);

    const response = await enqueueRoute(
      createJsonRequest("https://example.com/api/internal/notifications/enqueue", {
        dedupeKey: "reward:wallet111:evt_1",
        notificationType: "onboarding_reward_earned",
        walletPublicKey: "Wallet11111111111111111111111111111111",
        title: "Reward",
        body: "Disponible"
      })
    );

    expect(response.status).toBe(403);
  });

  it("creates and enqueues a queued transactional job", async () => {
    const response = await enqueueRoute(
      createJsonRequest("https://example.com/api/internal/notifications/enqueue", {
        dedupeKey: "reward:wallet111:evt_1",
        notificationType: "onboarding_reward_earned",
        walletPublicKey: "Wallet11111111111111111111111111111111",
        title: "Reward",
        body: "Disponible",
        destinationUrl: "/protected"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(202);
    expect(payload.queued).toBe(true);
    expect(routeMocks.createOrGetTransactionalWebPushJob).toHaveBeenCalledWith(
      expect.objectContaining({
        createdByType: "admin",
        createdById: "AdminPubkey111"
      })
    );
    expect(routeMocks.enqueueTransactionalWebPushJob).toHaveBeenCalledWith(VALID_UUID);
  });

  it("falls back to inline processing when queue config is absent", async () => {
    routeMocks.hasNotificationQueueConfig.mockReturnValueOnce(false);

    const response = await enqueueRoute(
      createJsonRequest("https://example.com/api/internal/notifications/enqueue", {
        dedupeKey: "reward:wallet111:evt_1",
        notificationType: "onboarding_reward_earned",
        walletPublicKey: "Wallet11111111111111111111111111111111",
        title: "Reward",
        body: "Disponible"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(202);
    expect(payload.fallbackProcessedInline).toBe(true);
    expect(routeMocks.processTransactionalWebPushJobBatch).toHaveBeenCalledWith(VALID_UUID);
    expect(routeMocks.enqueueTransactionalWebPushJob).not.toHaveBeenCalled();
  });

  it("allows worker-token processing and re-enqueues when more work remains", async () => {
    routeMocks.isNotificationsWorkerRequest.mockReturnValueOnce(true);
    routeMocks.processTransactionalWebPushJobBatch.mockResolvedValueOnce({
      job: {
        id: VALID_UUID,
        status: "processing"
      },
      processedInBatch: 25,
      deliveredInBatch: 20,
      prunedInBatch: 3,
      failedInBatch: 2,
      needsRequeue: true
    });

    const response = await processRoute(
      createJsonRequest(
        "https://example.com/api/internal/notifications/process",
        {
          jobId: VALID_UUID
        },
        {
          "x-notifications-worker-token": "secret"
        }
      )
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.needsRequeue).toBe(true);
    expect(routeMocks.enqueueTransactionalWebPushJob).toHaveBeenCalledWith(VALID_UUID);
  });

  it("blocks enqueue when rollout disables delivery", async () => {
    process.env.ENABLE_WEB_PUSH_DELIVERY = "false";

    const response = await enqueueRoute(
      createJsonRequest("https://example.com/api/internal/notifications/enqueue", {
        dedupeKey: "reward:wallet111:evt_1",
        notificationType: "onboarding_reward_earned",
        walletPublicKey: "Wallet11111111111111111111111111111111",
        title: "Reward",
        body: "Disponible"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.error.code).toBe("WEB_PUSH_DELIVERY_DISABLED");

    delete process.env.ENABLE_WEB_PUSH_DELIVERY;
  });
});
