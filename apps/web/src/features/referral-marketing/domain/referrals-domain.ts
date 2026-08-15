export const REFERRAL_CODE_MIN_LENGTH = 8;
export const REFERRAL_CODE_MAX_LENGTH = 64;
export const DEFAULT_REFERRAL_ELIGIBILITY_WINDOW_DAYS = 30;
export const DEFAULT_REFERRAL_SETTLEMENT_WINDOW_DAYS = 7;
export const DEFAULT_REFERRAL_HOLDING_PERIOD_DAYS = 7;

export type ReferralAttributionSource = "link" | "manual" | "deep_link" | "unknown";

export type ReferralAttributionStatus =
  | "bound_pending_kyc"
  | "kyc_verified"
  | "reward_window_closed"
  | "expired_no_kyc"
  | "expired_no_qualification"
  | "rejected_self_referral"
  | "rejected_invalid_code";

export type ReferralRewardStatus =
  | "pending_qualification"
  | "pending_settlement"
  | "accrued"
  | "pending_admin_distribution"
  | "paid"
  | "clawbacked"
  | "rejected"
  | "risk_hold";

const ACTIVE_ATTRIBUTION_STATUS_SET = new Set<ReferralAttributionStatus>([
  "bound_pending_kyc",
  "kyc_verified"
]);

const ACTIVE_REWARD_STATUS_SET = new Set<ReferralRewardStatus>([
  "pending_qualification",
  "pending_settlement",
  "accrued",
  "pending_admin_distribution",
  "risk_hold"
]);

export function normalizeReferralCode(input: string): string {
  return input.trim().toUpperCase();
}

export function normalizeReferralAttributionSource(input: string | null | undefined): ReferralAttributionSource {
  if (input === "link" || input === "manual" || input === "deep_link") {
    return input;
  }

  return "unknown";
}

export function isReferralAttributionActiveStatus(status: ReferralAttributionStatus): boolean {
  return ACTIVE_ATTRIBUTION_STATUS_SET.has(status);
}

export function isReferralRewardActiveStatus(status: ReferralRewardStatus): boolean {
  return ACTIVE_REWARD_STATUS_SET.has(status);
}

export function buildWindowEndIso(startIso: string, days: number): string {
  const base = new Date(startIso);

  if (Number.isNaN(base.getTime())) {
    throw new Error("Invalid ISO timestamp.");
  }

  const copy = new Date(base.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy.toISOString();
}

export function getExpiredAttributionStatus(input: {
  currentStatus: ReferralAttributionStatus;
  kycApprovedAt: string | null;
}): Extract<ReferralAttributionStatus, "expired_no_kyc" | "expired_no_qualification"> {
  if (input.currentStatus === "kyc_verified" || input.kycApprovedAt) {
    return "expired_no_qualification";
  }

  return "expired_no_kyc";
}

export function truncateIsoToUtcDay(isoTimestamp: string | null): string | null {
  if (!isoTimestamp) {
    return null;
  }

  const parsed = new Date(isoTimestamp);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
}
