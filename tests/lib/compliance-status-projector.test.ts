import { describe, expect, it } from "vitest";

import { projectComplianceStatus } from "@/features/profile/domain/compliance-status-projector";

describe("projectComplianceStatus", () => {
  it("prioritizes suspended over any other status", () => {
    expect(
      projectComplianceStatus({
        kycStatus: "verified",
        amlStatus: "clear",
        isSuspended: true
      })
    ).toBe("suspended");
  });

  it("returns pending_kyc when KYC is not verified", () => {
    expect(projectComplianceStatus({ kycStatus: "not_started", amlStatus: "clear", isSuspended: false })).toBe("pending_kyc");
    expect(projectComplianceStatus({ kycStatus: "pending", amlStatus: "clear", isSuspended: false })).toBe("pending_kyc");
    expect(projectComplianceStatus({ kycStatus: "rejected", amlStatus: "clear", isSuspended: false })).toBe("pending_kyc");
  });

  it("returns pending_aml when KYC is verified but AML has not started", () => {
    expect(projectComplianceStatus({ kycStatus: "verified", amlStatus: "not_started", isSuspended: false })).toBe("pending_aml");
  });

  it("returns pending_review when AML is pending", () => {
    expect(projectComplianceStatus({ kycStatus: "verified", amlStatus: "pending", isSuspended: false })).toBe("pending_review");
  });

  it("returns restricted_aml when AML is flagged", () => {
    expect(projectComplianceStatus({ kycStatus: "verified", amlStatus: "flagged", isSuspended: false })).toBe("restricted_aml");
  });

  it("returns fully_verified when KYC is verified and AML is clear", () => {
    expect(projectComplianceStatus({ kycStatus: "verified", amlStatus: "clear", isSuspended: false })).toBe("fully_verified");
  });
});
