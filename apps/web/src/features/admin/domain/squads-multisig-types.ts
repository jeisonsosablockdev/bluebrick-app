/**
 * =========================================================================================
 * Layer 3: Domain Layer — Squads Multisig Types & Pure Evaluators
 * Module: squads-multisig-types
 *
 * Description:
 * Pure domain entities and evaluation functions for Squads v4 treasury governance,
 * date audit verification against on-chain Notary PDA state, and quorum validation.
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
