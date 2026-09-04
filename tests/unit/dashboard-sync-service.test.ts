/**
 * ============================================================================
 * @file tests/unit/dashboard-sync-service.test.ts
 * @description Layer 2 & QA: Comprehensive Unit Test Suite for DashboardSyncService
 * ============================================================================
 * Purpose: Verifies orchestration logic, transactional boundaries, error propagation,
 * and security invariants for automated Google Drive Excel dashboard synchronization.
 * 
 * Invariants Tested:
 *  - Atomic transaction: BEGIN, COMMIT on success; ROLLBACK & release on DB error.
 *  - Atomic opportunity pruning on synchronization: deletes obsolete opportunities within transaction.
 *  - Clean domain port delegation to IGoogleAuthProviderPort and ISpreadsheetParserPort.
 *  - Constant-time secret comparison and Bearer token verification.
 *  - Zero direct UI or framework coupling.
 * 
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 * 
 * @spec BBC-018-SYNC-SERVICE, BBC-018-DEDUPLICATE
 */

import { describe, it, expect, vi } from "vitest";
import {
  DashboardSyncService,
  IDashboardDbClient,
  IDashboardDbPool,
} from "@/features/ai-ingestion/application/services/dashboard-sync-service";
import {
  constantTimeCompare,
  verifyCronAuthorization,
  DEFAULT_DASHBOARD_FILE_ID,
} from "@/features/ai-ingestion/domain/models/dashboard-sync-models";
import { IGoogleAuthProviderPort } from "@/features/ai-ingestion/domain/ports/google-auth-port";
import { ISpreadsheetParserPort } from "@/features/ai-ingestion/domain/ports/spreadsheet-parser-port";
import { CanonicalDashboardWorkbook } from "@/features/ai-ingestion/domain/schemas/canonical-dashboard-schema";

/**
 * Creates a mock CanonicalDashboardWorkbook with test records across all 7 operational sheets.
 * 
 * @param overrides - Partial workbook data to override default mock records
 * @returns Complete CanonicalDashboardWorkbook object
 */
function createMockWorkbook(
  overrides?: Partial<CanonicalDashboardWorkbook>
): CanonicalDashboardWorkbook {
  // Step 1: Provide baseline valid records for all 7 sheets matching domain schemas
  return {
    proyectos: [
      {
        idInversion: "PROJ-BG-01",
        nombre: "Bush Garden Modern",
        ciudad: "Tampa Bay",
        tipoProyecto: "Residencial",
        duracionMeses: 6,
        faseActual: "1. Adquisición",
        avanceFasePct: 50,
        driveUrl: null,
      },
    ],
    inversionistas: [
      {
        idInversionista: "INV-USER-001",
        nombre: "Carlos Mendoza",
        email: "carlos@example.com",
        tipoInversionista: "Privado",
        fechaIngreso: "2024-01-01",
        timingMonths: 12,
      },
    ],
    inversiones: [
      {
        id: "INV_BG01_USER001",
        idInversion: "PROJ-BG-01",
        idInversionista: "INV-USER-001",
        nombreProyecto: "Bush Garden Modern",
        ciudad: "Tampa Bay",
        tipoPropiedad: "Residencial",
        tipoProyecto: "Fix & Flip",
        montoInvertido: 100000,
        roiPct: 0.16,
        estado: "Activa",
        fechaInicio: "2024-01-01",
        duracionMeses: 6,
        rangoEsperado: "14-18%",
        fechaTiming: "2024-07-01",
        allocationPct: 1,
        imagenUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00",
        avanceFasePct: 0.5,
        faseActual: "1. Adquisición",
        gananciaProyectada: 16000,
        rendimientoDevengado: 8000,
      },
    ],
    fases: [
      {
        idFase: "FASE-01",
        idInversion: "PROJ-BG-01",
        orden: 1,
        nombreFase: "Adquisición",
        estado: "Completada",
        fechaInicio: "2024-01-01",
        fechaFin: "2024-02-01",
        imagenes: ["https://example.com/phase1.jpg"],
      },
    ],
    oportunidades: [
      {
        id: "opp_tampa_bay",
        titulo: "Tampa Bay Residence",
        ciudad: "Tampa Bay",
        roiProyectado: 16,
        inversionMinima: 25000,
        diasRestantes: 20,
        gradient: "from-blue-600 to-indigo-600",
      },
    ],
    transacciones: [
      {
        idTransaccion: "TRX-001",
        idInversionista: "INV-USER-001",
        idOportunidad: "opp_tampa_bay",
        idInversionOrigen: "PROJ-BG-01",
        monto: 10000,
        fechaSolicitud: "2024-02-15",
        estado: "Confirmada",
        fechaConfirmacion: "2024-02-16",
        idInversionGenerada: "INV_BG02_USER001",
      },
    ],
    resumenes: [
      {
        idInversionista: "INV-USER-001",
        nombre: "Carlos Mendoza",
        patrimonioTotalInvertido: 100000,
        rendimientoAcumulado: 8000,
        capitalTotalActual: 108000,
        roiPonderado: 0.16,
        numActivas: 1,
        numConcluidas: 0,
        capitalDisponibleReinversion: 8000,
        gananciaProyectadaTotal: 16000,
      },
    ],
    ...overrides,
  };
}

