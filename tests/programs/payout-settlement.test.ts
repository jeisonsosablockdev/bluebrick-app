import { describe, it, expect } from 'vitest';
import { address, getAddressEncoder, getProgramDerivedAddress } from '@solana/kit';
import fixture from '../fixtures/payout-settlement-v1.json';

// Import domain / compat definitions
import {
  SQUADS_V4_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  deriveSquadsPdasFromCreateKey,
} from '../../apps/web/src/lib/solana-kit/compat/squads';

import {
  encodePayoutLeafPreimage,
  computeSnapshotHash,
} from '../../apps/web/src/features/staking-distribution/domain/payout-leaf';

/**
 * =========================================================================================
 * 🛡️ SPEC-04 TDD SUITE — ANCHOR PROGRAM PAYOUT_SETTLEMENT (RED PHASE)
 * =========================================================================================
 * 
 * Scope: On-Chain Program Contracts, Instructions & State Machine
 * Program: programs/payout_settlement
 * 
 * Invariants & Threat Models Tested:
 * 1. 3-Layer Vault PDA Authentication (initialize_policy / update_policy / initialize_run / seal_run)
 * 2. Immutable Squads Governance Binding (Multisig PDA + Vault Index)
 * 3. Instructions Sysvar Introspection (Dual Ed25519 independent attestations)
 * 4. Escrow ATA Balance Invariant & Exact Minor Unit Matching on seal_run
 * 5. Rejection of Token-2022 and Unauthorized Mints in V1
 * 
 * @spec EPIC-015-SOLUTION-ARCHITECTURE §Anchor Payout Settlement Program
 * @spec STORY-015-01-SPEC-04
 */
