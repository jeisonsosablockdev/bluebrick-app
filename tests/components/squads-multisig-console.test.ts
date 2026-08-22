import { describe, it, expect } from 'vitest';

/**
 * =========================================================================================
 * 🧪 SPEC-02: SQUADS MULTISIG CONSOLE & GOVERNANCE UI CONTRACT TESTS (RED Phase)
 * =========================================================================================
 * 
 * Tests the component contracts, date audit warning logic, quorum rules (2 of 4),
 * and expansion toggle state management for the Treasury Multisig Console (/admin/treasury/squads).
 */

import {
  evaluateDateAuditWarning,
  evaluateQuorumStatus,
  evaluateUnifiedMultisigAction,
  type SquadsProposalDTO
} from "@/features/admin/domain/squads-multisig-types";

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

  it('should evaluate unified multisig action based on threshold progress', () => {
    // 0 approvals -> Action is VOTE_ONLY (1 vote will not reach threshold 2)
    const zeroApprovalsDto: SquadsProposalDTO = {
      ...baseMockDto,
      approvedMembers: [],
    };
    const actionZero = evaluateUnifiedMultisigAction(zeroApprovalsDto, 'NewSignerWallet111111111111111111111111');
    expect(actionZero.type).toBe('VOTE_ONLY');
    expect(actionZero.disabled).toBe(false);
    expect(actionZero.willReachQuorum).toBe(false);

    // 1 approval -> Next vote WILL reach threshold 2 -> VOTE_AND_EXECUTE
    const oneApprovalDto: SquadsProposalDTO = {
      ...baseMockDto,
      approvedMembers: ['3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd'],
    };
    const actionOne = evaluateUnifiedMultisigAction(oneApprovalDto, 'SecondSignerWallet22222222222222222222');
    expect(actionOne.type).toBe('VOTE_AND_EXECUTE');
    expect(actionOne.disabled).toBe(false);
    expect(actionOne.willReachQuorum).toBe(true);

    // User already approved -> ALREADY_APPROVED
    const actionAlreadyApproved = evaluateUnifiedMultisigAction(oneApprovalDto, '3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd');
    expect(actionAlreadyApproved.type).toBe('ALREADY_APPROVED');
    expect(actionAlreadyApproved.disabled).toBe(true);
  });
});
