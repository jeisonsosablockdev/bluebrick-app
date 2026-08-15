export type KycStatus = "not_started" | "pending" | "verified" | "rejected";
export type AmlStatus = "not_started" | "pending" | "clear" | "flagged";
export type ComplianceStatus =
  | "pending_kyc"
  | "pending_aml"
  | "pending_review"
  | "fully_verified"
  | "restricted_aml"
  | "suspended";

export type ComplianceProjectionInput = {
  kycStatus: KycStatus;
  amlStatus: AmlStatus;
  isSuspended: boolean;
};

export function projectComplianceStatus(input: ComplianceProjectionInput): ComplianceStatus {
  if (input.isSuspended) {
    return "suspended";
  }

  if (input.kycStatus !== "verified") {
    return "pending_kyc";
  }

  if (input.amlStatus === "not_started") {
    return "pending_aml";
  }

  if (input.amlStatus === "pending") {
    return "pending_review";
  }

  if (input.amlStatus === "flagged") {
    return "restricted_aml";
  }

  return "fully_verified";
}
