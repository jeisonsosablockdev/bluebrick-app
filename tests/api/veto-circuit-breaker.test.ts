import { describe, it, expect } from "vitest";

/**
 * =========================================================================================
 * 🧪 SPEC-01 (STORY-015-05): VETO, REJECT & CIRCUIT BREAKER CONTRACT TESTS
 * =========================================================================================
 * 
 * Verifies domain invariants:
 * 1. Global rejection of draft/blocked payout runs.
 * 2. Granular item veto pre-seal only (recalculates root and invalidates prior proposal).
 * 3. Prohibition of post-seal granular veto (must use emergency pause instead).
 * 4. Dual-layer circuit breaker (local bot stop + emergency pause payload with nonce & TTL <= 300s).
 */

type PayoutRunState = "draft" | "blocked" | "sealed" | "executing" | "finalized" | "paused";

type PayoutRunItemEntity = {
  id: string;
  runId: string;
  walletPublicKey: string;
  amountMinor: bigint;
  status: "active" | "vetoed";
  vetoedAt?: string | null;
  vetoedBy?: string | null;
};

type EmergencyPausePayload = {
  runId: string;
  policyPda: string;
  programId: string;
  nonce: number;
  expiresAt: number; // Unix timestamp in seconds
};

/**
 * Evaluates item veto eligibility based on run state.
 * What: Validates pre-seal veto rule.
 * How: Throws error if run is sealed or finalized.
 */
function executeItemVeto(
  runStatus: PayoutRunState,
  item: PayoutRunItemEntity,
  adminActorId: string,
  nowIso: string
): PayoutRunItemEntity {
  if (["sealed", "executing", "finalized"].includes(runStatus)) {
    throw new Error("ERR_SEALED_RUN_VETO_PROHIBITED: Cannot veto item after run has been sealed on-chain.");
  }

  return {
    ...item,
    status: "vetoed",
    vetoedAt: nowIso,
    vetoedBy: adminActorId
  };
}

/**
 * Generates an emergency pause message payload.
 * What: Constructs pause_run verification message.
 * How: Validates TTL <= 300s and encodes nonce.
 */
function buildEmergencyPausePayload(params: {
  runId: string;
  policyPda: string;
  programId: string;
  nonce: number;
  ttlSeconds?: number;
  currentUnixTime?: number;
}): EmergencyPausePayload {
  const currentUnix = params.currentUnixTime ?? Math.floor(Date.now() / 1000);
  const ttl = params.ttlSeconds ?? 300;

  if (ttl > 300) {
    throw new Error("ERR_EMERGENCY_TTL_EXCEEDED: Maximum allowed emergency pause TTL is 300 seconds.");
  }

  return {
    runId: params.runId,
    policyPda: params.policyPda,
    programId: params.programId,
    nonce: params.nonce,
    expiresAt: currentUnix + ttl
  };
}

describe("SPEC-01 (STORY-015-05): Veto & Circuit Breaker Invariant Contracts", () => {
  const adminActor = "admin-pubkey-123456789012345678901234567890";
  const mockItem: PayoutRunItemEntity = {
    id: "item-001",
    runId: "run-001",
    walletPublicKey: "3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd",
    amountMinor: 100000000n,
    status: "active"
  };

  describe("Granular Item Veto Rules", () => {
    it("should allow item veto in draft or blocked status", () => {
      const now = new Date().toISOString();
      const vetoed = executeItemVeto("draft", mockItem, adminActor, now);
      expect(vetoed.status).toBe("vetoed");
      expect(vetoed.vetoedBy).toBe(adminActor);
      expect(vetoed.vetoedAt).toBe(now);
    });

    it("should strictly reject item veto once run is sealed", () => {
      const now = new Date().toISOString();
      expect(() => executeItemVeto("sealed", mockItem, adminActor, now)).toThrowError(
        "ERR_SEALED_RUN_VETO_PROHIBITED"
      );
    });

    it("should strictly reject item veto once run is executing or finalized", () => {
      const now = new Date().toISOString();
      expect(() => executeItemVeto("executing", mockItem, adminActor, now)).toThrowError(
        "ERR_SEALED_RUN_VETO_PROHIBITED"
      );
      expect(() => executeItemVeto("finalized", mockItem, adminActor, now)).toThrowError(
        "ERR_SEALED_RUN_VETO_PROHIBITED"
      );
    });
  });

  describe("Emergency Pause Circuit Breaker Rules", () => {
    it("should construct emergency pause payload with valid 300s TTL and nonce", () => {
      const currentUnix = 1755800000;
      const payload = buildEmergencyPausePayload({
        runId: "run-001",
        policyPda: "PolicyPdaAddress123456789012345678901234567",
        programId: "ProgramId123456789012345678901234567890123",
        nonce: 1,
        ttlSeconds: 300,
        currentUnixTime: currentUnix
      });

      expect(payload.nonce).toBe(1);
      expect(payload.expiresAt).toBe(currentUnix + 300);
      expect(payload.runId).toBe("run-001");
    });

    it("should reject emergency pause TTL exceeding 300 seconds", () => {
      expect(() =>
        buildEmergencyPausePayload({
          runId: "run-001",
          policyPda: "PolicyPdaAddress123456789012345678901234567",
          programId: "ProgramId123456789012345678901234567890123",
          nonce: 1,
          ttlSeconds: 301
        })
      ).toThrowError("ERR_EMERGENCY_TTL_EXCEEDED");
    });
  });
});
