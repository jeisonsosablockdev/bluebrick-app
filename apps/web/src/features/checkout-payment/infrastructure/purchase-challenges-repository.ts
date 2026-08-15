import { randomUUID } from "node:crypto";

import { withDbClient } from "@/lib/db/pool";

export type PurchaseChallengeStatus = "issued" | "consumed" | "failed" | "expired";

export type PurchaseChallengeRecord = {
  id: string;
  propertyId: string;
  walletPublicKey: string;
  candyMachineAddress: string;
  challengeNonce: string;
  challengeMessage: string;
  expiresAt: string;
  status: PurchaseChallengeStatus;
  failureReason: string | null;
  consumedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreatePurchaseChallengeInput = {
  id?: string;
  propertyId: string;
  walletPublicKey: string;
  candyMachineAddress: string;
  challengeNonce: string;
  challengeMessage: string;
  expiresAt: string;
};

type PurchaseChallengeRow = {
  id: string;
  property_id: string;
  wallet_public_key: string;
  candy_machine_address: string;
  challenge_nonce: string;
  challenge_message: string;
  expires_at: string | Date;
  status: PurchaseChallengeStatus;
  failure_reason: string | null;
  consumed_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
};

function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function toIso(value: string | Date | null): string | null {
  if (value === null) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function mapRow(row: PurchaseChallengeRow): PurchaseChallengeRecord {
  return {
    id: row.id,
    propertyId: row.property_id,
    walletPublicKey: row.wallet_public_key,
    candyMachineAddress: row.candy_machine_address,
    challengeNonce: row.challenge_nonce,
    challengeMessage: row.challenge_message,
    expiresAt: toIso(row.expires_at) ?? new Date().toISOString(),
    status: row.status,
    failureReason: row.failure_reason,
    consumedAt: toIso(row.consumed_at),
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: toIso(row.updated_at) ?? new Date().toISOString()
  };
}

const inMemoryChallenges = new Map<string, PurchaseChallengeRecord>();

function purgeInMemoryExpired(now = Date.now()): void {
  for (const [id, challenge] of inMemoryChallenges) {
    const expiresAtMs = Date.parse(challenge.expiresAt);
    if (!Number.isFinite(expiresAtMs)) {
      continue;
    }

    if (challenge.status === "issued" && expiresAtMs <= now) {
      inMemoryChallenges.set(id, {
        ...challenge,
        status: "expired",
        updatedAt: new Date(now).toISOString()
      });
    }
  }
}

export async function createPurchaseChallenge(input: CreatePurchaseChallengeInput): Promise<PurchaseChallengeRecord> {
  const id = input.id ?? randomUUID();
  const nowIso = new Date().toISOString();
  const record: PurchaseChallengeRecord = {
    id,
    propertyId: input.propertyId,
    walletPublicKey: input.walletPublicKey,
    candyMachineAddress: input.candyMachineAddress,
    challengeNonce: input.challengeNonce,
    challengeMessage: input.challengeMessage,
    expiresAt: input.expiresAt,
    status: "issued",
    failureReason: null,
    consumedAt: null,
    createdAt: nowIso,
    updatedAt: nowIso
  };

  if (!isDatabaseConfigured()) {
    purgeInMemoryExpired();
    inMemoryChallenges.set(record.id, record);
    return { ...record };
  }

  return withDbClient(async (client) => {
    const result = await client.query<PurchaseChallengeRow>(
      `INSERT INTO purchase_challenges (
         id,
         property_id,
         wallet_public_key,
         candy_machine_address,
         challenge_nonce,
         challenge_message,
         expires_at,
         status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'issued')
       RETURNING
         id,
         property_id,
         wallet_public_key,
         candy_machine_address,
         challenge_nonce,
         challenge_message,
         expires_at,
         status,
         failure_reason,
         consumed_at,
         created_at,
         updated_at`,
      [
        record.id,
        record.propertyId,
        record.walletPublicKey,
        record.candyMachineAddress,
        record.challengeNonce,
        record.challengeMessage,
        record.expiresAt
      ]
    );

    return mapRow(result.rows[0] as PurchaseChallengeRow);
  });
}

export async function getPurchaseChallengeById(id: string): Promise<PurchaseChallengeRecord | null> {
  if (!isDatabaseConfigured()) {
    purgeInMemoryExpired();
    const challenge = inMemoryChallenges.get(id);
    return challenge ? { ...challenge } : null;
  }

  return withDbClient(async (client) => {
    const result = await client.query<PurchaseChallengeRow>(
      `SELECT
         id,
         property_id,
         wallet_public_key,
         candy_machine_address,
         challenge_nonce,
         challenge_message,
         expires_at,
         status,
         failure_reason,
         consumed_at,
         created_at,
         updated_at
       FROM purchase_challenges
       WHERE id = $1`,
      [id]
    );

    if (!result.rows[0]) {
      return null;
    }

    return mapRow(result.rows[0]);
  });
}

export async function consumePurchaseChallenge(id: string): Promise<PurchaseChallengeRecord | null> {
  if (!isDatabaseConfigured()) {
    purgeInMemoryExpired();
    const challenge = inMemoryChallenges.get(id);
    if (!challenge || challenge.status !== "issued") {
      return null;
    }

    if (Date.parse(challenge.expiresAt) <= Date.now()) {
      const expired = {
        ...challenge,
        status: "expired" as const,
        updatedAt: new Date().toISOString()
      };
      inMemoryChallenges.set(id, expired);
      return null;
    }

    const consumedAt = new Date().toISOString();
    const consumed: PurchaseChallengeRecord = {
      ...challenge,
      status: "consumed",
      consumedAt,
      updatedAt: consumedAt
    };
    inMemoryChallenges.set(id, consumed);
    return { ...consumed };
  }

  return withDbClient(async (client) => {
    const result = await client.query<PurchaseChallengeRow>(
      `UPDATE purchase_challenges
       SET
         status = 'consumed',
         consumed_at = NOW(),
         failure_reason = NULL
       WHERE id = $1
         AND status = 'issued'
         AND expires_at > NOW()
       RETURNING
         id,
         property_id,
         wallet_public_key,
         candy_machine_address,
         challenge_nonce,
         challenge_message,
         expires_at,
         status,
         failure_reason,
         consumed_at,
         created_at,
         updated_at`,
      [id]
    );

    if (!result.rows[0]) {
      return null;
    }

    return mapRow(result.rows[0]);
  });
}

export async function markPurchaseChallengeFailed(
  id: string,
  failureReason: string,
  forceStatus?: Extract<PurchaseChallengeStatus, "failed" | "expired">
): Promise<PurchaseChallengeRecord | null> {
  const status = forceStatus ?? "failed";

  if (!isDatabaseConfigured()) {
    purgeInMemoryExpired();
    const challenge = inMemoryChallenges.get(id);
    if (!challenge || challenge.status !== "issued") {
      return null;
    }

    const nowIso = new Date().toISOString();
    const updated: PurchaseChallengeRecord = {
      ...challenge,
      status,
      failureReason,
      updatedAt: nowIso
    };
    inMemoryChallenges.set(id, updated);
    return { ...updated };
  }

  return withDbClient(async (client) => {
    const result = await client.query<PurchaseChallengeRow>(
      `UPDATE purchase_challenges
       SET
         status = $2,
         failure_reason = $3
       WHERE id = $1
         AND status = 'issued'
       RETURNING
         id,
         property_id,
         wallet_public_key,
         candy_machine_address,
         challenge_nonce,
         challenge_message,
         expires_at,
         status,
         failure_reason,
         consumed_at,
         created_at,
         updated_at`,
      [id, status, failureReason]
    );

    if (!result.rows[0]) {
      return null;
    }

    return mapRow(result.rows[0]);
  });
}
