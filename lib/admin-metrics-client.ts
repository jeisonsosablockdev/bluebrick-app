export type MetricsRange = "24h" | "7d" | "30d";

export type DashboardOverviewResponse = {
  kpis: {
    totalAttempts: number;
    confirmedAttempts: number;
    failedAttempts: number;
    conversionRatePct: number;
    revenueLamports: number;
  };
  alerts: Array<{
    id: string;
    level: "info" | "warning" | "critical";
    message: string;
  }>;
  recentActivity: Array<{
    attemptId: string;
    propertyId: string;
    walletPublicKey: string;
    status: "created" | "prepared" | "submitted" | "confirmed" | "failed";
    txSignature: string | null;
    createdAt: string;
  }>;
  assetSummary: Array<{
    candyMachineAddress: string;
    collectionAddress: string;
    propertyId: string | null;
    propertyTitle: string | null;
    propertyImageUrl: string | null;
    internalCode: string | null;
    totalAttempts: number;
    confirmedAttempts: number;
    failedAttempts: number;
    inProgressAttempts: number;
    revenueLamports: number;
    soldQuantity: number;
  }>;
  charts: {
    attemptsByDay: Array<{ day: string; total: number; confirmed: number; failed: number }>;
    revenueByDay: Array<{ day: string; revenueLamports: number }>;
  };
  meta: {
    range: MetricsRange;
    lastSyncedAt: string | null;
    dataFreshness: "fresh" | "stale";
    source: "webhook-reconciled";
  };
};

export type SalesOverviewResponse = {
  highlights: Array<{
    id: string;
    label: string;
    value: string;
  }>;
  summary: {
    totalAttempts: number;
    confirmedAttempts: number;
    failedAttempts: number;
    confirmedRevenueLamports: number;
  };
  recentSales: Array<{
    attemptId: string;
    propertyId: string;
    walletPublicKey: string;
    quantity: number;
    status: "created" | "prepared" | "submitted" | "confirmed" | "failed";
    txSignature: string | null;
    createdAt: string;
    revenueLamports: number;
  }>;
  meta: {
    range: MetricsRange;
    lastSyncedAt: string | null;
    dataFreshness: "fresh" | "stale";
    source: "webhook-reconciled";
  };
};

export type MonitoringEventsResponse = {
  events: Array<{
    id: string;
    signature: string;
    eventType: string;
    status: "confirmed" | "failed";
    slot: number | null;
    errorMessage: string | null;
    walletPublicKey: string | null;
    propertyId: string | null;
    candyMachineAddress: string | null;
    txStatus: "created" | "prepared" | "submitted" | "confirmed" | "failed" | null;
    receivedAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  meta: {
    lastSyncedAt: string | null;
    dataFreshness: "fresh" | "stale";
    source: "webhook-reconciled";
  };
};

export type AnalyticsMonitoringResponse = {
  summary: {
    windowMinutes: number;
    totalEvents: number;
    byType: {
      page_view: number;
      route_change: number;
      scroll_depth: number;
      cta_click: number;
      client_error: number;
    };
    topPaths: Array<{ path: string; hits: number }>;
    topCtas: Array<{ ctaLabel: string; clicks: number }>;
    latestEventAt: string | null;
  };
  recentEvents: Array<{
    id: string;
    eventType: "page_view" | "route_change" | "scroll_depth" | "cta_click" | "client_error";
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
  }>;
};

export type OperabilityLogsResponse = {
  entries: Array<{
    id: string;
    level: "info" | "warn" | "error";
    event: string;
    message: string;
    context: Record<string, string | number | boolean | null>;
    createdAt: string;
  }>;
};

type JsonSuccess<T> = {
  ok: true;
  data: T;
};

type JsonError = {
  error?: {
    code?: string;
    message?: string;
  };
};

function normalizeRange(input: string | null | undefined): MetricsRange {
  return input === "7d" || input === "30d" ? input : "24h";
}

function toSearchParams(input: Record<string, string | number | null | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value === null || typeof value === "undefined") {
      continue;
    }
    const normalized = String(value).trim();
    if (!normalized) {
      continue;
    }
    params.set(key, normalized);
  }
  return params;
}

