/**
 * ============================================================================
 * @file tests/unit/dashboard-sync-service-batching.test.ts
 * @description Layer 2 & Domain: Unit Test Suite for DashboardSyncService Resilient Batching
 * ============================================================================
 * Purpose: Verifies PostgreSQL UNNEST batching, pre-transaction media I/O decoupling,
 * distributed advisory locking (4242424200001), and anti-wipe circuit-breaker integration.
 *
 * Invariants Tested:
 *  - External media downloads/uploads complete BEFORE client.query('BEGIN').
 *  - Distributed 64-bit advisory lock prevents concurrent executions.
 *  - Circuit breaker trips and rolls back if entity count drops >20%.
 *  - Circuit breaker can be bypassed with forceBypassCircuitBreaker: true.
 *  - Project phases are upserted in a single batched UNNEST query.
 *
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 *
 * @spec BBC-021
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  DashboardSyncService,
  DASHBOARD_SYNC_ADVISORY_LOCK_ID,
} from '@/features/ai-ingestion/application/services/dashboard-sync-service';
import { CanonicalDashboardWorkbook } from '@/features/ai-ingestion/domain/schemas/canonical-dashboard-schema';

describe('BBC-021: DashboardSyncService Resilient Batching & Circuit Breaker (@spec BBC-021)', () => {
  let mockClient: { query: ReturnType<typeof vi.fn>; release: ReturnType<typeof vi.fn> };
  let mockDbPool: { connect: ReturnType<typeof vi.fn> };
  let mockAuthProvider: { getAccessToken: ReturnType<typeof vi.fn> };
  let mockSpreadsheetParser: { parseDashboardWorkbook: ReturnType<typeof vi.fn> };
  let mockFolderReader: {
    listImageFiles: ReturnType<typeof vi.fn>;
    downloadImageBinary: ReturnType<typeof vi.fn>;
  };
  let mockBlobStorage: {
    uploadBlob: ReturnType<typeof vi.fn>;
    deleteBlob: ReturnType<typeof vi.fn>;
  };
  let queryHistory: string[];

  const sampleWorkbook: CanonicalDashboardWorkbook = {
    proyectos: [
      {
        idInversion: 'PROJ-01',
        nombre: 'Proyecto Test',
        ciudad: 'Bogotá',
        tipoPropiedad: 'Comercial',
        tipoProyecto: 'Desarrollo',
        montoObjetivo: 1000000,
        rentabilidadEstimada: 12.5,
        plazoMeses: 24,
        estado: 'ACTIVO',
      } as any,
    ],
    inversionistas: [
      {
        idInversionista: 'INV-01',
        nombreCompleto: 'Juan Perez',
        email: 'juan@test.com',
      } as any,
    ],
    inversiones: [
      {
        idInversion: 'PROJ-01',
        idInversionista: 'INV-01',
        montoInvertido: 50000,
      } as any,
    ],
    fases: [
      {
        idFase: 'FASE-01',
        idInversion: 'PROJ-01',
        nombreFase: 'Cimentación',
        orden: 1,
        estado: 'COMPLETADO',
        porcentajeAvance: 100,
        folderUrl: 'https://drive.google.com/drive/folders/1ABC_xyz_FOLDER_00123456789',
      } as any,
      {
        idFase: 'FASE-02',
        idInversion: 'PROJ-01',
        nombreFase: 'Estructura',
        orden: 2,
        estado: 'EN_PROGRESO',
        porcentajeAvance: 40,
        folderUrl: null,
      } as any,
    ],
    oportunidades: [],
    transacciones: [],
    resumenes: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    queryHistory = [];

    mockClient = {
      query: vi.fn(async (sql: string, params?: unknown[]) => {
        queryHistory.push(sql);

        // Advisory lock check
        if (sql.includes('pg_try_advisory_lock')) {
          return { rows: [{ acquired: true }] };
        }
        // Advisory unlock
        if (sql.includes('pg_advisory_unlock')) {
          return { rows: [{ unlocked: true }] };
        }
        // DB entity counts for circuit breaker
        if (sql.includes('COUNT(*)') || sql.includes('count(*)')) {
          return {
            rows: [
              {
                proyectos_count: '1',
                inversionistas_count: '1',
                inversiones_count: '1',
                fases_count: '2',
              },
            ],
          };
        }
        // Existing media assets query
        if (sql.includes('media_assets')) {
          return { rows: [] };
        }
        // Existing phases
        if (sql.includes('dashboard_project_phases')) {
          return { rows: [] };
        }
        return { rows: [] };
      }),
      release: vi.fn(),
    };

    mockDbPool = {
      connect: vi.fn().mockResolvedValue(mockClient),
    };

    mockAuthProvider = {
      getAccessToken: vi.fn().mockResolvedValue({ token: 'mock-google-token' }),
    };

    mockSpreadsheetParser = {
      parseDashboardWorkbook: vi.fn().mockResolvedValue(sampleWorkbook),
    };

    mockFolderReader = {
      listImageFiles: vi.fn().mockResolvedValue([
        { id: 'img-1', name: 'photo1.jpg', mimeType: 'image/jpeg' },
      ]),
      downloadImageBinary: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    };

    mockBlobStorage = {
      uploadBlob: vi.fn().mockResolvedValue({ url: 'https://blob.vercel-storage.com/photo1.jpg' }),
      deleteBlob: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('[@spec BBC-021:LOCK-01] should acquire 64-bit advisory lock before transaction and unlock in finally block', async () => {
    // Arrange
    const service = new DashboardSyncService({
      authProvider: mockAuthProvider as any,
      spreadsheetParser: mockSpreadsheetParser as any,
      dbPool: mockDbPool as any,
      folderReader: mockFolderReader as any,
      blobStorage: mockBlobStorage as any,
      fetchFn: vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(1024),
      } as any),
    });

    // Act
    const result = await service.executeSync();

    // Assert
    expect(result.success).toBe(true);
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('pg_try_advisory_lock'),
      expect.arrayContaining([DASHBOARD_SYNC_ADVISORY_LOCK_ID])
    );
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('pg_advisory_unlock'),
      expect.arrayContaining([DASHBOARD_SYNC_ADVISORY_LOCK_ID])
    );
  });

  it('[@spec BBC-021:DECOUPLE-IO-01] should download Drive folder images and upload blobs BEFORE client.query("BEGIN")', async () => {
    // Arrange
    let beginCalled = false;
    let driveDownloadCalledBeforeBegin = false;
    let blobUploadCalledBeforeBegin = false;

    mockClient.query = vi.fn(async (sql: string) => {
      queryHistory.push(sql);
      if (sql.includes('BEGIN')) {
        beginCalled = true;
      }
      if (sql.includes('pg_try_advisory_lock')) {
        return { rows: [{ acquired: true }] };
      }
      if (sql.includes('COUNT(*)')) {
        return {
          rows: [
            {
              proyectos_count: '1',
              inversionistas_count: '1',
              inversiones_count: '1',
              fases_count: '2',
            },
          ],
        };
      }
      return { rows: [] };
    });

    mockFolderReader.downloadImageBinary = vi.fn(async () => {
      if (!beginCalled) {
        driveDownloadCalledBeforeBegin = true;
      }
      return new Uint8Array([1, 2, 3]);
    });

    mockBlobStorage.uploadBlob = vi.fn(async () => {
      if (!beginCalled) {
        blobUploadCalledBeforeBegin = true;
      }
      return { url: 'https://blob.vercel-storage.com/photo1.jpg' };
    });

    const service = new DashboardSyncService({
      authProvider: mockAuthProvider as any,
      spreadsheetParser: mockSpreadsheetParser as any,
      dbPool: mockDbPool as any,
      folderReader: mockFolderReader as any,
      blobStorage: mockBlobStorage as any,
      fetchFn: vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(1024),
      } as any),
    });

    // Act
    await service.executeSync();

    // Assert: Drive download and Blob upload MUST happen before transaction BEGIN
    expect(driveDownloadCalledBeforeBegin).toBe(true);
    expect(blobUploadCalledBeforeBegin).toBe(true);
  });

  it('[@spec BBC-021:CIRCUIT-BREAKER-01] should abort with ROLLBACK and throw CircuitBreakerError if entity drop exceeds 20%', async () => {
    // Arrange: DB currently has 100 projects, but incoming workbook has only 1 project (>20% drop)
    mockClient.query = vi.fn(async (sql: string) => {
      queryHistory.push(sql);
      if (sql.includes('pg_try_advisory_lock')) {
        return { rows: [{ acquired: true }] };
      }
      if (sql.includes('COUNT(*)')) {
        return {
          rows: [
            {
              proyectos_count: '100',
              inversionistas_count: '50',
              inversiones_count: '50',
              fases_count: '200',
            },
          ],
        };
      }
      return { rows: [] };
    });

    const service = new DashboardSyncService({
      authProvider: mockAuthProvider as any,
      spreadsheetParser: mockSpreadsheetParser as any,
      dbPool: mockDbPool as any,
      fetchFn: vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(1024),
      } as any),
    });

    // Act & Assert
    await expect(service.executeSync()).rejects.toThrow(/circuit breaker/i);
    expect(queryHistory.some((q) => q.includes('ROLLBACK'))).toBe(true);
    expect(queryHistory.some((q) => q.includes('COMMIT'))).toBe(false);
  });

  it('[@spec BBC-021:CIRCUIT-BREAKER-02] should permit sync when forceBypassCircuitBreaker: true even with >20% drop', async () => {
    // Arrange: DB has 100 projects, incoming has 1, but forceBypass is true
    mockClient.query = vi.fn(async (sql: string) => {
      queryHistory.push(sql);
      if (sql.includes('pg_try_advisory_lock')) {
        return { rows: [{ acquired: true }] };
      }
      if (sql.includes('COUNT(*)')) {
        return {
          rows: [
            {
              proyectos_count: '100',
              inversionistas_count: '50',
              inversiones_count: '50',
              fases_count: '200',
            },
          ],
        };
      }
      return { rows: [] };
    });

    const service = new DashboardSyncService({
      authProvider: mockAuthProvider as any,
      spreadsheetParser: mockSpreadsheetParser as any,
      dbPool: mockDbPool as any,
      fetchFn: vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(1024),
      } as any),
    });

    // Act
    const result = await service.executeSync({ forceBypassCircuitBreaker: true });

    // Assert
    expect(result.success).toBe(true);
    expect(queryHistory.some((q) => q.includes('COMMIT'))).toBe(true);
  });

  it('[@spec BBC-021:BATCH-UNNEST-01] should execute phase upserts using a single UNNEST query rather than iterative loops', async () => {
    // Arrange
    const service = new DashboardSyncService({
      authProvider: mockAuthProvider as any,
      spreadsheetParser: mockSpreadsheetParser as any,
      dbPool: mockDbPool as any,
      fetchFn: vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(1024),
      } as any),
    });

    // Act
    await service.executeSync();

    // Assert: Check queryHistory for UNNEST query on dashboard_project_phases
    const phaseQueries = queryHistory.filter((q) => q.includes('dashboard_project_phases'));
    const unnestPhaseQuery = phaseQueries.find((q) => q.includes('UNNEST'));
    expect(unnestPhaseQuery).toBeDefined();
  });

  it('[@spec BBC-021:GSHEET-EXPORT-01] should directly export native Google Sheets documents using the /export endpoint', async () => {
    // Arrange: /export returns 200 OK with exported spreadsheet binary
    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/export')) {
        return {
          ok: true,
          status: 200,
          arrayBuffer: async () => new ArrayBuffer(1024),
        };
      }
      return { ok: false, status: 404 };
    });

    const service = new DashboardSyncService({
      authProvider: mockAuthProvider as any,
      spreadsheetParser: mockSpreadsheetParser as any,
      dbPool: mockDbPool as any,
      fetchFn: mockFetch as any,
    });

    // Act
    const result = await service.executeSync();

    // Assert
    expect(result.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/export?mimeType=application%2Fvnd.openxmlformats-officedocument.spreadsheetml.sheet'),
      expect.any(Object)
    );
  });

  it('[@spec BBC-021:GSHEET-EXPORT-02] should reject raw binary .xlsx files with informative error', async () => {
    // Arrange: /export returns 400 when invoked against binary files
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request - Export only supports Docs Editors files',
    });

    const service = new DashboardSyncService({
      authProvider: mockAuthProvider as any,
      spreadsheetParser: mockSpreadsheetParser as any,
      dbPool: mockDbPool as any,
      fetchFn: mockFetch as any,
    });

    // Act & Assert
    await expect(service.executeSync()).rejects.toThrow(
      /Only native Google Sheets documents \(application\/vnd\.google-apps\.spreadsheet\) are supported/
    );
  });
});
