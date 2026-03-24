import {
  listPurchaseAttempts,
  type PurchaseAttemptRecord,
  type PurchaseAttemptStatus
} from "@/lib/purchase-attempts-repository";
import { withDbClient } from "@/lib/db/pool";
import { listMarketplaceProperties } from "@/lib/property-marketplace-server";
import { listPurchaseWebhookEvents } from "@/lib/purchase-webhook-reconciliation";

export type MetricsRange = "24h" | "7d" | "30d";

type MetricsFreshness = "fresh" | "stale";

export type DashboardOverview = {
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
    status: PurchaseAttemptStatus;
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
    dataFreshness: MetricsFreshness;
    source: "webhook-reconciled";
  };
};

export type SalesOverview = {
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
    status: PurchaseAttemptStatus;
    txSignature: string | null;
    createdAt: string;
    revenueLamports: number;
  }>;
  meta: {
    range: MetricsRange;
    lastSyncedAt: string | null;
    dataFreshness: MetricsFreshness;
    source: "webhook-reconciled";
  };
};

export type MonitoringEventsPage = {
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
    txStatus: PurchaseAttemptStatus | null;
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
    dataFreshness: MetricsFreshness;
    source: "webhook-reconciled";
  };
};

function normalizeRange(input: string | null | undefined): MetricsRange {
  if (input === "7d" || input === "30d") {
    return input;
  }

  return "24h";
}

function rangeStartIso(range: MetricsRange, now = new Date()): string {
  const nowMs = now.getTime();
  const hours = range === "7d" ? 24 * 7 : range === "30d" ? 24 * 30 : 24;
  return new Date(nowMs - (hours * 60 * 60 * 1000)).toISOString();
}

function resolveRevenueLamports(attempt: PurchaseAttemptRecord): number {
  const unitPrice = attempt.preparedPriceLamports ?? attempt.quotedPriceLamports ?? 0;
  const quantity = Number.isInteger(attempt.quantity) && attempt.quantity > 0 ? attempt.quantity : 1;
  const total = unitPrice * quantity;
  return Number.isSafeInteger(total) && total > 0 ? total : 0;
}

function toFreshness(lastSyncedAt: string | null, now = new Date()): MetricsFreshness {
  if (!lastSyncedAt) {
    return "stale";
  }

  const last = new Date(lastSyncedAt).getTime();
  if (!Number.isFinite(last)) {
    return "stale";
  }

  const diffMs = Math.max(0, now.getTime() - last);
  return diffMs <= 15 * 60 * 1000 ? "fresh" : "stale";
}

function latestTimestampIso(values: Array<string | null>): string | null {
  const timestamps = values
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter((time) => Number.isFinite(time));

  if (!timestamps.length) {
    return null;
  }

  return new Date(Math.max(...timestamps)).toISOString();
}

async function listInternalCodesByCandyMachine(candyMachineAddresses: string[]): Promise<Map<string, string>> {
  const uniqueAddresses = Array.from(new Set(candyMachineAddresses.filter(Boolean)));
  if (!uniqueAddresses.length || !process.env.DATABASE_URL?.trim()) {
    return new Map();
  }

  return withDbClient(async (client) => {
    const result = await client.query<{
      candy_machine_address: string;
      internal_code: string | null;
    }>(
      `SELECT DISTINCT ON (candy_machine_address)
         candy_machine_address,
         NULLIF(TRIM(form_snapshot->>'internalCode'), '') AS internal_code
       FROM asset_mint_snapshots
       WHERE candy_machine_address = ANY($1::text[])
       ORDER BY candy_machine_address, created_at DESC`,
      [uniqueAddresses]
    );

    const codes = new Map<string, string>();
    for (const row of result.rows) {
      if (row.internal_code) {
        codes.set(row.candy_machine_address, row.internal_code);
      }
    }

    return codes;
  });
}

function buildAttemptsByDay(attempts: PurchaseAttemptRecord[]): DashboardOverview["charts"]["attemptsByDay"] {
  const bucket = new Map<string, { total: number; confirmed: number; failed: number }>();

  for (const attempt of attempts) {
    const day = new Date(attempt.createdAt).toISOString().slice(0, 10);
    const item = bucket.get(day) ?? { total: 0, confirmed: 0, failed: 0 };
    item.total += 1;
    if (attempt.status === "confirmed") {
      item.confirmed += 1;
    }
    if (attempt.status === "failed") {
      item.failed += 1;
    }
    bucket.set(day, item);
  }

  return Array.from(bucket.entries())
    .map(([day, stats]) => ({ day, ...stats }))
    .sort((left, right) => left.day.localeCompare(right.day));
}

