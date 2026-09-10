/**
 * ============================================================================
 * @file apps/web/src/features/ai-ingestion/domain/policies/sync-circuit-breaker-policy.ts
 * @description Layer 3: Domain - Synchronization Circuit Breaker & Anti-Wipe Safety Policy
 * ============================================================================
 * Purpose: Safeguards the production database against catastrophic table-wiping
 * cascades caused by corrupted spreadsheets, renamed worksheet tabs, zero-row
 * extractions, or massive unintentional entity deletions.
 *
 * Invariants:
 *  - Pure domain representation: Zero external network, I/O, or database dependencies.
 *  - Zero-row abortion: Any essential operational sheet returning 0 rows when DB has rows MUST trip.
 *  - Relative drop ceiling: Rejects deletions where incoming entity count drops by >20% compared to DB.
 *  - Immutable evaluation result DTOs with explanatory diagnostic reasons.
 *
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

/**
 * Entity counts snapshot across operational tables for comparison.
 */
export interface EntityCountSnapshot {
  readonly proyectos: number;
  readonly inversionistas: number;
  readonly inversiones: number;
  readonly fases: number;
  readonly oportunidades?: number;
  readonly transacciones?: number;
  readonly resumenes?: number;
}

/**
 * Result of circuit breaker evaluation.
 */
export interface CircuitBreakerEvaluationResult {
  readonly allowed: boolean;
  readonly tripped: boolean;
  readonly reason?: string;
  readonly violations: readonly CircuitBreakerViolation[];
}

/**
 * Detail of a specific table threshold violation.
 */
export interface CircuitBreakerViolation {
  readonly entityType: keyof EntityCountSnapshot;
  readonly currentDbCount: number;
  readonly incomingCount: number;
  readonly dropPercentage: number;
  readonly violationType: 'ZERO_ENTITY_WIPE' | 'EXCESSIVE_DROP_CEILING';
}

/**
 * Maximum allowable drop percentage before tripping circuit breaker (20%).
 */
export const DEFAULT_MAX_DROP_THRESHOLD_PCT = 0.20;

/**
 * Essential operational tables that must never drop to zero if existing data is present.
 */
export const ESSENTIAL_TABLES: readonly (keyof EntityCountSnapshot)[] = [
  'proyectos',
  'inversionistas',
  'inversiones',
  'fases',
];

/**
 * Evaluates entity counts against anti-wiping safety invariants.
 *
 * @param currentDbCounts - Existing entity counts currently in the database
 * @param incomingCounts - New entity counts parsed from the current workbook
 * @param maxDropThresholdPct - Configurable drop threshold (default: 0.20 / 20%)
 * @returns CircuitBreakerEvaluationResult indicating whether execution can proceed safely
 */
export function evaluateSyncCircuitBreaker(
  currentDbCounts: EntityCountSnapshot,
  incomingCounts: EntityCountSnapshot,
  maxDropThresholdPct = DEFAULT_MAX_DROP_THRESHOLD_PCT
): CircuitBreakerEvaluationResult {
  const violations: CircuitBreakerViolation[] = [];

  for (const tableKey of ESSENTIAL_TABLES) {
    const current = currentDbCounts[tableKey] ?? 0;
    const incoming = incomingCounts[tableKey] ?? 0;

    // Invariant 1: Anti-Wipe Protection
    // If database already contains records, incoming sheet MUST NOT be completely empty.
    if (current > 0 && incoming === 0) {
      violations.push({
        entityType: tableKey,
        currentDbCount: current,
        incomingCount: incoming,
        dropPercentage: 1.0,
        violationType: 'ZERO_ENTITY_WIPE',
      });
      continue;
    }

    // Invariant 2: Relative Drop Ceiling
    // Rejects any update where entity count contracts by more than the safety threshold (e.g. 20%)
    if (current > 0 && incoming < current) {
      const dropCount = current - incoming;
      const dropRatio = dropCount / current;

      if (dropRatio > maxDropThresholdPct) {
        violations.push({
          entityType: tableKey,
          currentDbCount: current,
          incomingCount: incoming,
          dropPercentage: Number(dropRatio.toFixed(4)),
          violationType: 'EXCESSIVE_DROP_CEILING',
        });
      }
    }
  }

  if (violations.length > 0) {
    const summaryReasons = violations.map((v) =>
      v.violationType === 'ZERO_ENTITY_WIPE'
        ? `Table '${v.entityType}' incoming count is 0 (current DB has ${v.currentDbCount})`
        : `Table '${v.entityType}' dropped by ${(v.dropPercentage * 100).toFixed(1)}% (from ${v.currentDbCount} to ${v.incomingCount}), exceeding ${maxDropThresholdPct * 100}% threshold`
    );

    return {
      allowed: false,
      tripped: true,
      reason: `Anti-Wipe Circuit Breaker Tripped: ${summaryReasons.join('; ')}`,
      violations,
    };
  }

  return {
    allowed: true,
    tripped: false,
    violations: [],
  };
}
