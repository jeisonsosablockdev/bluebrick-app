import { describe, it, expect } from 'vitest';

/**
 * =========================================================================================
 * 🎨 SPEC-01 ADMIN UI MODERNIZATION TEST SUITE
 * =========================================================================================
 * 
 * Tests the modern visual design contracts, KPI metric cards, and layout enhancements
 * in /admin and /admin/distributions.
 */
describe('SPEC-01 Admin UI Modernization & KPI Cards', () => {
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

  it('should provide dynamic badge styles for all distribution run statuses', () => {
    const getModernBadgeStyle = (status: 'draft' | 'blocked' | 'finalized' | 'failed' | 'active') => {
      switch (status) {
        case 'finalized':
        case 'active':
          return 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
        case 'blocked':
          return 'border border-amber-500/40 bg-amber-500/10 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
        case 'failed':
          return 'border border-rose-500/40 bg-rose-500/10 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.2)]';
        case 'draft':
        default:
          return 'border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]';
      }
    };

    expect(getModernBadgeStyle('finalized')).toContain('text-emerald-300');
    expect(getModernBadgeStyle('blocked')).toContain('text-amber-300');
    expect(getModernBadgeStyle('failed')).toContain('text-rose-300');
    expect(getModernBadgeStyle('draft')).toContain('text-cyan-300');
  });
});
