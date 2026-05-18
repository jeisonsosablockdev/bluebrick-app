import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const campaignMocks = vi.hoisted(() => ({
  previewAdminNotificationCampaign: vi.fn(),
  createAdminNotificationCampaign: vi.fn(),
  AdminNotificationCampaignError: class AdminNotificationCampaignError extends Error {
    readonly status: number;
    readonly code: string;

    constructor(message: string, status = 400, code = "ADMIN_NOTIFICATION_CAMPAIGN_ERROR") {
      super(message);
      this.status = status;
      this.code = code;
    }
  },
  getRequestRole: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: campaignMocks.getRequestRole
}));

vi.mock("@/lib/notifications/admin-campaigns", () => ({
  previewAdminNotificationCampaign: campaignMocks.previewAdminNotificationCampaign,
  createAdminNotificationCampaign: campaignMocks.createAdminNotificationCampaign,
  AdminNotificationCampaignError: campaignMocks.AdminNotificationCampaignError
}));

import { POST as previewRoute } from "@/app/api/admin/notifications/campaigns/preview/route";
import { POST as sendRoute } from "@/app/api/admin/notifications/campaigns/send/route";

function createRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

describe("admin notification campaign routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    campaignMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: "AdminPubkey111"
    });
    campaignMocks.previewAdminNotificationCampaign.mockResolvedValue({
      eligibleWalletCount: 2,
      eligibleSubscriptionCount: 3,
      excludedWalletCount: 1,
      blockedReasons: [],
      audienceCap: 100,
      audienceHash: "hash_1234567890abcdef",
      sampleWallets: []
    });
    campaignMocks.createAdminNotificationCampaign.mockResolvedValue({
      campaign: {
        id: "campaign_123",
        status: "queued"
      },
      preview: {
        audienceHash: "hash_1234567890abcdef"
      }
    });
  });

  it("rejects non-admin preview requests", async () => {
    campaignMocks.getRequestRole.mockReturnValueOnce({ authenticated: false });

    const response = await previewRoute(
      createRequest("https://example.com/api/admin/notifications/campaigns/preview", {
        messageClass: "product_update",
        title: "Title",
        body: "Body"
      })
    );

    expect(response.status).toBe(403);
  });

  it("returns a preview summary for an admin wallet session", async () => {
    const response = await previewRoute(
      createRequest("https://example.com/api/admin/notifications/campaigns/preview", {
        messageClass: "product_update",
        title: "Title",
        body: "Body",
        destinationUrl: "/protected",
        segment: {
          country: "CO"
        }
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.eligibleWalletCount).toBe(2);
    expect(campaignMocks.previewAdminNotificationCampaign).toHaveBeenCalledWith(
      expect.objectContaining({
        actorPubkey: "AdminPubkey111"
      })
    );
  });

  it("queues a send request after preview confirmation", async () => {
    const response = await sendRoute(
      createRequest("https://example.com/api/admin/notifications/campaigns/send", {
        messageClass: "ops_notice",
        title: "Title",
        body: "Body",
        destinationUrl: "/protected",
        previewHash: "hash_1234567890abcdef",
        segment: {
          country: "CO"
        }
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(202);
    expect(payload.data.campaign.status).toBe("queued");
    expect(campaignMocks.createAdminNotificationCampaign).toHaveBeenCalledWith(
      expect.objectContaining({
        actorPubkey: "AdminPubkey111",
        dryRun: false
      })
    );
  });

  it("maps governed campaign errors to the route response", async () => {
    campaignMocks.createAdminNotificationCampaign.mockRejectedValueOnce(
      new campaignMocks.AdminNotificationCampaignError("Blocked", 409, "BLOCKED_ADMIN_PUSH_CAMPAIGN")
    );

    const response = await sendRoute(
      createRequest("https://example.com/api/admin/notifications/campaigns/send", {
        messageClass: "ops_notice",
        title: "Title",
        body: "Body",
        previewHash: "hash_1234567890abcdef"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.error.code).toBe("BLOCKED_ADMIN_PUSH_CAMPAIGN");
  });
});
