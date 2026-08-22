import { describe, it, expect } from "vitest";
import crypto from "node:crypto";

/**
 * =========================================================================================
 * 🧪 SPEC-01 (STORY-015-04): CRON MONITORS & CLAIM CANCELLATION CONTRACT TESTS (RED Phase)
 * =========================================================================================
 * 
 * Tests the domain invariants for:
 * 1. Constant-time timing-safe `CRON_SECRET` verification.
 * 2. 48-hour claim request expiration monitor.
 * 3. 12-month compliance retention TTL monitor.
 * 4. User-initiated claim cancellation with ownership and state guards.
 * 5. Reentrant idempotency for cron execution.
 */

export type ClaimState = "UNCLAIMED" | "CLAIM_REQUESTED" | "EXECUTED" | "EXPIRED" | "CANCELED" | "RETAINED_COMPLIANCE";

export type DistributionClaimEntity = {
  id: string;
  runId: string;
  holderWallet: string;
  effectiveWallet: string;
  amountUsdc: number;
  status: ClaimState;
  requestedAt: string | null;
  executedAt: string | null;
  canceledAt: string | null;
  expiredAt: string | null;
  retainedAt: string | null;
  updatedAt: string;
};

/**
 * Validates CRON_SECRET using timing-safe comparison.
 * What: Authenticates cron requests.
 * How: Compares bearer authorization header with server secret using crypto.timingSafeEqual.
 */
export function verifyCronAuthorization(authHeader: string | null | undefined, expectedSecret: string): boolean {
  if (!authHeader || !expectedSecret) return false;
  if (!authHeader.startsWith("Bearer ")) return false;

  const token = authHeader.slice(7).trim();
  if (token.length !== expectedSecret.length) return false;

  const a = Buffer.from(token);
  const b = Buffer.from(expectedSecret);
  return crypto.timingSafeEqual(a, b);
}

/**
 * Evaluates claims expiration for entries older than 48 hours.
 * What: Expires stale claim requests.
 * How: Filters claims in CLAIM_REQUESTED status where (now - requestedAt) > 48 hours.
 */
export function processClaimsExpiry(
  claims: DistributionClaimEntity[],
  nowIso: string,
  cutoffHours = 48
): { updatedClaims: DistributionClaimEntity[]; expiredCount: number } {
  const nowMs = new Date(nowIso).getTime();
  const cutoffMs = cutoffHours * 60 * 60 * 1000;
  let expiredCount = 0;

  const updatedClaims = claims.map((claim) => {
    if (claim.status === "CLAIM_REQUESTED" && claim.requestedAt) {
      const requestedMs = new Date(claim.requestedAt).getTime();
      if (nowMs - requestedMs >= cutoffMs) {
        expiredCount++;
        return {
          ...claim,
          status: "EXPIRED" as const,
          expiredAt: nowIso,
          updatedAt: nowIso
        };
      }
    }
    return claim;
  });

  return { updatedClaims, expiredCount };
}

/**
 * Evaluates compliance TTL retention for unclaimed funds older than 12 months.
 * What: Retains long-unclaimed yields for compliance review.
 * How: Filters claims in UNCLAIMED status where age >= 365 days.
 */
export function processComplianceTtl(
  claims: DistributionClaimEntity[],
  nowIso: string,
  cutoffDays = 365
): { updatedClaims: DistributionClaimEntity[]; retainedCount: number } {
  const nowMs = new Date(nowIso).getTime();
  const cutoffMs = cutoffDays * 24 * 60 * 60 * 1000;
  let retainedCount = 0;

  const updatedClaims = claims.map((claim) => {
    if (claim.status === "UNCLAIMED") {
      const createdMs = new Date(claim.updatedAt).getTime();
      if (nowMs - createdMs >= cutoffMs) {
        retainedCount++;
        return {
          ...claim,
          status: "RETAINED_COMPLIANCE" as const,
          retainedAt: nowIso,
          updatedAt: nowIso
        };
      }
    }
    return claim;
  });

  return { updatedClaims, retainedCount };
}

