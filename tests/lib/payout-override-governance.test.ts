import { describe, it, expect } from "vitest";

/**
 * =========================================================================================
 * 🧪 SPEC-01 (STORY-015-03): PAYOUT OVERRIDES GOVERNANCE CONTRACT TESTS (RED Phase)
 * =========================================================================================
 * 
 * Tests the domain invariants for two-step wallet payout reassignments:
 * 1. Mandatory normalized `case_number` linking.
 * 2. Solana address validation.
 * 3. State machine transitions (PENDING -> APPROVED | REJECTED | EXPIRED).
 * 4. Payout engine resolution: only APPROVED overrides take effect.
 * 5. Optimistic concurrency locking (version increments).
 * 6. Immutability post-seal (Supersession contract).
 */

export type PayoutOverrideStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";

export type PayoutOverrideEntity = {
  id: string;
  originalWallet: string;
  requestedWallet: string;
  effectiveWallet: string;
  caseNumber: string;
  status: PayoutOverrideStatus;
  version: number;
  reason: string;
  requestedBy: string;
  approvedBy?: string;
  approvalTxSignature?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateOverrideInput = {
  originalWallet: string;
  requestedWallet: string;
  caseNumber: string;
  reason: string;
  requestedBy: string;
};

export type ApproveOverrideInput = {
  override: PayoutOverrideEntity;
  approvedBy: string;
  approvalTxSignature: string;
  expectedVersion: number;
  isRunSealed?: boolean;
};

/**
 * Validates a base58 Solana public key.
 */
export function isValidSolanaAddress(address: string): boolean {
  if (!address || typeof address !== "string") return false;
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address.trim());
}

/**
 * Normalizes case numbers into clean uppercase strings (e.g. "case-2026-001" -> "CASE-2026-001").
 */
export function normalizeCaseNumber(caseNumber: string): string {
  if (!caseNumber || typeof caseNumber !== "string" || caseNumber.trim() === "") {
    throw new Error("ERR_CASE_NUMBER_REQUIRED: case_number is required and cannot be empty.");
  }
  return caseNumber.trim().toUpperCase();
}

/**
 * Pure domain evaluator for creating a new payout override.
 */
