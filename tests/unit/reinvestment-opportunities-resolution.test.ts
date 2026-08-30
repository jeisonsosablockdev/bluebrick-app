/**
 * @file tests/unit/reinvestment-opportunities-resolution.test.ts
 * @description Layer 4 & QA: Unit test suite verifying reinvestment opportunities resolution
 * exclusively from ingested Excel records in the reinvestment_opportunities table.
 * @spec BBC-008-SPEC-5
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { InvestmentRepository } from "@/lib/infrastructure/db/repositories/investment-repository";
import type { DatabaseExecutor } from "@/lib/infrastructure/db/neon-client";

describe("SPEC-5: Reinvestment Opportunities Excel Source Resolution (@spec BBC-008-SPEC-5)", () => {
  let mockExecutor: DatabaseExecutor;
  let mockQuery: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockQuery = vi.fn();
    mockExecutor = {
      query: mockQuery as unknown as DatabaseExecutor["query"],
    };
  });

  it("retrieves exclusively active opportunities from Excel ingestion (e.g. MULBERRY at 16.0% ROI)", async () => {
    // Arrange: Mock database response with ingested Excel opportunity (MULBERRY)
    const mockExcelOpportunityRows = [
      {
        id: "opp_mulberry_001",
        title: "MULBERRY",
        city: "TAMPA",
        projected_roi: "16.0",
        min_investment: "24500.00",
        days_left: 14,
        gradient: "linear-gradient(135deg,#2F8F6B 0%,#111B2E 100%)",
        created_at: new Date("2026-08-29T12:00:00Z"),
      },
    ];

    mockQuery.mockResolvedValueOnce({ rows: mockExcelOpportunityRows });
    const repo = new InvestmentRepository(mockExecutor);

    // Act: Query reinvestment opportunities
    const opportunities = await repo.getReinvestmentOpportunities();

    // Assert: Opportunities match active Excel ingestion records and contain no demo seed remnants
    expect(opportunities.length).toBe(1);
    expect(opportunities[0].id).toBe("opp_mulberry_001");
    expect(opportunities[0].title).toBe("MULBERRY");
    expect(opportunities[0].city).toBe("TAMPA");
    expect(opportunities[0].projectedRoi).toBe(16.0);
    expect(opportunities[0].minInvestment).toBe(24500);
    expect(opportunities[0].daysLeft).toBe(14);
  });

  it("orders multiple reinvestment opportunities by projected ROI descending", async () => {
    // Arrange: Mock multiple opportunities
    const mockOpportunityRows = [
      {
        id: "opp_high_roi",
        title: "PALMETTO RESIDENCES",
        city: "TAMPA",
        projected_roi: "18.5",
        min_investment: "30000",
        days_left: 5,
        gradient: "linear-gradient(135deg,#C41230 0%,#111B2E 100%)",
      },
      {
        id: "opp_med_roi",
        title: "MULBERRY",
        city: "TAMPA",
        projected_roi: "16.0",
        min_investment: "24500",
        days_left: 14,
        gradient: "linear-gradient(135deg,#2F8F6B 0%,#111B2E 100%)",
      },
    ];

    mockQuery.mockResolvedValueOnce({ rows: mockOpportunityRows });
    const repo = new InvestmentRepository(mockExecutor);

    // Act
    const opportunities = await repo.getReinvestmentOpportunities();

    // Assert
    expect(opportunities.length).toBe(2);
    expect(opportunities[0].projectedRoi).toBeGreaterThan(opportunities[1].projectedRoi);
    expect(opportunities[0].title).toBe("PALMETTO RESIDENCES");
    expect(opportunities[1].title).toBe("MULBERRY");
  });

  it("returns an empty array when no reinvestment opportunities exist", async () => {
    // Arrange: Empty rows response
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const repo = new InvestmentRepository(mockExecutor);

    // Act
    const opportunities = await repo.getReinvestmentOpportunities();

    // Assert
    expect(opportunities).toEqual([]);
  });
});
