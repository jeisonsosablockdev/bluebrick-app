/**
 * ============================================================================
 * Layer 3: Domain - Human-in-the-Loop (HITL) RBAC Permission Policy
 * ============================================================================
 * Purpose: Defines domain authorization policies, role boundaries, and invariant
 * checks for manual human review and promotion of ingested records.
 * Invariants:
 *  - Only ADMIN or COMPLIANCE roles are authorized to perform HITL review decisions.
 *  - Pure domain function with zero side-effects and zero framework dependencies.
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

/**
 * Allowed roles for HITL review decisions.
 */
export const HITL_ALLOWED_ROLES = ['ADMIN', 'COMPLIANCE'] as const;
export type HitlAllowedRole = (typeof HITL_ALLOWED_ROLES)[number];

/**
 * Verifies whether a given user role possesses HITL review permissions.
 *
 * @param userRole - Role string associated with current user session.
 * @returns boolean indicating if user is authorized.
 */
export function verifyHitlPermission(userRole: string): boolean {
  return HITL_ALLOWED_ROLES.includes(userRole as HitlAllowedRole);
}
