/**
 * =========================================================================================
 * Layer 3: Domain Layer — Collection Patch Validation Engine
 * Description: Pure domain validation rules for collection updates, enforcing date
 *              immutability and security boundaries.
 * Security Invariants:
 * - Zero external I/O: no database, RPC, or framework dependencies.
 * - Enforces IMMUTABLE_PROJECT_DATE_FIELDS to prevent bypassing on-chain notary governance.
 * =========================================================================================
 */

export const IMMUTABLE_PROJECT_DATE_FIELDS = [
  "projectStartAt",
  "projectEndAt",
  "startAt",
  "endAt",
  "project_start_at",
  "project_end_at"
] as const;

export class CollectionDateImmutabilityError extends Error {
  readonly code: "IMMUTABLE_PROJECT_DATE_FIELD";
  readonly status: 400;

  constructor(fieldName: string) {
    super(
      `Cannot modify '${fieldName}' via HTTP API. Project dates are immutable and governed on-chain via Squads multisig and ProjectConfig PDA.`
    );
    this.name = "CollectionDateImmutabilityError";
    this.code = "IMMUTABLE_PROJECT_DATE_FIELD";
    this.status = 400;
  }
}

/**
 * Asserts that no project date fields are present in a collection patch payload.
 * What: Validates payload against immutable date security invariant.
 * How: Iterates through IMMUTABLE_PROJECT_DATE_FIELDS and throws CollectionDateImmutabilityError if any are present.
 */
export function assertNoImmutableDateFieldsInPatchPayload(payload: Record<string, unknown>): void {
  for (const field of IMMUTABLE_PROJECT_DATE_FIELDS) {
    if (field in payload && payload[field] !== undefined) {
      throw new CollectionDateImmutabilityError(field);
    }
  }
}
