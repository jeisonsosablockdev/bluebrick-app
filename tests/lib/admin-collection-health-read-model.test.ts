import { describe, expect, it } from "vitest";

import {
  buildAdminCollectionHealthCta,
  COLLECTION_HEALTH_V1_STATES,
  getAdminCollectionHealthPriority,
  isAdminCollectionHealthState
} from "@/lib/admin/collection-health-read-model";

describe("lib/admin/collection-health-read-model", () => {
  it("locks the approved v1 health vocabulary", () => {
    expect(COLLECTION_HEALTH_V1_STATES).toEqual([
      "missing_snapshot",
      "inconsistent",
      "bootstrap_failed",
      "manual_review_required"
    ]);
    expect(COLLECTION_HEALTH_V1_STATES).not.toContain("orphaned_uploads_detected");
  });

  it("exposes a type guard for supported health states", () => {
    expect(isAdminCollectionHealthState("missing_snapshot")).toBe(true);
    expect(isAdminCollectionHealthState("manual_review_required")).toBe(true);
    expect(isAdminCollectionHealthState("orphaned_uploads_detected")).toBe(false);
  });

  it("keeps the severity priority stable for downstream dedupe rules", () => {
    expect(getAdminCollectionHealthPriority("missing_snapshot")).toBeLessThan(
      getAdminCollectionHealthPriority("inconsistent")
    );
    expect(getAdminCollectionHealthPriority("bootstrap_failed")).toBeLessThan(
      getAdminCollectionHealthPriority("manual_review_required")
    );
  });

  it("builds the collection-context CTA only when an entry id exists", () => {
    expect(buildAdminCollectionHealthCta(" entry-123 ")).toEqual({
      href: "/admin/collections/entry-123",
      label: "View collection context"
    });
    expect(buildAdminCollectionHealthCta("   ")).toBeNull();
  });
});
