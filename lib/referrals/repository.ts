import { randomBytes, randomUUID } from "node:crypto";

import type { PoolClient } from "pg";

import { withDbClient } from "@/lib/db/pool";
import { ensureProfileExists } from "@/lib/compliance/profile-repository";
import {
  buildWindowEndIso,
  DEFAULT_REFERRAL_ELIGIBILITY_WINDOW_DAYS,
  getExpiredAttributionStatus,
  isReferralAttributionActiveStatus,
  normalizeReferralAttributionSource,
  normalizeReferralCode,
  type ReferralAttributionSource,
  type ReferralAttributionStatus
} from "@/lib/referrals/domain";

export type ReferralMetadata = Record<string, unknown>;

export type ReferralCodeRecord = {
  id: string;
  referrerWalletPublicKey: string;
  code: string;
  createdAt: string;
  disabledAt: string | null;
};

export type ReferralAttributionRecord = {
  id: string;
  referralCodeId: string;
  referralCode: string;
  referrerWalletPublicKey: string;
  inviteeWalletPublicKey: string;
  attributionSource: ReferralAttributionSource;
  boundAt: string;
  eligibilityWindowEndsAt: string;
  kycApprovedAt: string | null;
  closedAt: string | null;
  status: ReferralAttributionStatus;
  metadata: ReferralMetadata;
};

export type ReferralAttributionPage = {
  items: ReferralAttributionRecord[];
  totalCount: number;
  limit: number;
  offset: number;
};

export type BindReferralAtFirstAuthInput = {
  inviteeWalletPublicKey: string;
  referralCode: string;
  attributionSource: ReferralAttributionSource;
  boundAt?: string;
  metadata?: ReferralMetadata;
};

export type BindReferralAtFirstAuthResult =
  | {
      outcome: "bound";
      attribution: ReferralAttributionRecord;
    }
  | {
      outcome: "already_bound";
      attribution: ReferralAttributionRecord;
    }
  | {
      outcome: "rejected_self_referral";
      referrerWalletPublicKey: string;
      inviteeWalletPublicKey: string;
      referralCode: string;
    }
  | {
      outcome: "rejected_invalid_code";
      referralCode: string;
    };

export function __resetReferralRepositoryStateForTests(): void {
  inMemoryReferralCodesById.clear();
  inMemoryReferralCodeIdByWallet.clear();
  inMemoryReferralCodeIdByCode.clear();
  inMemoryAttributionsById.clear();
  inMemoryActiveAttributionIdByInviteeWallet.clear();
}

type ReferralCodeRow = {
  id: string;
  referrer_wallet_public_key: string;
  code: string;
  created_at: string | Date;
  disabled_at: string | Date | null;
};

type ReferralAttributionRow = {
  id: string;
  referral_code_id: string;
  referral_code: string;
  referrer_wallet_public_key: string;
  invitee_wallet_public_key: string;
  attribution_source: ReferralAttributionSource;
  bound_at: string | Date;
  eligibility_window_ends_at: string | Date;
  kyc_approved_at: string | Date | null;
  closed_at: string | Date | null;
  status: ReferralAttributionStatus;
  metadata_json: unknown;
};

const REFERRAL_CODE_SELECT = `
  id,
  referrer_wallet_public_key,
  code,
  created_at,
  disabled_at
`;

function buildOpaqueReferralCode(): string {
  return randomBytes(8).toString("hex").toUpperCase();
}

const REFERRAL_ATTRIBUTION_SELECT = `
  a.id,
  a.referral_code_id,
  rc.code AS referral_code,
  a.referrer_wallet_public_key,
  a.invitee_wallet_public_key,
  a.attribution_source,
  a.bound_at,
  a.eligibility_window_ends_at,
  a.kyc_approved_at,
  a.closed_at,
  a.status,
  a.metadata_json
`;

const inMemoryReferralCodesById = new Map<string, ReferralCodeRecord>();
const inMemoryReferralCodeIdByWallet = new Map<string, string>();
const inMemoryReferralCodeIdByCode = new Map<string, string>();

const inMemoryAttributionsById = new Map<string, ReferralAttributionRecord>();
const inMemoryActiveAttributionIdByInviteeWallet = new Map<string, string>();

function isReferralDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function nowIso(): string {
  return new Date().toISOString();
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

function cloneMetadata(value: ReferralMetadata | undefined): ReferralMetadata {
  return value ? { ...value } : {};
}

function sanitizeMetadata(value: unknown): ReferralMetadata {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return { ...(value as Record<string, unknown>) };
}

function mapReferralCodeRow(row: ReferralCodeRow): ReferralCodeRecord {
  return {
    id: row.id,
    referrerWalletPublicKey: row.referrer_wallet_public_key,
    code: row.code,
    createdAt: toIso(row.created_at) ?? nowIso(),
    disabledAt: toIso(row.disabled_at)
  };
}

function mapReferralAttributionRow(row: ReferralAttributionRow): ReferralAttributionRecord {
  return {
    id: row.id,
    referralCodeId: row.referral_code_id,
    referralCode: row.referral_code,
    referrerWalletPublicKey: row.referrer_wallet_public_key,
    inviteeWalletPublicKey: row.invitee_wallet_public_key,
    attributionSource: normalizeReferralAttributionSource(row.attribution_source),
    boundAt: toIso(row.bound_at) ?? nowIso(),
    eligibilityWindowEndsAt: toIso(row.eligibility_window_ends_at) ?? nowIso(),
    kycApprovedAt: toIso(row.kyc_approved_at),
    closedAt: toIso(row.closed_at),
    status: row.status,
    metadata: sanitizeMetadata(row.metadata_json)
  };
}

function setInMemoryReferralCode(record: ReferralCodeRecord): void {
  inMemoryReferralCodesById.set(record.id, { ...record });
  inMemoryReferralCodeIdByWallet.set(record.referrerWalletPublicKey, record.id);
  inMemoryReferralCodeIdByCode.set(record.code, record.id);
}

function setInMemoryAttribution(record: ReferralAttributionRecord): void {
  inMemoryAttributionsById.set(record.id, {
    ...record,
    metadata: { ...record.metadata }
  });

  if (isReferralAttributionActiveStatus(record.status)) {
    inMemoryActiveAttributionIdByInviteeWallet.set(record.inviteeWalletPublicKey, record.id);
  } else {
    inMemoryActiveAttributionIdByInviteeWallet.delete(record.inviteeWalletPublicKey);
  }
}

function getInMemoryReferralCodeById(id: string): ReferralCodeRecord | null {
  const found = inMemoryReferralCodesById.get(id);
  return found ? { ...found } : null;
}

function getInMemoryActiveAttributionByInviteeWallet(
  inviteeWalletPublicKey: string
): ReferralAttributionRecord | null {
  const id = inMemoryActiveAttributionIdByInviteeWallet.get(inviteeWalletPublicKey);
  if (!id) {
    return null;
  }

  const found = inMemoryAttributionsById.get(id);
  if (!found) {
    inMemoryActiveAttributionIdByInviteeWallet.delete(inviteeWalletPublicKey);
    return null;
  }

  return {
    ...found,
    metadata: { ...found.metadata }
  };
}

function getInMemoryAttributionById(id: string): ReferralAttributionRecord | null {
  const found = inMemoryAttributionsById.get(id);
  if (!found) {
    return null;
  }

  return {
    ...found,
    metadata: { ...found.metadata }
  };
}

async function getReferralCodeByValueWithClient(client: PoolClient, code: string): Promise<ReferralCodeRecord | null> {
  const result = await client.query<ReferralCodeRow>(
    `SELECT ${REFERRAL_CODE_SELECT}
     FROM referral_codes
     WHERE code = $1
       AND disabled_at IS NULL
     LIMIT 1`,
    [code]
  );

  if ((result.rowCount ?? 0) === 0) {
    return null;
  }

  return mapReferralCodeRow(result.rows[0] as ReferralCodeRow);
}

async function getActiveReferralAttributionByInviteeWalletWithClient(
  client: PoolClient,
  input: {
    inviteeWalletPublicKey: string;
    forUpdate?: boolean;
  }
): Promise<ReferralAttributionRecord | null> {
  const result = await client.query<ReferralAttributionRow>(
    `SELECT ${REFERRAL_ATTRIBUTION_SELECT}
     FROM referral_attributions a
     JOIN referral_codes rc ON rc.id = a.referral_code_id
     WHERE a.invitee_wallet_public_key = $1
       AND a.status IN ('bound_pending_kyc', 'kyc_verified')
     ORDER BY a.bound_at DESC
     LIMIT 1
     ${input.forUpdate ? "FOR UPDATE OF a" : ""}`,
    [input.inviteeWalletPublicKey]
  );

  if ((result.rowCount ?? 0) === 0) {
    return null;
  }

  return mapReferralAttributionRow(result.rows[0] as ReferralAttributionRow);
}

async function getReferralAttributionByIdWithClient(
  client: PoolClient,
  input: {
    id: string;
    forUpdate?: boolean;
  }
): Promise<ReferralAttributionRecord | null> {
  const result = await client.query<ReferralAttributionRow>(
    `SELECT ${REFERRAL_ATTRIBUTION_SELECT}
     FROM referral_attributions a
     JOIN referral_codes rc ON rc.id = a.referral_code_id
     WHERE a.id = $1
     LIMIT 1
     ${input.forUpdate ? "FOR UPDATE OF a" : ""}`,
    [input.id]
  );

  if ((result.rowCount ?? 0) === 0) {
    return null;
  }

  return mapReferralAttributionRow(result.rows[0] as ReferralAttributionRow);
}

export async function getOrCreateReferralCodeForWallet(input: {
  referrerWalletPublicKey: string;
}): Promise<ReferralCodeRecord> {
  if (!isReferralDatabaseConfigured()) {
    await ensureProfileExists(input.referrerWalletPublicKey);

    const existingId = inMemoryReferralCodeIdByWallet.get(input.referrerWalletPublicKey);
    if (existingId) {
      const existing = getInMemoryReferralCodeById(existingId);
      if (existing) {
        return existing;
      }
    }

    const record: ReferralCodeRecord = {
      id: randomUUID(),
      referrerWalletPublicKey: input.referrerWalletPublicKey,
      code: buildOpaqueReferralCode(),
      createdAt: nowIso(),
      disabledAt: null
    };

    setInMemoryReferralCode(record);
    return { ...record };
  }

  return withDbClient(async (client) => {
    await ensureProfileExists(input.referrerWalletPublicKey, { client });

    const existing = await client.query<ReferralCodeRow>(
      `SELECT ${REFERRAL_CODE_SELECT}
       FROM referral_codes
       WHERE referrer_wallet_public_key = $1
       LIMIT 1`,
      [input.referrerWalletPublicKey]
    );

    if ((existing.rowCount ?? 0) > 0) {
      return mapReferralCodeRow(existing.rows[0] as ReferralCodeRow);
    }

    const inserted = await client.query<ReferralCodeRow>(
      `INSERT INTO referral_codes (
         referrer_wallet_public_key,
         code
       ) VALUES ($1, $2)
       RETURNING ${REFERRAL_CODE_SELECT}`,
      [input.referrerWalletPublicKey, buildOpaqueReferralCode()]
    );

    return mapReferralCodeRow(inserted.rows[0] as ReferralCodeRow);
  });
}

export async function findReferralCodeByCode(input: {
  code: string;
}): Promise<ReferralCodeRecord | null> {
  const normalizedCode = normalizeReferralCode(input.code);
  if (!normalizedCode) {
    return null;
  }

  if (!isReferralDatabaseConfigured()) {
    const existingId = inMemoryReferralCodeIdByCode.get(normalizedCode);
    return existingId ? getInMemoryReferralCodeById(existingId) : null;
  }

  return withDbClient((client) => getReferralCodeByValueWithClient(client, normalizedCode));
}

export async function getActiveReferralAttributionByInviteeWallet(input: {
  inviteeWalletPublicKey: string;
}): Promise<ReferralAttributionRecord | null> {
  if (!isReferralDatabaseConfigured()) {
    return getInMemoryActiveAttributionByInviteeWallet(input.inviteeWalletPublicKey);
  }

  return withDbClient((client) =>
    getActiveReferralAttributionByInviteeWalletWithClient(client, {
      inviteeWalletPublicKey: input.inviteeWalletPublicKey
    })
  );
}

export async function getReferralAttributionById(input: {
  id: string;
}): Promise<ReferralAttributionRecord | null> {
  if (!isReferralDatabaseConfigured()) {
    return getInMemoryAttributionById(input.id);
  }

  return withDbClient((client) =>
    getReferralAttributionByIdWithClient(client, {
      id: input.id
    })
  );
}

export async function listReferralAttributionsForReferrer(input: {
  referrerWalletPublicKey: string;
}): Promise<ReferralAttributionRecord[]> {
  if (!isReferralDatabaseConfigured()) {
    return Array.from(inMemoryAttributionsById.values())
      .filter((attribution) => attribution.referrerWalletPublicKey === input.referrerWalletPublicKey)
      .sort((left, right) => left.boundAt.localeCompare(right.boundAt))
      .map((attribution) => ({
        ...attribution,
        metadata: { ...attribution.metadata }
      }));
  }

  return withDbClient(async (client) => {
    const result = await client.query<ReferralAttributionRow>(
      `SELECT ${REFERRAL_ATTRIBUTION_SELECT}
       FROM referral_attributions a
       JOIN referral_codes rc ON rc.id = a.referral_code_id
       WHERE a.referrer_wallet_public_key = $1
       ORDER BY a.bound_at ASC`,
      [input.referrerWalletPublicKey]
    );

    return result.rows.map((row) => mapReferralAttributionRow(row));
  });
}

export async function listReferralAttributionsPageForReferrer(input: {
  referrerWalletPublicKey: string;
  limit: number;
  offset: number;
}): Promise<ReferralAttributionPage> {
  const limit = Math.max(1, input.limit);
  const offset = Math.max(0, input.offset);

  if (!isReferralDatabaseConfigured()) {
    const items = Array.from(inMemoryAttributionsById.values())
      .filter((attribution) => attribution.referrerWalletPublicKey === input.referrerWalletPublicKey)
      .sort((left, right) => right.boundAt.localeCompare(left.boundAt))
      .slice(offset, offset + limit)
      .map((attribution) => ({
        ...attribution,
        metadata: { ...attribution.metadata }
      }));

    const totalCount = Array.from(inMemoryAttributionsById.values()).filter(
      (attribution) => attribution.referrerWalletPublicKey === input.referrerWalletPublicKey
    ).length;

    return {
      items,
      totalCount,
      limit,
      offset
    };
  }

  return withDbClient(async (client) => {
    const totalCountResult = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM referral_attributions
       WHERE referrer_wallet_public_key = $1`,
      [input.referrerWalletPublicKey]
    );

    const result = await client.query<ReferralAttributionRow>(
      `SELECT ${REFERRAL_ATTRIBUTION_SELECT}
       FROM referral_attributions a
       JOIN referral_codes rc ON rc.id = a.referral_code_id
       WHERE a.referrer_wallet_public_key = $1
       ORDER BY a.bound_at DESC
       LIMIT $2
       OFFSET $3`,
      [input.referrerWalletPublicKey, limit, offset]
    );

    return {
      items: result.rows.map((row) => mapReferralAttributionRow(row)),
      totalCount: Number.parseInt(totalCountResult.rows[0]?.count ?? "0", 10),
      limit,
      offset
    };
  });
}

export async function bindReferralAtFirstAuth(
  input: BindReferralAtFirstAuthInput
): Promise<BindReferralAtFirstAuthResult> {
  const normalizedCode = normalizeReferralCode(input.referralCode);
  const boundAt = input.boundAt ? new Date(input.boundAt).toISOString() : nowIso();
  const attributionSource = normalizeReferralAttributionSource(input.attributionSource);
  const metadata = cloneMetadata(input.metadata);

  if (!normalizedCode) {
    return {
      outcome: "rejected_invalid_code",
      referralCode: normalizedCode
    };
  }

  if (!isReferralDatabaseConfigured()) {
    const codeId = inMemoryReferralCodeIdByCode.get(normalizedCode);
    const referralCodeRecord = codeId ? getInMemoryReferralCodeById(codeId) : null;

    if (!referralCodeRecord || referralCodeRecord.disabledAt) {
      return {
        outcome: "rejected_invalid_code",
        referralCode: normalizedCode
      };
    }

    if (referralCodeRecord.referrerWalletPublicKey === input.inviteeWalletPublicKey) {
      return {
        outcome: "rejected_self_referral",
        referrerWalletPublicKey: referralCodeRecord.referrerWalletPublicKey,
        inviteeWalletPublicKey: input.inviteeWalletPublicKey,
        referralCode: normalizedCode
      };
    }

    const existingActive = getInMemoryActiveAttributionByInviteeWallet(input.inviteeWalletPublicKey);
    if (existingActive) {
      return {
        outcome: "already_bound",
        attribution: existingActive
      };
    }

    await ensureProfileExists(referralCodeRecord.referrerWalletPublicKey);
    await ensureProfileExists(input.inviteeWalletPublicKey);

    const attribution: ReferralAttributionRecord = {
      id: randomUUID(),
      referralCodeId: referralCodeRecord.id,
      referralCode: referralCodeRecord.code,
      referrerWalletPublicKey: referralCodeRecord.referrerWalletPublicKey,
      inviteeWalletPublicKey: input.inviteeWalletPublicKey,
      attributionSource,
      boundAt,
      eligibilityWindowEndsAt: buildWindowEndIso(boundAt, DEFAULT_REFERRAL_ELIGIBILITY_WINDOW_DAYS),
      kycApprovedAt: null,
      closedAt: null,
      status: "bound_pending_kyc",
      metadata
    };

    setInMemoryAttribution(attribution);
    return {
      outcome: "bound",
      attribution: {
        ...attribution,
        metadata: { ...attribution.metadata }
      }
    };
  }

  return withDbClient(async (client) => {
    const referralCodeRecord = await getReferralCodeByValueWithClient(client, normalizedCode);
    if (!referralCodeRecord) {
      return {
        outcome: "rejected_invalid_code",
        referralCode: normalizedCode
      } satisfies BindReferralAtFirstAuthResult;
    }

    if (referralCodeRecord.referrerWalletPublicKey === input.inviteeWalletPublicKey) {
      return {
        outcome: "rejected_self_referral",
        referrerWalletPublicKey: referralCodeRecord.referrerWalletPublicKey,
        inviteeWalletPublicKey: input.inviteeWalletPublicKey,
        referralCode: normalizedCode
      } satisfies BindReferralAtFirstAuthResult;
    }

    await ensureProfileExists(referralCodeRecord.referrerWalletPublicKey, { client });
    await ensureProfileExists(input.inviteeWalletPublicKey, { client });

    const activeBeforeInsert = await getActiveReferralAttributionByInviteeWalletWithClient(client, {
      inviteeWalletPublicKey: input.inviteeWalletPublicKey,
      forUpdate: true
    });

    if (activeBeforeInsert) {
      return {
        outcome: "already_bound",
        attribution: activeBeforeInsert
      } satisfies BindReferralAtFirstAuthResult;
    }

    try {
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO referral_attributions (
           referral_code_id,
           referrer_wallet_public_key,
           invitee_wallet_public_key,
           attribution_source,
           bound_at,
           eligibility_window_ends_at,
           metadata_json
         ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
         RETURNING id`,
        [
          referralCodeRecord.id,
          referralCodeRecord.referrerWalletPublicKey,
          input.inviteeWalletPublicKey,
          attributionSource,
          boundAt,
          buildWindowEndIso(boundAt, DEFAULT_REFERRAL_ELIGIBILITY_WINDOW_DAYS),
          JSON.stringify(metadata)
        ]
      );

      const created = await getReferralAttributionByIdWithClient(client, {
        id: inserted.rows[0]?.id ?? ""
      });

      if (!created) {
        throw new Error("Could not read inserted referral attribution.");
      }

      return {
        outcome: "bound",
        attribution: created
      } satisfies BindReferralAtFirstAuthResult;
    } catch (error) {
      const pgError = error as { code?: string };
      if (pgError.code !== "23505") {
        throw error;
      }

      const activeAfterConflict = await getActiveReferralAttributionByInviteeWalletWithClient(client, {
        inviteeWalletPublicKey: input.inviteeWalletPublicKey,
        forUpdate: true
      });

      if (!activeAfterConflict) {
        throw error;
      }

      return {
        outcome: "already_bound",
        attribution: activeAfterConflict
      } satisfies BindReferralAtFirstAuthResult;
    }
  });
}

