import { randomUUID } from "node:crypto";

import type { PoolClient } from "pg";

import { withDbClient } from "@/lib/db/pool";
import {
  projectComplianceStatus,
  type AmlStatus,
  type ComplianceStatus,
  type KycStatus
} from "@/lib/compliance/compliance-status-projector";
import {
  type AmlFlag,
  type AmlProviderClassification
} from "@/lib/compliance/aml-helius";

export type ProfileBundle = {
  walletPublicKey: string;
  username: string;
  bio: string;
  avatarUrl: string;
  firstName: string | null;
  lastName: string | null;
  country: string | null;
  stateProvince: string | null;
  email: string | null;
  address: string | null;
  phone: string | null;
  kycStatus: KycStatus;
  amlStatus: AmlStatus;
  complianceStatus: ComplianceStatus;
  rejectionReasonCode: string | null;
  kycProviderSessionId: string | null;
  kycProviderReportId: string | null;
  isSuspended: boolean;
  complianceStatusUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type UpdateProfileBasicsInput = {
  walletPublicKey: string;
  username: string;
  bio: string;
  avatarUrl: string;
  firstName: string | null;
  lastName: string | null;
  country: string | null;
  stateProvince: string | null;
  email: string | null;
  address: string | null;
  phone: string | null;
};

export type MarkKycSessionPendingInput = {
  walletPublicKey: string;
  provider: string;
  providerSessionId: string;
};

export type UpdateKycStatusFromProviderInput = {
  walletPublicKey: string;
  provider: string;
  providerSessionId: string;
  providerReportId?: string | null;
  kycStatus: KycStatus;
  rejectionReasonCode?: string | null;
};

export type UpdateAmlStatusFromProviderInput = {
  walletPublicKey: string;
  provider: string;
  providerClassification: AmlProviderClassification;
  amlStatus: AmlStatus;
  amlRiskScore: number | null;
  amlFlags: AmlFlag[];
  ruleVersion: string | null;
  triggerSource: string;
};

export type AmlCaseSnapshotForAdmin = {
  walletPublicKey: string;
  kycStatus: KycStatus;
  amlStatus: AmlStatus;
  amlRiskScore: number | null;
  amlFlags: AmlFlag[];
  amlProvider: string | null;
  amlRuleVersion: string | null;
  amlLastCheckedAt: string | null;
  complianceStatus: ComplianceStatus;
  screenings: Array<{
    id: number;
    provider: string;
    providerClassification: AmlProviderClassification;
    amlStatus: AmlStatus;
    amlRiskScore: number | null;
    amlFlags: AmlFlag[];
    ruleVersion: string | null;
    triggerSource: string;
    createdAt: string;
  }>;
};

export type ComplianceAuditEventRecord = {
  id: string;
  walletPublicKey: string;
  actorType: ComplianceAuditActorType;
  actorId: string;
  eventName: string;
  eventPayload: Record<string, unknown>;
  createdAt: string;
};

export type ComplianceNoteRecord = {
  id: string;
  walletPublicKey: string;
  noteText: string;
  actorId: string;
  createdAt: string;
};

export type ComplianceCaseListItem = {
  walletPublicKey: string;
  username: string;
  kycStatus: KycStatus;
  amlStatus: AmlStatus;
  amlRiskScore: number | null;
  complianceStatus: ComplianceStatus;
  isSuspended: boolean;
  complianceStatusUpdatedAt: string;
};

export type ListComplianceCasesInput = {
  status?: ComplianceStatus;
  cursor?: string | null;
  limit?: number;
};

export type ListComplianceCasesResult = {
  items: ComplianceCaseListItem[];
  nextCursor: string | null;
};

export type ComplianceCaseDetailForAdmin = ProfileBundle & {
  amlRiskScore: number | null;
  amlFlags: AmlFlag[];
  amlProvider: string | null;
  amlRuleVersion: string | null;
  amlLastCheckedAt: string | null;
  recentAuditEvents: ComplianceAuditEventRecord[];
  recentNotes: ComplianceNoteRecord[];
};

export type SetKycDecisionByAdminInput = {
  walletPublicKey: string;
  adminActorId: string;
  decision: "verified" | "rejected";
  reason?: string | null;
};

export type SetAmlDecisionByAdminInput = {
  walletPublicKey: string;
  adminActorId: string;
  decision: "clear" | "flagged";
  reason: string;
  amlRiskScore?: number | null;
  amlFlags?: AmlFlag[];
};

export type SetSuspensionByAdminInput = {
  walletPublicKey: string;
  adminActorId: string;
  suspended: boolean;
  reason?: string | null;
};

export type AddComplianceNoteInput = {
  walletPublicKey: string;
  actorId: string;
  noteText: string;
};

export type AdminCaseMutationResult = {
  profile: ProfileBundle;
  idempotent: boolean;
};

export type RegisterKycWebhookEventInput = {
  providerEventId: string;
  provider: string;
  eventType: string;
  walletPublicKey: string | null;
  providerSessionId: string | null;
  status: "processed" | "duplicate" | "ignored" | "invalid";
};

export type ComplianceAuditActorType = "user" | "admin" | "system" | "provider";

export type RecordComplianceAuditEventInput = {
  walletPublicKey: string;
  actorType: ComplianceAuditActorType;
  actorId: string;
  eventName: string;
  eventPayload?: Record<string, unknown>;
};

export class ProfileRepositoryError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

type ProfileBundleRow = {
  wallet_public_key: string;
  username: string;
  bio: string;
  avatar_url: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  country: string | null;
  state_province: string | null;
  address: string | null;
  phone: string | null;
  kyc_status: KycStatus;
  aml_status: AmlStatus;
  aml_risk_score: number | null;
  aml_flags_json: unknown;
  aml_provider: string | null;
  aml_rule_version: string | null;
  aml_last_checked_at: string | Date | null;
  compliance_status: ComplianceStatus;
  rejection_reason_code: string | null;
  kyc_provider_session_id: string | null;
  kyc_provider_report_id: string | null;
  is_suspended: boolean;
  compliance_status_updated_at: string | Date;
  created_at: string | Date;
  updated_at: string | Date;
};

type InMemoryProfileState = {
  walletPublicKey: string;
  username: string;
  bio: string;
  avatarUrl: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  country: string | null;
  stateProvince: string | null;
  address: string | null;
  phone: string | null;
  kycStatus: KycStatus;
  amlStatus: AmlStatus;
  amlRiskScore: number | null;
  amlFlags: AmlFlag[];
  amlProvider: string | null;
  amlRuleVersion: string | null;
  amlLastCheckedAt: string | null;
  rejectionReasonCode: string | null;
  kycProviderSessionId: string | null;
  kycProviderReportId: string | null;
  isSuspended: boolean;
  complianceStatus: ComplianceStatus;
  complianceStatusUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
};

const inMemoryProfiles = new Map<string, InMemoryProfileState>();
const inMemoryWebhookEventIds = new Set<string>();
const inMemoryAuditEvents: Array<RecordComplianceAuditEventInput & { id: string; createdAt: string }> = [];
const inMemoryNotes = new Map<string, ComplianceNoteRecord[]>();

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeIso(value: string | Date): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
}

function normalizeOptionalIso(value: string | Date | null): string | null {
  if (!value) {
    return null;
  }

  return normalizeIso(value);
}

