/**
 * @file tests/unit/dashboard-metrics.test.ts
 * @description Layer 3 & QA: Behavioral Unit Test Suite for Dashboard Calculation Pipelines.
 * @spec BBC-6-SPEC-3
 */

import { describe, it, expect } from "vitest";
import {
  formatUsdCurrency,
  formatRoiPercentage,
  calculatePropertyTypeDistribution,
} from "@/lib/pipelines/dashboard-metrics";
import type { PortfolioItem } from "@/lib/types/db";

describe("SPEC-3: Dashboard Metrics Pipeline (@spec BBC-6-SPEC-3)", () => {
  const sampleItems: PortfolioItem[] = [
    {
      id: "1",
      propertyId: "p1",
      propertyName: "Residencial Vista Norte",
      city: "Bogotá, Colombia",
      propertyType: "Residencial",
      investedAmount: 45000,
      roi: 14.2,
      status: "activa",
      timing: "Noviembre 2026",
      monthsLeft: 4,
      gradient: "linear-gradient(135deg,#2F8F6B 0%,#173F30 100%)",
    },
    {
      id: "2",
      propertyId: "p2",
      propertyName: "Torre Corporativa Sabana",
      city: "Bogotá, Colombia",
      propertyType: "Comercial",
      investedAmount: 60000,
      roi: 11.8,
      status: "activa",
      timing: "Marzo 2027",
      monthsLeft: 8,
      gradient: "linear-gradient(135deg,#C41230 0%,#4A0F1A 100%)",
    },
    {
      id: "3",
      propertyId: "p3",
      propertyName: "Bodega Industrial Cota",
      city: "Cota, Colombia",
      propertyType: "Industrial",
      investedAmount: 25000,
      roi: 18.5,
      status: "concluida",
      timing: "Concluida — Junio 2026",
      monthsLeft: 0,
      gradient: "linear-gradient(135deg,#57B98C 0%,#0A1220 100%)",
    },
  ];

  it("should format USD currency values cleanly", () => {
    expect(formatUsdCurrency(163000)).toBe("$163,000");
    expect(formatUsdCurrency(45000)).toBe("$45,000");
    expect(formatUsdCurrency(0)).toBe("$0");
  });

  it("should format ROI percentages with one decimal place", () => {
    expect(formatRoiPercentage(13.7)).toBe("13.7%");
    expect(formatRoiPercentage(14.2)).toBe("14.2%");
    expect(formatRoiPercentage(11.85)).toBe("11.9%");
  });

  it("should calculate asset type distributions for Recharts Donut chart", () => {
    const distribution = calculatePropertyTypeDistribution(sampleItems);
    expect(distribution).toEqual([
      { name: "Comercial", value: 60000, color: "#C41230", percentage: 46.2 },
      { name: "Residencial", value: 45000, color: "#2F8F6B", percentage: 34.6 },
      { name: "Industrial", value: 25000, color: "#57B98C", percentage: 19.2 },
    ]);
  });
});
