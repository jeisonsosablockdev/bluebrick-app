import { describe, it, expect } from "vitest";

import {
  assertNoImmutableDateFieldsInPatchPayload,
  IMMUTABLE_PROJECT_DATE_FIELDS
} from "@/features/admin/domain/collection-patch-validator";
import {
  parseAdminCollectionPatchPayload,
  AdminCollectionPatchPayloadError
} from "@/lib/admin/collection-patch-payload";

/**
 * =========================================================================================
 * 🧪 SPEC-02 (STORY-015-07): COLLECTION PATCH IMMUTABLE DATES VALIDATOR TESTS
 * =========================================================================================
 * 
 * Verifies domain invariants:
 * 1. HTTP PATCH payload to collections strictly rejects project date fields.
 * 2. parseAdminCollectionPatchPayload throws IMMUTABLE_PROJECT_DATE_FIELD.
 */

describe("SPEC-02 (STORY-015-07): Collection Patch Immutable Dates Validator", () => {
  it("should declare all 6 canonical immutable project date field names", () => {
    expect(IMMUTABLE_PROJECT_DATE_FIELDS).toContain("projectStartAt");
    expect(IMMUTABLE_PROJECT_DATE_FIELDS).toContain("projectEndAt");
    expect(IMMUTABLE_PROJECT_DATE_FIELDS).toContain("startAt");
    expect(IMMUTABLE_PROJECT_DATE_FIELDS).toContain("endAt");
    expect(IMMUTABLE_PROJECT_DATE_FIELDS).toContain("project_start_at");
    expect(IMMUTABLE_PROJECT_DATE_FIELDS).toContain("project_end_at");
  });

  it("should pass when valid editable sections are provided without date fields", () => {
    const validPayload = {
      section: "propertyInformation",
      data: {
        propertyInformation: "Updated luxury condominium details"
      }
    };

    const parsed = parseAdminCollectionPatchPayload(validPayload);
    expect(parsed.section).toBe("propertyInformation");
    expect(parsed.propertyInformation).toBe("Updated luxury condominium details");
  });

  it("should reject payloads containing top-level projectStartAt with IMMUTABLE_PROJECT_DATE_FIELD", () => {
    const payload = {
      section: "propertyInformation",
      projectStartAt: "2026-04-01T00:00:00Z",
      data: {
        propertyInformation: "Some text"
      }
    };

    expect(() => parseAdminCollectionPatchPayload(payload)).toThrowError(
      AdminCollectionPatchPayloadError
    );

    try {
      parseAdminCollectionPatchPayload(payload);
    } catch (err: any) {
      expect(err.code).toBe("IMMUTABLE_PROJECT_DATE_FIELD");
    }
  });

  it("should reject payloads containing nested projectEndAt inside data with IMMUTABLE_PROJECT_DATE_FIELD", () => {
    const payload = {
      section: "summary",
      data: {
        fractionalInvestmentSummary: "Summary text",
        projectEndAt: "2026-12-31T00:00:00Z"
      }
    };

    try {
      parseAdminCollectionPatchPayload(payload);
      expect.unreachable("Should have thrown error");
    } catch (err: any) {
      expect(err.code).toBe("IMMUTABLE_PROJECT_DATE_FIELD");
    }
  });
});
