import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";

import { POST } from "@/app/api/analytics/events/route";
import { resetObservabilityStateForTests, summarizeAnalytics } from "@/lib/observability";

function createRequest(payload: unknown): NextRequest {
  return new NextRequest("https://example.com/api/analytics/events", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      "content-type": "application/json"
    }
  });
}

describe("POST /api/analytics/events", () => {
  beforeEach(() => {
    resetObservabilityStateForTests();
  });

  it("accepts valid analytics payload", async () => {
    const response = await POST(
      createRequest({
        eventType: "page_view",
        path: "/knowledge"
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(202);
    expect(payload.ok).toBe(true);

    const summary = summarizeAnalytics(60);
    expect(summary.byType.page_view).toBe(1);
  });

  it("rejects invalid event payload", async () => {
    const response = await POST(
      createRequest({
        eventType: "unsupported_event"
      })
    );

    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("INVALID_ANALYTICS_PAYLOAD");
  });
});
