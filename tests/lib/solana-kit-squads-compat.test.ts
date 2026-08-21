import { describe, it, expect } from 'vitest';
import {
  SQUADS_V4_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  deriveSquadsPdasFromCreateKey,
  deriveAssociatedTokenAddress,
} from '../../apps/web/src/lib/solana-kit/compat/squads';

/**
 * SPEC-02 TDD Suite — Squads v4 SDK Compat Wrapper & Deterministic PDA Derivation
 * 
 * @spec EPIC-015-SOLUTION-ARCHITECTURE §Authority Manifest Devnet V1
 * @spec STORY-015-01-SPEC-02
 */
describe('SPEC-02 Squads v4 SDK Compat Wrapper (@spec SPEC-015-SQUADS-SDK-V4)', () => {
  describe('A. Program IDs & Constants (@spec SPEC-015-SQUADS-CONSTANTS)', () => {
    it('should configure canonical Squads v4 Program ID (SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf)', () => {
      expect(SQUADS_V4_PROGRAM_ID.toString()).toBe(
        'SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf'
      );
    });

    it('should configure SPL Token and Associated Token Program IDs', () => {
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
      // Arrange — On-chain verified values from Devnet Authority Manifest
      const realCreateKey = 'AZGhDBuomd6cRf1LZoUNfk4fWn6HpoZjmp8dzZibZK7c';
      const expectedMultisigPda = 'rVKwqnxyq2RuU4sTBdXhifrZB9oY9mGoqw5oA6EHKaD';
      const expectedVaultPda = 'D9i1XNftRpB68WTYrpCau5fEYYS2eiJa8Q738N5idSXB'; // Index 0

      // Act
      const pdas = await deriveSquadsPdasFromCreateKey(realCreateKey, 0n, 0);

      // Assert
      expect(pdas.squadsMultisigPda).toBe(expectedMultisigPda);
      expect(pdas.squadsVaultPda).toBe(expectedVaultPda);
    });

    it('should derive deterministic Proposal and Batch PDAs with transactionIndex', async () => {
      // Arrange
      const realCreateKey = 'AZGhDBuomd6cRf1LZoUNfk4fWn6HpoZjmp8dzZibZK7c';

      // Act
      const pdasTx1 = await deriveSquadsPdasFromCreateKey(realCreateKey, 1n, 0);
      const pdasTx2 = await deriveSquadsPdasFromCreateKey(realCreateKey, 2n, 0);

      // Assert — Proposal and Batch PDAs must be valid base58 strings and differ per tx index
      expect(pdasTx1.proposalPda).not.toBe(pdasTx2.proposalPda);
      expect(pdasTx1.batchPda).not.toBe(pdasTx2.batchPda);
      expect(pdasTx1.squadsMultisigPda).toBe(pdasTx2.squadsMultisigPda); // Same multisig
    });
  });

  describe('C. Fail-Closed Error Protocol (@spec SPEC-015-FAIL-CLOSED)', () => {
    it('should throw explicit error for invalid create_key (fail closed, NO dummy string fallback)', async () => {
      // Arrange
      const invalidCreateKey = 'not-a-valid-solana-pubkey!!!';

      // Act & Assert — Must throw typed error, NEVER return "not-a-valid-solana-pubkey!!!_multisig"
      await expect(
        deriveSquadsPdasFromCreateKey(invalidCreateKey, 1n, 0)
      ).rejects.toThrow(/(invalid|address|base58)/i);
    });

    it('should throw explicit error for invalid wallet address in deriveAssociatedTokenAddress', async () => {
      // Arrange
      const invalidWallet = 'invalid-wallet-address';
      const validMint = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

      // Act & Assert — Must throw, NEVER return "invalid-wallet-address_ata_4zMMC9sr"
      await expect(
        deriveAssociatedTokenAddress(invalidWallet, validMint)
      ).rejects.toThrow(/(invalid|address|base58)/i);
    });
  });
});
