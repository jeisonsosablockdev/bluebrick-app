/**
 * ============================================================================
 * @file tests/unit/reinvestment-opportunities-resolution.test.ts
 * @description Layer 4 & QA: Unit test suite verifying reinvestment opportunities resolution
 * ============================================================================
 * Purpose: Verifies deduplication and query resolution of reinvestment opportunities
 * exclusively from ingested Excel records in the reinvestment_opportunities table.
 *
 * Invariants Tested:
 *  - Native DISTINCT ON (LOWER(TRIM(title))) deduplication.
 *  - Title normalization and newest record selection (created_at DESC).
 *  - Highest projected ROI sorting order for presentation.
 *
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 *
 * @spec BBC-008-SPEC-5, BBC-018-DEDUPLICATE
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

  /**
   * Test case: Deduplicate opportunities by title using DISTINCT ON.
   * @spec BBC-018-DEDUPLICATE-QUERY
   */
  it("deduplicates opportunities by title using DISTINCT ON, returning only the most recent entry when multiple records exist with the same project title", async () => {
    // Arrange: Multiple mock rows with title "MULBERRY" (e.g. opp_mb_05 from 2026-08-30 and MB-07 from 2026-09-03)
    const mockOpportunityRows = [
      {
        id: "MB-07",
        title: "MULBERRY",
        city: "TAMPA",
        projected_roi: "16.0",
        min_investment: "24500",
        days_left: 20,
        gradient: "linear-gradient(135deg,#2F8F6B 0%,#111B2E 100%)",
        created_at: new Date("2026-09-03T12:00:00Z"),
      },
      {
        id: "opp_mb_05",
        title: "MULBERRY",
        city: "TAMPA",
        projected_roi: "15.5",
        min_investment: "25000",
        days_left: 5,
        gradient: "linear-gradient(135deg,#2F8F6B 0%,#111B2E 100%)",
        created_at: new Date("2026-08-30T12:00:00Z"),
      },
    ];

    // Mock DB executor: when SQL properly uses DISTINCT ON, DB returns deduplicated latest row
    mockQuery.mockImplementation(async (sql: string) => {
      const normalized = sql.replace(/\s+/g, " ");
      if (/DISTINCT\s+ON\s*\(\s*LOWER\s*\(\s*TRIM\s*\(\s*title\s*\)\s*\)\s*\)/i.test(normalized)) {
        return { rows: [mockOpportunityRows[0]] };
      }
      return { rows: mockOpportunityRows };
    });

    const repo = new InvestmentRepository(mockExecutor);

    // Act: Query reinvestment opportunities
    const opportunities = await repo.getReinvestmentOpportunities();

    // Assert: Verify mockQuery was called with query containing DISTINCT ON and LOWER(TRIM(title))
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringMatching(/DISTINCT\s+ON/i)
    );
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringMatching(/LOWER\s*\(\s*TRIM\s*\(\s*title\s*\)\s*\)/i)
    );
    expect(opportunities.length).toBe(1);
    expect(opportunities[0].id).toBe("MB-07");
    expect(opportunities[0].title).toBe("MULBERRY");
  });
});
