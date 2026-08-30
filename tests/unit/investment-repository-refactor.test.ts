/**
 * @file tests/unit/investment-repository-refactor.test.ts
 * @description Layer 4 & QA: Unit test suite verifying clean code modular transformers,
 * typed parsing helpers, and portfolio calculations in InvestmentRepository.
 * @spec BBC-008-SPEC-6
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  InvestmentRepository,
  parseRoiPercentage,
  parseMonetaryAmount,
  resolveItemGradient,
  calculatePortfolioMetrics,
} from "@/lib/infrastructure/db/repositories/investment-repository";
import type { DatabaseExecutor } from "@/lib/infrastructure/db/neon-client";
import type { PortfolioItem, DbClientRow } from "@/lib/types/db";

describe("SPEC-6: InvestmentRepository Clean Code Refactor Audit (@spec BBC-008-SPEC-6)", () => {
  let mockExecutor: DatabaseExecutor;
  let mockQuery: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockQuery = vi.fn();
    mockExecutor = {
      query: mockQuery as unknown as DatabaseExecutor["query"],
    };
  });

  describe("Helper: parseRoiPercentage", () => {
    it("parses decimal representation correctly (0.16 -> 16.0)", () => {
      // Step 1: Arrange decimal input
      const input = 0.16;
      // Step 2: Act
      const result = parseRoiPercentage(input);
      // Step 3: Assert
      expect(result).toBe(16.0);
    });

    it("parses percentage string correctly ('15.5%' -> 15.5)", () => {
      // Step 1: Arrange percentage string input
      const input = "15.5%";
      // Step 2: Act
      const result = parseRoiPercentage(input);
      // Step 3: Assert
      expect(result).toBe(15.5);
    });

    it("parses integer or direct number correctly (18 -> 18)", () => {
      // Step 1: Arrange direct numeric input
      const input = 18;
      // Step 2: Act
      const result = parseRoiPercentage(input);
      // Step 3: Assert
      expect(result).toBe(18);
    });

    it("falls back to default (15.0) when input is undefined or invalid", () => {
      // Step 1: Act with null and invalid strings
      expect(parseRoiPercentage(undefined)).toBe(15.0);
      expect(parseRoiPercentage(null)).toBe(15.0);
      expect(parseRoiPercentage("invalid")).toBe(15.0);
    });
  });

  describe("Helper: parseMonetaryAmount", () => {
    it("parses formatted currency strings ('$50,000.00' -> 50000)", () => {
      // Step 1: Arrange formatted string
      const input = "$50,000.00";
      // Step 2: Act
      const result = parseMonetaryAmount(input);
      // Step 3: Assert
      expect(result).toBe(50000);
    });

    it("handles numeric input directly", () => {
      // Step 1: Arrange numeric input
      const input = 75000;
      // Step 2: Act
      const result = parseMonetaryAmount(input);
      // Step 3: Assert
      expect(result).toBe(75000);
    });

    it("returns 0 for undefined or unparseable input", () => {
      // Step 1: Act & Assert fallback
      expect(parseMonetaryAmount(undefined)).toBe(0);
      expect(parseMonetaryAmount(null)).toBe(0);
      expect(parseMonetaryAmount("N/A")).toBe(0);
    });
  });

  describe("Helper: resolveItemGradient", () => {
    it("cycles through defined gradients predictably based on index", () => {
      // Step 1: Act & Assert gradient mapping
      const g0 = resolveItemGradient(0);
      const g1 = resolveItemGradient(1);
      const g4 = resolveItemGradient(4);

      expect(typeof g0).toBe("string");
      expect(g0).toContain("linear-gradient");
      expect(g4).toBe(g0); // Cycles every 4 items
      expect(g1).not.toBe(g0);
    });
  });

  describe("Helper: calculatePortfolioMetrics", () => {
    it("calculates totalInvested, weightedRoi, and status counts with high precision", () => {
      // Step 1: Arrange sample portfolio items
      const items: PortfolioItem[] = [
        {
          id: "item_1",
          propertyId: "prop_1",
          propertyName: "CARROLLWOOD",
          city: "TAMPA",
          propertyType: "Residencial",
          investedAmount: 50000,
          roi: 16.0,
          status: "activa",
          timing: "Noviembre 2026",
          monthsLeft: 4,
          gradient: "linear-gradient(135deg,#2F8F6B 0%,#173F30 100%)",
        },
        {
          id: "item_2",
          propertyId: "prop_2",
          propertyName: "AVENTURA",
          city: "MIAMI",
          propertyType: "Residencial",
          investedAmount: 50000,
          roi: 14.0,
          status: "concluida",
          timing: "Diciembre 2025",
          monthsLeft: 0,
          gradient: "linear-gradient(135deg,#C41230 0%,#4A0F1A 100%)",
        },
      ];

      // Step 2: Act
      const metrics = calculatePortfolioMetrics(items);

      // Step 3: Assert: 50k @ 16% + 50k @ 14% = 100k total, 15% weighted ROI
      expect(metrics.totalInvested).toBe(100000);
      expect(metrics.weightedRoi).toBe(15.0);
      expect(metrics.activeCount).toBe(1);
      expect(metrics.concludedCount).toBe(1);
    });

    it("returns zero metrics when portfolio items array is empty", () => {
      // Step 1: Act with empty array
      const metrics = calculatePortfolioMetrics([]);

      // Step 2: Assert
      expect(metrics.totalInvested).toBe(0);
      expect(metrics.weightedRoi).toBe(0);
      expect(metrics.activeCount).toBe(0);
      expect(metrics.concludedCount).toBe(0);
    });
  });

  describe("InvestmentRepository Class & Modular Methods", () => {
    it("instantiates repository and executes getPortfolioSummary cleanly", async () => {
      // Step 1: Arrange mock client row
      const mockClient: DbClientRow = {
        id: "client-uuid-1",
        name: "Test Client",
        tax_id: "TAX-123",
        email: "test@example.com",
        contract_amount: "30000",
        status: "ACTIVE",
        metadata: {
          project: "PALMA REAL",
          city: "TAMPA",
          roi: "15.0%",
        },
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockClient] });
      const repo = new InvestmentRepository(mockExecutor);

      // Step 2: Act
      const summary = await repo.getPortfolioSummary("test@example.com");

      // Step 3: Assert
      expect(summary.userId).toBe("test@example.com");
      expect(summary.totalInvested).toBe(30000);
      expect(summary.items.length).toBe(1);
      expect(summary.items[0].propertyName).toBe("PALMA REAL");
    });
  });
});
