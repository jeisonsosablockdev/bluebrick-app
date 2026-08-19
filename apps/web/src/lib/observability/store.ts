import { randomUUID } from "node:crypto";

import { sanitizeContext, sanitizeInteger, sanitizePath, sanitizeText } from "@/lib/security";

import type {
  AnalyticsEvent,
  AnalyticsEventInput,
  AnalyticsEventType,
  AnalyticsSummary,
  OperabilityLogEntry,
  OperabilityLogLevel
} from "./types";

const MAX_ANALYTICS_EVENTS = 2500;
const MAX_OPERABILITY_LOGS = 500;

const analyticsEvents: AnalyticsEvent[] = [];
const operabilityLogs: OperabilityLogEntry[] = [];

const ANALYTICS_EVENT_TYPES: AnalyticsEventType[] = [
  "page_view",
  "route_change",
  "scroll_depth",
  "cta_click",
  "client_error"
];

function isAnalyticsEventType(value: unknown): value is AnalyticsEventType {
  return typeof value === "string" && ANALYTICS_EVENT_TYPES.includes(value as AnalyticsEventType);
}

function normalizeDateIso(value: unknown): string {
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return new Date().toISOString();
}

function trimBuffer<T>(buffer: T[], maxLength: number): void {
  if (buffer.length <= maxLength) {
    return;
  }

  buffer.splice(0, buffer.length - maxLength);
}

export function recordAnalyticsEvent(input: AnalyticsEventInput): AnalyticsEvent {
  if (!isAnalyticsEventType(input.eventType)) {
    throw new Error("Unsupported analytics event type.");
  }

  const event: AnalyticsEvent = {
    id: randomUUID(),
    eventType: input.eventType,
    path: sanitizePath(input.path),
    fromPath: sanitizeText(input.fromPath, 256) || null,
    scrollDepth: input.eventType === "scroll_depth"
      ? sanitizeInteger(input.scrollDepth, 0, 0, 100)
      : null,
    ctaId: sanitizeText(input.ctaId, 64) || null,
    ctaLabel: sanitizeText(input.ctaLabel, 96) || null,
    message: sanitizeText(input.message, 180) || null,
    viewportWidth: sanitizeInteger(input.viewportWidth, 0, 0, 10000) || null,
    viewportHeight: sanitizeInteger(input.viewportHeight, 0, 0, 10000) || null,
    occurredAt: normalizeDateIso(input.occurredAt),
    recordedAt: new Date().toISOString()
  };

  analyticsEvents.push(event);
  trimBuffer(analyticsEvents, MAX_ANALYTICS_EVENTS);

  return event;
}

export function summarizeAnalytics(windowMinutes = 60): AnalyticsSummary {
  const safeWindowMinutes = sanitizeInteger(windowMinutes, 60, 1, 24 * 7);
  const now = Date.now();
  const minTime = now - safeWindowMinutes * 60 * 1000;

  const byType = ANALYTICS_EVENT_TYPES.reduce<Record<AnalyticsEventType, number>>(
    (acc, type) => {
      acc[type] = 0;
      return acc;
    },
    {
      page_view: 0,
      route_change: 0,
      scroll_depth: 0,
      cta_click: 0,
      client_error: 0
    }
  );

  const pathHits = new Map<string, number>();
  const ctaHits = new Map<string, number>();

  let latestEventAt: string | null = null;
  let totalEvents = 0;

  for (const event of analyticsEvents) {
    const occurredMs = new Date(event.occurredAt).getTime();
    if (!Number.isFinite(occurredMs) || occurredMs < minTime) {
      continue;
    }

    totalEvents += 1;
    byType[event.eventType] += 1;
    pathHits.set(event.path, (pathHits.get(event.path) ?? 0) + 1);

    if (event.eventType === "cta_click" && event.ctaLabel) {
      ctaHits.set(event.ctaLabel, (ctaHits.get(event.ctaLabel) ?? 0) + 1);
    }

    if (!latestEventAt || occurredMs > new Date(latestEventAt).getTime()) {
      latestEventAt = event.occurredAt;
    }
  }

  const topPaths = Array.from(pathHits.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 10)
    .map(([path, hits]) => ({ path, hits }));

  const topCtas = Array.from(ctaHits.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 10)
    .map(([ctaLabel, clicks]) => ({ ctaLabel, clicks }));

  return {
    windowMinutes: safeWindowMinutes,
    totalEvents,
    byType,
    topPaths,
    topCtas,
    latestEventAt
  };
}

export function listRecentAnalyticsEvents(limit = 50): AnalyticsEvent[] {
  const safeLimit = sanitizeInteger(limit, 50, 1, 200);

  return analyticsEvents.slice(-safeLimit).reverse();
}

export function recordOperabilityLog(input: {
  level: OperabilityLogLevel;
  event: string;
  message: string;
  context?: Record<string, unknown>;
}): OperabilityLogEntry {
  const entry: OperabilityLogEntry = {
    id: randomUUID(),
    level: input.level,
    event: sanitizeText(input.event, 64) || "unknown_event",
    message: sanitizeText(input.message, 220) || "",
    context: sanitizeContext(input.context),
    createdAt: new Date().toISOString()
  };

  operabilityLogs.push(entry);
  trimBuffer(operabilityLogs, MAX_OPERABILITY_LOGS);

  return entry;
}

export function listOperabilityLogs(limit = 50): OperabilityLogEntry[] {
  const safeLimit = sanitizeInteger(limit, 50, 1, 200);
  return operabilityLogs.slice(-safeLimit).reverse();
}

export function resetObservabilityStateForTests(): void {
  analyticsEvents.length = 0;
  operabilityLogs.length = 0;
}
