/**
 * =========================================================================================
 * Test Suite: SPEC-10 (BRI-8) — Cryptographic Proposal Hashing & Invariant Verification
 * File: tests/features/admin/squads-proposal-crypto.test.ts
 *
 * Layer: Layer 3 (Domain) & Layer 4 (Infrastructure) Verification
 * Scope: Pure cryptographic hash calculation, deterministic canonicalization,
 *        tampering detection, and on-chain vote memo formatting.
 *
 * Invariants Tested:
 * 1. Determinism: Identical inputs strictly produce identical 64-char hex SHA-256 digests.
 * 2. Avalanche Effect: Changing any parameter (timestamps, address, justification) alters hash.
 * 3. Tamper Resistance: verifyProposalIntegrity returns valid: false when payload is mutated.
 * 4. Memo Formatting: formatOnChainVoteMemo produces canonical Solana Memo Program v2 payload.
 *
 * @spec BRI-8 (SPEC-10)
 * =========================================================================================
 */

import { describe, expect, it } from "vitest";

import {
  computeProposalPayloadHash,
  formatOnChainVoteMemo,
  verifyProposalIntegrity,
  type ProposalSealPayload
} from "@/features/admin/domain/squads-proposal-crypto";

describe("SPEC-10 (BRI-8): Cryptographic Proposal Sealing & Integrity Verification", () => {
  const CANONICAL_PAYLOAD: ProposalSealPayload = {
    collectionAddress: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    proposedStartAt: "2026-04-01T00:00:00.000Z",
    proposedEndAt: "2028-12-31T23:59:59.000Z",
    justification: "Ajuste de cronograma de obra y licencias ambientales autorizadas.",
    nonce: "NONCE-2026-08-22-001"
  };

  describe("A. Deterministic SHA-256 Proposal Hash Calculation", () => {
    it("should compute a valid 64-character lowercase hex SHA-256 hash", () => {
      // Arrange & Act
      const hash = computeProposalPayloadHash(CANONICAL_PAYLOAD);

      // Assert
      expect(hash).toBeDefined();
      expect(typeof hash).toBe("string");
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it("should produce identical hash for identical payload across separate calls (Idempotency)", () => {
      // Arrange & Act
      const hash1 = computeProposalPayloadHash(CANONICAL_PAYLOAD);
      const hash2 = computeProposalPayloadHash({ ...CANONICAL_PAYLOAD });

      // Assert
      expect(hash1).toBe(hash2);
    });

    it("should produce different hash if proposedStartAt is modified by 1 second (Avalanche Effect)", () => {
      // Arrange
      const tamperedPayload: ProposalSealPayload = {
        ...CANONICAL_PAYLOAD,
        proposedStartAt: "2026-04-01T00:00:01.000Z"
      };

      // Act
      const originalHash = computeProposalPayloadHash(CANONICAL_PAYLOAD);
      const tamperedHash = computeProposalPayloadHash(tamperedPayload);

      // Assert
      expect(originalHash).not.toBe(tamperedHash);
    });

    it("should produce different hash if proposedEndAt is modified", () => {
      // Arrange
      const tamperedPayload: ProposalSealPayload = {
        ...CANONICAL_PAYLOAD,
        proposedEndAt: "2029-01-01T00:00:00.000Z"
      };

      // Act
      const originalHash = computeProposalPayloadHash(CANONICAL_PAYLOAD);
      const tamperedHash = computeProposalPayloadHash(tamperedPayload);

      // Assert
      expect(originalHash).not.toBe(tamperedHash);
    });

    it("should produce different hash if justification text is tampered with", () => {
      // Arrange
      const tamperedPayload: ProposalSealPayload = {
        ...CANONICAL_PAYLOAD,
        justification: "Justificación alterada maliciosamente."
      };

      // Act
      const originalHash = computeProposalPayloadHash(CANONICAL_PAYLOAD);
      const tamperedHash = computeProposalPayloadHash(tamperedPayload);

      // Assert
      expect(originalHash).not.toBe(tamperedHash);
    });
  });

  describe("B. Proposal Integrity Verification", () => {
    it("should return valid: true when payload matches expected hash", () => {
      // Arrange
      const hash = computeProposalPayloadHash(CANONICAL_PAYLOAD);

      // Act
      const result = verifyProposalIntegrity(CANONICAL_PAYLOAD, hash);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.reason).toBeNull();
    });

    it("should return valid: false when payload has been tampered with", () => {
      // Arrange
      const legitimateHash = computeProposalPayloadHash(CANONICAL_PAYLOAD);
      const tamperedPayload: ProposalSealPayload = {
        ...CANONICAL_PAYLOAD,
        proposedStartAt: "2026-01-01T00:00:00.000Z"
      };

      // Act
      const result = verifyProposalIntegrity(tamperedPayload, legitimateHash);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe("HASH_MISMATCH_TAMPERING_DETECTED");
      expect(result.computedHash).not.toBe(legitimateHash);
    });
  });

  describe("C. Canonical On-Chain Vote Memo Formatting", () => {
    it("should format valid on-chain vote memo payload with hash, timestamps and signer", () => {
      // Arrange
      const hash = computeProposalPayloadHash(CANONICAL_PAYLOAD);
      const proposalId = "fix-flip-brandon-117-666";
      const signerWallet = "3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd";
      const timestamp = 1787432390983;

      // Act
      const memoString = formatOnChainVoteMemo({
        proposalId,
        newStartAt: CANONICAL_PAYLOAD.proposedStartAt,
        newEndAt: CANONICAL_PAYLOAD.proposedEndAt,
        proposalHash: hash,
        signerWallet,
        timestamp
      });

      // Assert
      expect(memoString).toContain(`BRIDS_SQUADS_VOTE:${proposalId}`);
      expect(memoString).toContain(hash);
      expect(memoString).toContain(`SIGNER:${signerWallet}`);
      expect(memoString).toContain(String(timestamp));
      // Invariant: Solana Memo Program v2 payload should remain well under max byte limits (566 bytes)
      expect(Buffer.byteLength(memoString, "utf-8")).toBeLessThan(250);
    });
  });
});