/**
 * Cancels a user claim request.
 * What: Allows user to cancel pending claim request.
 * How: Validates ownership and enforces that only CLAIM_REQUESTED claims can be cancelled.
 */
export function cancelClaimRequest(
  claim: DistributionClaimEntity,
  requesterWallet: string,
  nowIso: string
): DistributionClaimEntity {
  // Step 1: Validate ownership
  if (claim.holderWallet !== requesterWallet && claim.effectiveWallet !== requesterWallet) {
    throw new Error("ERR_FORBIDDEN_OWNERSHIP: You do not own this claim request.");
  }

  // Step 2: Validate claim state (only CLAIM_REQUESTED can be cancelled)
  if (claim.status !== "CLAIM_REQUESTED") {
    throw new Error(`ERR_INVALID_CLAIM_STATE: Cannot cancel claim in state ${claim.status}.`);
  }

  return {
    ...claim,
    status: "CANCELED",
    canceledAt: nowIso,
    updatedAt: nowIso
  };
}

describe("SPEC-01 (STORY-015-04): Cron Monitors & Claim Cancellation Contracts", () => {
  const serverSecret = "secret-cron-token-1234567890-abcdef";
  const userWallet = "3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd";

  describe("Timing-safe Cron Authorization", () => {
    it("should accept valid bearer token matching server secret", () => {
      const isValid = verifyCronAuthorization(`Bearer ${serverSecret}`, serverSecret);
      expect(isValid).toBe(true);
    });

    it("should reject missing or malformed authorization header", () => {
      expect(verifyCronAuthorization(null, serverSecret)).toBe(false);
      expect(verifyCronAuthorization("Basic 123", serverSecret)).toBe(false);
      expect(verifyCronAuthorization("Bearer wrong-secret", serverSecret)).toBe(false);
    });
  });

  describe("Claims 48h Expiry Cronjob", () => {
    it("should transition CLAIM_REQUESTED claims older than 48 hours to EXPIRED", () => {
      const now = new Date("2026-08-21T12:00:00Z");
      const staleRequestedAt = new Date("2026-08-19T10:00:00Z").toISOString(); // 50 hours ago
      const recentRequestedAt = new Date("2026-08-21T06:00:00Z").toISOString(); // 6 hours ago

      const mockClaims: DistributionClaimEntity[] = [
        {
          id: "claim-1",
          runId: "run-1",
          holderWallet: userWallet,
          effectiveWallet: userWallet,
          amountUsdc: 150.0,
          status: "CLAIM_REQUESTED",
          requestedAt: staleRequestedAt,
          executedAt: null,
          canceledAt: null,
          expiredAt: null,
          retainedAt: null,
          updatedAt: staleRequestedAt
        },
        {
          id: "claim-2",
          runId: "run-1",
          holderWallet: userWallet,
          effectiveWallet: userWallet,
          amountUsdc: 200.0,
          status: "CLAIM_REQUESTED",
          requestedAt: recentRequestedAt,
          executedAt: null,
          canceledAt: null,
          expiredAt: null,
          retainedAt: null,
          updatedAt: recentRequestedAt
        }
      ];

      const result = processClaimsExpiry(mockClaims, now.toISOString());
      expect(result.expiredCount).toBe(1);
      expect(result.updatedClaims[0].status).toBe("EXPIRED");
      expect(result.updatedClaims[0].expiredAt).toBe(now.toISOString());
      expect(result.updatedClaims[1].status).toBe("CLAIM_REQUESTED"); // Not expired
    });

    it("should be idempotent when re-invoked on already expired claims", () => {
      const now = new Date("2026-08-21T12:00:00Z").toISOString();
      const expiredClaim: DistributionClaimEntity = {
        id: "claim-1",
        runId: "run-1",
        holderWallet: userWallet,
        effectiveWallet: userWallet,
        amountUsdc: 150.0,
        status: "EXPIRED",
        requestedAt: "2026-08-19T10:00:00Z",
        executedAt: null,
        canceledAt: null,
        expiredAt: "2026-08-21T11:00:00Z",
        retainedAt: null,
        updatedAt: "2026-08-21T11:00:00Z"
      };

      const result = processClaimsExpiry([expiredClaim], now);
      expect(result.expiredCount).toBe(0);
      expect(result.updatedClaims[0].status).toBe("EXPIRED");
    });
  });

  describe("Compliance 12-Month Retention TTL Cronjob", () => {
    it("should transition UNCLAIMED funds older than 365 days to RETAINED_COMPLIANCE", () => {
      const now = new Date("2026-08-21T12:00:00Z");
      const oldDate = new Date("2025-07-01T00:00:00Z").toISOString(); // > 400 days ago
      const recentDate = new Date("2026-07-01T00:00:00Z").toISOString(); // < 60 days ago

      const mockClaims: DistributionClaimEntity[] = [
        {
          id: "claim-old",
          runId: "run-1",
          holderWallet: userWallet,
          effectiveWallet: userWallet,
          amountUsdc: 500.0,
          status: "UNCLAIMED",
          requestedAt: null,
          executedAt: null,
          canceledAt: null,
          expiredAt: null,
          retainedAt: null,
          updatedAt: oldDate
        },
        {
          id: "claim-recent",
          runId: "run-1",
          holderWallet: userWallet,
          effectiveWallet: userWallet,
          amountUsdc: 300.0,
          status: "UNCLAIMED",
          requestedAt: null,
          executedAt: null,
          canceledAt: null,
          expiredAt: null,
          retainedAt: null,
          updatedAt: recentDate
        }
      ];

      const result = processComplianceTtl(mockClaims, now.toISOString());
      expect(result.retainedCount).toBe(1);
      expect(result.updatedClaims[0].status).toBe("RETAINED_COMPLIANCE");
      expect(result.updatedClaims[0].retainedAt).toBe(now.toISOString());
      expect(result.updatedClaims[1].status).toBe("UNCLAIMED");
    });
  });

  describe("User Claim Cancellation Flow", () => {
    it("should cancel a CLAIM_REQUESTED claim when requested by owner", () => {
      const now = new Date().toISOString();
      const claim: DistributionClaimEntity = {
        id: "claim-123",
        runId: "run-1",
        holderWallet: userWallet,
        effectiveWallet: userWallet,
        amountUsdc: 250.0,
        status: "CLAIM_REQUESTED",
        requestedAt: now,
        executedAt: null,
        canceledAt: null,
        expiredAt: null,
        retainedAt: null,
        updatedAt: now
      };

      const canceled = cancelClaimRequest(claim, userWallet, now);
      expect(canceled.status).toBe("CANCELED");
      expect(canceled.canceledAt).toBe(now);
    });

    it("should reject cancellation if requester is not the claim owner", () => {
      const now = new Date().toISOString();
      const claim: DistributionClaimEntity = {
        id: "claim-123",
        runId: "run-1",
        holderWallet: userWallet,
        effectiveWallet: userWallet,
        amountUsdc: 250.0,
        status: "CLAIM_REQUESTED",
        requestedAt: now,
        executedAt: null,
        canceledAt: null,
        expiredAt: null,
        retainedAt: null,
        updatedAt: now
      };

      expect(() =>
        cancelClaimRequest(claim, "AnotherWalletAddress1234567890123456789", now)
      ).toThrowError("ERR_FORBIDDEN_OWNERSHIP");
    });

    it("should reject cancellation if claim is already EXECUTED", () => {
      const now = new Date().toISOString();
      const claim: DistributionClaimEntity = {
        id: "claim-123",
        runId: "run-1",
        holderWallet: userWallet,
        effectiveWallet: userWallet,
        amountUsdc: 250.0,
        status: "EXECUTED",
        requestedAt: now,
        executedAt: now,
        canceledAt: null,
        expiredAt: null,
        retainedAt: null,
        updatedAt: now
      };

      expect(() =>
        cancelClaimRequest(claim, userWallet, now)
      ).toThrowError("ERR_INVALID_CLAIM_STATE");
    });
  });
});
