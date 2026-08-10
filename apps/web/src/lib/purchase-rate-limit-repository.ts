import { randomUUID } from "node:crypto";

import { withDbClient } from "@/lib/db/pool";

export type PurchaseRateLimitEndpoint = "purchase_challenge" | "purchase_prepare";

type PurchaseRateLimitRow = {
  wallet_count: string | number;
  ip_count: string | number;
};

type InMemoryRateLimitEvent = {
  id: string;
  endpoint: PurchaseRateLimitEndpoint;
  walletPublicKey: string;
  ipAddress: string;
  createdAtMs: number;
};

function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function toNumber(value: string | number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

const inMemoryRateLimitEvents: InMemoryRateLimitEvent[] = [];

function purgeInMemoryEvents(windowSeconds: number, nowMs = Date.now()): void {
  const minTimestamp = nowMs - Math.max(1, windowSeconds) * 1_000;
  for (let index = inMemoryRateLimitEvents.length - 1; index >= 0; index -= 1) {
    if (inMemoryRateLimitEvents[index] && inMemoryRateLimitEvents[index].createdAtMs < minTimestamp) {
      inMemoryRateLimitEvents.splice(index, 1);
    }
  }
}

export async function countRecentPurchaseRateLimitEvents(input: {
  endpoint: PurchaseRateLimitEndpoint;
  walletPublicKey: string;
  ipAddress: string;
  windowSeconds: number;
}): Promise<{ walletCount: number; ipCount: number }> {
  const windowSeconds = Math.max(1, Math.floor(input.windowSeconds));

  if (!isDatabaseConfigured()) {
    const nowMs = Date.now();
    purgeInMemoryEvents(windowSeconds, nowMs);
    const minTimestamp = nowMs - windowSeconds * 1_000;
    let walletCount = 0;
    let ipCount = 0;

    for (const event of inMemoryRateLimitEvents) {
      if (event.createdAtMs < minTimestamp || event.endpoint !== input.endpoint) {
        continue;
      }

      if (event.walletPublicKey === input.walletPublicKey) {
        walletCount += 1;
      }

      if (event.ipAddress === input.ipAddress) {
        ipCount += 1;
      }
    }

    return { walletCount, ipCount };
  }

  return withDbClient(async (client) => {
    const result = await client.query<PurchaseRateLimitRow>(
      `SELECT
         (
           SELECT COUNT(*)::int
           FROM purchase_rate_limit_events
           WHERE endpoint = $1
             AND wallet_public_key = $2
             AND created_at >= NOW() - ($4::int * INTERVAL '1 second')
         ) AS wallet_count,
         (
           SELECT COUNT(*)::int
           FROM purchase_rate_limit_events
           WHERE endpoint = $1
             AND ip_address = $3
             AND created_at >= NOW() - ($4::int * INTERVAL '1 second')
         ) AS ip_count`,
      [input.endpoint, input.walletPublicKey, input.ipAddress, windowSeconds]
    );

    const row = result.rows[0];
    return {
      walletCount: row ? toNumber(row.wallet_count) : 0,
      ipCount: row ? toNumber(row.ip_count) : 0
    };
  });
}

export async function createPurchaseRateLimitEvent(input: {
  endpoint: PurchaseRateLimitEndpoint;
  walletPublicKey: string;
  ipAddress: string;
}): Promise<void> {
  if (!isDatabaseConfigured()) {
    inMemoryRateLimitEvents.push({
      id: randomUUID(),
      endpoint: input.endpoint,
      walletPublicKey: input.walletPublicKey,
      ipAddress: input.ipAddress,
      createdAtMs: Date.now()
    });
    return;
  }

  await withDbClient(async (client) => {
    await client.query(
      `INSERT INTO purchase_rate_limit_events (
         id,
         endpoint,
         wallet_public_key,
         ip_address
       )
       VALUES ($1, $2, $3, $4)`,
      [randomUUID(), input.endpoint, input.walletPublicKey, input.ipAddress]
    );
  });
}