export async function markReferralAttributionKycApproved(input: {
  inviteeWalletPublicKey: string;
  approvedAt?: string;
}): Promise<ReferralAttributionRecord | null> {
  const approvedAt = input.approvedAt ? new Date(input.approvedAt).toISOString() : nowIso();

  if (!isReferralDatabaseConfigured()) {
    const active = getInMemoryActiveAttributionByInviteeWallet(input.inviteeWalletPublicKey);
    if (!active) {
      return null;
    }

    const next: ReferralAttributionRecord = {
      ...active,
      kycApprovedAt: active.kycApprovedAt ?? approvedAt,
      status: "kyc_verified"
    };

    setInMemoryAttribution(next);
    return {
      ...next,
      metadata: { ...next.metadata }
    };
  }

  return withDbClient(async (client) => {
    const active = await getActiveReferralAttributionByInviteeWalletWithClient(client, {
      inviteeWalletPublicKey: input.inviteeWalletPublicKey,
      forUpdate: true
    });

    if (!active) {
      return null;
    }

    if (active.status === "kyc_verified") {
      return active;
    }

    await client.query(
      `UPDATE referral_attributions
       SET kyc_approved_at = COALESCE(kyc_approved_at, $2),
           status = 'kyc_verified'
       WHERE id = $1`,
      [active.id, approvedAt]
    );

    return getReferralAttributionByIdWithClient(client, { id: active.id });
  });
}

