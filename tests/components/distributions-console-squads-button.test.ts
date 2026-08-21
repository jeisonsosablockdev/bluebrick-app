import { describe, it, expect } from 'vitest';

/**
 * =========================================================================================
 * 🧪 SPEC-02: DISTRIBUTIONS SQUADS BUTTON CONTRACT TESTS (RED Phase)
 * =========================================================================================
 * 
 * Tests the navigation contracts and parameter resolution for linking distribution runs
 * to the Squads v4 treasury console (/admin/treasury/squads?runId=...).
 */

export function buildSquadsProposalUrl(runId: string | null | undefined): string | null {
  if (!runId || runId.trim() === '') {
    return null;
  }
  return `/admin/treasury/squads?runId=${encodeURIComponent(runId.trim())}`;
}

export function isSquadsButtonVisible(runStatus: 'draft' | 'blocked' | 'finalized' | 'failed'): boolean {
  // Proposals in Squads can only be launched or inspected once the snapshot is drafted or finalized
  return runStatus === 'draft' || runStatus === 'finalized';
}

describe('SPEC-02: Distributions Squads Button Navigation Contracts', () => {
  it('should generate valid Squads proposal URL with encoded runId', () => {
    expect(buildSquadsProposalUrl('RUN-2026-08-TEST')).toBe('/admin/treasury/squads?runId=RUN-2026-08-TEST');
    expect(buildSquadsProposalUrl('run/with space/123')).toBe('/admin/treasury/squads?runId=run%2Fwith%20space%2F123');
    expect(buildSquadsProposalUrl('')).toBeNull();
    expect(buildSquadsProposalUrl(null)).toBeNull();
  });

  it('should enable Squads proposal action only for drafted and finalized runs', () => {
    expect(isSquadsButtonVisible('finalized')).toBe(true);
    expect(isSquadsButtonVisible('draft')).toBe(true);
    expect(isSquadsButtonVisible('blocked')).toBe(false);
    expect(isSquadsButtonVisible('failed')).toBe(false);
  });
});
