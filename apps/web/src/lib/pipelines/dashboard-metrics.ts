/**
 * @file apps/web/src/lib/pipelines/dashboard-metrics.ts
 * @description Layer 3: Domain / Pipelines - Pure calculation and formatting pipelines for dashboard metrics.
 */

import type { PortfolioItem } from "@/lib/types/db";
import type { TypeDistributionSlice } from "@/lib/types/dashboard";

const TYPE_COLORS: Record<string, string> = {
  Comercial: "#C41230",
  Residencial: "#2F8F6B",
  Industrial: "#57B98C",
  Otro: "#8E9BAA",
};

/**
 * Formats a numeric USD amount into a standard currency string (e.g. $163,000).
 */
export function formatUsdCurrency(amount: number): string {
  // Step 1: Format currency using Intl.NumberFormat without decimal cents
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats an ROI percentage with one decimal precision (e.g. 13.7%).
 */
export function formatRoiPercentage(roi: number): string {
  // Step 1: Round mathematically to 1 decimal place and append %
  const rounded = (Math.round((roi + Number.EPSILON) * 10) / 10).toFixed(1);
  return `${rounded}%`;
}

/**
 * Groups and aggregates portfolio items by property asset type for Donut charts.
 */
export function calculatePropertyTypeDistribution(items: PortfolioItem[]): TypeDistributionSlice[] {
  // Step 1: Aggregate invested capital by property type
  const groupTotals: Record<string, number> = {};
  let grandTotal = 0;

  for (const item of items) {
    const type = item.propertyType || "Otro";
    groupTotals[type] = (groupTotals[type] || 0) + item.investedAmount;
    grandTotal += item.investedAmount;
  }

  // Step 2: Convert to sorted array of distribution slices with color tokens
  return Object.entries(groupTotals)
    .map(([name, value]) => ({
      name,
      value,
      color: TYPE_COLORS[name] || "#8E9BAA",
      percentage: grandTotal > 0 ? Math.round((value / grandTotal) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.value - a.value);
}