function sanitizeAmlFlags(value: unknown): AmlFlag[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const result: AmlFlag[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const record = item as Record<string, unknown>;
    const code = typeof record.code === "string" ? record.code.trim() : "";
    if (!code) {
      continue;
    }

    const severityValue =
      record.severity === "low" || record.severity === "medium" || record.severity === "high"
        ? record.severity
        : "unknown";
    const label = typeof record.label === "string" && record.label.trim() ? record.label.trim() : undefined;

    result.push({
      code,
      severity: severityValue,
      label
    });
  }

  return result.slice(0, 50);
}

function sanitizeEventPayload(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function normalizeDecisionReason(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 500) : null;
}

function encodeComplianceCursor(input: { updatedAt: string; walletPublicKey: string }): string {
  return Buffer.from(JSON.stringify({ u: input.updatedAt, w: input.walletPublicKey }), "utf8").toString("base64url");
}

function decodeComplianceCursor(cursor: string | null | undefined): { updatedAt: string; walletPublicKey: string } | null {
  if (!cursor || !cursor.trim()) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as {
      u?: unknown;
      w?: unknown;
    };
    const updatedAt = typeof decoded.u === "string" ? decoded.u.trim() : "";
    const walletPublicKey = typeof decoded.w === "string" ? decoded.w.trim() : "";

    if (!updatedAt || !walletPublicKey) {
      throw new Error("Cursor fields are missing.");
    }

    const asDate = new Date(updatedAt);
    if (Number.isNaN(asDate.getTime())) {
      throw new Error("Cursor date is invalid.");
    }

    return {
      updatedAt: asDate.toISOString(),
      walletPublicKey
    };
  } catch {
    throw new ProfileRepositoryError("INVALID_CURSOR", "Cursor is invalid.");
  }
}

function normalizeListLimit(limit: number | undefined): number {
  if (!Number.isInteger(limit) || Number(limit) < 1) {
    return 20;
  }

  return Math.min(Number(limit), 100);
}

function sortCasesByCursorOrder<T extends { complianceStatusUpdatedAt: string; walletPublicKey: string }>(cases: T[]): T[] {
  return [...cases].sort((left, right) => {
    const leftTime = new Date(left.complianceStatusUpdatedAt).getTime();
    const rightTime = new Date(right.complianceStatusUpdatedAt).getTime();
    if (leftTime !== rightTime) {
      return rightTime - leftTime;
    }

    return right.walletPublicKey.localeCompare(left.walletPublicKey);
  });
}

function isProfileErrorCode(error: unknown, code: string): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === code
  );
}

function buildDefaultInMemoryProfile(walletPublicKey: string): InMemoryProfileState {
  const createdAt = nowIso();
  return {
    walletPublicKey,
    username: "",
    bio: "",
    avatarUrl: "",
    firstName: null,
    lastName: null,
    email: null,
    country: null,
    stateProvince: null,
    address: null,
    phone: null,
    kycStatus: "not_started",
    amlStatus: "not_started",
    amlRiskScore: null,
    amlFlags: [],
    amlProvider: null,
    amlRuleVersion: null,
    amlLastCheckedAt: null,
    rejectionReasonCode: null,
    kycProviderSessionId: null,
    kycProviderReportId: null,
    isSuspended: false,
    complianceStatus: projectComplianceStatus({
      kycStatus: "not_started",
      amlStatus: "not_started",
      isSuspended: false
    }),
    complianceStatusUpdatedAt: createdAt,
    createdAt,
    updatedAt: createdAt
  };
}

function mapInMemoryToBundle(profile: InMemoryProfileState): ProfileBundle {
  return {
    walletPublicKey: profile.walletPublicKey,
    username: profile.username,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    firstName: profile.firstName,
    lastName: profile.lastName,
    country: profile.country,
    stateProvince: profile.stateProvince,
    email: profile.email,
    address: profile.address,
    phone: profile.phone,
    kycStatus: profile.kycStatus,
    amlStatus: profile.amlStatus,
    complianceStatus: profile.complianceStatus,
    rejectionReasonCode: profile.rejectionReasonCode,
    kycProviderSessionId: profile.kycProviderSessionId,
    kycProviderReportId: profile.kycProviderReportId,
    isSuspended: profile.isSuspended,
    complianceStatusUpdatedAt: profile.complianceStatusUpdatedAt,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt
  };
}

function getOrCreateInMemoryProfile(walletPublicKey: string): InMemoryProfileState {
  const found = inMemoryProfiles.get(walletPublicKey);

  if (found) {
    return found;
  }

  const created = buildDefaultInMemoryProfile(walletPublicKey);
  inMemoryProfiles.set(walletPublicKey, created);
  return created;
}

function toBundle(row: ProfileBundleRow): ProfileBundle {
  return {
    walletPublicKey: row.wallet_public_key,
    username: row.username,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    firstName: row.first_name,
    lastName: row.last_name,
    country: row.country,
    stateProvince: row.state_province,
    email: row.email,
    address: row.address,
    phone: row.phone,
    kycStatus: row.kyc_status,
    amlStatus: row.aml_status,
    complianceStatus: row.compliance_status,
    rejectionReasonCode: row.rejection_reason_code,
    kycProviderSessionId: row.kyc_provider_session_id,
    kycProviderReportId: row.kyc_provider_report_id,
    isSuspended: Boolean(row.is_suspended),
    complianceStatusUpdatedAt: normalizeIso(row.compliance_status_updated_at),
    createdAt: normalizeIso(row.created_at),
    updatedAt: normalizeIso(row.updated_at)
  };
}

export function isProfileDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

async function ensureProfileExistsWithClient(client: PoolClient, walletPublicKey: string): Promise<void> {
  const initialComplianceStatus = projectComplianceStatus({
    kycStatus: "not_started",
    amlStatus: "not_started",
    isSuspended: false
  });

  await client.query(
    `INSERT INTO user_profiles (wallet_public_key, compliance_status)
     VALUES ($1, $2)
     ON CONFLICT (wallet_public_key) DO NOTHING`,
    [walletPublicKey, initialComplianceStatus]
  );

  await client.query(
    `INSERT INTO kyc_cases (wallet_public_key)
     VALUES ($1)
     ON CONFLICT (wallet_public_key) DO NOTHING`,
    [walletPublicKey]
  );
}

async function getProfileBundleWithClient(
  client: PoolClient,
  walletPublicKey: string,
  forUpdate = false
): Promise<ProfileBundle | null> {
  const result = await client.query<ProfileBundleRow>(
    `SELECT
       p.wallet_public_key,
       p.username,
       p.bio,
       p.avatar_url,
       p.first_name,
       p.last_name,
       p.email,
       p.country,
       p.state_province,
       p.address,
       p.phone,
       k.kyc_status,
       p.aml_status,
       p.aml_risk_score,
       p.aml_flags_json,
       p.aml_provider,
       p.aml_rule_version,
       p.aml_last_checked_at,
       p.compliance_status,
       k.rejection_reason_code,
       p.kyc_provider_session_id,
       p.kyc_provider_report_id,
       p.is_suspended,
       p.compliance_status_updated_at,
       p.created_at,
       p.updated_at
     FROM user_profiles p
     JOIN kyc_cases k ON k.wallet_public_key = p.wallet_public_key
     WHERE p.wallet_public_key = $1
     ${forUpdate ? "FOR UPDATE OF p, k" : ""}`,
    [walletPublicKey]
  );

  if (!result.rows[0]) {
    return null;
  }

  return toBundle(result.rows[0]);
}

