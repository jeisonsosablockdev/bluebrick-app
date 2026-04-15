import { PERFORMANCE_BASELINE, readRuntimePerformanceSnapshot } from "./performance";
import { summarizeAnalytics } from "./store";

export type HealthSnapshot = {
  status: "ok" | "degraded";
  timestamp: string;
  uptimeSeconds: number;
  checks: {
    nodeEnv: string;
    siteUrlConfigured: boolean;
    solanaRpcConfigured: boolean;
    cspReportOnly: boolean;
  };
  observability: {
    analyticsWindowMinutes: number;
    analyticsTotalEvents: number;
    latestAnalyticsEventAt: string | null;
  };
  performance: {
    baseline: typeof PERFORMANCE_BASELINE;
    runtime: ReturnType<typeof readRuntimePerformanceSnapshot>;
  };
};

function readNodeEnv(): string {
  return process.env.NODE_ENV?.trim() || "development";
}

export function buildHealthSnapshot(input?: { analyticsWindowMinutes?: number }): HealthSnapshot {
  const analyticsWindowMinutes = input?.analyticsWindowMinutes ?? 60;
  const analytics = summarizeAnalytics(analyticsWindowMinutes);
  const runtime = readRuntimePerformanceSnapshot();

  const checks = {
    nodeEnv: readNodeEnv(),
    siteUrlConfigured: Boolean(process.env.NEXT_PUBLIC_SITE_URL?.trim()),
    solanaRpcConfigured: Boolean(process.env.SOLANA_RPC_URL?.trim()),
    cspReportOnly: process.env.CSP_REPORT_ONLY?.trim().toLowerCase() === "true"
  };

  const isDegraded = !checks.siteUrlConfigured || !checks.solanaRpcConfigured;

  return {
    status: isDegraded ? "degraded" : "ok",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    checks,
    observability: {
      analyticsWindowMinutes: analytics.windowMinutes,
      analyticsTotalEvents: analytics.totalEvents,
      latestAnalyticsEventAt: analytics.latestEventAt
    },
    performance: {
      baseline: PERFORMANCE_BASELINE,
      runtime
    }
  };
}