/**
 * Creates a mock Google Auth Provider port returning a valid Bearer token.
 * 
 * @param overrides - Partial method overrides for IGoogleAuthProviderPort
 * @returns Mocked IGoogleAuthProviderPort
 */
function createMockAuthProvider(
  overrides?: Partial<IGoogleAuthProviderPort>
): IGoogleAuthProviderPort {
  // Step 1: Return valid token payload by default
  return {
    getAccessToken: vi.fn().mockResolvedValue({
      token: "mock-oauth-access-token-xyz",
      expiresAtUtc: Date.now() + 3600 * 1000,
      tokenType: "Bearer" as const,
    }),
    invalidateCache: vi.fn(),
    ...overrides,
  };
}

/**
 * Creates a mock Spreadsheet Parser port returning parsed workbook data.
 * 
 * @param workbookData - Canonical workbook to return upon parsing
 * @returns Mocked ISpreadsheetParserPort
 */
function createMockSpreadsheetParser(
  workbookData?: CanonicalDashboardWorkbook
): ISpreadsheetParserPort {
  const data = workbookData ?? createMockWorkbook();
  // Step 1: Mock parseDashboardWorkbook and parseSpreadsheet
  return {
    parseSpreadsheet: vi.fn().mockResolvedValue({
      filename: "test.xlsx",
      sheets: [],
      totalEntitiesExtracted: 0,
    }),
    parseDashboardWorkbook: vi.fn().mockResolvedValue(data),
  };
}

/**
 * Creates a mock database client tracking transactional lifecycle methods.
 * 
 * @param queryImpl - Custom query implementation function
 * @returns Mocked IDashboardDbClient
 */
function createMockDbClient(
  queryImpl?: (text: string, params?: unknown[]) => Promise<unknown>
): IDashboardDbClient & { query: ReturnType<typeof vi.fn>; release: ReturnType<typeof vi.fn> } {
  // Step 1: Default query mock resolves successfully with empty rows
  const query = vi.fn().mockImplementation(
    queryImpl ?? (async () => ({ rows: [], rowCount: 1 }))
  );
  const release = vi.fn();
  return { query, release };
}

/**
 * Creates a mock database pool that connects and yields the provided client.
 * 
 * @param client - Transactional client to resolve upon connect()
 * @returns Mocked IDashboardDbPool
 */
function createMockDbPool(
  client?: IDashboardDbClient
): IDashboardDbPool & { connect: ReturnType<typeof vi.fn> } {
  const mockClient = client ?? createMockDbClient();
  const connect = vi.fn().mockResolvedValue(mockClient);
  return { connect };
}