async function insertComplianceAuditEventWithClient(
  client: PoolClient,
  input: RecordComplianceAuditEventInput
): Promise<void> {
  await client.query(
    `INSERT INTO compliance_audit_events (
      wallet_public_key,
      actor_type,
      actor_id,
      event_name,
      event_payload
    ) VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [
      input.walletPublicKey,
      input.actorType,
      input.actorId,
      input.eventName,
      JSON.stringify(input.eventPayload ?? {})
    ]
  );
}

export async function isWalletRegistered(walletPublicKey: string): Promise<boolean> {
  if (!isProfileDatabaseConfigured()) {
    return inMemoryProfiles.has(walletPublicKey);
  }

  return withDbClient(async (client) => {
    const res = await client.query<{ exists: boolean }>(
      "SELECT EXISTS(SELECT 1 FROM user_profiles WHERE wallet_public_key = $1) as exists",
      [walletPublicKey]
    );
    return res.rows[0]?.exists ?? false;
  });
}

export async function getOrCreateProfileBundle(walletPublicKey: string): Promise<ProfileBundle> {
  if (!isProfileDatabaseConfigured()) {
    return mapInMemoryToBundle(getOrCreateInMemoryProfile(walletPublicKey));
  }

  return withDbClient(async (client) => {
    await ensureProfileExistsWithClient(client, walletPublicKey);
    const profile = await getProfileBundleWithClient(client, walletPublicKey);

    if (!profile) {
      throw new Error("Could not read wallet profile.");
    }

    return profile;
  });
}

export async function updateProfileBasics(input: UpdateProfileBasicsInput): Promise<ProfileBundle> {
  if (!isProfileDatabaseConfigured()) {
    const profile = getOrCreateInMemoryProfile(input.walletPublicKey);
    const updatedAt = nowIso();

    profile.username = input.username;
    profile.bio = input.bio;
    profile.avatarUrl = input.avatarUrl;
    profile.firstName = input.firstName;
    profile.lastName = input.lastName;
    profile.country = input.country;
    profile.stateProvince = input.stateProvince;
    profile.email = input.email;
    profile.address = input.address;
    profile.phone = input.phone;
    profile.updatedAt = updatedAt;

    inMemoryProfiles.set(profile.walletPublicKey, profile);
    return mapInMemoryToBundle(profile);
  }

  try {
    return await withDbClient(async (client) => {
      await ensureProfileExistsWithClient(client, input.walletPublicKey);

      await client.query(
        `UPDATE user_profiles
         SET username = $2,
             bio = $3,
             avatar_url = $4,
             first_name = $5,
             last_name = $6,
             email = $7,
             country = $8,
             state_province = $9,
             address = $10,
             phone = $11,
             updated_at = NOW()
         WHERE wallet_public_key = $1`,
        [input.walletPublicKey, input.username, input.bio, input.avatarUrl, input.firstName, input.lastName, input.email, input.country, input.stateProvince, input.address, input.phone]
      );

      const updated = await getProfileBundleWithClient(client, input.walletPublicKey);
      if (!updated) {
        throw new Error("Could not update wallet profile.");
      }

      return updated;
    });
  } catch (error) {
    if (isProfileErrorCode(error, "23505")) {
      throw new ProfileRepositoryError("USERNAME_TAKEN", "Username is already in use.");
    }

    throw error;
  }
}

export async function markKycSessionPending(input: MarkKycSessionPendingInput): Promise<void> {
  if (!isProfileDatabaseConfigured()) {
    const profile = getOrCreateInMemoryProfile(input.walletPublicKey);
    const updatedAt = nowIso();

    profile.kycStatus = "pending";
    profile.kycProviderSessionId = input.providerSessionId;
    profile.rejectionReasonCode = null;
    profile.complianceStatus = projectComplianceStatus({
      kycStatus: profile.kycStatus,
      amlStatus: profile.amlStatus,
      isSuspended: profile.isSuspended
    });
    profile.complianceStatusUpdatedAt = updatedAt;
    profile.updatedAt = updatedAt;

    inMemoryProfiles.set(input.walletPublicKey, profile);

    await recordComplianceAuditEvent({
      walletPublicKey: input.walletPublicKey,
      actorType: "user",
      actorId: input.walletPublicKey,
      eventName: "kyc.session_started",
      eventPayload: {
        provider: input.provider,
        providerSessionId: input.providerSessionId
      }
    });
    return;
  }

  await withDbClient(async (client) => {
    await ensureProfileExistsWithClient(client, input.walletPublicKey);

    const current = await getProfileBundleWithClient(client, input.walletPublicKey, true);
    if (!current) {
      throw new Error("Could not load profile before starting KYC session.");
    }

    const complianceStatus = projectComplianceStatus({
      kycStatus: "pending",
      amlStatus: current.amlStatus,
      isSuspended: current.isSuspended
    });

    await client.query(
      `UPDATE kyc_cases
       SET kyc_provider = $2,
           kyc_provider_session_id = $3,
           kyc_status = 'pending',
           rejection_reason_code = NULL,
           submitted_at = COALESCE(submitted_at, NOW()),
           updated_at = NOW()
       WHERE wallet_public_key = $1`,
      [input.walletPublicKey, input.provider, input.providerSessionId]
    );

    await client.query(
      `UPDATE user_profiles
       SET kyc_provider = $2,
           kyc_provider_session_id = $3,
           compliance_status = $4,
           compliance_status_updated_at = NOW(),
           updated_at = NOW()
       WHERE wallet_public_key = $1`,
      [input.walletPublicKey, input.provider, input.providerSessionId, complianceStatus]
    );

    await insertComplianceAuditEventWithClient(client, {
      walletPublicKey: input.walletPublicKey,
      actorType: "user",
      actorId: input.walletPublicKey,
      eventName: "kyc.session_started",
      eventPayload: {
        provider: input.provider,
        providerSessionId: input.providerSessionId
      }
    });
  });
}

export async function findWalletByKycProviderSessionId(providerSessionId: string): Promise<string | null> {
  if (!isProfileDatabaseConfigured()) {
    for (const profile of inMemoryProfiles.values()) {
      if (profile.kycProviderSessionId === providerSessionId) {
        return profile.walletPublicKey;
      }
    }

    return null;
  }

  return withDbClient(async (client) => {
    const result = await client.query<{ wallet_public_key: string }>(
      `SELECT wallet_public_key
       FROM kyc_cases
       WHERE kyc_provider_session_id = $1
       LIMIT 1`,
      [providerSessionId]
    );

    return result.rows[0]?.wallet_public_key ?? null;
  });
}

export async function updateKycStatusFromProvider(
  input: UpdateKycStatusFromProviderInput
): Promise<ProfileBundle> {
  if (!isProfileDatabaseConfigured()) {
    const profile = getOrCreateInMemoryProfile(input.walletPublicKey);
    const updatedAt = nowIso();

    profile.kycStatus = input.kycStatus;
    profile.kycProviderSessionId = input.providerSessionId;
    profile.kycProviderReportId = input.providerReportId ?? null;
    profile.rejectionReasonCode = input.rejectionReasonCode ?? null;
    profile.complianceStatus = projectComplianceStatus({
      kycStatus: profile.kycStatus,
      amlStatus: profile.amlStatus,
      isSuspended: profile.isSuspended
    });
    profile.complianceStatusUpdatedAt = updatedAt;
    profile.updatedAt = updatedAt;

    inMemoryProfiles.set(input.walletPublicKey, profile);

    await recordComplianceAuditEvent({
      walletPublicKey: input.walletPublicKey,
      actorType: "provider",
      actorId: input.provider,
      eventName: "kyc.status_updated",
      eventPayload: {
        providerSessionId: input.providerSessionId,
        providerReportId: input.providerReportId ?? null,
        kycStatus: input.kycStatus,
        rejectionReasonCode: input.rejectionReasonCode ?? null,
        complianceStatus: profile.complianceStatus
      }
    });

    return mapInMemoryToBundle(profile);
  }

  return withDbClient(async (client) => {
    await ensureProfileExistsWithClient(client, input.walletPublicKey);

    const current = await getProfileBundleWithClient(client, input.walletPublicKey, true);
    if (!current) {
      throw new Error("Could not load profile for KYC update.");
    }

    const complianceStatus = projectComplianceStatus({
      kycStatus: input.kycStatus,
      amlStatus: current.amlStatus,
      isSuspended: current.isSuspended
    });

    await client.query(
      `UPDATE kyc_cases
       SET kyc_provider = $2,
           kyc_provider_session_id = $3,
           kyc_provider_report_id = $4,
           kyc_status = $5,
           rejection_reason_code = $6,
           reviewed_at = CASE WHEN $5 IN ('verified', 'rejected') THEN NOW() ELSE reviewed_at END,
           updated_at = NOW()
       WHERE wallet_public_key = $1`,
      [
        input.walletPublicKey,
        input.provider,
        input.providerSessionId,
        input.providerReportId ?? null,
        input.kycStatus,
        input.rejectionReasonCode ?? null
      ]
    );

    await client.query(
      `UPDATE user_profiles
       SET kyc_provider = $2,
           kyc_provider_session_id = $3,
           kyc_provider_report_id = $4,
           compliance_status = $5,
           compliance_status_updated_at = NOW(),
           updated_at = NOW()
       WHERE wallet_public_key = $1`,
      [
        input.walletPublicKey,
        input.provider,
        input.providerSessionId,
        input.providerReportId ?? null,
        complianceStatus
      ]
    );

    await insertComplianceAuditEventWithClient(client, {
      walletPublicKey: input.walletPublicKey,
      actorType: "provider",
      actorId: input.provider,
      eventName: "kyc.status_updated",
      eventPayload: {
        providerSessionId: input.providerSessionId,
        providerReportId: input.providerReportId ?? null,
        kycStatus: input.kycStatus,
        rejectionReasonCode: input.rejectionReasonCode ?? null,
        complianceStatus
      }
    });

    const updated = await getProfileBundleWithClient(client, input.walletPublicKey);
    if (!updated) {
      throw new Error("Could not load profile after KYC update.");
    }

    return updated;
  });
}

type AmlSnapshotRow = {
  wallet_public_key: string;
  kyc_status: KycStatus;
  aml_status: AmlStatus;
  aml_risk_score: number | null;
  aml_flags_json: unknown;
  aml_provider: string | null;
  aml_rule_version: string | null;
  aml_last_checked_at: string | Date | null;
  compliance_status: ComplianceStatus;
};

type ComplianceCaseListRow = {
  wallet_public_key: string;
  username: string;
  kyc_status: KycStatus;
  aml_status: AmlStatus;
  aml_risk_score: number | null;
  compliance_status: ComplianceStatus;
  is_suspended: boolean;
  compliance_status_updated_at: string | Date;
};

type ComplianceAuditEventRow = {
  id: number | string;
  wallet_public_key: string;
  actor_type: ComplianceAuditActorType;
  actor_id: string;
  event_name: string;
  event_payload: unknown;
  created_at: string | Date;
};

type ComplianceNoteRow = {
  id: number | string;
  wallet_public_key: string;
  note_text: string;
  actor_id: string;
  created_at: string | Date;
};

type AmlScreeningRow = {
  id: number;
  provider: string;
  provider_classification: AmlProviderClassification;
  aml_status: AmlStatus;
  aml_risk_score: number | null;
  aml_flags_json: unknown;
  rule_version: string | null;
  trigger_source: string;
  created_at: string | Date;
};

function mapComplianceCaseRow(row: ComplianceCaseListRow): ComplianceCaseListItem {
  return {
    walletPublicKey: row.wallet_public_key,
    username: row.username,
    kycStatus: row.kyc_status,
    amlStatus: row.aml_status,
    amlRiskScore: row.aml_risk_score,
    complianceStatus: row.compliance_status,
    isSuspended: Boolean(row.is_suspended),
    complianceStatusUpdatedAt: normalizeIso(row.compliance_status_updated_at)
  };
}

function mapComplianceAuditEventRow(row: ComplianceAuditEventRow): ComplianceAuditEventRecord {
  return {
    id: String(row.id),
    walletPublicKey: row.wallet_public_key,
    actorType: row.actor_type,
    actorId: row.actor_id,
    eventName: row.event_name,
    eventPayload: sanitizeEventPayload(row.event_payload),
    createdAt: normalizeIso(row.created_at)
  };
}

function mapComplianceNoteRow(row: ComplianceNoteRow): ComplianceNoteRecord {
  return {
    id: String(row.id),
    walletPublicKey: row.wallet_public_key,
    noteText: row.note_text,
    actorId: row.actor_id,
    createdAt: normalizeIso(row.created_at)
  };
}

function mapAmlCaseSnapshot(
  snapshot: AmlSnapshotRow,
  screenings: AmlScreeningRow[]
): AmlCaseSnapshotForAdmin {
  return {
    walletPublicKey: snapshot.wallet_public_key,
    kycStatus: snapshot.kyc_status,
    amlStatus: snapshot.aml_status,
    amlRiskScore: snapshot.aml_risk_score,
    amlFlags: sanitizeAmlFlags(snapshot.aml_flags_json),
    amlProvider: snapshot.aml_provider,
    amlRuleVersion: snapshot.aml_rule_version,
    amlLastCheckedAt: normalizeOptionalIso(snapshot.aml_last_checked_at),
    complianceStatus: snapshot.compliance_status,
    screenings: screenings.map((screening) => ({
      id: screening.id,
      provider: screening.provider,
      providerClassification: screening.provider_classification,
      amlStatus: screening.aml_status,
      amlRiskScore: screening.aml_risk_score,
      amlFlags: sanitizeAmlFlags(screening.aml_flags_json),
      ruleVersion: screening.rule_version,
      triggerSource: screening.trigger_source,
      createdAt: normalizeIso(screening.created_at)
    }))
  };
}

type MutableComplianceState = {
  walletPublicKey: string;
  kycStatus: KycStatus;
  amlStatus: AmlStatus;
  amlRiskScore: number | null;
  amlFlags: AmlFlag[];
  isSuspended: boolean;
  complianceStatus: ComplianceStatus;
  rejectionReasonCode: string | null;
};

async function getMutableComplianceStateWithClient(
  client: PoolClient,
  walletPublicKey: string,
  forUpdate = false
): Promise<MutableComplianceState | null> {
  const result = await client.query<{
    wallet_public_key: string;
    kyc_status: KycStatus;
    aml_status: AmlStatus;
    aml_risk_score: number | null;
    aml_flags_json: unknown;
    is_suspended: boolean;
    compliance_status: ComplianceStatus;
    rejection_reason_code: string | null;
  }>(
    `SELECT
       p.wallet_public_key,
       k.kyc_status,
       p.aml_status,
       p.aml_risk_score,
       p.aml_flags_json,
       p.is_suspended,
       p.compliance_status,
       k.rejection_reason_code
     FROM user_profiles p
     JOIN kyc_cases k ON k.wallet_public_key = p.wallet_public_key
     WHERE p.wallet_public_key = $1
     ${forUpdate ? "FOR UPDATE OF p, k" : ""}`,
    [walletPublicKey]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return {
    walletPublicKey: row.wallet_public_key,
    kycStatus: row.kyc_status,
    amlStatus: row.aml_status,
    amlRiskScore: row.aml_risk_score,
    amlFlags: sanitizeAmlFlags(row.aml_flags_json),
    isSuspended: Boolean(row.is_suspended),
    complianceStatus: row.compliance_status,
    rejectionReasonCode: row.rejection_reason_code
  };
}

async function getRecentComplianceAuditEventsWithClient(
  client: PoolClient,
  walletPublicKey: string,
  limit = 50
): Promise<ComplianceAuditEventRecord[]> {
  const result = await client.query<ComplianceAuditEventRow>(
    `SELECT
       id,
       wallet_public_key,
       actor_type,
       actor_id,
       event_name,
       event_payload,
       created_at
     FROM compliance_audit_events
     WHERE wallet_public_key = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [walletPublicKey, Math.max(1, Math.min(limit, 200))]
  );

  return result.rows.map(mapComplianceAuditEventRow);
}

