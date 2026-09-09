import { describe, it, expect } from 'vitest';
import {
  evaluateSyncCircuitBreaker,
  type EntityCountSnapshot,
} from '@/features/ai-ingestion/domain/policies/sync-circuit-breaker-policy';

describe('sync-circuit-breaker-policy', () => {
  const healthyBaseline: EntityCountSnapshot = {
    proyectos: 10,
    inversionistas: 50,
    inversiones: 80,
    fases: 120,
    oportunidades: 15,
  };

  it('allows sync when incoming counts are healthy and comparable', () => {
    const incoming: EntityCountSnapshot = {
      proyectos: 10,
      inversionistas: 52,
      inversiones: 80,
      fases: 120,
      oportunidades: 16,
    };

    const result = evaluateSyncCircuitBreaker(healthyBaseline, incoming);
    expect(result.allowed).toBe(true);
    expect(result.tripped).toBe(false);
    expect(result.violations).toHaveLength(0);
  });

  it('allows sync on initial seed when current DB has 0 rows', () => {
    const emptyDb: EntityCountSnapshot = {
      proyectos: 0,
      inversionistas: 0,
      inversiones: 0,
      fases: 0,
    };
    const incoming: EntityCountSnapshot = {
      proyectos: 5,
      inversionistas: 20,
      inversiones: 30,
      fases: 50,
    };

    const result = evaluateSyncCircuitBreaker(emptyDb, incoming);
    expect(result.allowed).toBe(true);
    expect(result.tripped).toBe(false);
  });

  it('trips circuit breaker when an essential sheet returns 0 rows (anti-wipe protection)', () => {
    const incomingCorrupted: EntityCountSnapshot = {
      proyectos: 0, // Zero projects!
      inversionistas: 50,
      inversiones: 80,
      fases: 120,
    };

    const result = evaluateSyncCircuitBreaker(healthyBaseline, incomingCorrupted);
    expect(result.allowed).toBe(false);
    expect(result.tripped).toBe(true);
    expect(result.reason).toContain("Anti-Wipe Circuit Breaker Tripped");
    expect(result.violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entityType: 'proyectos',
          currentDbCount: 10,
          incomingCount: 0,
          violationType: 'ZERO_ENTITY_WIPE',
        }),
      ])
    );
  });

  it('trips circuit breaker when entity count drops by >20% (relative drop ceiling)', () => {
    const incomingDropped: EntityCountSnapshot = {
      proyectos: 10,
      inversionistas: 35, // Dropped from 50 to 35 -> 30% drop (>20% threshold)
      inversiones: 80,
      fases: 120,
    };

    const result = evaluateSyncCircuitBreaker(healthyBaseline, incomingDropped, 0.20);
    expect(result.allowed).toBe(false);
    expect(result.tripped).toBe(true);
    expect(result.violations[0].entityType).toBe('inversionistas');
    expect(result.violations[0].dropPercentage).toBeCloseTo(0.30);
    expect(result.violations[0].violationType).toBe('EXCESSIVE_DROP_CEILING');
  });

  it('allows minor pruning within threshold (<=20% drop)', () => {
    const incomingMinorDrop: EntityCountSnapshot = {
      proyectos: 10,
      inversionistas: 45, // Dropped from 50 to 45 -> 10% drop (<= 20%)
      inversiones: 75,    // Dropped from 80 to 75 -> 6.25% drop
      fases: 120,
    };

    const result = evaluateSyncCircuitBreaker(healthyBaseline, incomingMinorDrop, 0.20);
    expect(result.allowed).toBe(true);
    expect(result.tripped).toBe(false);
    expect(result.violations).toHaveLength(0);
  });
});
