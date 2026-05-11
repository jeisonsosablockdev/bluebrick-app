import type { SanitizedContextValue } from "@/lib/security";

export type AnalyticsEventType =
  | "page_view"
  | "route_change"
  | "scroll_depth"
  | "cta_click"
  | "client_error";

export type AnalyticsEventInput = {
  eventType: AnalyticsEventType;
  path?: unknown;
  fromPath?: unknown;
  scrollDepth?: unknown;
  ctaId?: unknown;
  ctaLabel?: unknown;
  message?: unknown;
  viewportWidth?: unknown;
  viewportHeight?: unknown;
  occurredAt?: unknown;
};

export type AnalyticsEvent = {
  id: string;
  eventType: AnalyticsEventType;
  path: string;
  fromPath: string | null;
  scrollDepth: number | null;
  ctaId: string | null;
  ctaLabel: string | null;
  message: string | null;
  viewportWidth: number | null;
  viewportHeight: number | null;
  occurredAt: string;
  recordedAt: string;
};

export type AnalyticsSummary = {
  windowMinutes: number;
  totalEvents: number;
  byType: Record<AnalyticsEventType, number>;
  topPaths: Array<{ path: string; hits: number }>;
  topCtas: Array<{ ctaLabel: string; clicks: number }>;
  latestEventAt: string | null;
};

export type OperabilityLogLevel = "info" | "warn" | "error";

export type OperabilityLogEntry = {
  id: string;
  level: OperabilityLogLevel;
  event: string;
  message: string;
  context: Record<string, SanitizedContextValue>;
  createdAt: string;
};
