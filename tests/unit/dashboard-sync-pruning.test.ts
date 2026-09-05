/**
 * ============================================================================
 * @file tests/unit/dashboard-sync-pruning.test.ts
 * @description Layer 2 & QA: Comprehensive Unit Test Suite for Idempotent Dashboard Sync & Stale Pruning
 * ============================================================================
 * Purpose: Verifies that DashboardSyncService performs idempotent orphan pruning across
 * all operational tables (investments, phases, projects, investors, transactions, summaries)
 * within the transaction boundary.
 *
 * @spec BBC-018-IDEMPOTENT-PRUNING
 */

import { describe, it, expect, vi } from "vitest";
import {
  DashboardSyncService,
  IDashboardDbClient,
  IDashboardDbPool,
} from "@/features/ai-ingestion/application/services/dashboard-sync-service";
import { IGoogleAuthProviderPort } from "@/features/ai-ingestion/domain/ports/google-auth-port";
import { ISpreadsheetParserPort } from "@/features/ai-ingestion/domain/ports/spreadsheet-parser-port";
import { CanonicalDashboardWorkbook } from "@/features/ai-ingestion/domain/schemas/canonical-dashboard-schema";

function createTestWorkbook(): CanonicalDashboardWorkbook {
  return {
    proyectos: [
      {
        idInversion: "BG-01",
        nombre: "BUSH GARDEN",
        ciudad: "TAMPA",
        tipoProyecto: "Residencial",
        duracionMeses: 6,
        faseActual: "9. Acabados",
        avanceFasePct: 57.14,
        driveUrl: null,
      },
    ],
    inversionistas: [
      {
        idInversionista: "INV-010",
        nombre: "JUAN PABLO PAZOS",
        email: "pazosjp@gmail.com",
        tipoInversionista: "Privado",
        fechaIngreso: "2026-07-14",
        timingMonths: 6,
      },
    ],
    inversiones: [
      {
        id: "INV_BG-01_INV-010",
        idInversion: "BG-01",
        idInversionista: "INV-010",
        nombreProyecto: "BUSH GARDEN",
        ciudad: "TAMPA BAY",
        tipoPropiedad: "Residencial",
        tipoProyecto: "Fix & Flip",
        montoInvertido: 10000,
        roiPct: 0.16,
        estado: "Activa",
        fechaInicio: "2026-07-14",
        duracionMeses: 6,
        rangoEsperado: "6-12 MESES",
        fechaTiming: "2027-01-14",
        allocationPct: 1,
        imagenUrl: null,
        avanceFasePct: 0.5714,
        faseActual: "9. Acabados",
        gananciaProyectada: 1600,
        rendimientoDevengado: 914.29,
      },
      {
        id: "INV_BK-02_INV-010",
        idInversion: "BK-02",
        idInversionista: "INV-010",
        nombreProyecto: "BROOKSVILLE",
        ciudad: "TAMPA BAY",
        tipoPropiedad: "Residencial",
        tipoProyecto: "Fix & Flip",
        montoInvertido: 9860,
        roiPct: 0.155,
        estado: "Activa",
        fechaInicio: "2026-07-14",
        duracionMeses: 6,
        rangoEsperado: "6-12 MESES",
        fechaTiming: "2027-01-14",
        allocationPct: 1,
        imagenUrl: null,
        avanceFasePct: 0.2143,
        faseActual: "Sin fase en curso",
        gananciaProyectada: 1528.3,
        rendimientoDevengado: 327.49,
      },
    ],
    fases: [
      {
        idFase: "FASE-0001",
        idInversion: "BG-01",
        orden: 1,
        nombreFase: "1. Adquisición",
        estado: "Completada",
        fechaInicio: "2026-07-14",
        fechaFin: "2026-08-01",
        imagenes: [],
      },
    ],
    oportunidades: [
      {
        id: "opp_carrollwood",
        titulo: "CARROLLWOOD",
        ciudad: "TAMPA",
        roiProyectado: 16,
        inversionMinima: 25000,
        diasRestantes: 15,
        gradient: "from-green-600 to-emerald-800",
      },
    ],
    transacciones: [
      {
        idTransaccion: "TRX-001",
        idInversionista: "INV-010",
        idOportunidad: "opp_carrollwood",
        idInversionOrigen: "BG-01",
        monto: 5000,
        fechaSolicitud: "2026-08-10",
        estado: "Pendiente",
        idInversionGenerada: null,
      },
    ],
    resumenes: [
      {
        idInversionista: "INV-010",
        nombre: "JUAN PABLO PAZOS",
        patrimonioTotalInvertido: 19860,
        rendimientoAcumulado: 1241.78,
        capitalTotalActual: 21101.78,
        roiPonderado: 0.1575,
        numActivas: 2,
        numConcluidas: 0,
        capitalDisponibleReinversion: 1241.78,
        gananciaProyectadaTotal: 3128.3,
      },
    ],
  };
}

