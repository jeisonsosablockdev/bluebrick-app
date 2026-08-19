import "server-only";

import type { PoolClient } from "pg";

import { COUNTRIES } from "@/lib/countries";
import {
  ensureProfileExists,
  getOrCreateProfileBundle,
  isProfileDatabaseConfigured,
  recordComplianceAuditEvent
} from "@/features/profile/infrastructure/profile-repository";
import { withDbClient } from "@/features/shared/infrastructure/db/pool";
import { generateUuidV7 } from "@/lib/uuid-v7";

export type OnboardingRewardStatus =
  | "pending_profile"
  | "pending_kyc"
  | "pending_review"
  | "earned"
  | "reserved"
  | "consumed"
  | "expired";

export type OnboardingRewardProgram = {
  id: string;
  code: string;
  rewardAmountUsd: number;
  qualificationWindowDays: number;
  kycReviewGraceHours: number;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type OnboardingRewardSnapshot = {
  id: string;
  walletPublicKey: string;
  programId: string;
  programCode: string;
  status: OnboardingRewardStatus;
  initialRegistrationAt: string;
  qualificationDeadlineAt: string;
  profileCompletedAt: string | null;
  kycSubmittedAt: string | null;
  kycReviewGraceDeadlineAt: string | null;
  kycVerifiedAt: string | null;
  earnedAt: string | null;
  rewardAmountUsdSnapshot: number;
  reservedOrderId: string | null;
  reservedAt: string | null;
  consumedOrderId: string | null;
  consumedAt: string | null;
  expiredAt: string | null;
  createdAt: string;
  updatedAt: string;
  nextDeadlineAt: string | null;
  remainingSeconds: number | null;
  isProfileComplete: boolean;
  canUseInCheckout: boolean;
  shouldShowReminder: boolean;
};

type DbOptions = {
  client?: PoolClient;
};

type RewardProgramRow = {
  id: string;
  code: string;
  reward_amount_usd: string | number;
  qualification_window_days: number;
  kyc_review_grace_hours: number;
  starts_at: string | Date | null;
  ends_at: string | Date | null;
  is_active: boolean;
  created_at: string | Date;
  updated_at: string | Date;
};

type RewardRow = {
  id: string;
  wallet_public_key: string;
  program_id: string;
  status: OnboardingRewardStatus;
  initial_registration_at: string | Date;
  qualification_deadline_at: string | Date;
  profile_completed_at: string | Date | null;
  kyc_submitted_at: string | Date | null;
  kyc_review_grace_deadline_at: string | Date | null;
  kyc_verified_at: string | Date | null;
  earned_at: string | Date | null;
  reward_amount_usd_snapshot: string | number;
  reserved_order_id: string | null;
  reserved_at: string | Date | null;
  consumed_order_id: string | null;
  consumed_at: string | Date | null;
  expired_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
};

type RewardProfileContextRow = {
  wallet_public_key: string;
  profile_created_at: string | Date;
  username: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  country: string | null;
  state_province: string | null;
  address: string | null;
  phone: string | null;
  kyc_status: "not_started" | "pending" | "verified" | "rejected";
  kyc_submitted_at: string | Date | null;
  kyc_reviewed_at: string | Date | null;
};

type RewardProfileContext = {
  walletPublicKey: string;
  profileCreatedAt: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  country: string | null;
  stateProvince: string | null;
  address: string | null;
  phone: string | null;
  kycStatus: "not_started" | "pending" | "verified" | "rejected";
  kycSubmittedAt: string | null;
  kycReviewedAt: string | null;
};

type InMemoryProgram = OnboardingRewardProgram;
type InMemoryReward = Omit<OnboardingRewardSnapshot, "nextDeadlineAt" | "remainingSeconds" | "isProfileComplete" | "canUseInCheckout" | "shouldShowReminder">;

const DEFAULT_PROGRAM_ID = "onboarding_reward_profile_completion_bonus_v1";
const DEFAULT_PROGRAM_CODE = "profile_completion_bonus";
const DEFAULT_REWARD_AMOUNT_USD = 10;
const DEFAULT_QUALIFICATION_WINDOW_DAYS = 7;
const DEFAULT_KYC_REVIEW_GRACE_HOURS = 72;
const STATUS_TERMINAL: OnboardingRewardStatus[] = ["earned", "reserved", "consumed", "expired"];

const inMemoryPrograms = new Map<string, InMemoryProgram>();
const inMemoryRewards = new Map<string, InMemoryReward>();

function nowIso(): string {
  return new Date().toISOString();
}

function toIso(value: string | Date | null): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
}

