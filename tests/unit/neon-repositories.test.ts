/**
 * @file tests/unit/neon-repositories.test.ts
 * @description Layer 4 & QA: Behavioral Unit Test Suite for Database Repositories.
 * @spec BBC-6-SPEC-2
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserRepository } from "@/lib/infrastructure/db/repositories/user-repository";
import { PropertyRepository } from "@/lib/infrastructure/db/repositories/property-repository";
import { InvestmentRepository } from "@/lib/infrastructure/db/repositories/investment-repository";
import type { DatabaseExecutor } from "@/lib/infrastructure/db/neon-client";

describe("SPEC-2: Database Repositories Behavioral Suite (@spec BBC-6-SPEC-2)", () => {
  let mockExecutor: DatabaseExecutor;
  let mockQuery: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockQuery = vi.fn();
    mockExecutor = {
      query: mockQuery as unknown as DatabaseExecutor["query"],
    };
  });

  describe("UserRepository", () => {
    it("should retrieve an investor by ID", async () => {
      // Arrange
      const mockUserRow = {
        id: "user_sofia_martinez",
        email: "sofia.martinez@bluebrick.investments",
        first_name: "Sofía",
        last_name: "Martínez",
        avatar_url: null,
        tier: "Inversionista Privada",
        created_at: new Date("2021-01-01"),
      };
      mockQuery.mockResolvedValueOnce({ rows: [mockUserRow] });
      const repo = new UserRepository(mockExecutor);

      // Act
      const user = await repo.findById("user_sofia_martinez");

      // Assert
      expect(user).not.toBeNull();
      expect(user?.firstName).toBe("Sofía");
      expect(user?.tier).toBe("Inversionista Privada");
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT"),
        ["user_sofia_martinez"]
      );
    });
  });

  describe("PropertyRepository", () => {
    it("should list all available properties", async () => {
      // Arrange
      const mockProperties = [
        {
          id: "p1",
          name: "Residencial Vista Norte",
          city: "Bogotá, Colombia",
          type: "Residencial",
          target_amount: "45000",
          roi: "14.2",
          status: "activa",
          timing: "Noviembre 2026",
          months_left: 4,
          gradient: "linear-gradient(135deg,#2F8F6B 0%,#173F30 100%)",
        },
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockProperties });
      const repo = new PropertyRepository(mockExecutor);

      // Act
      const list = await repo.listAll();

      // Assert
      expect(list.length).toBe(1);
      expect(list[0].name).toBe("Residencial Vista Norte");
      expect(list[0].roi).toBe(14.2);
    });
  });

  describe("InvestmentRepository", () => {
    it("should calculate portfolio metrics from database rows for Sofia Martinez", async () => {
      // Arrange
      const mockInvestments = [
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
        {
          id: "inv-2",
          property_id: "p2",
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
        {
          id: "inv-3",
          property_id: "p3",
          property_name: "Bodega Industrial Cota",
          city: "Cota, Colombia",
          property_type: "Industrial",
          invested_amount: "25000",
          roi: "18.5",
          status: "concluida",
          timing: "Concluida — Junio 2026",
          months_left: 0,
          gradient: "linear-gradient(135deg,#57B98C 0%,#0A1220 100%)",
        },
        {
          id: "inv-4",
          property_id: "p4",
          property_name: "Lote Comercial Chía",
          city: "Chía, Colombia",
          property_type: "Comercial",
          invested_amount: "18000",
          roi: "9.4",
          status: "activa",
          timing: "Enero 2027",
          months_left: 6,
          gradient: "linear-gradient(135deg,#E8495F 0%,#3B1018 100%)",
        },
        {
          id: "inv-5",
          property_id: "p5",
          property_name: "Apartaestudios Laureles",
          city: "Medellín, Colombia",
          property_type: "Residencial",
          invested_amount: "15000",
          roi: "13.0",
          status: "activa",
          timing: "Agosto 2026",
          months_left: 1,
          gradient: "linear-gradient(135deg,#3F7D63 0%,#0A1220 100%)",
        },
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockInvestments });
      const repo = new InvestmentRepository(mockExecutor);

      // Act
      const portfolio = await repo.getPortfolioSummary("user_sofia_martinez");

      // Assert
      expect(portfolio.totalInvested).toBe(163000);
      expect(portfolio.activeCount).toBe(4);
      expect(portfolio.concludedCount).toBe(1);
      expect(portfolio.weightedRoi).toBeCloseTo(13.34, 1);
      expect(portfolio.items.length).toBe(5);
    });
  });
});
