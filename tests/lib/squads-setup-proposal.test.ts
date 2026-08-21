import { describe, it, expect } from 'vitest';
import { address, getAddressEncoder } from '@solana/kit';
import {
  deriveTreasuryPolicyPda,
  encodeInitializePolicyInstruction,
  buildSquadsSetupProposalData,
  INITIALIZE_POLICY_DISCRIMINATOR,
  type InitializePolicyInstructionParams,
} from '../../apps/web/src/features/staking-distribution/infrastructure/squads-proposals';
import {
  SQUADS_V4_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  deriveSquadsPdasFromCreateKey,
} from '../../apps/web/src/lib/solana-kit/compat/squads';

/**
 * =========================================================================================
 * 🛡️ SPEC-06 TDD SUITE — SQUADS V4 SETUP PROPOSAL & INITIALIZE_POLICY CPI BUILDER
 * =========================================================================================
 * 
 * Target Layer: Layer 4 (Infrastructure Proposal Builder)
 * Target File:  apps/web/src/features/staking-distribution/infrastructure/squads-proposals.ts
 * 
 * Scope:
 * 1. TreasuryPolicy PDA derivation: [b"treasury_policy", multisig_pda]
 * 2. Anchor 8-byte discriminator encoding: sha256("global:initialize_policy")[0..8]
 * 3. 3-Layer Squads Vault CPI account meta assembly:
 *    [treasury_policy, multisig, authority_vault (signer), mint, token_program, payer, system_program]
 * 4. Squads v4 VaultTransaction / Proposal instruction payload assembly
 * 5. Invariant & fail-closed validation (rejects matching attesters A & B, invalid keys)
 * 
 * @spec EPIC-015-SOLUTION-ARCHITECTURE §2.1 Authority Manifest & §2.2 Canonic Setup
 * @spec STORY-015-01-SPEC-06
 */