export async function expireEligibleReferralAttributions(input: {
  now?: string;
}): Promise<ReferralAttributionRecord[]> {
  const now = input.now ? new Date(input.now).toISOString() : nowIso();

  if (!isReferralDatabaseConfigured()) {
    const expired: ReferralAttributionRecord[] = [];

    for (const attribution of inMemoryAttributionsById.values()) {
      if (!isReferralAttributionActiveStatus(attribution.status)) {
        continue;
      }

      if (attribution.eligibilityWindowEndsAt > now) {
        continue;
      }

      const next: ReferralAttributionRecord = {
        ...attribution,
        status: getExpiredAttributionStatus({
          currentStatus: attribution.status,
          kycApprovedAt: attribution.kycApprovedAt
        }),
        closedAt: now
      };

      setInMemoryAttribution(next);
      expired.push({
        ...next,
        metadata: { ...next.metadata }
      });
    }

    expired.sort((left, right) => left.boundAt.localeCompare(right.boundAt));
    return expired;
  }

  return withDbClient(async (client) => {
    const result = await client.query<ReferralAttributionRow>(
      `WITH expired AS (
         UPDATE referral_attributions
         SET status = CASE
             WHEN status = 'kyc_verified' OR kyc_approved_at IS NOT NULL THEN 'expired_no_qualification'
             ELSE 'expired_no_kyc'
           END,
           closed_at = $1
         WHERE status IN ('bound_pending_kyc', 'kyc_verified')
           AND eligibility_window_ends_at <= $1
         RETURNING
           id,
           referral_code_id,
           referrer_wallet_public_key,
           invitee_wallet_public_key,
           attribution_source,
           bound_at,
           eligibility_window_ends_at,
           kyc_approved_at,
           closed_at,
           status,
           metadata_json
       )
       SELECT
         expired.id,
         expired.referral_code_id,
         rc.code AS referral_code,
         expired.referrer_wallet_public_key,
         expired.invitee_wallet_public_key,
         expired.attribution_source,
         expired.bound_at,
         expired.eligibility_window_ends_at,
         expired.kyc_approved_at,
         expired.closed_at,
         expired.status,
         expired.metadata_json
       FROM expired
       JOIN referral_codes rc ON rc.id = expired.referral_code_id
       ORDER BY expired.bound_at ASC`,
      [now]
    );

    return result.rows.map((row) => mapReferralAttributionRow(row));
  });
}
