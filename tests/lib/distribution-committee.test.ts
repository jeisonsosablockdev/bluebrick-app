import { describe, expect, it } from "vitest";

import {
  InvalidStateTransitionError
} from "@/lib/distribution/state-machine";

describe("lib/distribution/state-machine", () => {
  it("creates InvalidStateTransitionError with correct code and message", () => {
    const error = new InvalidStateTransitionError("draft", "APPROVE_DISPERSION");
    expect(error.code).toBe("INVALID_STATE_TRANSITION");
    expect(error.message).toBe("Cannot execute action APPROVE_DISPERSION from status draft.");
  });
});
