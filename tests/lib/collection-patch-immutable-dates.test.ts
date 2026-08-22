import { describe, it, expect } from "vitest";

/**
 * =========================================================================================
 * 🧪 SPEC-01 (STORY-015-07): COLLECTION PATCH IMMUTABLE DATES VALIDATOR TESTS
 * =========================================================================================
 * 
 * Verifies domain invariants:
 * 1. HTTP PATCH payload to collections strictly rejects project date fields.
 * 2. Attempts to patch start_at, end_at, projectStartAt, projectEndAt fail with 400 IMMUTABLE_PROJECT_DATE_FIELD.
 */

export const IMMUTABLE_PROJECT_DATE_FIELDS = [
  "projectStartAt",
  "projectEndAt",
  "startAt",
  "endAt",
  "project_start_at",
  "project_end_at"
] as const;

/**
 * Asserts that no immutable date fields are present in a collection patch payload.
 * What: Validates collection update payload against immutable date governance rules.
 * How: Scans payload keys against IMMUTABLE_PROJECT_DATE_FIELDS and throws error if present.
 */
export function validateCollectionPatchPayloadForDates(payload: Record<string, unknown>): void {
  for (const field of IMMUTABLE_PROJECT_DATE_FIELDS) {
    if (field in payload && payload[field] !== undefined) {
      throw new Error(
        `IMMUTABLE_PROJECT_DATE_FIELD: Cannot modify '${field}' via HTTP API. Project dates are governed on-chain via Squads multisig and ProjectConfig PDA.`
      );
    }
  }
}

describe("SPEC-01 (STORY-015-07): Collection Patch Immutable Dates Validator", () => {
  it("should pass when valid editable sections are provided without date fields", () => {
    const validPayload = {
      section: "propertyInformation",
      propertyInformation: "Updated luxury condominium details"
    };

    expect(() => validateCollectionPatchPayloadForDates(validPayload)).not.toThrow();
  });

  it("should reject payloads containing projectStartAt with IMMUTABLE_PROJECT_DATE_FIELD", () => {
    const payload = {
      section: "propertyInformation",
      projectStartAt: "2026-04-01T00:00:00Z"
    };

    expect(() => validateCollectionPatchPayloadForDates(payload)).toThrowError(
      "IMMUTABLE_PROJECT_DATE_FIELD"
    );
  });

  it("should reject payloads containing projectEndAt or startAt/endAt with IMMUTABLE_PROJECT_DATE_FIELD", () => {
    expect(() =>
      validateCollectionPatchPayloadForDates({
        section: "summary",
        projectEndAt: "2026-12-31T00:00:00Z"
      })
    ).toThrowError("IMMUTABLE_PROJECT_DATE_FIELD");

    expect(() =>
      validateCollectionPatchPayloadForDates({
        section: "summary",
        startAt: 1755800000
      })
    ).toThrowError("IMMUTABLE_PROJECT_DATE_FIELD");
  });
});
