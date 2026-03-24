import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchAdminDashboardOverview,
  fetchAdminMonitoringEvents,
  fetchAdminSalesOverview,
  reprocessAdminMonitoringEvent
} from "@/lib/admin-metrics-client";

function createJsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" }
  });
}

describe("lib/admin-metrics-client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls dashboard endpoint with normalized range", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createJsonResponse({ ok: true, data: { meta: { range: "24h" } } })
    );

    await fetchAdminDashboardOverview({ range: "invalid" });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/admin/dashboard/overview?range=24h",
      expect.objectContaining({ method: "GET", cache: "no-store" })
    );
  });

  it("passes monitoring filters to query string", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createJsonResponse({ ok: true, data: { events: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }, meta: { lastSyncedAt: null, dataFreshness: "stale", source: "webhook-reconciled" } } })
    );

    await fetchAdminMonitoringEvents({
      eventType: "NFT_SALE",
      status: "failed",
      wallet: "Wallet111",
      asset: "asset-1",
      signature: "sig-1",
      page: 2,
      limit: 10
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/admin/monitoring/events?eventType=NFT_SALE&status=failed&wallet=Wallet111&asset=asset-1&signature=sig-1&page=2&limit=10",
      expect.objectContaining({ method: "GET", cache: "no-store" })
    );
  });

  it("throws API message on non-ok response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createJsonResponse(
        {
          error: {
            message: "boom"
          }
        },
        500
      )
    );

    await expect(fetchAdminSalesOverview({ range: "7d" })).rejects.toThrow("boom");
  });

  it("calls monitoring reprocess endpoint", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createJsonResponse({
        ok: true,
        data: {
          eventId: "event-1",
          signature: "sig-1",
          eventType: "NFT_SALE",
          status: "confirmed",
          reconciled: true
        }
      })
    );

    const response = await reprocessAdminMonitoringEvent({ eventId: "event-1" });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/admin/monitoring/events/event-1/reprocess",
      expect.objectContaining({ method: "POST", cache: "no-store" })
    );
    expect(response.reconciled).toBe(true);
  });
});
