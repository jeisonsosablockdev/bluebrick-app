import { describe, expect, it } from "vitest";

import {
  validateSnapshotInput,
  SnapshotValidationError,
  type CreateSnapshotInput
} from "@/lib/distribution/snapshot";

describe("lib/distribution/snapshot", () => {
  const validInput: CreateSnapshotInput = {
    projectId: "proj-yield-1",
    eligibilityStartAt: "2026-01-01T00:00:00Z",
    eligibilityEndAt: "2026-06-01T00:00:00Z",
    availableTreasuryEarningsMinor: 1000000000n, // 1000 USDC
    distributionPoolAmountMinor: 500000000n,   // 500 USDC
    tokenMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    treasuryVault: "Vault1111111111111111111111111111111111111",
    createdByActorId: "admin-1"
  };

  it("validates correct snapshot input cleanly", () => {
    expect(() => validateSnapshotInput(validInput)).not.toThrow();
  });

  it("rejects missing projectId", () => {
    expect(() => validateSnapshotInput({ ...validInput, projectId: "" })).toThrow(
      SnapshotValidationError
    );
  });

  it("rejects eligibilityEndAt <= eligibilityStartAt", () => {
    expect(() =>
      validateSnapshotInput({
        ...validInput,
        eligibilityStartAt: "2026-06-01T00:00:00Z",
        eligibilityEndAt: "2026-01-01T00:00:00Z"
      })
    ).toThrow("eligibilityEndAt must be strictly after eligibilityStartAt.");
  });

  it("rejects distributionPoolAmountMinor exceeding availableTreasuryEarningsMinor", () => {
    expect(() =>
      validateSnapshotInput({
        ...validInput,
        availableTreasuryEarningsMinor: 100n,
        distributionPoolAmountMinor: 200n
      })
    ).toThrow("cannot exceed availableTreasuryEarningsMinor");
  });

  it("rejects negative or zero pool amounts", () => {
    expect(() =>
      validateSnapshotInput({
        ...validInput,
        distributionPoolAmountMinor: 0n
      })
    ).toThrow("distributionPoolAmountMinor must be greater than zero.");
  });

  it("rejects missing createdByActorId", () => {
    expect(() =>
      validateSnapshotInput({
        ...validInput,
        createdByActorId: ""
      })
    ).toThrow("createdByActorId is required.");
  });

  it("rejects invalid snapshotAt date", () => {
    expect(() =>
      validateSnapshotInput({
        ...validInput,
        snapshotAt: "invalid-date"
      })
    ).toThrow("snapshotAt is invalid.");
  });
});
