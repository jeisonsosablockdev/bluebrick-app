/**
 * ============================================================================
 * @file tests/unit/blob-orphan-pruning.test.ts
 * @description Layer 2, Layer 4 & QA: Comprehensive Unit Test Suite for Vercel Blob
 * orphan pruning, media asset maintenance, and InvestmentRepository enrichment.
 * ============================================================================
 * Purpose: Verifies automated pruning of orphaned Vercel Blob assets when photos
 * are removed from Google Drive folders, ensuring edge storage hygiene, transactional
 * resilience, and backwards-compatible repository hydration.
 *
 * Invariants Tested:
 *  - Orphan Detection: Identifies previous Vercel Blob URLs no longer present in Google Drive.
 *  - Edge Cleanup: Invokes IBlobStoragePort.deleteBlob and prunes media_assets table.
 *  - Shared Asset Guard: Retains blobs if referenced by another active project phase.
 *  - Graceful Degradation: Blob deletion errors never abort the primary sync transaction.
 *  - Repository Prioritization: Reads row.imagenes first with fallback to scalar columns.
 *
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 *
 * @spec BBC-8-SPEC-3-ORPHAN-PRUNING, BBC-8-SPEC-3-REPOSITORY-ENRICHMENT
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  DashboardSyncService,
  IDashboardDbClient,
  IDashboardDbPool,
} from "@/features/ai-ingestion/application/services/dashboard-sync-service";
import { IGoogleAuthProviderPort } from "@/features/ai-ingestion/domain/ports/google-auth-port";
import { ISpreadsheetParserPort } from "@/features/ai-ingestion/domain/ports/spreadsheet-parser-port";
import { IDriveFolderReaderPort } from "@/features/ai-ingestion/domain/ports/drive-folder-reader-port";
import { IBlobStoragePort } from "@/features/ai-ingestion/domain/ports/blob-storage-port";
import { CanonicalDashboardWorkbook } from "@/features/ai-ingestion/domain/schemas/canonical-dashboard-schema";
import { InvestmentRepository } from "@/lib/infrastructure/db/repositories/investment-repository";
import type { DatabaseExecutor } from "@/lib/infrastructure/db/neon-client";
import type { DbClientRow } from "@/lib/types/db";

describe("SPEC-3: Vercel Blob Orphan Pruning & Repository Enrichment (@spec BBC-8-SPEC-3)", () => {
  let mockAuth: IGoogleAuthProviderPort;
  let mockParser: ISpreadsheetParserPort;
  let mockFolderReader: IDriveFolderReaderPort;
  let mockBlobStorage: IBlobStoragePort;
  let mockDbPool: IDashboardDbPool;
  let executedQueries: Array<{ sql: string; params?: unknown[] }>;

  const baseWorkbook: CanonicalDashboardWorkbook = {
    proyectos: [
      {
        idInversion: "PROJ-BG-01",
        nombre: "Bush Garden Modern",
        ciudad: "Miami",
        tipoProyecto: "Residencial",
        duracionMeses: 6,
        faseActual: "1. Cimentación",
        avanceFasePct: 50,
        driveUrl: null,
      },
    ],
    inversionistas: [],
    inversiones: [],
    fases: [
      {
        idFase: "FASE-01",
        idInversion: "PROJ-BG-01",
        orden: 1,
        nombreFase: "Cimentación y Estructura",
        estado: "En curso",
        fechaInicio: "2025-02-01",
        fechaFin: "2026-02-01",
        folderUrl: "https://drive.google.com/drive/folders/1ABC_xyz_FOLDER_001",
        imagenes: [],
      },
    ],
    oportunidades: [],
    transacciones: [],
    resumenes: [],
  };

  beforeEach(() => {
    executedQueries = [];

    mockAuth = {
      getAccessToken: vi.fn().mockResolvedValue({
        token: "mock-token",
        expiresAtUtc: Date.now() + 3600000,
        tokenType: "Bearer" as const,
      }),
      invalidateCache: vi.fn().mockResolvedValue(undefined),
    };

    mockParser = {
      parseSpreadsheet: vi.fn(),
      parseDashboardWorkbook: vi.fn().mockResolvedValue(baseWorkbook),
    };

    mockFolderReader = {
      listImageFiles: vi.fn(),
      downloadImageBinary: vi.fn(),
    };

    mockBlobStorage = {
      uploadBlob: vi.fn(),
      deleteBlob: vi.fn().mockResolvedValue(undefined),
    };

    const mockClient: IDashboardDbClient = {
      query: vi.fn(async (sql: string, params?: unknown[]) => {
        executedQueries.push({ sql, params });

        // Simulate reading previous phase record with existing images
        if (sql.includes("SELECT folder_url, imagenes FROM dashboard_project_phases WHERE id = $1")) {
          return {
            rows: [
              {
                folder_url: "https://drive.google.com/drive/folders/1ABC_xyz_FOLDER_001",
                imagenes: [
                  "https://public.blob.vercel-storage.com/projects/PROJ-BG-01/file1-retained.jpg",
                  "https://public.blob.vercel-storage.com/projects/PROJ-BG-01/file2-orphan.jpg",
                ],
              },
            ],
          };
        }

        // Simulate deduplication query for active drive files
        if (sql.includes("SELECT drive_file_id, blob_url FROM media_assets WHERE drive_file_id = ANY($1::varchar[])")) {
          return {
            rows: [
              {
                drive_file_id: "DRIVE-IMG-RETAINED",
                blob_url: "https://public.blob.vercel-storage.com/projects/PROJ-BG-01/file1-retained.jpg",
              },
            ],
          };
        }

        // Simulate check if orphan blob is referenced by another phase
        if (sql.includes("SELECT 1 FROM dashboard_project_phases WHERE id != $1 AND $2 = ANY(imagenes)")) {
          return { rows: [] }; // Not referenced elsewhere -> safe to prune
        }

        return { rows: [] };
      }),
      release: vi.fn(),
    };

    mockDbPool = {
      connect: vi.fn().mockResolvedValue(mockClient),
    };
  });

  describe("Orphan Blob Pruning in DashboardSyncService", () => {
    it("prunes orphaned Vercel Blobs when photos are deleted from Drive folder (@spec BBC-8-SPEC-3-ORPHAN-PRUNING)", async () => {
      // Step 1: Arrange - Drive folder now only contains DRIVE-IMG-RETAINED (file2 was deleted in Drive)
      vi.mocked(mockFolderReader.listImageFiles).mockResolvedValue([
        {
          id: "DRIVE-IMG-RETAINED",
          name: "foundation-01.jpg",
          mimeType: "image/jpeg",
          sizeBytes: 150000,
          modifiedTime: "2026-01-01T00:00:00Z",
        },
      ]);

      const service = new DashboardSyncService({
        authProvider: mockAuth,
        spreadsheetParser: mockParser,
        dbPool: mockDbPool,
        folderReader: mockFolderReader,
        blobStorage: mockBlobStorage,
        fetchFn: vi.fn().mockResolvedValue(new Response("dummy-binary")),
      });

      // Step 2: Act
      const result = await service.executeSync({ fileId: "MOCK_DASHBOARD_ID" });

      // Step 3: Assert
      expect(result.success).toBe(true);

      // Verify that deleteBlob was called for the orphaned image
      expect(mockBlobStorage.deleteBlob).toHaveBeenCalledWith(
        "https://public.blob.vercel-storage.com/projects/PROJ-BG-01/file2-orphan.jpg"
      );

      // Verify that media_assets pruned the orphan record
      const deleteAssetQuery = executedQueries.find((q) =>
        q.sql.includes("DELETE FROM media_assets WHERE blob_url = $1")
      );
      expect(deleteAssetQuery).toBeDefined();
      expect(deleteAssetQuery?.params).toEqual([
        "https://public.blob.vercel-storage.com/projects/PROJ-BG-01/file2-orphan.jpg",
      ]);
    });

    it("does NOT prune blob if it is still referenced by another phase (@spec BBC-8-SPEC-3-SHARED-GUARD)", async () => {
      // Step 1: Arrange - Mock DB returning another phase referencing file2-orphan.jpg
      const mockClient: IDashboardDbClient = {
        query: vi.fn(async (sql: string, params?: unknown[]) => {
          executedQueries.push({ sql, params });

          if (sql.includes("SELECT folder_url, imagenes FROM dashboard_project_phases WHERE id = $1")) {
            return {
              rows: [
                {
                  folder_url: "https://drive.google.com/drive/folders/1ABC_xyz_FOLDER_001",
                  imagenes: [
                    "https://public.blob.vercel-storage.com/projects/PROJ-BG-01/file1-retained.jpg",
                    "https://public.blob.vercel-storage.com/projects/PROJ-BG-01/file2-shared.jpg",
                  ],
                },
              ],
            };
          }

          if (sql.includes("SELECT 1 FROM dashboard_project_phases WHERE id != $1 AND $2 = ANY(imagenes)")) {
            // Another phase references this URL
            return { rows: [{ "?column?": 1 }] };
          }

          return { rows: [] };
        }),
        release: vi.fn(),
      };

      vi.mocked(mockDbPool.connect).mockResolvedValue(mockClient);
      vi.mocked(mockFolderReader.listImageFiles).mockResolvedValue([]);

      const service = new DashboardSyncService({
        authProvider: mockAuth,
        spreadsheetParser: mockParser,
        dbPool: mockDbPool,
        folderReader: mockFolderReader,
        blobStorage: mockBlobStorage,
        fetchFn: vi.fn().mockResolvedValue(new Response("dummy-binary")),
      });

      // Step 2: Act
      // Step 2: Act
      const result = await service.executeSync({ fileId: "MOCK_DASHBOARD_ID" });

      // Step 3: Assert - Shared URL must NOT be deleted from Blob storage
      expect(result.success).toBe(true);
      expect(mockBlobStorage.deleteBlob).not.toHaveBeenCalled();
    });

    it("handles deleteBlob errors gracefully without failing synchronization (@spec BBC-8-SPEC-3-DEGRADATION)", async () => {
      // Step 1: Arrange - deleteBlob throws network error
      vi.mocked(mockFolderReader.listImageFiles).mockResolvedValue([]);
      vi.mocked(mockBlobStorage.deleteBlob!).mockRejectedValue(new Error("Vercel Blob 503 Service Unavailable"));

      const service = new DashboardSyncService({
        authProvider: mockAuth,
        spreadsheetParser: mockParser,
        dbPool: mockDbPool,
        folderReader: mockFolderReader,
        blobStorage: mockBlobStorage,
        fetchFn: vi.fn().mockResolvedValue(new Response("dummy-binary")),
      });

      // Step 2: Act
      const result = await service.executeSync({ fileId: "MOCK_DASHBOARD_ID" });

      // Step 3: Assert - Primary transaction should commit without throwing
      expect(result.success).toBe(true);
      const commitQuery = executedQueries.find((q) => q.sql === "COMMIT");
      expect(commitQuery).toBeDefined();
    });
  });

  describe("InvestmentRepository Phase Images Hydration", () => {
    it("hydrates phase images preferentially from row.imagenes (@spec BBC-8-SPEC-3-REPOSITORY-ENRICHMENT)", async () => {
      // Step 1: Arrange mock client and phase rows
      const mockClientRow: DbClientRow = {
        id: "client-uuid-1",
        name: "Test Client",
        tax_id: "PROJ-BG-01",
        email: "test@example.com",
        contract_amount: "50000",
        status: "ACTIVE",
        metadata: {
          project: "Bush Garden Modern",
          property_id: "PROJ-BG-01",
        },
      };

      const mockPhaseRow = {
        id: "FASE-01_PROJ-BG-01",
        id_fase: "FASE-01",
        id_inversion: "PROJ-BG-01",
        orden: 1,
        nombre_fase: "Cimentación",
        estado: "Completada" as const,
        fecha_inicio: "2025-01-01",
        fecha_fin: "2025-06-01",
        imagenes: [
          "https://public.blob.vercel-storage.com/projects/PROJ-BG-01/blob-img-1.jpg",
          "https://public.blob.vercel-storage.com/projects/PROJ-BG-01/blob-img-2.jpg",
          "https://public.blob.vercel-storage.com/projects/PROJ-BG-01/blob-img-3.jpg",
          "https://public.blob.vercel-storage.com/projects/PROJ-BG-01/blob-img-4.jpg",
        ],
        imagen_url_1: "https://example.com/fallback-1.jpg",
        imagen_url_2: "https://example.com/fallback-2.jpg",
        imagen_url_3: null,
      };

      const mockDbExecutor: DatabaseExecutor = {
        query: vi.fn(async (sql: string) => {
          if (sql.includes("FROM clients")) {
            return { rows: [mockClientRow] };
          }
          if (sql.includes("FROM dashboard_project_phases")) {
            return { rows: [mockPhaseRow] };
          }
          return { rows: [] };
        }) as unknown as DatabaseExecutor["query"],
      };

      const repo = new InvestmentRepository(mockDbExecutor);

      // Step 2: Act
      const summary = await repo.getPortfolioSummary("test@example.com");

      // Step 3: Assert
      expect(summary.items.length).toBe(1);
      const phases = summary.items[0].phases;
      expect(phases).toBeDefined();
      expect(phases!.length).toBe(1);
      expect(phases![0].images).toEqual([
        "https://public.blob.vercel-storage.com/projects/PROJ-BG-01/blob-img-1.jpg",
        "https://public.blob.vercel-storage.com/projects/PROJ-BG-01/blob-img-2.jpg",
        "https://public.blob.vercel-storage.com/projects/PROJ-BG-01/blob-img-3.jpg",
        "https://public.blob.vercel-storage.com/projects/PROJ-BG-01/blob-img-4.jpg",
      ]);
    });

    it("falls back to imagen_url_1..3 when row.imagenes is empty or null (@spec BBC-8-SPEC-3-FALLBACK)", async () => {
      // Step 1: Arrange mock phase row without row.imagenes
      const mockClientRow: DbClientRow = {
        id: "client-uuid-1",
        name: "Test Client",
        tax_id: "PROJ-BG-01",
        email: "test@example.com",
        contract_amount: "50000",
        status: "ACTIVE",
        metadata: {
          project: "Bush Garden Modern",
          property_id: "PROJ-BG-01",
        },
      };

      const mockPhaseRow = {
        id: "FASE-01_PROJ-BG-01",
        id_fase: "FASE-01",
        id_inversion: "PROJ-BG-01",
        orden: 1,
        nombre_fase: "Cimentación",
        estado: "Completada" as const,
        fecha_inicio: "2025-01-01",
        fecha_fin: "2025-06-01",
        imagenes: [], // Empty array
        imagen_url_1: "https://example.com/fallback-1.jpg",
        imagen_url_2: "https://example.com/fallback-2.jpg",
        imagen_url_3: null,
      };

      const mockDbExecutor: DatabaseExecutor = {
        query: vi.fn(async (sql: string) => {
          if (sql.includes("FROM clients")) {
            return { rows: [mockClientRow] };
          }
          if (sql.includes("FROM dashboard_project_phases")) {
            return { rows: [mockPhaseRow] };
          }
          return { rows: [] };
        }) as unknown as DatabaseExecutor["query"],
      };

      const repo = new InvestmentRepository(mockDbExecutor);

      // Step 2: Act
      const summary = await repo.getPortfolioSummary("test@example.com");

      // Step 3: Assert - Falls back to scalar columns, filtering out null
      expect(summary.items.length).toBe(1);
      const phases = summary.items[0].phases;
      expect(phases).toBeDefined();
      expect(phases![0].images).toEqual([
        "https://example.com/fallback-1.jpg",
        "https://example.com/fallback-2.jpg",
      ]);
    });
  });
});
