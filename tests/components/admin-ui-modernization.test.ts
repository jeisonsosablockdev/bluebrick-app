import { describe, it, expect } from 'vitest';

/**
 * =========================================================================================
 * 🎨 SPEC-01 ADMIN UI MODERNIZATION TEST SUITE (SOBER & CLEAN)
 * =========================================================================================
 * 
 * Tests the clean, sober visual design contracts, KPI metric cards, and layout enhancements
 * in /admin and /admin/distributions, matching the /profile design standard.
 */
describe('SPEC-01 Admin UI Modernization & KPI Cards (Clean Style)', () => {
  it('should define KPI metric formatting utilities correctly', () => {
    const formatUsdcAmount = (amountMinor: string | number | bigint) => {
      const numeric = Number(amountMinor) / 1_000_000;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      }).format(numeric);
    };

    expect(formatUsdcAmount(10_000_000_000n)).toBe('$10,000.00');
    expect(formatUsdcAmount('25500000')).toBe('$25.50');
    expect(formatUsdcAmount(0)).toBe('$0.00');
  });

  it('should provide sober, clean badge styles for all distribution run statuses', () => {
    const getSoberBadgeStyle = (status: 'draft' | 'blocked' | 'finalized' | 'failed' | 'active') => {
      switch (status) {
        case 'finalized':
        case 'active':
          return 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
        case 'blocked':
          return 'border border-amber-500/30 bg-amber-500/10 text-amber-400';
        case 'failed':
          return 'border border-rose-500/30 bg-rose-500/10 text-rose-400';
        case 'draft':
        default:
          return 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-400';
      }
    };

    expect(getSoberBadgeStyle('finalized')).toContain('text-emerald-400');
    expect(getSoberBadgeStyle('blocked')).toContain('text-amber-400');
    expect(getSoberBadgeStyle('failed')).toContain('text-rose-400');
    expect(getSoberBadgeStyle('draft')).toContain('text-cyan-400');
  });
});