async function getRecentComplianceNotesWithClient(
  client: PoolClient,
  walletPublicKey: string,
  limit = 50
): Promise<ComplianceNoteRecord[]> {
  const result = await client.query<ComplianceNoteRow>(
    `SELECT
       id,
       wallet_public_key,
       note_text,
       actor_id,
       created_at
     FROM compliance_notes
     WHERE wallet_public_key = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [walletPublicKey, Math.max(1, Math.min(limit, 200))]
  );

  return result.rows.map(mapComplianceNoteRow);
}

export async function updateAmlStatusFromProvider(
  input: UpdateAmlStatusFromProviderInput
): Promise<ProfileBundle> {
  const normalizedFlags = sanitizeAmlFlags(input.amlFlags);

  if (!isProfileDatabaseConfigured()) {
    const profile = getOrCreateInMemoryProfile(input.walletPublicKey);
    const updatedAt = nowIso();

    profile.amlStatus = input.amlStatus;
    profile.amlRiskScore = input.amlRiskScore;
    profile.amlFlags = normalizedFlags;
    profile.amlProvider = input.provider;
    profile.amlRuleVersion = input.ruleVersion;
    profile.amlLastCheckedAt = updatedAt;
    profile.complianceStatus = projectComplianceStatus({
      kycStatus: profile.kycStatus,
      amlStatus: profile.amlStatus,
      isSuspended: profile.isSuspended
    });
    profile.complianceStatusUpdatedAt = updatedAt;
    profile.updatedAt = updatedAt;

    inMemoryProfiles.set(input.walletPublicKey, profile);
    return mapInMemoryToBundle(profile);
  }

  return withDbClient(async (client) => {
    await ensureProfileExistsWithClient(client, input.walletPublicKey);

    const current = await getProfileBundleWithClient(client, input.walletPublicKey, true);
    if (!current) {
      throw new Error("Could not load profile for AML update.");
    }

    const complianceStatus = projectComplianceStatus({
      kycStatus: current.kycStatus,
      amlStatus: input.amlStatus,
      isSuspended: current.isSuspended
    });

    await client.query(
      `UPDATE user_profiles
       SET aml_status = $2,
           aml_risk_score = $3,
           aml_flags_json = $4::jsonb,
           aml_provider = $5,
           aml_rule_version = $6,
           aml_last_checked_at = NOW(),
           compliance_status = $7,
           compliance_status_updated_at = NOW(),
           updated_at = NOW()
       WHERE wallet_public_key = $1`,
      [
        input.walletPublicKey,
        input.amlStatus,
        input.amlRiskScore,
        JSON.stringify(normalizedFlags),
        input.provider,
        input.ruleVersion,
        complianceStatus
      ]
    );

    await client.query(
      `INSERT INTO aml_screenings (
         wallet_public_key,
         provider,
         provider_classification,
         aml_status,
         aml_risk_score,
         aml_flags_json,
         rule_version,
         trigger_source
       ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)`,
      [
        input.walletPublicKey,
        input.provider,
        input.providerClassification,
        input.amlStatus,
        input.amlRiskScore,
        JSON.stringify(normalizedFlags),
        input.ruleVersion,
        input.triggerSource
      ]
    );

    const updated = await getProfileBundleWithClient(client, input.walletPublicKey);
    if (!updated) {
      throw new Error("Could not load profile after AML update.");
    }

    return updated;
  });
}

export async function getAmlCaseSnapshotForAdmin(walletPublicKey: string): Promise<AmlCaseSnapshotForAdmin | null> {
  if (!isProfileDatabaseConfigured()) {
    const profile = inMemoryProfiles.get(walletPublicKey);
    if (!profile) {
      return null;
    }

    return {
      walletPublicKey: profile.walletPublicKey,
      kycStatus: profile.kycStatus,
      amlStatus: profile.amlStatus,
      amlRiskScore: profile.amlRiskScore,
      amlFlags: profile.amlFlags,
      amlProvider: profile.amlProvider,
      amlRuleVersion: profile.amlRuleVersion,
      amlLastCheckedAt: profile.amlLastCheckedAt,
      complianceStatus: profile.complianceStatus,
      screenings: []
    };
  }

  return withDbClient(async (client) => {
    const snapshotResult = await client.query<AmlSnapshotRow>(
      `SELECT
         p.wallet_public_key,
         k.kyc_status,
         p.aml_status,
         p.aml_risk_score,
         p.aml_flags_json,
         p.aml_provider,
         p.aml_rule_version,
         p.aml_last_checked_at,
         p.compliance_status
       FROM user_profiles p
       JOIN kyc_cases k ON k.wallet_public_key = p.wallet_public_key
       WHERE p.wallet_public_key = $1
       LIMIT 1`,
      [walletPublicKey]
    );

    const snapshot = snapshotResult.rows[0];
    if (!snapshot) {
      return null;
    }

    const screeningsResult = await client.query<AmlScreeningRow>(
      `SELECT
         id,
         provider,
         provider_classification,
         aml_status,
         aml_risk_score,
         aml_flags_json,
         rule_version,
         trigger_source,
         created_at
       FROM aml_screenings
       WHERE wallet_public_key = $1
       ORDER BY created_at DESC
       LIMIT 25`,
      [walletPublicKey]
    );

    return mapAmlCaseSnapshot(snapshot, screeningsResult.rows);
  });
}

export async function listComplianceCasesForAdmin(input: ListComplianceCasesInput): Promise<ListComplianceCasesResult> {
  const normalizedLimit = normalizeListLimit(input.limit);
  const parsedCursor = decodeComplianceCursor(input.cursor ?? null);

  if (!isProfileDatabaseConfigured()) {
    let cases = sortCasesByCursorOrder(
      Array.from(inMemoryProfiles.values())
        .filter((profile) => (input.status ? profile.complianceStatus === input.status : true))
        .map((profile) => ({
          walletPublicKey: profile.walletPublicKey,
          username: profile.username,
          kycStatus: profile.kycStatus,
          amlStatus: profile.amlStatus,
          amlRiskScore: profile.amlRiskScore,
          complianceStatus: profile.complianceStatus,
          isSuspended: profile.isSuspended,
          complianceStatusUpdatedAt: profile.complianceStatusUpdatedAt
        }))
    );

    if (parsedCursor) {
      const cursorTime = new Date(parsedCursor.updatedAt).getTime();
      cases = cases.filter((item) => {
        const itemTime = new Date(item.complianceStatusUpdatedAt).getTime();
        if (itemTime < cursorTime) {
          return true;
        }

        if (itemTime > cursorTime) {
          return false;
        }

        return item.walletPublicKey < parsedCursor.walletPublicKey;
      });
    }

    const pageSlice = cases.slice(0, normalizedLimit + 1);
    const hasMore = pageSlice.length > normalizedLimit;
    const items = hasMore ? pageSlice.slice(0, normalizedLimit) : pageSlice;
    const last = items[items.length - 1];

    return {
      items,
      nextCursor: hasMore && last
        ? encodeComplianceCursor({
          updatedAt: last.complianceStatusUpdatedAt,
          walletPublicKey: last.walletPublicKey
        })
        : null
    };
  }

  return withDbClient(async (client) => {
    const result = await client.query<ComplianceCaseListRow>(
      `SELECT
         p.wallet_public_key,
         p.username,
         k.kyc_status,
         p.aml_status,
         p.aml_risk_score,
         p.compliance_status,
         p.is_suspended,
         p.compliance_status_updated_at
       FROM user_profiles p
       JOIN kyc_cases k ON k.wallet_public_key = p.wallet_public_key
       WHERE ($1::text IS NULL OR p.compliance_status = $1::text)
         AND (
           $2::timestamptz IS NULL
           OR p.compliance_status_updated_at < $2::timestamptz
           OR (p.compliance_status_updated_at = $2::timestamptz AND p.wallet_public_key < $3::text)
         )
       ORDER BY p.compliance_status_updated_at DESC, p.wallet_public_key DESC
       LIMIT $4`,
      [
        input.status ?? null,
        parsedCursor?.updatedAt ?? null,
        parsedCursor?.walletPublicKey ?? null,
        normalizedLimit + 1
      ]
    );

    const mapped = result.rows.map(mapComplianceCaseRow);
    const hasMore = mapped.length > normalizedLimit;
    const items = hasMore ? mapped.slice(0, normalizedLimit) : mapped;
    const last = items[items.length - 1];

    return {
      items,
      nextCursor: hasMore && last
        ? encodeComplianceCursor({
          updatedAt: last.complianceStatusUpdatedAt,
          walletPublicKey: last.walletPublicKey
        })
        : null
    };
  });
}

export async function getComplianceCaseDetailForAdmin(
  walletPublicKey: string
): Promise<ComplianceCaseDetailForAdmin | null> {
  if (!isProfileDatabaseConfigured()) {
    const profile = inMemoryProfiles.get(walletPublicKey);
    if (!profile) {
      return null;
    }

    const recentAuditEvents = [...inMemoryAuditEvents]
      .filter((event) => event.walletPublicKey === walletPublicKey)
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .slice(0, 50)
      .map((event) => ({
        id: event.id,
        walletPublicKey: event.walletPublicKey,
        actorType: event.actorType,
        actorId: event.actorId,
        eventName: event.eventName,
        eventPayload: sanitizeEventPayload(event.eventPayload),
        createdAt: event.createdAt
      }));

    const recentNotes = [...(inMemoryNotes.get(walletPublicKey) ?? [])]
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .slice(0, 50);

    return {
      ...mapInMemoryToBundle(profile),
      amlRiskScore: profile.amlRiskScore,
      amlFlags: profile.amlFlags,
      amlProvider: profile.amlProvider,
      amlRuleVersion: profile.amlRuleVersion,
      amlLastCheckedAt: profile.amlLastCheckedAt,
      recentAuditEvents,
      recentNotes
    };
  }

  return withDbClient(async (client) => {
    const snapshotResult = await client.query<ProfileBundleRow>(
      `SELECT
         p.wallet_public_key,
         p.username,
         p.bio,
         p.avatar_url,
         k.kyc_status,
         p.aml_status,
         p.aml_risk_score,
         p.aml_flags_json,
         p.aml_provider,
         p.aml_rule_version,
         p.aml_last_checked_at,
         p.compliance_status,
         k.rejection_reason_code,
         p.kyc_provider_session_id,
         p.kyc_provider_report_id,
         p.is_suspended,
         p.compliance_status_updated_at,
         p.created_at,
         p.updated_at
       FROM user_profiles p
       JOIN kyc_cases k ON k.wallet_public_key = p.wallet_public_key
       WHERE p.wallet_public_key = $1
       LIMIT 1`,
      [walletPublicKey]
    );

    const row = snapshotResult.rows[0];
    if (!row) {
      return null;
    }

    const [recentAuditEvents, recentNotes] = await Promise.all([
      getRecentComplianceAuditEventsWithClient(client, walletPublicKey, 50),
      getRecentComplianceNotesWithClient(client, walletPublicKey, 50)
    ]);

    return {
      ...toBundle(row),
      amlRiskScore: row.aml_risk_score,
      amlFlags: sanitizeAmlFlags(row.aml_flags_json),
      amlProvider: row.aml_provider,
      amlRuleVersion: row.aml_rule_version,
      amlLastCheckedAt: normalizeOptionalIso(row.aml_last_checked_at),
      recentAuditEvents,
      recentNotes
    };
  });
}

export async function listComplianceNotesForAdmin(
  walletPublicKey: string,
  limit = 50
): Promise<ComplianceNoteRecord[]> {
  if (!isProfileDatabaseConfigured()) {
    return [...(inMemoryNotes.get(walletPublicKey) ?? [])]
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .slice(0, Math.max(1, Math.min(limit, 200)));
  }

  return withDbClient(async (client) => getRecentComplianceNotesWithClient(client, walletPublicKey, limit));
}

export async function addComplianceNoteForAdmin(input: AddComplianceNoteInput): Promise<ComplianceNoteRecord> {
  const noteText = input.noteText.trim();
  if (!noteText) {
    throw new ProfileRepositoryError("INVALID_NOTE", "Note text is required.");
  }

  if (noteText.length > 2000) {
    throw new ProfileRepositoryError("INVALID_NOTE", "Note text cannot exceed 2000 characters.");
  }

  if (!isProfileDatabaseConfigured()) {
    const existingProfile = inMemoryProfiles.get(input.walletPublicKey);
    if (!existingProfile) {
      throw new ProfileRepositoryError("CASE_NOT_FOUND", "Compliance case was not found for this wallet.");
    }

    const created: ComplianceNoteRecord = {
      id: randomUUID(),
      walletPublicKey: input.walletPublicKey,
      noteText,
      actorId: input.actorId,
      createdAt: nowIso()
    };

    const existingNotes = inMemoryNotes.get(input.walletPublicKey) ?? [];
    inMemoryNotes.set(input.walletPublicKey, [created, ...existingNotes]);

    await recordComplianceAuditEvent({
      walletPublicKey: input.walletPublicKey,
      actorType: "admin",
      actorId: input.actorId,
      eventName: "compliance.note_added",
      eventPayload: {
        noteId: created.id
      }
    });

    return created;
  }

  return withDbClient(async (client) => {
    const current = await getProfileBundleWithClient(client, input.walletPublicKey);
    if (!current) {
      throw new ProfileRepositoryError("CASE_NOT_FOUND", "Compliance case was not found for this wallet.");
    }

    const result = await client.query<ComplianceNoteRow>(
      `INSERT INTO compliance_notes (wallet_public_key, note_text, actor_id)
       VALUES ($1, $2, $3)
       RETURNING id, wallet_public_key, note_text, actor_id, created_at`,
      [input.walletPublicKey, noteText, input.actorId]
    );
    const created = mapComplianceNoteRow(result.rows[0]);

    await insertComplianceAuditEventWithClient(client, {
      walletPublicKey: input.walletPublicKey,
      actorType: "admin",
      actorId: input.actorId,
      eventName: "compliance.note_added",
      eventPayload: {
        noteId: created.id
      }
    });

    return created;
  });
}

export async function setKycDecisionByAdmin(input: SetKycDecisionByAdminInput): Promise<AdminCaseMutationResult> {
  const normalizedReason = normalizeDecisionReason(input.reason);
  if (input.decision === "rejected" && !normalizedReason) {
    throw new ProfileRepositoryError("REASON_REQUIRED", "Reason is required for rejected KYC decisions.");
  }

  const rejectionReasonCode = input.decision === "rejected" ? normalizedReason : null;

  if (!isProfileDatabaseConfigured()) {
    const profile = inMemoryProfiles.get(input.walletPublicKey);
    if (!profile) {
      throw new ProfileRepositoryError("CASE_NOT_FOUND", "Compliance case was not found for this wallet.");
    }

    const projectedStatus = projectComplianceStatus({
      kycStatus: input.decision,
      amlStatus: profile.amlStatus,
      isSuspended: profile.isSuspended
    });

    const idempotent = profile.kycStatus === input.decision
      && profile.rejectionReasonCode === rejectionReasonCode
      && profile.complianceStatus === projectedStatus;

    if (!idempotent) {
      const updatedAt = nowIso();
      const previousKycStatus = profile.kycStatus;
      const previousComplianceStatus = profile.complianceStatus;

      profile.kycStatus = input.decision;
      profile.rejectionReasonCode = rejectionReasonCode;
      profile.complianceStatus = projectedStatus;
      profile.complianceStatusUpdatedAt = updatedAt;
      profile.updatedAt = updatedAt;
      inMemoryProfiles.set(profile.walletPublicKey, profile);

      await recordComplianceAuditEvent({
        walletPublicKey: input.walletPublicKey,
        actorType: "admin",
        actorId: input.adminActorId,
        eventName: "kyc.admin_decision_applied",
        eventPayload: {
          decision: input.decision,
          reason: rejectionReasonCode,
          previousKycStatus,
          previousComplianceStatus,
          complianceStatus: projectedStatus
        }
      });
    }

    return {
      profile: mapInMemoryToBundle(profile),
      idempotent
    };
  }

  return withDbClient(async (client) => {
    await client.query("BEGIN");

    try {
      const current = await getProfileBundleWithClient(client, input.walletPublicKey, true);
      if (!current) {
        throw new ProfileRepositoryError("CASE_NOT_FOUND", "Compliance case was not found for this wallet.");
      }

      const projectedStatus = projectComplianceStatus({
        kycStatus: input.decision,
        amlStatus: current.amlStatus,
        isSuspended: current.isSuspended
      });

      const idempotent = current.kycStatus === input.decision
        && current.rejectionReasonCode === rejectionReasonCode
        && current.complianceStatus === projectedStatus;

      if (!idempotent) {
        await client.query(
          `UPDATE kyc_cases
           SET kyc_status = $2,
               rejection_reason_code = $3,
               reviewed_at = NOW(),
               updated_at = NOW()
           WHERE wallet_public_key = $1`,
          [input.walletPublicKey, input.decision, rejectionReasonCode]
        );

        await client.query(
          `UPDATE user_profiles
           SET compliance_status = $2,
               compliance_status_updated_at = NOW(),
               updated_at = NOW()
           WHERE wallet_public_key = $1`,
          [input.walletPublicKey, projectedStatus]
        );

        await insertComplianceAuditEventWithClient(client, {
          walletPublicKey: input.walletPublicKey,
          actorType: "admin",
          actorId: input.adminActorId,
          eventName: "kyc.admin_decision_applied",
          eventPayload: {
            decision: input.decision,
            reason: rejectionReasonCode,
            previousKycStatus: current.kycStatus,
            previousComplianceStatus: current.complianceStatus,
            complianceStatus: projectedStatus
          }
        });
      }

      const updated = await getProfileBundleWithClient(client, input.walletPublicKey);
      if (!updated) {
        throw new Error("Could not load profile after KYC admin decision.");
      }

      await client.query("COMMIT");
      return { profile: updated, idempotent };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

export async function setAmlDecisionByAdmin(input: SetAmlDecisionByAdminInput): Promise<AdminCaseMutationResult> {
  const normalizedReason = normalizeDecisionReason(input.reason);
  if (!normalizedReason) {
    throw new ProfileRepositoryError("REASON_REQUIRED", "Reason is required for AML admin decision.");
  }

  const normalizedInputFlags = Array.isArray(input.amlFlags) ? sanitizeAmlFlags(input.amlFlags) : null;

  if (!isProfileDatabaseConfigured()) {
    const profile = inMemoryProfiles.get(input.walletPublicKey);
    if (!profile) {
      throw new ProfileRepositoryError("CASE_NOT_FOUND", "Compliance case was not found for this wallet.");
    }

    const projectedStatus = projectComplianceStatus({
      kycStatus: profile.kycStatus,
      amlStatus: input.decision,
      isSuspended: profile.isSuspended
    });

    const idempotent = profile.amlStatus === input.decision
      && typeof input.amlRiskScore === "undefined"
      && normalizedInputFlags === null
      && profile.complianceStatus === projectedStatus;

    if (!idempotent) {
      const updatedAt = nowIso();
      const previousAmlStatus = profile.amlStatus;
      const previousComplianceStatus = profile.complianceStatus;

      profile.amlStatus = input.decision;
      profile.amlRiskScore = typeof input.amlRiskScore === "undefined" ? profile.amlRiskScore : input.amlRiskScore;
      profile.amlFlags = normalizedInputFlags ?? profile.amlFlags;
      profile.amlProvider = "admin_override";
      profile.amlRuleVersion = "admin_override";
      profile.amlLastCheckedAt = updatedAt;
      profile.complianceStatus = projectedStatus;
      profile.complianceStatusUpdatedAt = updatedAt;
      profile.updatedAt = updatedAt;
      inMemoryProfiles.set(profile.walletPublicKey, profile);

      await recordComplianceAuditEvent({
        walletPublicKey: input.walletPublicKey,
        actorType: "admin",
        actorId: input.adminActorId,
        eventName: "aml.admin_decision_applied",
        eventPayload: {
          decision: input.decision,
          reason: normalizedReason,
          previousAmlStatus,
          previousComplianceStatus,
          complianceStatus: projectedStatus,
          amlRiskScore: profile.amlRiskScore
        }
      });
    }

    return {
      profile: mapInMemoryToBundle(profile),
      idempotent
    };
  }

  return withDbClient(async (client) => {
    await client.query("BEGIN");

    try {
      const current = await getMutableComplianceStateWithClient(client, input.walletPublicKey, true);
      if (!current) {
        throw new ProfileRepositoryError("CASE_NOT_FOUND", "Compliance case was not found for this wallet.");
      }

      const projectedStatus = projectComplianceStatus({
        kycStatus: current.kycStatus,
        amlStatus: input.decision,
        isSuspended: current.isSuspended
      });

      const idempotent = current.amlStatus === input.decision
        && typeof input.amlRiskScore === "undefined"
        && normalizedInputFlags === null
        && current.complianceStatus === projectedStatus;

      if (!idempotent) {
        const nextRiskScore = typeof input.amlRiskScore === "undefined" ? current.amlRiskScore : input.amlRiskScore;
        const nextFlags = normalizedInputFlags ?? current.amlFlags;
        const providerClassification: AmlProviderClassification = input.decision === "clear" ? "clear" : "flagged";

        await client.query(
          `UPDATE user_profiles
           SET aml_status = $2,
               aml_risk_score = $3,
               aml_flags_json = $4::jsonb,
               aml_provider = 'admin_override',
               aml_rule_version = 'admin_override',
               aml_last_checked_at = NOW(),
               compliance_status = $5,
               compliance_status_updated_at = NOW(),
               updated_at = NOW()
           WHERE wallet_public_key = $1`,
          [input.walletPublicKey, input.decision, nextRiskScore, JSON.stringify(nextFlags), projectedStatus]
        );

        await client.query(
          `INSERT INTO aml_screenings (
             wallet_public_key,
             provider,
             provider_classification,
             aml_status,
             aml_risk_score,
             aml_flags_json,
             rule_version,
             trigger_source
           ) VALUES ($1, 'admin_override', $2, $3, $4, $5::jsonb, 'admin_override', 'admin_override')`,
          [input.walletPublicKey, providerClassification, input.decision, nextRiskScore, JSON.stringify(nextFlags)]
        );

        await insertComplianceAuditEventWithClient(client, {
          walletPublicKey: input.walletPublicKey,
          actorType: "admin",
          actorId: input.adminActorId,
          eventName: "aml.admin_decision_applied",
          eventPayload: {
            decision: input.decision,
            reason: normalizedReason,
            previousAmlStatus: current.amlStatus,
            previousComplianceStatus: current.complianceStatus,
            complianceStatus: projectedStatus,
            amlRiskScore: nextRiskScore
          }
        });
      }

      const updated = await getProfileBundleWithClient(client, input.walletPublicKey);
      if (!updated) {
        throw new Error("Could not load profile after AML admin decision.");
      }

      await client.query("COMMIT");
      return { profile: updated, idempotent };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

export async function setSuspensionByAdmin(input: SetSuspensionByAdminInput): Promise<AdminCaseMutationResult> {
  const normalizedReason = normalizeDecisionReason(input.reason);

  if (!isProfileDatabaseConfigured()) {
    const profile = inMemoryProfiles.get(input.walletPublicKey);
    if (!profile) {
      throw new ProfileRepositoryError("CASE_NOT_FOUND", "Compliance case was not found for this wallet.");
    }

    const projectedStatus = projectComplianceStatus({
      kycStatus: profile.kycStatus,
      amlStatus: profile.amlStatus,
      isSuspended: input.suspended
    });

    const idempotent = profile.isSuspended === input.suspended && profile.complianceStatus === projectedStatus;

    if (!idempotent) {
      const updatedAt = nowIso();
      const previousSuspended = profile.isSuspended;
      const previousComplianceStatus = profile.complianceStatus;

      profile.isSuspended = input.suspended;
      profile.complianceStatus = projectedStatus;
      profile.complianceStatusUpdatedAt = updatedAt;
      profile.updatedAt = updatedAt;
      inMemoryProfiles.set(profile.walletPublicKey, profile);

      await recordComplianceAuditEvent({
        walletPublicKey: input.walletPublicKey,
        actorType: "admin",
        actorId: input.adminActorId,
        eventName: input.suspended ? "compliance.suspended" : "compliance.unsuspended",
        eventPayload: {
          reason: normalizedReason,
          previousSuspended,
          previousComplianceStatus,
          complianceStatus: projectedStatus
        }
      });
    }

    return {
      profile: mapInMemoryToBundle(profile),
      idempotent
    };
  }

  return withDbClient(async (client) => {
    await client.query("BEGIN");

    try {
      const current = await getProfileBundleWithClient(client, input.walletPublicKey, true);
      if (!current) {
        throw new ProfileRepositoryError("CASE_NOT_FOUND", "Compliance case was not found for this wallet.");
      }

      const projectedStatus = projectComplianceStatus({
        kycStatus: current.kycStatus,
        amlStatus: current.amlStatus,
        isSuspended: input.suspended
      });

      const idempotent = current.isSuspended === input.suspended && current.complianceStatus === projectedStatus;

      if (!idempotent) {
        await client.query(
          `UPDATE user_profiles
           SET is_suspended = $2,
               compliance_status = $3,
               compliance_status_updated_at = NOW(),
               updated_at = NOW()
           WHERE wallet_public_key = $1`,
          [input.walletPublicKey, input.suspended, projectedStatus]
        );

        await insertComplianceAuditEventWithClient(client, {
          walletPublicKey: input.walletPublicKey,
          actorType: "admin",
          actorId: input.adminActorId,
          eventName: input.suspended ? "compliance.suspended" : "compliance.unsuspended",
          eventPayload: {
            reason: normalizedReason,
            previousSuspended: current.isSuspended,
            previousComplianceStatus: current.complianceStatus,
            complianceStatus: projectedStatus
          }
        });
      }

      const updated = await getProfileBundleWithClient(client, input.walletPublicKey);
      if (!updated) {
        throw new Error("Could not load profile after suspension update.");
      }

      await client.query("COMMIT");
      return { profile: updated, idempotent };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

export async function registerKycWebhookEvent(input: RegisterKycWebhookEventInput): Promise<boolean> {
  if (!isProfileDatabaseConfigured()) {
    if (inMemoryWebhookEventIds.has(input.providerEventId)) {
      return false;
    }

    inMemoryWebhookEventIds.add(input.providerEventId);
    return true;
  }

  return withDbClient(async (client) => {
    const result = await client.query<{ provider_event_id: string }>(
      `INSERT INTO kyc_webhook_events (
        provider_event_id,
        provider,
        event_type,
        wallet_public_key,
        kyc_provider_session_id,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (provider_event_id) DO NOTHING
      RETURNING provider_event_id`,
      [
        input.providerEventId,
        input.provider,
        input.eventType,
        input.walletPublicKey,
        input.providerSessionId,
        input.status
      ]
    );

    return (result.rowCount ?? 0) > 0;
  });
}

export async function recordComplianceAuditEvent(input: RecordComplianceAuditEventInput): Promise<void> {
  if (!isProfileDatabaseConfigured()) {
    inMemoryAuditEvents.push({
      ...input,
      id: randomUUID(),
      createdAt: nowIso()
    });
    return;
  }

  await withDbClient(async (client) => {
    await insertComplianceAuditEventWithClient(client, input);
  });
}
