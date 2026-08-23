/**
 * =========================================================================================
 * Layer 3: Domain Layer — Payout Override Rules & Pure Evaluators
 * Module: payout-override-rules.ts
 *
 * Description:
 * Pure domain entities, address validators, case number normalizers, and state machine
 * transition functions for two-step wallet payout reassignments.
 *
 * Invariants:
 * - Zero external framework, zero database, zero RPC dependencies.
 * - Strict base58 Solana address validation.
 * - Immutable post-seal execution invariants (Supersession contract).
 * =========================================================================================
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
 *
 * @param address - Public key string to validate
 * @returns boolean indicating if the address is a valid base58 Solana public key
 */
export function isValidSolanaAddress(address: string): boolean {
  if (!address || typeof address !== "string") return false;
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address.trim());
}

/**
 * Normalizes case numbers into clean uppercase strings (e.g. "case-2026-001" -> "CASE-2026-001").
 *
 * @param caseNumber - Raw case number input
 * @returns Normalized uppercase case number string
 */
export function normalizeCaseNumber(caseNumber: string): string {
  if (!caseNumber || typeof caseNumber !== "string" || caseNumber.trim() === "") {
    throw new Error("ERR_CASE_NUMBER_REQUIRED: case_number is required and cannot be empty.");
  }
  return caseNumber.trim().toUpperCase();
}

/**
 * Pure domain evaluator for creating a new payout override.
 *
 * @param input - Validated input parameters for override creation
 * @returns PayoutOverrideEntity in initial PENDING status
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
 *
 * @param input - Payout override approval parameters and concurrency checks
 * @returns Updated PayoutOverrideEntity in APPROVED status
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
 *
 * @param holderWallet - Original asset holder wallet address
 * @param overrides - Array of all active payout overrides
 * @returns Effective payout destination wallet address
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
