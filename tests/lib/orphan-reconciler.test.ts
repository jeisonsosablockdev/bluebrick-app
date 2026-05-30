import { describe, expect, it } from "vitest";

import { parseReconcileInput } from "@/lib/asset-uploads/orphan-reconciler";

describe("lib/asset-uploads/orphan-reconciler", () => {
  it("defaults to dryRun=true and safe limits", () => {
    const result = parseReconcileInput({});

    expect(result.dryRun).toBe(true);
    expect(result.temporaryRetentionDays).toBe(7);
    expect(result.abandonedRetentionDays).toBe(15);
    expect(result.limit).toBeGreaterThan(0);
  });

  it("normalizes user-provided values", () => {
    const result = parseReconcileInput({
      dryRun: false,
      temporaryRetentionDays: 4.9,
      abandonedRetentionDays: 60,
      limit: 99999
    });

    expect(result).toEqual({
      dryRun: false,
      temporaryRetentionDays: 4,
      abandonedRetentionDays: 60,
      limit: 500
    });
  });
});
