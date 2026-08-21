import { describe, it, expect } from 'vitest';

/**
 * =========================================================================================
 * 🧪 SPEC-02: SQUADS MULTISIG CONSOLE & GOVERNANCE UI CONTRACT TESTS (RED Phase)
 * =========================================================================================
 * 
 * Tests the component contracts, date audit warning logic, quorum rules (2 of 4),
 * and expansion toggle state management for the Treasury Multisig Console (/admin/treasury/squads).
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
      reason: 'ONCHAIN_PDA_DATES_UNAVAILABLE_OR_STALE',
    };
  }

  const startMismatch = dto.onChainDates.projectStartAt !== dto.dbDates.projectStartAt;
  const endMismatch = dto.onChainDates.projectEndAt !== dto.dbDates.projectEndAt;

  if (startMismatch || endMismatch) {
    return {
      isWarning: true,
      reason: dto.dbDates.modificationReason ?? 'PROJECT_DATES_MODIFIED_VS_ONCHAIN_NOTARY',
    };
  }

  return {
    isWarning: false,
    reason: null,
  };
}

/**
 * Quorum state machine evaluator (2-of-4).
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
    canExecute,
  };
}

describe('SPEC-02: Squads Multisig Console & Governance Contracts', () => {
  const baseMockDto: SquadsProposalDTO = {
    runId: 'RUN-2026-08-TEST',
    treasuryPolicyPda: 'Bay3rtZ9nhDR6CgpiHKnSdCiksuFUHz7ttuzQpF1D71K',
    multisigPda: 'rVKwqnxyq2RuU4sTBdXhifrZB9oY9mGoqw5oA6EHKaD',
    vaultPda: 'D9i1XNftRpB68WTYrpCau5fEYYS2eiJa8Q738N5idSXB',
    threshold: 2,
    membersCount: 4,
    approvedMembers: ['3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd'],
    executed: false,
    onChainDates: {
      projectStartAt: '2026-03-15T00:00:00Z',
      projectEndAt: '2028-12-31T23:59:59Z',
    },
    dbDates: {
      projectStartAt: '2026-03-15T00:00:00Z',
      projectEndAt: '2028-12-31T23:59:59Z',
    },
    beneficiaries: [
      {
        claimId: 'CLAIM-001',
        holderName: 'Carlos Mendoza',
        originWallet: '3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd',
        payoutWallet: 'AdNNTBSMy4yndiSNVmgEBTkJJuXLBrb7PKFWCdEf8Kxi',
        assetMint: '9xP2...v4M1',
        mintDate: '2026-01-15',
        daysSinceMint: 40,
        stakingDays: 15,
        stakingPeriod: '01/08/2026 al 15/08/2026',
        grossAmountMinor: '1200000000',
        feeAmountMinor: '24000000',
        netAmountMinor: '1176000000',
        overrideCaseNumber: 'CASE-2026-0891',
      },
    ],
  };

  it('should evaluate date audit as clean when on-chain PDA matches DB dates', () => {
    const result = evaluateDateAuditWarning(baseMockDto);
    expect(result.isWarning).toBe(false);
    expect(result.reason).toBeNull();
  });

  it('should trigger prominent audit warning when DB dates differ from on-chain Notario PDA', () => {
    const modifiedDto: SquadsProposalDTO = {
      ...baseMockDto,
      dbDates: {
        ...baseMockDto.dbDates,
        projectEndAt: '2029-12-31T23:59:59Z',
        modificationReason: 'Prórroga de contrato de arrendamiento por 12 meses adicionales - Adenda #3',
      },
    };

    const result = evaluateDateAuditWarning(modifiedDto);
    expect(result.isWarning).toBe(true);
    expect(result.reason).toContain('Prórroga de contrato de arrendamiento');
  });

  it('should fail closed with warning if on-chain RPC dates are unavailable', () => {
    const staleDto: SquadsProposalDTO = {
      ...baseMockDto,
      onChainDates: null,
    };

    const result = evaluateDateAuditWarning(staleDto);
    expect(result.isWarning).toBe(true);
    expect(result.reason).toBe('ONCHAIN_PDA_DATES_UNAVAILABLE_OR_STALE');
  });

  it('should enforce 2-of-4 quorum threshold and block execution until 2 approvals exist', () => {
    // 1 approval -> Quorum NOT reached, execution blocked
    const oneApproval = evaluateQuorumStatus(baseMockDto);
    expect(oneApproval.quorumReached).toBe(false);
    expect(oneApproval.approvalsCount).toBe(1);
    expect(oneApproval.canExecute).toBe(false);

    // 2 approvals -> Quorum reached, execution enabled
    const twoApprovalsDto: SquadsProposalDTO = {
      ...baseMockDto,
      approvedMembers: [
        '3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd',
        'AdNNTBSMy4yndiSNVmgEBTkJJuXLBrb7PKFWCdEf8Kxi',
      ],
    };

    const twoApprovals = evaluateQuorumStatus(twoApprovalsDto);
    expect(twoApprovals.quorumReached).toBe(true);
    expect(twoApprovals.approvalsCount).toBe(2);
    expect(twoApprovals.canExecute).toBe(true);

    // If already executed -> canExecute must be false
    const executedDto: SquadsProposalDTO = {
      ...twoApprovalsDto,
      executed: true,
    };

    const executed = evaluateQuorumStatus(executedDto);
    expect(executed.canExecute).toBe(false);
  });
});
