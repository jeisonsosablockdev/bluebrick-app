/**
 * =========================================================================================
 * Layer 3: Domain Layer — Squads Multisig Types & Pure Evaluators
 * Module: squads-multisig-types
 *
 * Description:
 * Pure domain entities and evaluation functions for Squads v4 treasury governance,
 * date audit verification against on-chain Notary PDA state, quorum validation,
 * and unified single-action multi-signature determination.
 * Zero framework, zero UI, zero DB/RPC dependencies.
 * =========================================================================================
 */

export type SquadsProposalDTO = {
  runId: string;
  treasuryPolicyPda: string;
  multisigPda: string;
  vaultPda: string;
  threshold: number;
  membersCount: number;
  approvedMembers: string[];
  executed: boolean;
  onChainDates: {
    projectStartAt: string;
    projectEndAt: string;
  } | null;
  dbDates: {
    projectStartAt: string;
    projectEndAt: string;
    modifiedAt?: string;
    modifiedBy?: string;
    modificationReason?: string;
  };
  beneficiaries: Array<{
    claimId: string;
    holderName: string;
    originWallet: string;
    payoutWallet: string;
    assetMint: string;
    mintDate: string;
    daysSinceMint: number;
    stakingDays: number;
    stakingPeriod: string;
    grossAmountMinor: string;
    feeAmountMinor: string;
    netAmountMinor: string;
    overrideCaseNumber?: string;
  }>;
};

/**
 * Pure evaluation function for the Date Audit Warning Banner.
 */
export function evaluateDateAuditWarning(dto: SquadsProposalDTO): {
  isWarning: boolean;
  reason: string | null;
} {
  if (!dto.onChainDates) {
    return {
      isWarning: true,
      reason: "ONCHAIN_PDA_DATES_UNAVAILABLE_OR_STALE"
    };
  }

  const startMismatch = dto.onChainDates.projectStartAt !== dto.dbDates.projectStartAt;
  const endMismatch = dto.onChainDates.projectEndAt !== dto.dbDates.projectEndAt;

  if (startMismatch || endMismatch) {
    return {
      isWarning: true,
      reason: dto.dbDates.modificationReason ?? "PROJECT_DATES_MODIFIED_VS_ONCHAIN_NOTARY"
    };
  }

  return {
    isWarning: false,
    reason: null
  };
}

/**
 * Quorum state machine evaluator (e.g. 2-of-4).
 */
export function evaluateQuorumStatus(dto: SquadsProposalDTO): {
  quorumReached: boolean;
  approvalsCount: number;
  canExecute: boolean;
} {
  const approvalsCount = dto.approvedMembers.length;
  const quorumReached = approvalsCount >= dto.threshold;
  const canExecute = quorumReached && !dto.executed;

  return {
    quorumReached,
    approvalsCount,
    canExecute
  };
}

/**
 * Unified multisig action evaluation result.
 */
export type UnifiedMultisigAction =
  | { type: "ALREADY_EXECUTED"; label: "Propuesta Ejecutada"; disabled: true; willReachQuorum: false }
  | { type: "ALREADY_APPROVED"; label: "Ya Has Aprobado"; disabled: true; willReachQuorum: false }
  | { type: "VOTE_ONLY"; label: "Aprobar Propuesta (Votar)"; disabled: false; willReachQuorum: false }
  | { type: "VOTE_AND_EXECUTE"; label: "Aprobar y Ejecutar en Devnet"; disabled: false; willReachQuorum: true };

/**
 * Pure state machine determining the single action button flow for the connected user.
 *
 * @param dto - Current proposal state
 * @param userPubkey - Connected signer public key, or null
 * @returns Unified action configuration
 */
export function evaluateUnifiedMultisigAction(
  dto: SquadsProposalDTO,
  userPubkey: string | null
): UnifiedMultisigAction {
  // Step 1: Check if already executed
  if (dto.executed) {
    return { type: "ALREADY_EXECUTED", label: "Propuesta Ejecutada", disabled: true, willReachQuorum: false };
  }

  // Step 2: Check if current connected user already voted
  if (userPubkey && dto.approvedMembers.includes(userPubkey)) {
    return { type: "ALREADY_APPROVED", label: "Ya Has Aprobado", disabled: true, willReachQuorum: false };
  }

  // Step 3: Check if this user's vote will fulfill the required threshold (e.g. 2-of-4)
  const projectedApprovals = dto.approvedMembers.length + 1;
  const willReachQuorum = projectedApprovals >= dto.threshold;

  if (willReachQuorum) {
    return {
      type: "VOTE_AND_EXECUTE",
      label: "Aprobar y Ejecutar en Devnet",
      disabled: false,
      willReachQuorum: true
    };
  }

  return {
    type: "VOTE_ONLY",
    label: "Aprobar Propuesta (Votar)",
    disabled: false,
    willReachQuorum: false
  };
}