function buildRevenueByDay(attempts: PurchaseAttemptRecord[]): DashboardOverview["charts"]["revenueByDay"] {
  const bucket = new Map<string, number>();

  for (const attempt of attempts) {
    if (attempt.status !== "confirmed") {
      continue;
    }

    const day = new Date(attempt.createdAt).toISOString().slice(0, 10);
    const current = bucket.get(day) ?? 0;
    bucket.set(day, current + resolveRevenueLamports(attempt));
  }

  return Array.from(bucket.entries())
    .map(([day, revenueLamports]) => ({ day, revenueLamports }))
    .sort((left, right) => left.day.localeCompare(right.day));
}

export async function getAdminDashboardOverview(input: {
  range: string;
}): Promise<DashboardOverview> {
  const range = normalizeRange(input.range);
  const fromIso = rangeStartIso(range);
  const attempts = await listPurchaseAttempts({ fromIso, limit: 2_000 });

  const totalAttempts = attempts.length;
  const confirmedAttempts = attempts.filter((item) => item.status === "confirmed").length;
  const failedAttempts = attempts.filter((item) => item.status === "failed").length;
  const revenueLamports = attempts
    .filter((item) => item.status === "confirmed")
    .reduce((sum, item) => sum + resolveRevenueLamports(item), 0);
  const conversionRatePct = totalAttempts > 0
    ? Number(((confirmedAttempts / totalAttempts) * 100).toFixed(2))
    : 0;

  type AssetAccumulatorRow = DashboardOverview["assetSummary"][number] & {
    propertyFrequency: Map<string, number>;
  };

  const assetAccumulator = new Map<string, AssetAccumulatorRow>();
  for (const attempt of attempts) {
    const key = `${attempt.candyMachineAddress}:${attempt.collectionAddress}`;
    const row = assetAccumulator.get(key) ?? {
      candyMachineAddress: attempt.candyMachineAddress,
      collectionAddress: attempt.collectionAddress,
      propertyId: null,
      propertyTitle: null,
      propertyImageUrl: null,
      internalCode: null,
      totalAttempts: 0,
      confirmedAttempts: 0,
      failedAttempts: 0,
      inProgressAttempts: 0,
      revenueLamports: 0,
      soldQuantity: 0,
      propertyFrequency: new Map<string, number>()
    };

    row.totalAttempts += 1;
    row.propertyFrequency.set(
      attempt.propertyId,
      (row.propertyFrequency.get(attempt.propertyId) ?? 0) + 1
    );
    if (attempt.status === "confirmed") {
      row.confirmedAttempts += 1;
      row.soldQuantity += attempt.quantity;
      row.revenueLamports += resolveRevenueLamports(attempt);
    }
    if (attempt.status === "failed") {
      row.failedAttempts += 1;
    }
    if (attempt.status !== "confirmed" && attempt.status !== "failed") {
      row.inProgressAttempts += 1;
    }

    assetAccumulator.set(key, row);
  }

  const marketplaceProperties = await listMarketplaceProperties({});
  const marketplaceById = new Map(
    marketplaceProperties.map((property) => [property.id, property])
  );
  const internalCodesByCandyMachine = await listInternalCodesByCandyMachine(
    Array.from(assetAccumulator.values()).map((row) => row.candyMachineAddress)
  );

  const assetSummary = Array.from(assetAccumulator.values())
    .map((row) => {
      const topProperty = Array.from(row.propertyFrequency.entries())
        .sort((left, right) => right[1] - left[1])[0];
      const propertyId = topProperty?.[0] ?? null;
      const property = propertyId ? marketplaceById.get(propertyId) : null;

      return {
        candyMachineAddress: row.candyMachineAddress,
        collectionAddress: row.collectionAddress,
        propertyId,
        propertyTitle: property?.title ?? null,
        propertyImageUrl: property?.image ?? null,
        internalCode: internalCodesByCandyMachine.get(row.candyMachineAddress) ?? null,
        totalAttempts: row.totalAttempts,
        confirmedAttempts: row.confirmedAttempts,
        failedAttempts: row.failedAttempts,
        inProgressAttempts: row.inProgressAttempts,
        revenueLamports: row.revenueLamports,
        soldQuantity: row.soldQuantity
      };
    })
    .sort((left, right) => right.revenueLamports - left.revenueLamports)
    .slice(0, 10);

  const recentActivity = attempts
    .slice(0, 20)
    .map((attempt) => ({
      attemptId: attempt.id,
      propertyId: attempt.propertyId,
      walletPublicKey: attempt.walletPublicKey,
      status: attempt.status,
      txSignature: attempt.txSignature,
      createdAt: attempt.createdAt
    }));

  const alerts: DashboardOverview["alerts"] = [];
  if (failedAttempts > 0) {
    alerts.push({
      id: "failed-attempts",
      level: failedAttempts >= 5 ? "critical" : "warning",
      message: `${failedAttempts} failed purchase attempts in selected range.`
    });
  }

  const lastSyncedAt = latestTimestampIso(attempts.map((item) => item.updatedAt));

  return {
    kpis: {
      totalAttempts,
      confirmedAttempts,
      failedAttempts,
      conversionRatePct,
      revenueLamports
    },
    alerts,
    recentActivity,
    assetSummary,
    charts: {
      attemptsByDay: buildAttemptsByDay(attempts),
      revenueByDay: buildRevenueByDay(attempts)
    },
    meta: {
      range,
      lastSyncedAt,
      dataFreshness: toFreshness(lastSyncedAt),
      source: "webhook-reconciled"
    }
  };
}

