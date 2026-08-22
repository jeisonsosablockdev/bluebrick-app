/**
 * =========================================================================================
 * Layer 2: Application Layer — Payout Override Orchestration Service
 * Module: payout-override-service.ts
 * Description: Orchestrates the two-step payout wallet override workflow, enforces Solana address
 *              validations, case number normalizations, optimistic locking, and supersession rules.
 * =========================================================================================
 */

import {
  createPayoutOverrideRecord,
  findApprovedOverrideForWallet,
  getPayoutOverrideById,
  listPendingPayoutOverrides,
  updatePayoutOverrideStatus,
  type PayoutOverrideRow
} from "@/features/staking-distribution/infrastructure/payout-override-repository";
import {
  isValidSolanaAddress,
  normalizeCaseNumber
} from "@/tests/lib/payout-override-governance.test";

export class PayoutOverrideServiceError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(code: string, message: string, status = 400, details?: Record<string, unknown>) {
    super(`${code}: ${message}`);
    this.name = "PayoutOverrideServiceError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export type RequestPayoutOverrideInput = {
  originalWallet: string;
  requestedWallet: string;
  caseNumber: string;
  reason: string;
  requestedBy: string;
};

export type ApprovePayoutOverrideInput = {
  overrideId: string;
  expectedVersion: number;
  approvedBy: string;
  approvalTxSignature: string;
  isRunSealed?: boolean;
};

/**
 * Requests a new payout override in PENDING status.
 */
export async function requestPayoutOverride(
  input: RequestPayoutOverrideInput
): Promise<PayoutOverrideRow> {
  // Step 1: Validate and normalize case number
  let normalizedCase: string;
  try {
    normalizedCase = normalizeCaseNumber(input.caseNumber);
  } catch {
    throw new PayoutOverrideServiceError(
      "ERR_CASE_NUMBER_REQUIRED",
      "case_number is required and cannot be empty.",
      400
    );
  }

  // Step 2: Validate Solana address format for original wallet
  if (!isValidSolanaAddress(input.originalWallet)) {
    throw new PayoutOverrideServiceError(
      "ERR_INVALID_SOLANA_ADDRESS",
      "originalWallet is not a valid Solana public key address.",
      400
    );
  }

  // Step 3: Validate Solana address format for requested wallet
  if (!isValidSolanaAddress(input.requestedWallet)) {
    throw new PayoutOverrideServiceError(
      "ERR_INVALID_SOLANA_ADDRESS",
      "requestedWallet is not a valid Solana public key address.",
      400
    );
  }

  // Step 4: Ensure requested wallet is distinct from original
  if (input.originalWallet.trim() === input.requestedWallet.trim()) {
    throw new PayoutOverrideServiceError(
      "ERR_SAME_WALLET_OVERRIDE",
      "requestedWallet cannot be identical to originalWallet.",
      400
    );
  }

  // Step 5: Ensure reason is provided
  if (!input.reason || input.reason.trim() === "") {
    throw new PayoutOverrideServiceError(
      "ERR_REASON_REQUIRED",
      "Compliance reason / justification is required.",
      400
    );
  }

  // Step 6: Persist in database via repository
  const id = `OVR-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  return createPayoutOverrideRecord({
    id,
    originalWallet: input.originalWallet.trim(),
    requestedWallet: input.requestedWallet.trim(),
    effectiveWallet: input.originalWallet.trim(), // Stays original while PENDING
    caseNumber: normalizedCase,
    reason: input.reason.trim(),
    requestedBy: input.requestedBy.trim()
  });
}

/**
 * Approves a pending payout override with multisig execution proof and optimistic locking.
 */
export async function approvePayoutOverrideWithMultisig(
  input: ApprovePayoutOverrideInput
): Promise<PayoutOverrideRow> {
  // Step 1: Enforce supersession contract: sealed runs cannot be modified
  if (input.isRunSealed) {
    throw new PayoutOverrideServiceError(
      "ERR_SEALED_RUN_IMMUTABLE",
      "Cannot approve override for an already sealed distribution run.",
      409
    );
  }

  // Step 2: Validate execution signature
  if (!input.approvalTxSignature || input.approvalTxSignature.trim() === "") {
    throw new PayoutOverrideServiceError(
      "ERR_EXECUTION_PROOF_REQUIRED",
      "On-chain approval transaction signature proof is required.",
      400
    );
  }

  // Step 3: Fetch existing record
  const existing = await getPayoutOverrideById(input.overrideId);
  if (!existing) {
    throw new PayoutOverrideServiceError(
      "ERR_OVERRIDE_NOT_FOUND",
      `Payout override ${input.overrideId} not found.`,
      404
    );
  }

  // Step 4: Validate state transition (only PENDING can be approved)
  if (existing.status !== "PENDING") {
    throw new PayoutOverrideServiceError(
      "ERR_INVALID_STATE_TRANSITION",
      `Cannot approve payout override in status ${existing.status}.`,
      409
    );
  }

  // Step 5: Perform atomic update with optimistic locking
  const updated = await updatePayoutOverrideStatus({
    id: input.overrideId,
    status: "APPROVED",
    expectedVersion: input.expectedVersion,
    effectiveWallet: existing.requested_wallet,
    approvedBy: input.approvedBy,
    approvalTxSignature: input.approvalTxSignature
  });

  if (!updated) {
    throw new PayoutOverrideServiceError(
      "ERR_CONCURRENT_MODIFICATION",
      "Conflict: The override was concurrently modified by another administrator.",
      409
    );
  }

  return updated;
}

/**
 * Lists pending overrides for the compliance queue.
 */
export async function listPendingOverridesForCompliance(): Promise<PayoutOverrideRow[]> {
  return listPendingPayoutOverrides();
}

/**
 * Resolves the destination payout address for a given holder wallet.
 */
export async function resolveActivePayoutWallet(holderWallet: string): Promise<string> {
  const approved = await findApprovedOverrideForWallet(holderWallet);
  return approved ? approved.effective_wallet : holderWallet;
}