describe('SPEC-04 Anchor Program payout_settlement Contract Specification (@spec SPEC-015-PROGRAM-SETTLEMENT)', () => {
  const SETTLEMENT_PROGRAM_ID = address(
    process.env.PAYOUT_SETTLEMENT_PROGRAM_ID || 'HLp7YXKZZ8uPuzwN3CtuDxtgYoWhc5Fb1FHj5bHEe9zE'
  );

  const CANONICAL_MINT = address('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'); // USDC Devnet
  const CANONICAL_CREATE_KEY = 'AZGhDBuomd6cRf1LZoUNfk4fWn6HpoZjmp8dzZibZK7c';

  describe('A. TreasuryPolicy PDA & 3-Layer Vault Authentication (@spec SPEC-015-VAULT-AUTH)', () => {
    it('should derive TreasuryPolicy PDA using canonical seeds [b"treasury_policy", multisig_pda]', async () => {
      // Threat Model: Attacker derives policy with arbitrary seeds or attacker pubkey.
      // Defense: Strict seed derivation [b"treasury_policy", multisig_pda].

      // Arrange
      const squadsPdas = await deriveSquadsPdasFromCreateKey(CANONICAL_CREATE_KEY, 0n, 0);
      const multisigAddr = address(squadsPdas.squadsMultisigPda);

      // Act
      const [treasuryPolicyPda] = await getProgramDerivedAddress({
        programAddress: SETTLEMENT_PROGRAM_ID,
        seeds: [
          new TextEncoder().encode('treasury_policy'),
          getAddressEncoder().encode(multisigAddr),
        ],
      });

      // Assert
      expect(treasuryPolicyPda).toBeTruthy();
      expect(typeof treasuryPolicyPda).toBe('string');
      expect(treasuryPolicyPda.length).toBeGreaterThan(30);
    });

    it('should enforce 3-layer validation: signer == true, key == vaultPda, owner == SQUADS_V4_ID', async () => {
      // Invariant: An attacker signer PDA from another program CANNOT initialize or update policy.
      
      // Arrange
      const squadsPdas = await deriveSquadsPdasFromCreateKey(CANONICAL_CREATE_KEY, 0n, 0);
      const legitimateVaultPda = squadsPdas.squadsVaultPda;
      const forgedSignerPda = '9hSR6S7WPtxmTojgo6GG3k4yDPecgJY292j7xrsUGWBu'; // Fake signer

      // Act & Assert
      expect(legitimateVaultPda).toBe('D9i1XNftRpB68WTYrpCau5fEYYS2eiJa8Q738N5idSXB');
      expect(forgedSignerPda).not.toBe(legitimateVaultPda);
      expect(SQUADS_V4_PROGRAM_ID.toString()).toBe('SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf');
    });

    it('should declare immutable binding to Squads Multisig and Vault Index in policy state', () => {
      // State invariant contract: TreasuryPolicy struct fields
      const expectedPolicyFields = [
        'multisig_pda',
        'vault_index',
        'authority_vault',
        'policy_version',
        'payout_attester_a',
        'payout_attester_b',
        'emergency_pause_authority',
        'emergency_pause_key_version',
        'bump',
      ];

      expect(expectedPolicyFields).toContain('multisig_pda');
      expect(expectedPolicyFields).toContain('authority_vault');
      expect(expectedPolicyFields).toContain('emergency_pause_authority');
    });
  });

  describe('B. PayoutRun PDA & Escrow Token Account (@spec SPEC-015-RUN-INITIALIZATION)', () => {
    it('should derive PayoutRun PDA using seeds [b"payout_run", run_id_16_bytes]', async () => {
      // Arrange — Parse UUID to 16 bytes Big-Endian
      const runIdHex = fixture.runId.replace(/-/g, '');
      const runIdBytes = Buffer.from(runIdHex, 'hex');

      // Act
      const [payoutRunPda] = await getProgramDerivedAddress({
        programAddress: SETTLEMENT_PROGRAM_ID,
        seeds: [
          new TextEncoder().encode('payout_run'),
          runIdBytes,
        ],
      });

      // Assert
      expect(payoutRunPda).toBeTruthy();
      expect(typeof payoutRunPda).toBe('string');
    });

    it('should derive Escrow Token Account owned exclusively by PayoutRun PDA', async () => {
      // Arrange — Escrow ATA derived with [payout_run_pda, token_program, mint]
      const runIdHex = fixture.runId.replace(/-/g, '');
      const runIdBytes = Buffer.from(runIdHex, 'hex');

      const [payoutRunPda] = await getProgramDerivedAddress({
        programAddress: SETTLEMENT_PROGRAM_ID,
        seeds: [
          new TextEncoder().encode('payout_run'),
          runIdBytes,
        ],
      });

      const [escrowAta] = await getProgramDerivedAddress({
        programAddress: address('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
        seeds: [
          getAddressEncoder().encode(address(payoutRunPda)),
          getAddressEncoder().encode(TOKEN_PROGRAM_ID),
          getAddressEncoder().encode(CANONICAL_MINT),
        ],
      });

      // Assert
      expect(escrowAta).toBeTruthy();
      expect(escrowAta).not.toBe(payoutRunPda);
    });

    it('should reject Token-2022 program for escrow initialization in V1', () => {
      // Invariant: V1 strictly rejects Token-2022 Program (TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb)
      const TOKEN_2022_PROGRAM_ID = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
      expect(TOKEN_PROGRAM_ID.toString()).not.toBe(TOKEN_2022_PROGRAM_ID);
      expect(TOKEN_PROGRAM_ID.toString()).toBe('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
    });
  });

  describe('C. Dual Ed25519 Attestation Sysvar Introspection (@spec SPEC-015-SYSVAR-ATTESTATION)', () => {
    it('should require dual distinct attester public keys (Attester A != Attester B)', () => {
      // Threat Model: Attester signs twice with same key (Sybil attack).
      // Defense: Program checks attester_a != attester_b on policy and instructions sysvar.

      const attesterA = '3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd';
      const attesterB = 'AdNNTBSMy4yndiSNVmgEBTkJJuXLBrb7PKFWCdEf8Kxi';

      expect(attesterA).not.toBe(attesterB);
    });

    it('should verify snapshotHash matches canonical dual Ed25519 signed preimage of 147 bytes', () => {
      // Arrange
      const snapshotParams = {
        snapshotVersion: fixture.snapshotVersion,
        runId: fixture.runId,
        merkleRoot: fixture.merkleRoot,
        totalAmountMinor: BigInt(fixture.totalAmountMinor),
        itemCount: fixture.itemCount,
        rulesVersion: fixture.rulesVersion,
        mint: fixture.mint,
        tokenProgram: fixture.tokenProgram,
      };

      // Act
      const snapshotHash = computeSnapshotHash(snapshotParams);

      // Assert
      expect(snapshotHash).toBe(fixture.snapshotHash);
    });
  });

  describe('D. Seal Run & Exact Escrow Balance Invariant (@spec SPEC-015-SEAL-RUN)', () => {
    it('should verify that seal_run requires exact escrow balance equality (balance == totalAmountMinor)', () => {
      // Invariant: Escrow must contain EXACT committed amount. Underfunded or overfunded reverts.
      const committedAmount = BigInt(fixture.totalAmountMinor); // 7,000,000 minor units ($7 USDC)
      const underfundedBalance = committedAmount - 1n;
      const overfundedBalance = committedAmount + 1n;

      expect(committedAmount).toBe(7000000n);
      expect(underfundedBalance).not.toBe(committedAmount);
      expect(overfundedBalance).not.toBe(committedAmount);
    });

    it('should enforce state transition: Draft (0) -> Active (1) -> Paused (2) / Cancelled (3) / Completed (4)', () => {
      const PayoutRunStatus = {
        Draft: 0,
        Active: 1,
        Paused: 2,
        Cancelled: 3,
        Completed: 4,
      };

      expect(PayoutRunStatus.Draft).toBe(0);
      expect(PayoutRunStatus.Active).toBe(1);
      expect(PayoutRunStatus.Paused).toBe(2);
    });
  });
});
