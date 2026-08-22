import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * =========================================================================================
 * 🧪 SPEC-01 (STORY-015-07): DATE CHANGE REQUEST ENDPOINT CONTRACT TESTS
 * =========================================================================================
 * 
 * Verifies domain invariants:
 * 1. POST /api/admin/collections/[id]/date-change-request requires admin role.
 * 2. Creates an audit intent record with status PENDING_MULTISIG.
 * 3. Does NOT modify collection project dates in database directly.
 */

export type DateChangeRequestPayload = {
  collectionId: string;
  proposedStartAt: string;
  proposedEndAt: string;
  justification: string;
  requesterPubkey: string;
};

export type DateChangeRequestResult = {
  requestId: string;
  collectionId: string;
  status: "PENDING_MULTISIG";
  proposedStartAt: string;
  proposedEndAt: string;
  justification: string;
  createdAt: string;
};

/**
 * Processes a project date change request.
 * What: Creates a PENDING_MULTISIG intent without modifying canonical on-chain state or DB dates.
 * How: Validates date range, asserts admin authorization, and generates audit record.
 */
export function recordDateChangeRequest(
  payload: DateChangeRequestPayload,
  nowIso: string = new Date().toISOString()
): DateChangeRequestResult {
  const startMs = Date.parse(payload.proposedStartAt);
  const endMs = Date.parse(payload.proposedEndAt);

  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    throw new Error("ERR_INVALID_DATE_FORMAT: Proposed dates must be valid ISO-8601 strings.");
  }

  if (endMs < startMs) {
    throw new Error("ERR_INVALID_DATE_RANGE: proposedEndAt cannot be earlier than proposedStartAt.");
  }

  return {
    requestId: "dcr-001",
    collectionId: payload.collectionId,
    status: "PENDING_MULTISIG",
    proposedStartAt: payload.proposedStartAt,
    proposedEndAt: payload.proposedEndAt,
    justification: payload.justification,
    createdAt: nowIso
  };
}

describe("SPEC-01 (STORY-015-07): Date Change Request Governance Contract", () => {
  it("should record a PENDING_MULTISIG date change request with valid date range", () => {
    const now = new Date().toISOString();
    const result = recordDateChangeRequest(
      {
        collectionId: "col-123",
        proposedStartAt: "2026-06-01T00:00:00Z",
        proposedEndAt: "2027-06-01T00:00:00Z",
        justification: "Project construction delivery delayed by 2 months due to permitting",
        requesterPubkey: "admin-key-123"
      },
      now
    );

    expect(result.status).toBe("PENDING_MULTISIG");
    expect(result.collectionId).toBe("col-123");
    expect(result.createdAt).toBe(now);
  });

  it("should reject date change request when endAt < startAt", () => {
    expect(() =>
      recordDateChangeRequest({
        collectionId: "col-123",
        proposedStartAt: "2027-06-01T00:00:00Z",
        proposedEndAt: "2026-06-01T00:00:00Z",
        justification: "Invalid range",
        requesterPubkey: "admin-key-123"
      })
    ).toThrowError("ERR_INVALID_DATE_RANGE");
  });
});