describe("DashboardSyncService - Idempotent Stale Record Pruning (@spec BBC-018-IDEMPOTENT-PRUNING)", () => {
  it("executes atomic DELETE pruning on operational tables for stale records during sync", async () => {
    // Step 1: Arrange mock ports and DB queries collector
    const executedQueries: Array<{ sql: string; params?: unknown[] }> = [];

    const mockClient: IDashboardDbClient = {
      query: vi.fn().mockImplementation(async (sql: string, params?: unknown[]) => {
        executedQueries.push({ sql, params });
        return { rows: [] };
      }),
      release: vi.fn(),
    };

    const mockDbPool: IDashboardDbPool = {
      connect: vi.fn().mockResolvedValue(mockClient),
    };

    const mockAuth: IGoogleAuthProviderPort = {
      getAccessToken: vi.fn().mockResolvedValue({ token: "mock_token", expiresAt: Date.now() + 3600000 }),
      invalidateCache: vi.fn().mockResolvedValue(undefined),
    };

    const mockParser: ISpreadsheetParserPort = {
      parseDashboardWorkbook: vi.fn().mockResolvedValue(createTestWorkbook()),
      parseSpreadsheet: vi.fn(),
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(128)),
    } as unknown as Response);

    const service = new DashboardSyncService({
      authProvider: mockAuth,
      spreadsheetParser: mockParser,
      dbPool: mockDbPool,
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    // Step 2: Act
    const result = await service.executeSync();

    // Step 3: Assert
    expect(result.success).toBe(true);

    // Verify pruning query executions for all operational tables
    const deleteQueries = executedQueries.filter((q) => q.sql.includes("DELETE FROM"));

    // Must prune projects
    const deleteProjects = deleteQueries.find((q) => q.sql.includes("dashboard_projects"));
    expect(deleteProjects).toBeDefined();
    expect(deleteProjects?.sql).toContain("id_inversion != ALL");
    expect(deleteProjects?.params?.[0]).toEqual(["BG-01"]);

    // Must prune investors
    const deleteInvestors = deleteQueries.find((q) => q.sql.includes("dashboard_investors"));
    expect(deleteInvestors).toBeDefined();
    expect(deleteInvestors?.sql).toContain("id_inversionista != ALL");
    expect(deleteInvestors?.params?.[0]).toEqual(["INV-010"]);

    // Must prune investments
    const deleteInvestments = deleteQueries.find((q) => q.sql.includes("dashboard_investments"));
    expect(deleteInvestments).toBeDefined();
    expect(deleteInvestments?.sql).toContain("id != ALL");
    expect(deleteInvestments?.params?.[0]).toEqual(["INV_BG-01_INV-010", "INV_BK-02_INV-010"]);

    // Must prune project phases
    const deletePhases = deleteQueries.find((q) => q.sql.includes("dashboard_project_phases"));
    expect(deletePhases).toBeDefined();
    expect(deletePhases?.sql).toContain("id != ALL");
    expect(deletePhases?.params?.[0]).toEqual(["FASE-0001_BG-01"]);

    // Must prune reinvestment transactions
    const deleteTx = deleteQueries.find((q) => q.sql.includes("dashboard_reinvestment_transactions"));
    expect(deleteTx).toBeDefined();
    expect(deleteTx?.sql).toContain("id_transaccion != ALL");
    expect(deleteTx?.params?.[0]).toEqual(["TRX-001"]);

    // Must prune investor summaries
    const deleteSummaries = deleteQueries.find((q) => q.sql.includes("dashboard_investor_summaries"));
    expect(deleteSummaries).toBeDefined();
    expect(deleteSummaries?.sql).toContain("id_inversionista != ALL");
    expect(deleteSummaries?.params?.[0]).toEqual(["INV-010"]);
  });
});
