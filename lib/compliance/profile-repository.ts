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
             updated_at = NOW()
         WHERE wallet_public_key = $1`,
        [input.walletPublicKey, input.username, input.bio, input.avatarUrl]
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