export async function getAdminSalesOverview(input: {
  range: string;
  status?: string;
  wallet?: string;
  candyMachine?: string;
}): Promise<SalesOverview> {
  const range = normalizeRange(input.range);
  const status = input.status === "created"
    || input.status === "prepared"
    || input.status === "submitted"
    || input.status === "confirmed"
    || input.status === "failed"
    ? input.status
    : undefined;

  const attempts = await listPurchaseAttempts({
    fromIso: rangeStartIso(range),
    status,
    walletPublicKey: input.wallet ?? null,
    candyMachineAddress: input.candyMachine ?? null,
    limit: 500
  });

  const totalAttempts = attempts.length;
  const confirmedAttempts = attempts.filter((item) => item.status === "confirmed").length;
  const failedAttempts = attempts.filter((item) => item.status === "failed").length;
  const confirmedRevenueLamports = attempts
    .filter((item) => item.status === "confirmed")
    .reduce((sum, item) => sum + resolveRevenueLamports(item), 0);

  const highlights: SalesOverview["highlights"] = [
    { id: "attempts", label: "Attempts", value: String(totalAttempts) },
    { id: "confirmed", label: "Confirmed", value: String(confirmedAttempts) },
    { id: "failed", label: "Failed", value: String(failedAttempts) },
    { id: "revenue", label: "Revenue (lamports)", value: String(confirmedRevenueLamports) }
  ];

  const recentSales = attempts
    .map((attempt) => ({
      attemptId: attempt.id,
      propertyId: attempt.propertyId,
      walletPublicKey: attempt.walletPublicKey,
      quantity: attempt.quantity,
      status: attempt.status,
      txSignature: attempt.txSignature,
      createdAt: attempt.createdAt,
      revenueLamports: attempt.status === "confirmed" ? resolveRevenueLamports(attempt) : 0
    }))
    .slice(0, 50);

  const lastSyncedAt = latestTimestampIso(attempts.map((item) => item.updatedAt));

  return {
    highlights,
    summary: {
      totalAttempts,
      confirmedAttempts,
      failedAttempts,
      confirmedRevenueLamports
    },
    recentSales,
    meta: {
      range,
      lastSyncedAt,
      dataFreshness: toFreshness(lastSyncedAt),
      source: "webhook-reconciled"
    }
  };
}

export async function getAdminMonitoringEvents(input: {
  eventType?: string;
  status?: string;
  wallet?: string;
  asset?: string;
  signature?: string;
  page?: number;
  limit?: number;
}): Promise<MonitoringEventsPage> {
  const page = Number.isInteger(input.page) && Number(input.page) > 0 ? Number(input.page) : 1;
  const limit = Number.isInteger(input.limit) && Number(input.limit) > 0 ? Number(input.limit) : 20;

  const statusFilter = input.status === "confirmed" || input.status === "failed"
    ? input.status
    : undefined;

  const webhookEvents = await listPurchaseWebhookEvents({
    signature: input.signature,
    status: statusFilter,
    eventType: input.eventType,
    page,
    limit
  });

  const attempts = await listPurchaseAttempts({ limit: 2_000 });
  const attemptsBySignature = new Map<string, PurchaseAttemptRecord>();
  for (const attempt of attempts) {
    if (attempt.txSignature) {
      attemptsBySignature.set(attempt.txSignature, attempt);
    }
  }

  let events = webhookEvents.map((event) => {
    const attempt = attemptsBySignature.get(event.signature) ?? null;
    return {
      id: event.id,
      signature: event.signature,
      eventType: event.eventType,
      status: event.status,
      slot: event.slot,
      errorMessage: event.errorMessage,
      walletPublicKey: attempt?.walletPublicKey ?? null,
      propertyId: attempt?.propertyId ?? null,
      candyMachineAddress: attempt?.candyMachineAddress ?? null,
      txStatus: attempt?.status ?? null,
      receivedAt: event.receivedAt
    };
  });

  if (input.wallet) {
    events = events.filter((item) => item.walletPublicKey === input.wallet);
  }

  if (input.asset) {
    events = events.filter((item) => item.propertyId === input.asset);
  }

  const total = events.length;
  const pagedEvents = events.slice(0, limit);

  const lastSyncedAt = latestTimestampIso(events.map((item) => item.receivedAt));

  return {
    events: pagedEvents,
    pagination: {
      page,
      limit,
      total,
      totalPages: total > 0 ? Math.ceil(total / limit) : 0
    },
    meta: {
      lastSyncedAt,
      dataFreshness: toFreshness(lastSyncedAt),
      source: "webhook-reconciled"
    }
  };
}
