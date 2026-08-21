import { describe, it, expect } from 'vitest';
import {
  SQUADS_V4_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  deriveSquadsPdasFromCreateKey,
  deriveAssociatedTokenAddress,
} from '../../apps/web/src/lib/solana-kit/compat/squads';

/**
 * =========================================================================================
 * 🛡️ SPEC-02 TDD SUITE — SQUADS PROTOCOL V4 SDK COMPAT & SECURITY MODEL
 * =========================================================================================
 * 
 * Target Layer: Layer 4 (Infrastructure Compat)
 * Target File:  apps/web/src/lib/solana-kit/compat/squads.ts
 * 
 * Threat Models & Vulnerabilities Covered:
 * 1. Rogue Program ID Injection: Tests verify that only the canonical Devnet Squads v4
 *    program ID (SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf) is configured.
 * 2. Spoofed Vault Derivation: Tests verify that the Multisig and Vault PDAs derived
 *    from the verified create_key exactly match the on-chain Devnet accounts.
 * 3. Proposal Collision: Tests verify that incrementing transactionIndex produces
 *    unambiguous, non-colliding Proposal and Batch PDAs.
 * 4. Fake String Fallback Attack (Fail-Closed): Tests verify that invalid inputs throw
 *    immediate typed errors and NEVER fall back to dummy mock strings.
 * 
 * @spec EPIC-015-SOLUTION-ARCHITECTURE §Authority Manifest Devnet V1
 * @spec STORY-015-01-SPEC-02
 */
describe('SPEC-02 Squads v4 SDK Compat Wrapper (@spec SPEC-015-SQUADS-SDK-V4)', () => {
  describe('A. Program IDs & Constants (@spec SPEC-015-SQUADS-CONSTANTS)', () => {
    it('should configure canonical Squads v4 Program ID (SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf)', () => {
      // Invariant: Must strictly target the verified Squads v4 deployment on Solana Devnet
      expect(SQUADS_V4_PROGRAM_ID.toString()).toBe(
        'SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf'
      );
    });

    it('should configure SPL Token and Associated Token Program IDs', () => {
      // Invariant: Only classic SPL Token program is authorized for V1 (Token-2022 rejected)
      expect(TOKEN_PROGRAM_ID.toString()).toBe(
        'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
      );
      expect(ASSOCIATED_TOKEN_PROGRAM_ID.toString()).toBe(
        'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
      );
    });
  });

  describe('B. Squads v4 Deterministic PDA Derivation (@spec SPEC-015-SQUADS-PDA-DERIVATION)', () => {
    it('should derive exact Devnet Multisig and Vault PDAs from real create_key', async () => {
      // Threat Model: Attacker attempts to forge a fake Vault PDA to hijack treasury claims.
      // Defense: Re-derivation using canonical seeds [multisig, multisig, create_key] + [multisig, pda, vault, index].

      // Arrange — On-chain verified values from Devnet Authority Manifest (Slot ~485810685)
      const realCreateKey = 'AZGhDBuomd6cRf1LZoUNfk4fWn6HpoZjmp8dzZibZK7c';
      const expectedMultisigPda = 'rVKwqnxyq2RuU4sTBdXhifrZB9oY9mGoqw5oA6EHKaD';
      const expectedVaultPda = 'D9i1XNftRpB68WTYrpCau5fEYYS2eiJa8Q738N5idSXB'; // Vault Index 0

      // Act — Derive PDAs deterministically using @solana/kit
      const pdas = await deriveSquadsPdasFromCreateKey(realCreateKey, 0n, 0);

      // Assert — Verifies cryptographic derivation matches on-chain state exactly
      expect(pdas.squadsMultisigPda).toBe(expectedMultisigPda);
      expect(pdas.squadsVaultPda).toBe(expectedVaultPda);
    });

    it('should derive deterministic Proposal and Batch PDAs with transactionIndex', async () => {
      // Threat Model: State confusion between different distribution proposal runs.
      // Defense: Proposal PDAs include Little-Endian u64 transaction_index in seed.

      // Arrange
      const realCreateKey = 'AZGhDBuomd6cRf1LZoUNfk4fWn6HpoZjmp8dzZibZK7c';

      // Act — Derive PDAs for consecutive transaction indices (tx 1 vs tx 2)
      const pdasTx1 = await deriveSquadsPdasFromCreateKey(realCreateKey, 1n, 0);
      const pdasTx2 = await deriveSquadsPdasFromCreateKey(realCreateKey, 2n, 0);

      // Assert — Proposals must be distinct while belonging to the identical multisig
      expect(pdasTx1.proposalPda).not.toBe(pdasTx2.proposalPda);
      expect(pdasTx1.batchPda).not.toBe(pdasTx2.batchPda);
      expect(pdasTx1.squadsMultisigPda).toBe(pdasTx2.squadsMultisigPda);
    });
  });

  describe('C. Fail-Closed Error Protocol (@spec SPEC-015-FAIL-CLOSED)', () => {
    it('should throw explicit error for invalid create_key (fail closed, NO dummy string fallback)', async () => {
      // Threat Model: Attacker passes garbage input hoping the adapter returns a fallback string that bypasses checks.
      // Defense: Strict fail-closed protocol — throw immediately on invalid address.

      // Arrange
      const invalidCreateKey = 'not-a-valid-solana-pubkey!!!';

      // Act & Assert — Must reject with typed error, NEVER return fallback template string
      await expect(
        deriveSquadsPdasFromCreateKey(invalidCreateKey, 1n, 0)
      ).rejects.toThrow(/(invalid|address|base58)/i);
    });

    it('should throw explicit error for invalid wallet address in deriveAssociatedTokenAddress', async () => {
      // Threat Model: Attacker passes invalid recipient address causing silent fallback.
      // Defense: Fail-closed ATA derivation.

      // Arrange
      const invalidWallet = 'invalid-wallet-address';
      const validMint = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

      // Act & Assert
      await expect(
        deriveAssociatedTokenAddress(invalidWallet, validMint)
      ).rejects.toThrow(/(invalid|address|base58)/i);
    });
  });
});

