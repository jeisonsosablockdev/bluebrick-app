/**
 * @file tests/unit/client-portfolio-resolution.test.ts
 * @description Layer 4 & QA: Unit test suite verifying primary portfolio resolution
 * from ingested Excel clients and fallback to user_investments.
 * @spec BBC-008-SPEC-4
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { InvestmentRepository } from "@/lib/infrastructure/db/repositories/investment-repository";
import type { DatabaseExecutor } from "@/lib/infrastructure/db/neon-client";

describe("SPEC-4: Ingested Excel Clients Portfolio Resolution (@spec BBC-008-SPEC-4)", () => {
  let mockExecutor: DatabaseExecutor;
  let mockQuery: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockQuery = vi.fn();
    mockExecutor = {
      query: mockQuery as unknown as DatabaseExecutor["query"],
    };
  });

  it("resolves primary real investor portfolio from clients table by email (e.g. jeisonjsosar@gmail.com)", async () => {
    // Arrange: Mock clients table containing Jayson Sosa's real ingested Excel row
    const mockClientRow = {
      id: "d7c6a225-5083-490f-ac24-9337b781493a",
      name: "JAYSON SOSA",
      tax_id: "INV-009",
      email: "jeisonjsosar@gmail.com",
      contract_amount: "50000.00",
      status: "ACTIVE",
      metadata: {
        roi: "15.0%",
        city: "TAMPA",
        project: "CARROLLWOOD",
        investorId: "INV-009",
      },
    };

    mockQuery.mockResolvedValueOnce({ rows: [mockClientRow] });
    const repo = new InvestmentRepository(mockExecutor);

    // Act: Request portfolio by email
    const portfolio = await repo.getPortfolioSummary("jeisonjsosar@gmail.com", "user_01M1774JG4M9C240HPK2RGQVFW");

    // Assert: Portfolio resolves real Excel figures
    expect(portfolio.totalInvested).toBe(50000);
    expect(portfolio.weightedRoi).toBe(15.0);
    expect(portfolio.activeCount).toBe(1);
    expect(portfolio.concludedCount).toBe(0);
    expect(portfolio.items.length).toBe(1);
    expect(portfolio.items[0].propertyName).toBe("CARROLLWOOD");
    expect(portfolio.items[0].city).toBe("TAMPA");
    expect(portfolio.items[0].investedAmount).toBe(50000);
    expect(portfolio.items[0].roi).toBe(15.0);
    expect(portfolio.items[0].status).toBe("activa");
  });

  it("normalizes heterogeneous ROI formats and monetary strings from Excel metadata", async () => {
    // Arrange: Mock client with varied metadata formats
    const mockClientWithDirtyData = {
      id: "client-002",
      name: "OSCAR VANEGAS",
      tax_id: "INV-002",
      email: "succesbizz5@gmail.com",
      contract_amount: "10000",
      status: "ACTIVE",
      metadata: {
        roi: "20.0%",
        city: "TAMPA",
        project: "BROOKSVILLE",
      },
    };

    mockQuery.mockResolvedValueOnce({ rows: [mockClientWithDirtyData] });
    const repo = new InvestmentRepository(mockExecutor);

    // Act
    const portfolio = await repo.getPortfolioSummary("succesbizz5@gmail.com");

    // Assert: Arithmetic conversion and clean parsing
    expect(portfolio.totalInvested).toBe(10000);
    expect(portfolio.weightedRoi).toBe(20.0);
    expect(portfolio.items[0].roi).toBe(20.0);
  });

  it("sanitizes email with case-insensitivity and trims whitespace", async () => {
    // Arrange
    const mockClientRow = {
      id: "client-001",
      name: "ESTEBAN CEBALLOS",
      tax_id: "INV-001",
      email: "inversion.usa2026@gmail.com",
      contract_amount: "60000.00",
      status: "ACTIVE",
      metadata: {
        roi: "16.0%",
        city: "TAMPA",
        project: "BUSH GARDEN",
      },
    };

    mockQuery.mockResolvedValueOnce({ rows: [mockClientRow] });
    const repo = new InvestmentRepository(mockExecutor);

    // Act: Pass uppercase and padded email
    const portfolio = await repo.getPortfolioSummary("  INVERSION.USA2026@GMAIL.COM  ");

    // Assert
    expect(portfolio.items[0].propertyName).toBe("BUSH GARDEN");
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("LOWER"),
      expect.arrayContaining(["inversion.usa2026@gmail.com"])
    );
  });

  it("falls back cleanly to user_investments when email is not found in clients table", async () => {
    // Arrange: Step 1 (clients query) returns 0 rows. Step 2 (fallback query) returns Sofia's investments
    mockQuery.mockResolvedValueOnce({ rows: [] }); // clients query
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: "inv-1",
          property_id: "p1",
          property_name: "Residencial Vista Norte",
          city: "Bogotá, Colombia",
          property_type: "Residencial",
          invested_amount: "45000",
          roi: "14.2",
          status: "activa",
          timing: "Noviembre 2026",
          months_left: 4,
          gradient: "linear-gradient(135deg,#2F8F6B 0%,#173F30 100%)",
        },
      ],
    }); // fallback query

    const repo = new InvestmentRepository(mockExecutor);

    // Act: Search for unknown email
    const portfolio = await repo.getPortfolioSummary("unknown@domain.com", "user_sofia_martinez");

    // Assert: Falls back to user_investments
    expect(portfolio.items.length).toBe(1);
    expect(portfolio.items[0].propertyName).toBe("Residencial Vista Norte");
    expect(portfolio.totalInvested).toBe(45000);
  });

  it("falls back to user_investments when userEmail is null or omitted", async () => {
    // Arrange: Fallback query directly
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: "inv-demo",
          property_id: "p-demo",
          property_name: "Torre Corporativa Sabana",
          city: "Bogotá, Colombia",
          property_type: "Comercial",
          invested_amount: "60000",
          roi: "11.8",
          status: "activa",
          timing: "Marzo 2027",
          months_left: 8,
          gradient: "linear-gradient(135deg,#C41230 0%,#4A0F1A 100%)",
        },
      ],
    });

    const repo = new InvestmentRepository(mockExecutor);

    // Act: Null email
    const portfolio = await repo.getPortfolioSummary(null, "user_sofia_martinez");

    // Assert
    expect(portfolio.items[0].propertyName).toBe("Torre Corporativa Sabana");
  });
});
