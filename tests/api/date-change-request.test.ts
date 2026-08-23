import { afterEach, afterAll, describe, it, expect } from "vitest";

import { POST } from "../../apps/web/src/app/api/admin/collections/[id]/date-change-request/route";
import { clearDateChangeProposals } from "../../apps/web/src/features/admin/infrastructure/date-change-proposal-store";

/**
 * =========================================================================================
 * 🧪 SPEC-04 (STORY-015-07): DATE CHANGE REQUEST ENDPOINT INTEGRATION TESTS
 * =========================================================================================
 * 
 * Verifies API route behavior:
 * 1. POST /api/admin/collections/[id]/date-change-request validates collectionId and body.
 * 2. Enforces proposedStartAt <= proposedEndAt with HTTP 400.
 * 3. Returns status PENDING_MULTISIG and does not alter database dates directly.
 */

describe("SPEC-04 (STORY-015-07): Date Change Request Route Handler", () => {
  afterEach(() => {
    clearDateChangeProposals();
  });

  afterAll(() => {
    clearDateChangeProposals();
  });
  it("should return 200 OK and PENDING_MULTISIG for valid date change proposal", async () => {
    const request = new Request("http://localhost:3000/api/admin/collections/col-123/date-change-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        proposedStartAt: "2026-06-01T00:00:00Z",
        proposedEndAt: "2027-06-01T00:00:00Z",
        justification: "Project construction delayed by 2 months"
      })
    });

    const response = await POST(request, { params: Promise.resolve({ id: "col-123" }) });
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("PENDING_MULTISIG");
    expect(body.data.collectionId).toBe("col-123");
    expect(body.data.proposedStartAt).toBe("2026-06-01T00:00:00Z");
  });

  it("should return 400 Bad Request when end date is before start date", async () => {
    const request = new Request("http://localhost:3000/api/admin/collections/col-123/date-change-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        proposedStartAt: "2027-06-01T00:00:00Z",
        proposedEndAt: "2026-06-01T00:00:00Z",
        justification: "Invalid inverted range"
      })
    });

    const response = await POST(request, { params: Promise.resolve({ id: "col-123" }) });
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("ERR_INVALID_DATE_RANGE");
  });

  it("should return 400 Bad Request when justification is too short or missing", async () => {
    const request = new Request("http://localhost:3000/api/admin/collections/col-123/date-change-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        proposedStartAt: "2026-06-01T00:00:00Z",
        proposedEndAt: "2027-06-01T00:00:00Z",
        justification: "abc"
      })
    });

    const response = await POST(request, { params: Promise.resolve({ id: "col-123" }) });
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("ERR_INVALID_REQUEST_BODY");
  });
});