export function createPayoutOverride(input: CreateOverrideInput): PayoutOverrideEntity {
  const normalizedCase = normalizeCaseNumber(input.caseNumber);

  if (!isValidSolanaAddress(input.originalWallet)) {
    throw new Error("ERR_INVALID_SOLANA_ADDRESS: originalWallet is not a valid Solana address.");
  }

  if (!isValidSolanaAddress(input.requestedWallet)) {
    throw new Error("ERR_INVALID_SOLANA_ADDRESS: requestedWallet is not a valid Solana address.");
  }

  if (input.originalWallet.trim() === input.requestedWallet.trim()) {
    throw new Error("ERR_SAME_WALLET_OVERRIDE: requestedWallet cannot be identical to originalWallet.");
  }

  return {
    id: `OVR-${Date.now()}`,
    originalWallet: input.originalWallet.trim(),
    requestedWallet: input.requestedWallet.trim(),
    effectiveWallet: input.originalWallet.trim(), // Stays original until APPROVED
    caseNumber: normalizedCase,
    status: "PENDING",
    version: 1,
    reason: input.reason.trim(),
    requestedBy: input.requestedBy.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Pure domain evaluator for approving a payout override.
 */
export function approvePayoutOverride(input: ApproveOverrideInput): PayoutOverrideEntity {
  const { override, approvedBy, approvalTxSignature, expectedVersion, isRunSealed } = input;

  // Invariant 1: Supersession contract: cannot modify payouts for already sealed runs
  if (isRunSealed) {
    throw new Error("ERR_SEALED_RUN_IMMUTABLE: Cannot approve override for an already sealed run.");
  }

  // Invariant 2: Optimistic concurrency locking
  if (override.version !== expectedVersion) {
    throw new Error("ERR_CONCURRENT_MODIFICATION: Version mismatch. The override was modified by another actor.");
  }

  // Invariant 3: Valid state transitions
  if (override.status !== "PENDING") {
    throw new Error(`ERR_INVALID_STATE_TRANSITION: Cannot approve override in state ${override.status}.`);
  }

  // Invariant 4: Mandatory execution proof
  if (!approvalTxSignature || approvalTxSignature.trim() === "") {
    throw new Error("ERR_EXECUTION_PROOF_REQUIRED: approvalTxSignature is required for multisig authorization.");
  }

  return {
    ...override,
    effectiveWallet: override.requestedWallet, // Effective wallet switches on approval
    status: "APPROVED",
    version: override.version + 1,
    approvedBy: approvedBy.trim(),
    approvalTxSignature: approvalTxSignature.trim(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Resolves destination payout address considering active overrides.
 */
export function resolveEffectivePayoutWallet(
  holderWallet: string,
  overrides: PayoutOverrideEntity[]
): string {
  const approvedOverride = overrides.find(
    (o) => o.originalWallet === holderWallet && o.status === "APPROVED"
  );

  return approvedOverride ? approvedOverride.effectiveWallet : holderWallet;
}

describe("SPEC-01 (STORY-015-03): Payout Overrides Governance Flow Contracts", () => {
  const validOriginal = "3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd";
  const validRequested = "AdNNTBSMy4yndiSNVmgEBTkJJuXLBrb7PKFWCdEf8Kxi";

  describe("Creation Validation", () => {
    it("should create a valid PENDING override with normalized case number", () => {
      const override = createPayoutOverride({
        originalWallet: validOriginal,
        requestedWallet: validRequested,
        caseNumber: "case-2026-0891",
        reason: "Actualización de wallet por pérdida de clave privada certificada",
        requestedBy: "admin-carlos"
      });

      expect(override.status).toBe("PENDING");
      expect(override.caseNumber).toBe("CASE-2026-0891");
      expect(override.effectiveWallet).toBe(validOriginal); // Stays original until approved
      expect(override.version).toBe(1);
    });

    it("should reject creation when case_number is missing or whitespace", () => {
      expect(() =>
        createPayoutOverride({
          originalWallet: validOriginal,
          requestedWallet: validRequested,
          caseNumber: "   ",
          reason: "Razón válida",
          requestedBy: "admin-carlos"
        })
      ).toThrowError("ERR_CASE_NUMBER_REQUIRED");
    });

    it("should reject invalid Solana address formats", () => {
      expect(() =>
        createPayoutOverride({
          originalWallet: "0xInvalidEthAddress1234567890",
          requestedWallet: validRequested,
          caseNumber: "CASE-001",
          reason: "Razón válida",
          requestedBy: "admin-carlos"
        })
      ).toThrowError("ERR_INVALID_SOLANA_ADDRESS");
    });

    it("should reject when requested wallet is identical to original", () => {
      expect(() =>
        createPayoutOverride({
          originalWallet: validOriginal,
          requestedWallet: validOriginal,
          caseNumber: "CASE-001",
          reason: "Misma wallet",
          requestedBy: "admin-carlos"
        })
      ).toThrowError("ERR_SAME_WALLET_OVERRIDE");
    });
  });

  describe("Approval & Concurrency Invariants", () => {
    it("should transition PENDING override to APPROVED and update effectiveWallet", () => {
      const pending = createPayoutOverride({
        originalWallet: validOriginal,
        requestedWallet: validRequested,
        caseNumber: "CASE-2026-0891",
        reason: "Valid case",
        requestedBy: "admin-carlos"
      });

      const approved = approvePayoutOverride({
        override: pending,
        approvedBy: "multisig-quorum-2-of-4",
        approvalTxSignature: "5wHu8vXy4KaN9...sig123",
        expectedVersion: 1
      });

      expect(approved.status).toBe("APPROVED");
      expect(approved.effectiveWallet).toBe(validRequested);
      expect(approved.version).toBe(2);
      expect(approved.approvalTxSignature).toBe("5wHu8vXy4KaN9...sig123");
    });

    it("should reject approval on version mismatch (optimistic locking)", () => {
      const pending = createPayoutOverride({
        originalWallet: validOriginal,
        requestedWallet: validRequested,
        caseNumber: "CASE-001",
        reason: "Valid case",
        requestedBy: "admin-carlos"
      });

      expect(() =>
        approvePayoutOverride({
          override: pending,
          approvedBy: "admin-2",
          approvalTxSignature: "sig123",
          expectedVersion: 99 // Conflict!
        })
      ).toThrowError("ERR_CONCURRENT_MODIFICATION");
    });

    it("should reject approval if execution proof signature is missing", () => {
      const pending = createPayoutOverride({
        originalWallet: validOriginal,
        requestedWallet: validRequested,
        caseNumber: "CASE-001",
        reason: "Valid case",
        requestedBy: "admin-carlos"
      });

      expect(() =>
        approvePayoutOverride({
          override: pending,
          approvedBy: "admin-2",
          approvalTxSignature: "",
          expectedVersion: 1
        })
      ).toThrowError("ERR_EXECUTION_PROOF_REQUIRED");
    });

    it("should strictly reject override approval if distribution run is already sealed", () => {
      const pending = createPayoutOverride({
        originalWallet: validOriginal,
        requestedWallet: validRequested,
        caseNumber: "CASE-001",
        reason: "Valid case",
        requestedBy: "admin-carlos"
      });

      expect(() =>
        approvePayoutOverride({
          override: pending,
          approvedBy: "admin-2",
          approvalTxSignature: "sig123",
          expectedVersion: 1,
          isRunSealed: true
        })
      ).toThrowError("ERR_SEALED_RUN_IMMUTABLE");
    });
  });

  describe("Payout Resolution Engine", () => {
    it("should route payouts to original wallet if override is PENDING", () => {
      const pending = createPayoutOverride({
        originalWallet: validOriginal,
        requestedWallet: validRequested,
        caseNumber: "CASE-001",
        reason: "Pending case",
        requestedBy: "admin-carlos"
      });

      const effective = resolveEffectivePayoutWallet(validOriginal, [pending]);
      expect(effective).toBe(validOriginal); // PENDING does not change payout destination
    });

    it("should route payouts to requested wallet once override is APPROVED", () => {
      const pending = createPayoutOverride({
        originalWallet: validOriginal,
        requestedWallet: validRequested,
        caseNumber: "CASE-001",
        reason: "Approved case",
        requestedBy: "admin-carlos"
      });

      const approved = approvePayoutOverride({
        override: pending,
        approvedBy: "multisig",
        approvalTxSignature: "sig123",
        expectedVersion: 1
      });

      const effective = resolveEffectivePayoutWallet(validOriginal, [approved]);
      expect(effective).toBe(validRequested); // Routes to approved destination
    });
  });
});
