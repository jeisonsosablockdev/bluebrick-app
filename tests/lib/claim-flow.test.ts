import { describe, expect, it } from "vitest";

import { ClaimFlowError } from "@/lib/claims/claim-flow";

describe("lib/claims/claim-flow", () => {
  it("creates ClaimFlowError with correct error code and message", () => {
    const error = new ClaimFlowError("QUOTE_EXPIRED", "Claim quote has expired (48-hour TTL exceeded).");
    expect(error.code).toBe("QUOTE_EXPIRED");
    expect(error.message).toBe("Claim quote has expired (48-hour TTL exceeded).");
  });
});
