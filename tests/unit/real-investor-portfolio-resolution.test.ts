/**
 * @file tests/unit/real-investor-portfolio-resolution.test.ts
 * @description Layer 4: Infrastructure - Unit tests for real investor portfolio resolution from dashboard tables.
 * Validates direct lookup in dashboard_investors + dashboard_investments and phase enrichment from dashboard_project_phases.
 * 
 * @spec BBC-015-REQ-1
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { InvestmentRepository } from "@/lib/infrastructure/db/repositories/investment-repository";
import type { DatabaseExecutor } from "@/lib/infrastructure/db/neon-client";

describe("InvestmentRepository - Real Investor Portfolio Resolution (@spec BBC-015-REQ-1)", () => {
  let mockDb: DatabaseExecutor;
  let repository: InvestmentRepository;

  beforeEach(() => {
    mockDb = {
      query: vi.fn(),
    } as unknown as DatabaseExecutor;
    repository = new InvestmentRepository(mockDb);
  });

  it("should query dashboard_investments directly when a real investor email is provided", async () => {
    // Arrange: Mock DB returns real investor investments from dashboard_investors + dashboard_investments
    const mockDbQuery = mockDb.query as ReturnType<typeof vi.fn>;
    
    // First query: dashboard_investors JOIN dashboard_investments
    mockDbQuery.mockImplementation(async (sql: string, params: any[]) => {
      if (sql.includes("dashboard_investors") && sql.includes("dashboard_investments")) {
        return {
          rows: [
            {
              id: "INV_BG-01_INV-008",
              id_inversion: "BG-01",
              id_inversionista: "INV-008",
              nombre_proyecto: "BUSH GARDEN",
              ciudad: "TAMPA",
              tipo_propiedad: "Residencial",
              tipo_proyecto: "Fix & Flip",
              monto_invertido: "10000.00",
              roi_pct: "0.1600",
              estado: "Activa",
              fecha_timing: "2027-01-14",
              duracion_meses: 6,
              avance_fase_pct: "0.5714",
              fase_actual: "9. Acabados",
            },
          ],
        };
      }

      // Second query: dashboard_project_phases
      if (sql.includes("dashboard_project_phases")) {
        return {
          rows: [
            {
              id: "p1",
              id_fase: "FASE-0001",
              id_inversion: "BG-01",
              orden: 1,
              nombre_fase: "1. Adquisición",
              estado: "Completada",
            },
            {
              id: "p9",
              id_fase: "FASE-0009",
              id_inversion: "BG-01",
              orden: 9,
              nombre_fase: "9. Acabados",
              estado: "En curso",
            },
          ],
        };
      }

      return { rows: [] };
    });

    // Act: Query portfolio summary for Francisco Garzón
    const result = await repository.getPortfolioSummary("pacogarzonn@hotmail.com");

    // Assert: Check that real dashboard investments were mapped
    expect(result.userId).toBe("pacogarzonn@hotmail.com");
    expect(result.items).toHaveLength(1);
    const item = result.items[0];
    expect(item.propertyName).toBe("BUSH GARDEN");
    expect(item.propertyId).toBe("BG-01");
    expect(item.investedAmount).toBe(10000);
    expect(item.roi).toBe(16);
    expect(item.currentPhase).toBe("9. Acabados");
    expect(item.phaseProgressPct).toBe(57.14);
    expect(item.phases).toHaveLength(2);
    expect(item.phases![1].name).toBe("9. Acabados");
    expect(item.phases![1].status).toBe("En curso");
  });

  it("should preserve demo fallback for user_sofia_martinez when no real investor matches", async () => {
    // Arrange: No dashboard investments found, falls back to user_investments
    const mockDbQuery = mockDb.query as ReturnType<typeof vi.fn>;
    mockDbQuery.mockImplementation(async (sql: string) => {
      if (sql.includes("dashboard_investments")) {
        return { rows: [] };
      }
      if (sql.includes("clients")) {
        return { rows: [] };
      }
      if (sql.includes("user_investments")) {
        return {
          rows: [
            {
              investment_id: "inv_sofia_001",
              property_id: "prop_vista_norte",
              property_name: "Residencial Vista Norte",
              city: "Bogotá, Colombia",
              property_type: "Residencial",
              invested_amount: "45000",
              roi: "14.2",
              status: "activa",
              timing: "Noviembre 2026",
              months_left: 4,
            },
          ],
        };
      }
      return { rows: [] };
    });

    // Act: Query portfolio for demo Sofia Martinez
    const result = await repository.getPortfolioSummary("sofia.martinez@bluebrick.investments", "user_sofia_martinez");

    // Assert: Check demo fallback is preserved
    expect(result.items).toHaveLength(1);
    expect(result.items[0].propertyName).toBe("Residencial Vista Norte");
    expect(result.items[0].investedAmount).toBe(45000);
  });

  it("should resolve ALL dashboard investments when investor has both a legacy clients row and multiple dashboard_investments (BBC-18)", async () => {
    // Step 1: Arrange - Mock DB returning 2 rows from dashboard_investments JOIN clients for pazosjp@gmail.com
    const mockDbQuery = mockDb.query as ReturnType<typeof vi.fn>;
    mockDbQuery.mockImplementation(async (sql: string, params: any[]) => {
      if (sql.includes("clients") && sql.includes("dashboard_investments")) {
        return {
          rows: [
            {
              dash_id: "INV_BG-01_INV-010",
              id_inversion: "BG-01",
              dash_project_name: "BUSH GARDEN",
              dash_city: "TAMPA BAY",
              dash_property_type: "Residencial",
              tipo_proyecto: "Fix & Flip",
              monto_invertido: "10000.00",
              dash_roi_pct: "0.1600",
              dash_estado: "Activa",
              dash_duracion_meses: 6,
              dash_fecha_timing: null,
              dash_avance_fase_pct: "0.5714",
              dash_fase_actual: "9. Acabados",
              id: "dac1a9d1-4179-45e6-89f0-e05ddaaf17d6",
              name: "JUAN PABLO PAZOS",
              tax_id: null,
              email: "pazosjp@gmail.com",
              contract_amount: "10000.00", // Legacy client contract amount present!
              status: "ACTIVE",
              metadata: {
                // Stale legacy metadata containing only 1 investment
                allInvestments: [
                  {
                    id_inversion: "BG-01",
                    nombre_proyecto: "BUSH GARDEN",
                    ciudad: "TAMPA",
                    monto_invertido: 10000,
                    roi_pct: 0.16,
                    estado: "Activa",
                  },
                ],
              },
            },
            {
              dash_id: "INV_BK-02_INV-010",
              id_inversion: "BK-02",
              dash_project_name: "BROOKSVILLE",
              dash_city: "TAMPA BAY",
              dash_property_type: "Residencial",
              tipo_proyecto: "Fix & Flip",
              monto_invertido: "9860.00",
              dash_roi_pct: "0.1550",
              dash_estado: "Activa",
              dash_duracion_meses: 6,
              dash_fecha_timing: null,
              dash_avance_fase_pct: "0.2143",
              dash_fase_actual: "Sin fase en curso",
              id: "dac1a9d1-4179-45e6-89f0-e05ddaaf17d6",
              name: "JUAN PABLO PAZOS",
              tax_id: null,
              email: "pazosjp@gmail.com",
              contract_amount: "10000.00",
              status: "ACTIVE",
              metadata: {
                allInvestments: [
                  {
                    id_inversion: "BG-01",
                    nombre_proyecto: "BUSH GARDEN",
                    ciudad: "TAMPA",
                    monto_invertido: 10000,
                    roi_pct: 0.16,
                    estado: "Activa",
                  },
                ],
              },
            },
          ],
        };
      }

      if (sql.includes("dashboard_project_phases")) {
        return { rows: [] };
      }

      return { rows: [] };
    });

    // Step 2: Act - Query portfolio for Juan Pablo Pazos
    const result = await repository.getPortfolioSummary("pazosjp@gmail.com");

    // Step 3: Assert - Both projects must be resolved, not just the single legacy one
    expect(result.userId).toBe("pazosjp@gmail.com");
    expect(result.items).toHaveLength(2);
    expect(result.items.map((i) => i.propertyName)).toEqual(["BUSH GARDEN", "BROOKSVILLE"]);
    expect(result.totalInvested).toBe(19860);
    expect(result.activeCount).toBe(2);
  });
});
