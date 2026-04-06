import { afterEach, describe, expect, it } from "vitest";

import {
  evaluateAuthorityLifecycleTransition,
  isCoreAuthorityLifecycleInputError,
  type AuthorityMultisigEvidence
} from "@/lib/core-authority-lifecycle";

const baseMultisig: AuthorityMultisigEvidence = {
  proposalId: "proposal-1",
  proposer: "11111111111111111111111111111111",
  executor: "11111111111111111111111111111111",
  approverSigners: [
    "11111111111111111111111111111111",
    "Vote111111111111111111111111111111111111111"
  ],
  reason: "rotation",
  requestedAt: "2026-04-01T10:00:00.000Z"
};

afterEach(() => {
  delete process.env.SQUADS_MULTISIG_THRESHOLD;
  delete process.env.SQUADS_EMERGENCY_MULTISIG_THRESHOLD;
  delete process.env.AUTHORITY_ROTATION_COOLDOWN_SECONDS;
});

describe("core authority lifecycle transition evaluation", () => {
  it("increments authority_version on rotate", () => {
    process.env.SQUADS_MULTISIG_THRESHOLD = "2";
    process.env.AUTHORITY_ROTATION_COOLDOWN_SECONDS = "10";

    const result = evaluateAuthorityLifecycleTransition({
      role: "transfer_delegate",
      operation: "rotate",
      currentAuthority: "Vote111111111111111111111111111111111111111",
      currentVersion: 3,
      currentUpdatedAt: "2026-04-01T00:00:00.000Z",
      newAuthority: "8NfQF6K3XfMiH4r3Q8YjA5q5V6wG6b1W9ZkL8rC9t4u1",
      multisig: baseMultisig,
      now: new Date("2026-04-01T12:00:00.000Z")
    });

    expect(result.previousVersion).toBe(3);
    expect(result.nextVersion).toBe(4);
    expect(result.requiredThreshold).toBe(2);
    expect(result.targetAuthority).toBe("8NfQF6K3XfMiH4r3Q8YjA5q5V6wG6b1W9ZkL8rC9t4u1");
  });

  it("requires elevated quorum for emergency_rotate", () => {
    process.env.SQUADS_MULTISIG_THRESHOLD = "2";
    process.env.SQUADS_EMERGENCY_MULTISIG_THRESHOLD = "4";

    let captured: unknown = null;

    try {
      evaluateAuthorityLifecycleTransition({
        role: "transfer_delegate",
        operation: "emergency_rotate",
        currentAuthority: "Vote111111111111111111111111111111111111111",
        currentVersion: 1,
        currentUpdatedAt: "2026-04-01T00:00:00.000Z",
        newAuthority: "8NfQF6K3XfMiH4r3Q8YjA5q5V6wG6b1W9ZkL8rC9t4u1",
        multisig: baseMultisig,
        now: new Date("2026-04-01T12:00:00.000Z")
      });
    } catch (error) {
      captured = error;
    }

    expect(isCoreAuthorityLifecycleInputError(captured)).toBe(true);
    expect((captured as Error).message).toContain("do not meet required threshold (4)");
  });

  it("rejects rotate without new authority", () => {
    let captured: unknown = null;

    try {
      evaluateAuthorityLifecycleTransition({
        role: "appdata_authority",
        operation: "rotate",
        currentAuthority: "Vote111111111111111111111111111111111111111",
        currentVersion: 2,
        currentUpdatedAt: "2026-04-01T00:00:00.000Z",
        multisig: baseMultisig,
        now: new Date("2026-04-01T12:00:00.000Z")
      });
    } catch (error) {
      captured = error;
    }

    expect(isCoreAuthorityLifecycleInputError(captured)).toBe(true);
    expect((captured as Error).message).toBe("newAuthority is required for rotate operations.");
  });

  it("enforces cooldown for non-emergency operations", () => {
    process.env.AUTHORITY_ROTATION_COOLDOWN_SECONDS = "3600";

    let captured: unknown = null;

    try {
      evaluateAuthorityLifecycleTransition({
        role: "transfer_delegate",
        operation: "revoke",
        currentAuthority: "Vote111111111111111111111111111111111111111",
        currentVersion: 5,
        currentUpdatedAt: "2026-04-01T11:40:00.000Z",
        multisig: baseMultisig,
        now: new Date("2026-04-01T12:00:00.000Z")
      });
    } catch (error) {
      captured = error;
    }

    expect(isCoreAuthorityLifecycleInputError(captured)).toBe(true);
    expect((captured as Error).message).toContain("Authority cooldown still active");
  });
});