function toRequiredIso(value: string | Date): string {
  return toIso(value) ?? nowIso();
}

function toNumber(value: string | number): number {
  return Number(value);
}

function addHours(iso: string, hours: number): string {
  return new Date(new Date(iso).getTime() + hours * 60 * 60 * 1000).toISOString();
}

function addDays(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

function isIsoOnOrBefore(left: string | null, right: string): boolean {
  if (!left) {
    return false;
  }

  return new Date(left).getTime() <= new Date(right).getTime();
}

function normalizeNullable(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function resolveCountryRequiresStateProvince(countryCode: string | null): boolean {
  if (!countryCode) {
    return false;
  }

  const country = COUNTRIES.find((entry) => entry.code === countryCode);
  return Boolean(country?.divisions?.length);
}

export function isOnboardingRewardProfileComplete(context: {
  username: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  country: string | null;
  stateProvince: string | null;
  address: string | null;
  phone: string | null;
}): boolean {
  const hasRequiredFields = Boolean(
    normalizeNullable(context.username) &&
      normalizeNullable(context.firstName) &&
      normalizeNullable(context.lastName) &&
      normalizeNullable(context.email) &&
      normalizeNullable(context.country) &&
      normalizeNullable(context.address) &&
      normalizeNullable(context.phone)
  );

  if (!hasRequiredFields) {
    return false;
  }

  if (!resolveCountryRequiresStateProvince(context.country)) {
    return true;
  }

  return Boolean(normalizeNullable(context.stateProvince));
}

function mapProgramRow(row: RewardProgramRow): OnboardingRewardProgram {
  return {
    id: row.id,
    code: row.code,
    rewardAmountUsd: toNumber(row.reward_amount_usd),
    qualificationWindowDays: row.qualification_window_days,
    kycReviewGraceHours: row.kyc_review_grace_hours,
    startsAt: toIso(row.starts_at),
    endsAt: toIso(row.ends_at),
    isActive: Boolean(row.is_active),
    createdAt: toRequiredIso(row.created_at),
    updatedAt: toRequiredIso(row.updated_at)
  };
}

function mapContextRow(row: RewardProfileContextRow): RewardProfileContext {
  return {
    walletPublicKey: row.wallet_public_key,
    profileCreatedAt: toRequiredIso(row.profile_created_at),
    username: row.username,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    country: row.country,
    stateProvince: row.state_province,
    address: row.address,
    phone: row.phone,
    kycStatus: row.kyc_status,
    kycSubmittedAt: toIso(row.kyc_submitted_at),
    kycReviewedAt: toIso(row.kyc_reviewed_at)
  };
}

function buildPublicSnapshot(
  reward: InMemoryReward,
  program: OnboardingRewardProgram,
  profileComplete: boolean,
  now = new Date()
): OnboardingRewardSnapshot {
  let nextDeadlineAt: string | null = null;
  if (reward.status === "pending_profile" || reward.status === "pending_kyc") {
    nextDeadlineAt = reward.qualificationDeadlineAt;
  } else if (reward.status === "pending_review") {
    nextDeadlineAt = reward.kycReviewGraceDeadlineAt;
  }

  let remainingSeconds: number | null = null;
  if (nextDeadlineAt) {
    remainingSeconds = Math.max(0, Math.floor((new Date(nextDeadlineAt).getTime() - now.getTime()) / 1000));
  }

  return {
    ...reward,
    programCode: program.code,
    nextDeadlineAt,
    remainingSeconds,
    isProfileComplete: profileComplete,
    canUseInCheckout: reward.status === "earned",
    shouldShowReminder: reward.status === "pending_profile" || reward.status === "pending_kyc" || reward.status === "pending_review"
  };
}

function defaultProgram(now = nowIso()): InMemoryProgram {
  return {
    id: DEFAULT_PROGRAM_ID,
    code: DEFAULT_PROGRAM_CODE,
    rewardAmountUsd: DEFAULT_REWARD_AMOUNT_USD,
    qualificationWindowDays: DEFAULT_QUALIFICATION_WINDOW_DAYS,
    kycReviewGraceHours: DEFAULT_KYC_REVIEW_GRACE_HOURS,
    startsAt: null,
    endsAt: null,
    isActive: true,
    createdAt: now,
    updatedAt: now
  };
}

function getInMemoryProgram(): InMemoryProgram {
  const existing = inMemoryPrograms.get(DEFAULT_PROGRAM_ID);
  if (existing) {
    return existing;
  }

  const created = defaultProgram();
  inMemoryPrograms.set(created.id, created);
  return created;
}

export function evaluateOnboardingRewardStatus(input: {
  currentStatus: OnboardingRewardStatus;
  qualificationDeadlineAt: string;
  profileCompletedAt: string | null;
  kycSubmittedAt: string | null;
  kycReviewGraceDeadlineAt: string | null;
  kycVerifiedAt: string | null;
  nowIso: string;
}): OnboardingRewardStatus {
  if (STATUS_TERMINAL.includes(input.currentStatus)) {
    return input.currentStatus;
  }

  const profileCompletedInTime = isIsoOnOrBefore(input.profileCompletedAt, input.qualificationDeadlineAt);
  const kycSubmittedInTime = isIsoOnOrBefore(input.kycSubmittedAt, input.qualificationDeadlineAt);
  const kycVerifiedInGrace =
    input.kycVerifiedAt &&
    input.kycReviewGraceDeadlineAt &&
    new Date(input.kycVerifiedAt).getTime() <= new Date(input.kycReviewGraceDeadlineAt).getTime();

  if (profileCompletedInTime && kycSubmittedInTime && kycVerifiedInGrace) {
    return "earned";
  }

  if (profileCompletedInTime && kycSubmittedInTime) {
    if (input.kycReviewGraceDeadlineAt && new Date(input.nowIso).getTime() <= new Date(input.kycReviewGraceDeadlineAt).getTime()) {
      return "pending_review";
    }

    return "expired";
  }

  if (profileCompletedInTime) {
    if (new Date(input.nowIso).getTime() > new Date(input.qualificationDeadlineAt).getTime()) {
      return "expired";
    }

    return "pending_kyc";
  }

  if (new Date(input.nowIso).getTime() > new Date(input.qualificationDeadlineAt).getTime()) {
    return "expired";
  }

  return "pending_profile";
}

async function runWithClient<T>(work: (client: PoolClient) => Promise<T>, options?: DbOptions): Promise<T> {
  if (options?.client) {
    return work(options.client);
  }

  return withDbClient(work);
}

async function ensureDefaultProgramWithClient(client: PoolClient): Promise<OnboardingRewardProgram> {
  await client.query(
    `INSERT INTO onboarding_reward_programs (
       id,
       code,
       reward_amount_usd,
       qualification_window_days,
       kyc_review_grace_hours,
       is_active
     ) VALUES ($1, $2, $3, $4, $5, true)
     ON CONFLICT (id) DO NOTHING`,
    [
      DEFAULT_PROGRAM_ID,
      DEFAULT_PROGRAM_CODE,
      DEFAULT_REWARD_AMOUNT_USD,
      DEFAULT_QUALIFICATION_WINDOW_DAYS,
      DEFAULT_KYC_REVIEW_GRACE_HOURS
    ]
  );

  const result = await client.query<RewardProgramRow>(
    `SELECT
       id,
       code,
       reward_amount_usd,
       qualification_window_days,
       kyc_review_grace_hours,
       starts_at,
       ends_at,
       is_active,
       created_at,
       updated_at
     FROM onboarding_reward_programs
     WHERE code = $1
       AND is_active = true
       AND (starts_at IS NULL OR starts_at <= NOW())
       AND (ends_at IS NULL OR ends_at > NOW())
     ORDER BY updated_at DESC
     LIMIT 1`,
    [DEFAULT_PROGRAM_CODE]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("Active onboarding reward program is not configured.");
  }

  return mapProgramRow(row);
}

async function getRewardProfileContextWithClient(client: PoolClient, walletPublicKey: string): Promise<RewardProfileContext> {
  await ensureProfileExists(walletPublicKey, { client });

  const result = await client.query<RewardProfileContextRow>(
    `SELECT
       p.wallet_public_key,
       p.created_at AS profile_created_at,
       p.username,
       p.first_name,
       p.last_name,
       p.email,
       p.country,
       p.state_province,
       p.address,
       p.phone,
       k.kyc_status,
       k.submitted_at AS kyc_submitted_at,
       k.reviewed_at AS kyc_reviewed_at
     FROM user_profiles p
     JOIN kyc_cases k ON k.wallet_public_key = p.wallet_public_key
     WHERE p.wallet_public_key = $1
     LIMIT 1`,
    [walletPublicKey]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("Could not resolve onboarding reward profile context.");
  }

  return mapContextRow(row);
}

async function getOrCreateRewardWithClient(
  client: PoolClient,
  context: RewardProfileContext,
  program: OnboardingRewardProgram
): Promise<InMemoryReward> {
  const existing = await client.query<RewardRow>(
    `SELECT
       id,
       wallet_public_key,
       program_id,
       status,
       initial_registration_at,
       qualification_deadline_at,
       profile_completed_at,
       kyc_submitted_at,
       kyc_review_grace_deadline_at,
       kyc_verified_at,
       earned_at,
       reward_amount_usd_snapshot,
       reserved_order_id,
       reserved_at,
       consumed_order_id,
       consumed_at,
       expired_at,
       created_at,
       updated_at
     FROM user_onboarding_rewards
     WHERE wallet_public_key = $1
       AND program_id = $2
     LIMIT 1
     FOR UPDATE`,
    [context.walletPublicKey, program.id]
  );

  const row = existing.rows[0];
  if (row) {
    return {
      id: row.id,
      walletPublicKey: row.wallet_public_key,
      programId: row.program_id,
      programCode: program.code,
      status: row.status,
      initialRegistrationAt: toRequiredIso(row.initial_registration_at),
      qualificationDeadlineAt: toRequiredIso(row.qualification_deadline_at),
      profileCompletedAt: toIso(row.profile_completed_at),
      kycSubmittedAt: toIso(row.kyc_submitted_at),
      kycReviewGraceDeadlineAt: toIso(row.kyc_review_grace_deadline_at),
      kycVerifiedAt: toIso(row.kyc_verified_at),
      earnedAt: toIso(row.earned_at),
      rewardAmountUsdSnapshot: toNumber(row.reward_amount_usd_snapshot),
      reservedOrderId: row.reserved_order_id,
      reservedAt: toIso(row.reserved_at),
      consumedOrderId: row.consumed_order_id,
      consumedAt: toIso(row.consumed_at),
      expiredAt: toIso(row.expired_at),
      createdAt: toRequiredIso(row.created_at),
      updatedAt: toRequiredIso(row.updated_at)
    };
  }

  const id = generateUuidV7();
  const initialRegistrationAt = context.profileCreatedAt;
  const qualificationDeadlineAt = addDays(initialRegistrationAt, program.qualificationWindowDays);
  await client.query(
    `INSERT INTO user_onboarding_rewards (
       id,
       wallet_public_key,
       program_id,
       status,
       initial_registration_at,
       qualification_deadline_at,
       reward_amount_usd_snapshot
     ) VALUES ($1, $2, $3, 'pending_profile', $4, $5, $6)`,
    [id, context.walletPublicKey, program.id, initialRegistrationAt, qualificationDeadlineAt, program.rewardAmountUsd]
  );

  return {
    id,
    walletPublicKey: context.walletPublicKey,
    programId: program.id,
    programCode: program.code,
    status: "pending_profile",
    initialRegistrationAt,
    qualificationDeadlineAt,
    profileCompletedAt: null,
    kycSubmittedAt: null,
    kycReviewGraceDeadlineAt: null,
    kycVerifiedAt: null,
    earnedAt: null,
    rewardAmountUsdSnapshot: program.rewardAmountUsd,
    reservedOrderId: null,
    reservedAt: null,
    consumedOrderId: null,
    consumedAt: null,
    expiredAt: null,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
}

function toRewardUpdatePayload(input: {
  reward: InMemoryReward;
  context: RewardProfileContext;
  program: OnboardingRewardProgram;
  now: string;
}): InMemoryReward {
  const profileCompletedAt =
    input.reward.profileCompletedAt ?? (isOnboardingRewardProfileComplete(input.context) ? input.now : null);
  const kycSubmittedAt = input.reward.kycSubmittedAt ?? input.context.kycSubmittedAt;
  const kycReviewGraceDeadlineAt =
    input.reward.kycReviewGraceDeadlineAt
      ?? (kycSubmittedAt ? addHours(kycSubmittedAt, input.program.kycReviewGraceHours) : null);
  const kycVerifiedAt =
    input.reward.kycVerifiedAt
      ?? (input.context.kycStatus === "verified" ? input.context.kycReviewedAt ?? input.now : null);
  const nextStatus = evaluateOnboardingRewardStatus({
    currentStatus: input.reward.status,
    qualificationDeadlineAt: input.reward.qualificationDeadlineAt,
    profileCompletedAt,
    kycSubmittedAt,
    kycReviewGraceDeadlineAt,
    kycVerifiedAt,
    nowIso: input.now
  });

  return {
    ...input.reward,
    status: nextStatus,
    profileCompletedAt,
    kycSubmittedAt,
    kycReviewGraceDeadlineAt,
    kycVerifiedAt,
    earnedAt: input.reward.earnedAt ?? (nextStatus === "earned" ? input.now : null),
    expiredAt: input.reward.expiredAt ?? (nextStatus === "expired" ? input.now : null),
    updatedAt: input.now
  };
}

async function persistRewardWithClient(client: PoolClient, reward: InMemoryReward): Promise<void> {
  await client.query(
    `UPDATE user_onboarding_rewards
     SET status = $2,
         profile_completed_at = $3,
         kyc_submitted_at = $4,
         kyc_review_grace_deadline_at = $5,
         kyc_verified_at = $6,
         earned_at = $7,
         reserved_order_id = $8,
         reserved_at = $9,
         consumed_order_id = $10,
         consumed_at = $11,
         expired_at = $12,
         updated_at = NOW()
     WHERE id = $1`,
    [
      reward.id,
      reward.status,
      reward.profileCompletedAt,
      reward.kycSubmittedAt,
      reward.kycReviewGraceDeadlineAt,
      reward.kycVerifiedAt,
      reward.earnedAt,
      reward.reservedOrderId,
      reward.reservedAt,
      reward.consumedOrderId,
      reward.consumedAt,
      reward.expiredAt
    ]
  );
}

async function syncRewardWithClient(
  client: PoolClient,
  walletPublicKey: string
): Promise<OnboardingRewardSnapshot> {
  const program = await ensureDefaultProgramWithClient(client);
  const context = await getRewardProfileContextWithClient(client, walletPublicKey);
  const current = await getOrCreateRewardWithClient(client, context, program);
  const next = toRewardUpdatePayload({
    reward: current,
    context,
    program,
    now: nowIso()
  });

  const changedStatus = current.status !== next.status;
  const changedPayload =
    current.profileCompletedAt !== next.profileCompletedAt ||
    current.kycSubmittedAt !== next.kycSubmittedAt ||
    current.kycReviewGraceDeadlineAt !== next.kycReviewGraceDeadlineAt ||
    current.kycVerifiedAt !== next.kycVerifiedAt ||
    current.earnedAt !== next.earnedAt ||
    current.expiredAt !== next.expiredAt ||
    changedStatus;

  if (changedPayload) {
    await persistRewardWithClient(client, next);
  }

  if (changedStatus) {
    await recordComplianceAuditEvent({
      walletPublicKey,
      actorType: "system",
      actorId: "onboarding_reward_engine",
      eventName: "onboarding_reward.status_changed",
      eventPayload: {
        previousStatus: current.status,
        nextStatus: next.status,
        rewardId: next.id,
        programCode: program.code
      }
    });
  }

  return buildPublicSnapshot(next, program, isOnboardingRewardProfileComplete(context));
}

function getOrCreateInMemoryReward(walletPublicKey: string): InMemoryReward {
  const existing = inMemoryRewards.get(walletPublicKey);
  if (existing) {
    return existing;
  }

  const now = nowIso();
  const program = getInMemoryProgram();
  const created: InMemoryReward = {
    id: generateUuidV7(),
    walletPublicKey,
    programId: program.id,
    programCode: program.code,
    status: "pending_profile",
    initialRegistrationAt: now,
    qualificationDeadlineAt: addDays(now, program.qualificationWindowDays),
    profileCompletedAt: null,
    kycSubmittedAt: null,
    kycReviewGraceDeadlineAt: null,
    kycVerifiedAt: null,
    earnedAt: null,
    rewardAmountUsdSnapshot: program.rewardAmountUsd,
    reservedOrderId: null,
    reservedAt: null,
    consumedOrderId: null,
    consumedAt: null,
    expiredAt: null,
    createdAt: now,
    updatedAt: now
  };

  inMemoryRewards.set(walletPublicKey, created);
  return created;
}

async function getInMemoryProfileContext(walletPublicKey: string): Promise<RewardProfileContext> {
  await ensureProfileExists(walletPublicKey);
  const profile = await getOrCreateProfileBundle(walletPublicKey);

  return {
    walletPublicKey,
    profileCreatedAt: profile.createdAt,
    username: profile.username,
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    country: profile.country,
    stateProvince: profile.stateProvince,
    address: profile.address,
    phone: profile.phone,
    kycStatus: profile.kycStatus,
    kycSubmittedAt: profile.kycSubmittedAt ?? null,
    kycReviewedAt: profile.kycReviewedAt ?? null
  };
}

async function syncInMemoryReward(walletPublicKey: string): Promise<OnboardingRewardSnapshot> {
  const program = getInMemoryProgram();
  const context = await getInMemoryProfileContext(walletPublicKey);
  const current = getOrCreateInMemoryReward(walletPublicKey);
  const next = toRewardUpdatePayload({
    reward: current,
    context,
    program,
    now: nowIso()
  });
  inMemoryRewards.set(walletPublicKey, next);
  return buildPublicSnapshot(next, program, isOnboardingRewardProfileComplete(context));
}

export async function getOnboardingRewardForWallet(walletPublicKey: string, options?: DbOptions): Promise<OnboardingRewardSnapshot> {
  if (!isProfileDatabaseConfigured()) {
    return syncInMemoryReward(walletPublicKey);
  }

  return runWithClient((client) => syncRewardWithClient(client, walletPublicKey), options);
}

export async function ensureOnboardingRewardRegistered(walletPublicKey: string, options?: DbOptions): Promise<OnboardingRewardSnapshot> {
  return getOnboardingRewardForWallet(walletPublicKey, options);
}

export async function reserveOnboardingRewardForOrder(
  input: {
    walletPublicKey: string;
    orderId: string;
    subtotalAmountUsd: number;
  },
  options?: DbOptions
): Promise<{ rewardId: string; discountAmountUsd: number } | null> {
  if (!isProfileDatabaseConfigured()) {
    const snapshot = await syncInMemoryReward(input.walletPublicKey);
    if (snapshot.status !== "earned") {
      return null;
    }

    const reward = getOrCreateInMemoryReward(input.walletPublicKey);
    reward.status = "reserved";
    reward.reservedOrderId = input.orderId;
    reward.reservedAt = nowIso();
    reward.updatedAt = reward.reservedAt;
    inMemoryRewards.set(input.walletPublicKey, reward);
    return {
      rewardId: reward.id,
      discountAmountUsd: Math.min(snapshot.rewardAmountUsdSnapshot, input.subtotalAmountUsd)
    };
  }

  return runWithClient(async (client) => {
    const snapshot = await syncRewardWithClient(client, input.walletPublicKey);
    if (snapshot.status !== "earned") {
      return null;
    }

    const result = await client.query<RewardRow>(
      `SELECT
         id,
         wallet_public_key,
         program_id,
         status,
         initial_registration_at,
         qualification_deadline_at,
         profile_completed_at,
         kyc_submitted_at,
         kyc_review_grace_deadline_at,
         kyc_verified_at,
         earned_at,
         reward_amount_usd_snapshot,
         reserved_order_id,
         reserved_at,
         consumed_order_id,
         consumed_at,
         expired_at,
         created_at,
         updated_at
       FROM user_onboarding_rewards
       WHERE wallet_public_key = $1
         AND status = 'earned'
       LIMIT 1
       FOR UPDATE`,
      [input.walletPublicKey]
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    await client.query(
      `UPDATE user_onboarding_rewards
       SET status = 'reserved',
           reserved_order_id = $2,
           reserved_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [row.id, input.orderId]
    );

    return {
      rewardId: row.id,
      discountAmountUsd: Math.min(toNumber(row.reward_amount_usd_snapshot), input.subtotalAmountUsd)
    };
  }, options);
}

export async function releaseOnboardingRewardReservationForOrder(orderId: string, options?: DbOptions): Promise<void> {
  if (!isProfileDatabaseConfigured()) {
    for (const [walletPublicKey, reward] of inMemoryRewards.entries()) {
      if (reward.status === "reserved" && reward.reservedOrderId === orderId) {
        inMemoryRewards.set(walletPublicKey, {
          ...reward,
          status: "earned",
          reservedOrderId: null,
          reservedAt: null,
          updatedAt: nowIso()
        });
      }
    }
    return;
  }

  await runWithClient(async (client) => {
    await client.query(
      `UPDATE user_onboarding_rewards
       SET status = 'earned',
           reserved_order_id = NULL,
           reserved_at = NULL,
           updated_at = NOW()
       WHERE reserved_order_id = $1
         AND status = 'reserved'`,
      [orderId]
    );
  }, options);
}

export async function consumeOnboardingRewardReservationForOrder(orderId: string, options?: DbOptions): Promise<void> {
  if (!isProfileDatabaseConfigured()) {
    for (const [walletPublicKey, reward] of inMemoryRewards.entries()) {
      if (reward.status === "reserved" && reward.reservedOrderId === orderId) {
        inMemoryRewards.set(walletPublicKey, {
          ...reward,
          status: "consumed",
          consumedOrderId: orderId,
          consumedAt: nowIso(),
          updatedAt: nowIso()
        });
      }
    }
    return;
  }

  await runWithClient(async (client) => {
    await client.query(
      `UPDATE user_onboarding_rewards
       SET status = 'consumed',
           consumed_order_id = COALESCE(consumed_order_id, $2),
           consumed_at = COALESCE(consumed_at, NOW()),
           updated_at = NOW()
       WHERE reserved_order_id = $1
         AND status = 'reserved'`,
      [orderId, orderId]
    );
  }, options);
}