describe('SPEC-06 Squads v4 Setup Proposal Builder (@spec SPEC-015-SQUADS-PROPOSAL-SETUP)', () => {
  const DEPLOYED_PROGRAM_ID = address('HLp7YXKZZ8uPuzwN3CtuDxtgYoWhc5Fb1FHj5bHEe9zE');
  const DEVNET_CREATE_KEY = 'AZGhDBuomd6cRf1LZoUNfk4fWn6HpoZjmp8dzZibZK7c';
  const DEVNET_MULTISIG_PDA = 'rVKwqnxyq2RuU4sTBdXhifrZB9oY9mGoqw5oA6EHKaD';
  const DEVNET_VAULT_PDA = 'D9i1XNftRpB68WTYrpCau5fEYYS2eiJa8Q738N5idSXB';
  const DEVNET_USDC_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

  const ATTESTER_A = '3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd';
  const ATTESTER_B = 'AdNNTBSMy4yndiSNVmgEBTkJJuXLBrb7PKFWCdEf8Kxi';
  const PAUSE_AUTHORITY = '3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd';

  describe('A. TreasuryPolicy PDA Derivation (@spec SPEC-015-TREASURY-POLICY-PDA)', () => {
    it('should derive deterministic TreasuryPolicy PDA from Multisig PDA', async () => {
      // Act
      const [treasuryPolicyPda, bump] = await deriveTreasuryPolicyPda(
        DEVNET_MULTISIG_PDA,
        DEPLOYED_PROGRAM_ID
      );

      // Assert
      expect(treasuryPolicyPda).toBeTruthy();
      expect(typeof treasuryPolicyPda).toBe('string');
      expect(typeof bump).toBe('number');
      expect(bump).toBeGreaterThanOrEqual(0);
      expect(bump).toBeLessThanOrEqual(255);
    });

    it('should produce identical TreasuryPolicy PDA when called idempotently', async () => {
      const [pda1] = await deriveTreasuryPolicyPda(DEVNET_MULTISIG_PDA, DEPLOYED_PROGRAM_ID);
      const [pda2] = await deriveTreasuryPolicyPda(DEVNET_MULTISIG_PDA, DEPLOYED_PROGRAM_ID);

      expect(pda1).toBe(pda2);
    });
  });

  describe('B. Anchor Instruction Discriminator & Payload Encoding (@spec SPEC-015-INIT-POLICY-ENCODING)', () => {
    it('should match the canonical Anchor 8-byte discriminator for initialize_policy', () => {
      // Discriminator = sha256("global:initialize_policy")[0..8]
      expect(INITIALIZE_POLICY_DISCRIMINATOR.length).toBe(8);
      expect(Buffer.from(INITIALIZE_POLICY_DISCRIMINATOR).toString('hex')).toBe(
        'b227c4ea90e7a2cc'
      );
    });

    it('should encode instruction data with vault_index and 3 public keys (105 bytes total)', async () => {
      // Arrange
      const params: InitializePolicyInstructionParams = {
        settlementProgramId: DEPLOYED_PROGRAM_ID,
        multisigPda: DEVNET_MULTISIG_PDA,
        authorityVaultPda: DEVNET_VAULT_PDA,
        mint: DEVNET_USDC_MINT,
        vaultIndex: 0,
        payoutAttesterA: ATTESTER_A,
        payoutAttesterB: ATTESTER_B,
        emergencyPauseAuthority: PAUSE_AUTHORITY,
        payer: ATTESTER_A,
      };

      // Act
      const ix = await encodeInitializePolicyInstruction(params);

      // Assert
      // 8 bytes discriminator + 1 byte vault_index + 32 bytes attesterA + 32 bytes attesterB + 32 bytes pauseAuth = 105 bytes
      expect(ix.data.length).toBe(105);
      expect(ix.programAddress).toBe(DEPLOYED_PROGRAM_ID);
    });

    it('should build exact 7 account metas matching 3-layer Squads Vault security model', async () => {
      const [treasuryPolicyPda] = await deriveTreasuryPolicyPda(
        DEVNET_MULTISIG_PDA,
        DEPLOYED_PROGRAM_ID
      );

      const params: InitializePolicyInstructionParams = {
        settlementProgramId: DEPLOYED_PROGRAM_ID,
        multisigPda: DEVNET_MULTISIG_PDA,
        authorityVaultPda: DEVNET_VAULT_PDA,
        mint: DEVNET_USDC_MINT,
        vaultIndex: 0,
        payoutAttesterA: ATTESTER_A,
        payoutAttesterB: ATTESTER_B,
        emergencyPauseAuthority: PAUSE_AUTHORITY,
        payer: ATTESTER_A,
      };

      const ix = await encodeInitializePolicyInstruction(params);

      // Assert 7 accounts:
      // 0: treasury_policy (writable, non-signer)
      // 1: multisig (readonly, non-signer)
      // 2: authority_vault (writable, SIGNER via Squads CPI)
      // 3: mint (readonly, non-signer)
      // 4: token_program (readonly, non-signer)
      // 5: payer (writable, signer)
      // 6: system_program (readonly, non-signer)
      expect(ix.accounts.length).toBe(7);
      expect(ix.accounts[0].address).toBe(treasuryPolicyPda);
      expect(ix.accounts[0].isWritable).toBe(true);
      expect(ix.accounts[0].isSigner).toBe(false);

      expect(ix.accounts[1].address).toBe(DEVNET_MULTISIG_PDA);
      expect(ix.accounts[1].isWritable).toBe(false);
      expect(ix.accounts[1].isSigner).toBe(false);

      expect(ix.accounts[2].address).toBe(DEVNET_VAULT_PDA);
      expect(ix.accounts[2].isWritable).toBe(true);
      expect(ix.accounts[2].isSigner).toBe(true); // Signed by Squads Vault CPI

      expect(ix.accounts[3].address).toBe(DEVNET_USDC_MINT);
      expect(ix.accounts[4].address).toBe(TOKEN_PROGRAM_ID.toString());
      expect(ix.accounts[5].address).toBe(ATTESTER_A);
      expect(ix.accounts[5].isSigner).toBe(true);
    });
  });

  describe('C. Squads Proposal Instruction & Threshold Validation (@spec SPEC-015-PROPOSAL-PAYLOAD)', () => {
    it('should build Squads proposal metadata linking create_key and transactionIndex 1', async () => {
      // Act
      const proposalData = await buildSquadsSetupProposalData({
        createKey: DEVNET_CREATE_KEY,
        transactionIndex: 1n,
        vaultIndex: 0,
        settlementProgramId: DEPLOYED_PROGRAM_ID,
        mint: DEVNET_USDC_MINT,
        payoutAttesterA: ATTESTER_A,
        payoutAttesterB: ATTESTER_B,
        emergencyPauseAuthority: PAUSE_AUTHORITY,
        proposer: ATTESTER_A,
      });

      // Assert
      expect(proposalData.multisigPda).toBe(DEVNET_MULTISIG_PDA);
      expect(proposalData.vaultPda).toBe(DEVNET_VAULT_PDA);
      expect(proposalData.proposalPda).toBeTruthy();
      expect(proposalData.innerInstruction.data.length).toBe(105);
    });

    it('should fail-closed if Attester A and Attester B are identical (Anti-Sybil)', async () => {
      // Threat Model: Attacker attempts to configure themselves as both Attester A and B.
      // Defense: Client helper rejects identical attesters before transaction submission.

      await expect(
        buildSquadsSetupProposalData({
          createKey: DEVNET_CREATE_KEY,
          transactionIndex: 1n,
          vaultIndex: 0,
          settlementProgramId: DEPLOYED_PROGRAM_ID,
          mint: DEVNET_USDC_MINT,
          payoutAttesterA: ATTESTER_A,
          payoutAttesterB: ATTESTER_A, // Duplicate!
          emergencyPauseAuthority: PAUSE_AUTHORITY,
          proposer: ATTESTER_A,
        })
      ).rejects.toThrow(/Payout attesters A and B must be distinct public keys/i);
    });
  });
});