async function requestJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, {
    method: "GET",
    cache: "no-store",
    signal
  });

  const payload = (await response.json().catch(() => null)) as JsonSuccess<T> | JsonError | null;
  if (!response.ok || !payload || !("ok" in payload) || payload.ok !== true) {
    const message = payload && "error" in payload && payload.error?.message
      ? payload.error.message
      : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload.data;
}

export async function fetchAdminDashboardOverview(input?: {
  range?: string | null;
  signal?: AbortSignal;
}): Promise<DashboardOverviewResponse> {
  const params = toSearchParams({ range: normalizeRange(input?.range) });
  return requestJson<DashboardOverviewResponse>(`/api/admin/dashboard/overview?${params.toString()}`, input?.signal);
}

export async function fetchAdminSalesOverview(input?: {
  range?: string | null;
  status?: string | null;
  wallet?: string | null;
  candyMachine?: string | null;
  signal?: AbortSignal;
}): Promise<SalesOverviewResponse> {
  const params = toSearchParams({
    range: normalizeRange(input?.range),
    status: input?.status ?? null,
    wallet: input?.wallet ?? null,
    candyMachine: input?.candyMachine ?? null
  });
  return requestJson<SalesOverviewResponse>(`/api/admin/sales/overview?${params.toString()}`, input?.signal);
}

export async function fetchAdminMonitoringEvents(input?: {
  eventType?: string | null;
  status?: string | null;
  wallet?: string | null;
  asset?: string | null;
  signature?: string | null;
  page?: number | null;
  limit?: number | null;
  signal?: AbortSignal;
}): Promise<MonitoringEventsResponse> {
  const params = toSearchParams({
    eventType: input?.eventType ?? null,
    status: input?.status ?? null,
    wallet: input?.wallet ?? null,
    asset: input?.asset ?? null,
    signature: input?.signature ?? null,
    page: input?.page ?? null,
    limit: input?.limit ?? null
  });
  const query = params.toString();
  return requestJson<MonitoringEventsResponse>(`/api/admin/monitoring/events${query ? `?${query}` : ""}`, input?.signal);
}

export async function reprocessAdminMonitoringEvent(input: { eventId: string }): Promise<{
  eventId: string;
  signature: string;
  eventType: string;
  status: "confirmed" | "failed";
  reconciled: boolean;
}> {
  const response = await fetch(`/api/admin/monitoring/events/${encodeURIComponent(input.eventId)}/reprocess`, {
    method: "POST",
    cache: "no-store"
  });

  const payload = (await response.json().catch(() => null)) as JsonSuccess<{
    eventId: string;
    signature: string;
    eventType: string;
    status: "confirmed" | "failed";
    reconciled: boolean;
  }> | JsonError | null;

  if (!response.ok || !payload || !("ok" in payload) || payload.ok !== true) {
    const message = payload && "error" in payload && payload.error?.message
      ? payload.error.message
      : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload.data;
}

export async function fetchAdminAnalyticsMonitoring(input?: {
  minutes?: number | null;
  limit?: number | null;
  signal?: AbortSignal;
}): Promise<AnalyticsMonitoringResponse> {
  const params = toSearchParams({
    minutes: input?.minutes ?? null,
    limit: input?.limit ?? null
  });
  const query = params.toString();

  return requestJson<AnalyticsMonitoringResponse>(
    `/api/admin/monitoring/analytics${query ? `?${query}` : ""}`,
    input?.signal
  );
}

export async function fetchAdminOperabilityLogs(input?: {
  limit?: number | null;
  signal?: AbortSignal;
}): Promise<OperabilityLogsResponse> {
  const params = toSearchParams({
    limit: input?.limit ?? null
  });
  const query = params.toString();

  return requestJson<OperabilityLogsResponse>(
    `/api/admin/monitoring/logs${query ? `?${query}` : ""}`,
    input?.signal
  );
}
