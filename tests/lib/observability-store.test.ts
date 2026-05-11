import { beforeEach, describe, expect, it } from "vitest";

import {
  recordAnalyticsEvent,
  recordOperabilityLog,
  resetObservabilityStateForTests,
  summarizeAnalytics,
  listOperabilityLogs
} from "@/lib/observability";

describe("lib/observability store", () => {
  beforeEach(() => {
    resetObservabilityStateForTests();
  });

  it("records analytics events and summarizes by event type", () => {
    recordAnalyticsEvent({ eventType: "page_view", path: "/" });
    recordAnalyticsEvent({ eventType: "route_change", path: "/knowledge", fromPath: "/" });
    recordAnalyticsEvent({ eventType: "cta_click", path: "/", ctaLabel: "Start now" });

    const summary = summarizeAnalytics(60);

    expect(summary.totalEvents).toBe(3);
    expect(summary.byType.page_view).toBe(1);
    expect(summary.byType.route_change).toBe(1);
    expect(summary.byType.cta_click).toBe(1);
    expect(summary.topPaths[0]?.path).toBe("/");
  });

  it("sanitizes and stores operability logs", () => {
    recordOperabilityLog({
      level: "warn",
      event: "health.snapshot",
      message: "Missing SITE_URL",
      context: {
        reason: "missing config",
        statusCode: 503
      }
    });

    const entries = listOperabilityLogs(10);

    expect(entries).toHaveLength(1);
    expect(entries[0]?.event).toBe("health.snapshot");
    expect(entries[0]?.context.reason).toBe("missing config");
    expect(entries[0]?.context.statusCode).toBe(503);
  });
});