/**
 * Creates a mock fetch function returning a binary Excel stream.
 * 
 * @param status - HTTP response status (default: 200)
 * @param statusText - HTTP response status text
 * @param body - Optional custom response body
 * @returns Mocked fetch implementation
 */
function createMockFetch(
  status = 200,
  statusText = "OK",
  body: Uint8Array = new Uint8Array([0x50, 0x4b, 0x03, 0x04])
): typeof fetch {
  return vi.fn().mockResolvedValue(
    new Response(body, {
      status,
      statusText,
      headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
    })
  ) as unknown as typeof fetch;
}

describe("BBC-018: DashboardSyncService & Domain Contracts (@spec BBC-018-SYNC-SERVICE)", () => {
  /**
   * Test case a: Full end-to-end synchronization across all 7 operational sheets within an atomic transaction.
   * @spec BBC-018-SYNC-SERVICE
   */
  it("should successfully synchronize all 7 operational sheets into database within an atomic transaction", async () => {
    // Arrange: Set up mock auth, spreadsheet parser with 7 sheets, mock db client and pool, and mock fetch
    const authProvider = createMockAuthProvider();
    const mockWorkbook = createMockWorkbook();
    const spreadsheetParser = createMockSpreadsheetParser(mockWorkbook);
    const mockDbClient = createMockDbClient();
    const dbPool = createMockDbPool(mockDbClient);
    const fetchFn = createMockFetch();

    const service = new DashboardSyncService({
      authProvider,
      spreadsheetParser,
      dbPool,
      fetchFn,
    });

    // Act: Execute synchronization
    const result = await service.executeSync();

    // Assert: Verify atomic transaction flow (BEGIN -> queries -> COMMIT -> release) and result metrics
    expect(dbPool.connect).toHaveBeenCalledTimes(1);
    expect(mockDbClient.query).toHaveBeenCalledWith("BEGIN");
    expect(mockDbClient.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO dashboard_projects"),
      expect.any(Array)
    );
    expect(mockDbClient.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO dashboard_investors"),
      expect.any(Array)
    );
    expect(mockDbClient.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO dashboard_investments"),
      expect.any(Array)
    );
    expect(mockDbClient.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO dashboard_project_phases"),
      expect.any(Array)
    );
    expect(mockDbClient.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO dashboard_opportunities"),
      expect.any(Array)
    );
    expect(mockDbClient.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO dashboard_reinvestment_transactions"),
      expect.any(Array)
    );
    expect(mockDbClient.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO dashboard_investor_summaries"),
      expect.any(Array)
    );
    expect(mockDbClient.query).toHaveBeenCalledWith(
      expect.stringMatching(/DELETE\s+FROM\s+dashboard_opportunities\s+WHERE\s+id_oportunidad\s+(!=\s*ALL\(\$1(?:::varchar\[\])?\)|NOT\s+IN)/i),
      expect.any(Array)
    );
    expect(mockDbClient.query).toHaveBeenCalledWith(
      expect.stringMatching(/DELETE\s+FROM\s+reinvestment_opportunities\s+WHERE\s+id\s+(!=\s*ALL\(\$1(?:::varchar\[\])?\)|NOT\s+IN)/i),
      expect.any(Array)
    );
    expect(mockDbClient.query).toHaveBeenCalledWith("COMMIT");
    expect(mockDbClient.release).toHaveBeenCalledTimes(1);

    expect(result.success).toBe(true);
    expect(result.totalEntitiesSynced).toBe(7);
    expect(result.fileId).toBe(DEFAULT_DASHBOARD_FILE_ID);
    expect(result.counts).toEqual({
      proyectos: 1,
      inversionistas: 1,
      inversiones: 1,
      fases: 1,
      oportunidades: 1,
      transacciones: 1,
      resumenes: 1,
    });
  });

  /**
   * Test case b: Respecting custom fileId override option when downloading workbook.
   * @spec BBC-018-SYNC-SERVICE
   */
  it("should respect custom fileId override option", async () => {
    // Arrange: Initialize service with mock dependencies and custom fileId
    const customFileId = "custom-google-drive-file-id-xyz";
    const authProvider = createMockAuthProvider();
    const spreadsheetParser = createMockSpreadsheetParser();
    const mockDbClient = createMockDbClient();
    const dbPool = createMockDbPool(mockDbClient);
    const fetchFn = createMockFetch();

    const service = new DashboardSyncService({
      authProvider,
      spreadsheetParser,
      dbPool,
      fetchFn,
    });

    // Act: Execute sync with fileId override option
    const result = await service.executeSync({ fileId: customFileId });

    // Assert: Verify fetch called with custom fileId and result reports the custom fileId
    expect(fetchFn).toHaveBeenCalledWith(
      expect.stringContaining(customFileId),
      expect.any(Object)
    );
    expect(result.fileId).toBe(customFileId);
  });

  /**
   * Test case c: Error handling when Google Drive returns a non-200 HTTP response.
   * @spec BBC-018-SYNC-SERVICE
   */
  it("should throw DRIVE_DOWNLOAD_FAILED when Google Drive returns a non-200 HTTP response", async () => {
    // Arrange: Mock fetch to return a non-200 response (e.g. 404 Not Found)
    const authProvider = createMockAuthProvider();
    const spreadsheetParser = createMockSpreadsheetParser();
    const mockDbClient = createMockDbClient();
    const dbPool = createMockDbPool(mockDbClient);
    const fetchFn = vi.fn().mockResolvedValue(
      new Response("File Not Found in Google Drive", {
        status: 404,
        statusText: "Not Found",
      })
    ) as unknown as typeof fetch;

    const service = new DashboardSyncService({
      authProvider,
      spreadsheetParser,
      dbPool,
      fetchFn,
    });

    // Act & Assert: Call executeSync and assert failure with DRIVE_DOWNLOAD_FAILED
    await expect(service.executeSync()).rejects.toThrow(/DRIVE_DOWNLOAD_FAILED|DOWNLOAD_FAILED/);
  });

  /**
   * Test case d: Transaction rollback and client release when database query fails.
   * @spec BBC-018-SYNC-SERVICE
   */
  it("should rollback transaction and release client when a database query fails", async () => {
    // Arrange: Mock db client that throws error during table insert
    const authProvider = createMockAuthProvider();
    const spreadsheetParser = createMockSpreadsheetParser();
    const mockDbClient = {
      query: vi.fn().mockImplementation(async (sql: string) => {
        if (sql === "BEGIN") return { rows: [] };
        if (sql.includes("INSERT INTO")) {
          throw new Error("Neon PostgreSQL query failure: Deadlock detected");
        }
        if (sql === "ROLLBACK") return { rows: [] };
        return { rows: [] };
      }),
      release: vi.fn(),
    };
    const dbPool = createMockDbPool(mockDbClient);
    const fetchFn = createMockFetch();

    const service = new DashboardSyncService({
      authProvider,
      spreadsheetParser,
      dbPool,
      fetchFn,
    });

    // Act & Assert: Execute sync and ensure error is propagated, ROLLBACK is issued, and client is released
    await expect(service.executeSync()).rejects.toThrow();
    expect(mockDbClient.query).toHaveBeenCalledWith("ROLLBACK");
    expect(mockDbClient.release).toHaveBeenCalledTimes(1);
  });

  /**
   * Test case e: Authentication failure propagation from authProvider.
   * @spec BBC-018-SYNC-SERVICE
   */
  it("should throw AUTHENTICATION_FAILED when authProvider fails", async () => {
    // Arrange: Configure authProvider to reject with authentication error
    const authProvider: IGoogleAuthProviderPort = {
      getAccessToken: vi
        .fn()
        .mockRejectedValue(new Error("AUTHENTICATION_FAILED: Invalid Google Service Account private key")),
      invalidateCache: vi.fn(),
    };
    const spreadsheetParser = createMockSpreadsheetParser();
    const mockDbClient = createMockDbClient();
    const dbPool = createMockDbPool(mockDbClient);
    const fetchFn = createMockFetch();

    const service = new DashboardSyncService({
      authProvider,
      spreadsheetParser,
      dbPool,
      fetchFn,
    });

    // Act & Assert: Call executeSync and verify it throws AUTHENTICATION_FAILED
    await expect(service.executeSync()).rejects.toThrow(/AUTHENTICATION_FAILED/);
  });

  /**
   * Test case f: Verification of cron authorization tokens and constant-time string comparison.
   * @spec BBC-018-SYNC-SERVICE
   */
  it("should correctly verify cron authorization tokens using verifyCronAuthorization and constantTimeCompare", () => {
    // Arrange: Set up sample secrets, headers, and comparison pairs
    const secret = "test-cron-secret-abcdef123456";
    const validBearer = `Bearer ${secret}`;
    const wrongBearer = "Bearer wrong-secret-value-xyz";
    const malformedBearer = `Token ${secret}`;

    // Act: Evaluate authorization and string comparisons
    const authValid = verifyCronAuthorization(validBearer, secret);
    const authWrong = verifyCronAuthorization(wrongBearer, secret);
    const authMalformed = verifyCronAuthorization(malformedBearer, secret);
    const authMissing = verifyCronAuthorization(null, secret);
    const authUndefinedSecret = verifyCronAuthorization(validBearer, undefined);

    const compareSame = constantTimeCompare("secret123", "secret123");
    const compareDifferentSameLen = constantTimeCompare("secret123", "secret456");
    const compareDifferentLen = constantTimeCompare("secret123", "secret12345");
    const compareNonString = constantTimeCompare(null as unknown as string, "secret123");

    // Assert: Verify expected boolean outcomes
    expect(authValid).toBe(true);
    expect(authWrong).toBe(false);
    expect(authMalformed).toBe(false);
    expect(authMissing).toBe(false);
    expect(authUndefinedSecret).toBe(false);

    expect(compareSame).toBe(true);
    expect(compareDifferentSameLen).toBe(false);
    expect(compareDifferentLen).toBe(false);
    expect(compareNonString).toBe(false);
  });

  /**
   * Test case g: Atomically prune stale opportunities not present in active workbook.
   * @spec BBC-018-DEDUPLICATE-PRUNE
   */
  it("should atomically prune stale opportunities not present in active workbook", async () => {
    // Arrange: Configure active workbook containing only 'MB-07' opportunity
    const authProvider = createMockAuthProvider();
    const mockWorkbook = createMockWorkbook({
      oportunidades: [
        {
          id: "MB-07",
          titulo: "Mulberry Phase 7",
          ciudad: "Tampa Bay",
          roiProyectado: 16,
          inversionMinima: 25000,
          diasRestantes: 20,
          gradient: "from-blue-600 to-indigo-600",
        },
      ],
    });
    const spreadsheetParser = createMockSpreadsheetParser(mockWorkbook);
    const mockDbClient = createMockDbClient();
    const dbPool = createMockDbPool(mockDbClient);
    const fetchFn = createMockFetch();

    const service = new DashboardSyncService({
      authProvider,
      spreadsheetParser,
      dbPool,
      fetchFn,
    });

    // Act: Execute synchronization
    const result = await service.executeSync();

    // Assert: Verify atomic pruning queries delete records with id_oportunidad != ALL(['MB-07']) and id != ALL(['MB-07'])
    expect(mockDbClient.query).toHaveBeenCalledWith(
      expect.stringMatching(/DELETE\s+FROM\s+dashboard_opportunities\s+WHERE\s+id_oportunidad\s+(!=\s*ALL\(\$1(?:::varchar\[\])?\)|NOT\s+IN)/i),
      [["MB-07"]]
    );
    expect(mockDbClient.query).toHaveBeenCalledWith(
      expect.stringMatching(/DELETE\s+FROM\s+reinvestment_opportunities\s+WHERE\s+id\s+(!=\s*ALL\(\$1(?:::varchar\[\])?\)|NOT\s+IN)/i),
      [["MB-07"]]
    );
    expect(result.success).toBe(true);
  });
});
