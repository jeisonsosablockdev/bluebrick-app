/**
 * @file tests/unit/drive-blob-sync-dedup.test.ts
 * @description Unit test suite for Google Drive folder image sync to Vercel Blob and media deduplication.
 *
 * Requirements tested per SPEC-2:
 *  - @spec BBC-8-SPEC-2-DRIVE-BLOB-SYNC: When phase has folderUrl, discovers Drive images, uploads to Vercel Blob, and populates dashboard_project_phases.
 *  - @spec BBC-8-SPEC-2-DEDUPLICATION: Reuses existing blob_url for previously ingested drive_file_id without re-downloading or re-uploading.
 *  - @spec BBC-8-SPEC-2-ERROR-RESILIENCE: Gracefully handles Drive folder read errors without breaking the sync transaction.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  DashboardSyncService,
  DashboardSyncServiceDependencies,
  IDashboardDbPool,
  IDashboardDbClient,
} from "@/features/ai-ingestion/application/services/dashboard-sync-service";
import { IGoogleAuthProviderPort } from "@/features/ai-ingestion/domain/ports/google-auth-port";
import { ISpreadsheetParserPort } from "@/features/ai-ingestion/domain/ports/spreadsheet-parser-port";
import { IDriveFolderReaderPort, DriveImageFileInfo } from "@/features/ai-ingestion/domain/ports/drive-folder-reader-port";
import { IBlobStoragePort, BlobUploadOptions, BlobUploadResult } from "@/features/ai-ingestion/domain/ports/blob-storage-port";
import { CanonicalDashboardWorkbook } from "@/features/ai-ingestion/domain/schemas/canonical-dashboard-schema";

describe("BBC-8 SPEC-2: Drive Folder Sync & Blob Deduplication", () => {
  let mockAuth: IGoogleAuthProviderPort;
  let mockParser: ISpreadsheetParserPort;
  let mockFolderReader: IDriveFolderReaderPort;
  let mockBlobStorage: IBlobStoragePort;
  let mockClient: IDashboardDbClient;
  let mockDbPool: IDashboardDbPool;
  let executedQueries: Array<{ sql: string; params?: any[] }>;

  const baseWorkbook: CanonicalDashboardWorkbook = {
    proyectos: [],
    inversionistas: [],
    inversiones: [],
    fases: [
      {
        idFase: "FASE-0001",
        idInversion: "BG-01",
        orden: 1,
        nombreFase: "1. Adquisición",
        estado: "Completada",
        fechaInicio: "2026-01-01",
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
    };

    mockClient = {
      query: vi.fn().mockImplementation(async (sql: string, params?: any[]) => {
        executedQueries.push({ sql, params });

        // If querying media_assets for existing assets
        if (sql.includes("FROM media_assets")) {
          return { rows: [] };
        }

        return { rows: [] };
      }),
      release: vi.fn(),
    };

    mockDbPool = {
      connect: vi.fn().mockResolvedValue(mockClient),
    };
  });

  it("should discover Drive images, upload to Vercel Blob, and save to dashboard_project_phases (@spec BBC-8-SPEC-2-DRIVE-BLOB-SYNC)", async () => {
    const discoveredFiles: DriveImageFileInfo[] = [
      {
        id: "drive-img-1",
        name: "foto_obra_1.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 102400,
        modifiedTime: "2026-01-15T10:00:00Z",
        md5Checksum: "md5-img-1",
      },
      {
        id: "drive-img-2",
        name: "foto_obra_2.png",
        mimeType: "image/png",
        sizeBytes: 204800,
        modifiedTime: "2026-01-16T10:00:00Z",
        md5Checksum: "md5-img-2",
      },
    ];

    vi.mocked(mockFolderReader.listImageFiles).mockResolvedValue(discoveredFiles);
    vi.mocked(mockFolderReader.downloadImageBinary).mockResolvedValue(Buffer.from("mock-binary"));

    vi.mocked(mockBlobStorage.uploadBlob).mockImplementation(async (opts: BlobUploadOptions): Promise<BlobUploadResult> => ({
      url: `https://public.blob.vercel-storage.com/${opts.driveFileId}.jpg`,
      pathname: `projects/${opts.projectId}/${opts.filename}`,
      contentType: opts.contentType,
      sizeBytes: opts.data.byteLength,
    }));

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => new ArrayBuffer(8),
    } as Response);

    const service = new DashboardSyncService({
      authProvider: mockAuth,
      spreadsheetParser: mockParser,
      dbPool: mockDbPool,
      fetchFn: mockFetch as any,
      folderReader: mockFolderReader,
      blobStorage: mockBlobStorage,
    });

    const result = await service.executeSync();
    expect(result.success).toBe(true);

    // Step 1: Verify folderReader was called with extracted folder ID
    expect(mockFolderReader.listImageFiles).toHaveBeenCalledWith("1ABC_xyz_FOLDER_001");

    // Step 2: Verify binary download and Vercel Blob upload for each new image
    expect(mockFolderReader.downloadImageBinary).toHaveBeenCalledTimes(2);
    expect(mockBlobStorage.uploadBlob).toHaveBeenCalledTimes(2);

    // Step 3: Verify dashboard_project_phases upsert contains folder_url and imagenes
    const phaseUpsert = executedQueries.find((q) => q.sql.includes("INSERT INTO dashboard_project_phases"));
    expect(phaseUpsert).toBeDefined();
    expect(phaseUpsert?.sql).toContain("folder_url");
    expect(phaseUpsert?.sql).toContain("imagenes");
    expect(phaseUpsert?.params).toContain("https://drive.google.com/drive/folders/1ABC_xyz_FOLDER_001");
    // Verify parameters include the Vercel Blob URLs
    expect(phaseUpsert?.params).toEqual(
      expect.arrayContaining([
        expect.arrayContaining([
          "https://public.blob.vercel-storage.com/drive-img-1.jpg",
          "https://public.blob.vercel-storage.com/drive-img-2.jpg",
        ]),
      ])
    );
  });

  it("should deduplicate existing images in media_assets without re-downloading or re-uploading (@spec BBC-8-SPEC-2-DEDUPLICATION)", async () => {
    const discoveredFiles: DriveImageFileInfo[] = [
      {
        id: "drive-img-existing",
        name: "foto_obra_antigua.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 102400,
        modifiedTime: "2026-01-10T10:00:00Z",
        md5Checksum: "md5-existing",
      },
    ];

    vi.mocked(mockFolderReader.listImageFiles).mockResolvedValue(discoveredFiles);

    // Simulate media_assets already having drive-img-existing
    mockClient.query = vi.fn().mockImplementation(async (sql: string, params?: any[]) => {
      executedQueries.push({ sql, params });

      if (sql.includes("FROM media_assets")) {
        return {
          rows: [
            {
              drive_file_id: "drive-img-existing",
              blob_url: "https://public.blob.vercel-storage.com/already-uploaded.jpg",
            },
          ],
        };
      }

      return { rows: [] };
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => new ArrayBuffer(8),
    } as Response);

    const service = new DashboardSyncService({
      authProvider: mockAuth,
      spreadsheetParser: mockParser,
      dbPool: mockDbPool,
      fetchFn: mockFetch as any,
      folderReader: mockFolderReader,
      blobStorage: mockBlobStorage,
    });

    await service.executeSync();

    // Invariant: Zero downloads and zero uploads because image was deduplicated
    expect(mockFolderReader.downloadImageBinary).not.toHaveBeenCalled();
    expect(mockBlobStorage.uploadBlob).not.toHaveBeenCalled();

    // Reused existing blob URL in phases upsert
    const phaseUpsert = executedQueries.find((q) => q.sql.includes("INSERT INTO dashboard_project_phases"));
    expect(phaseUpsert).toBeDefined();
    expect(phaseUpsert?.params).toEqual(
      expect.arrayContaining([
        expect.arrayContaining(["https://public.blob.vercel-storage.com/already-uploaded.jpg"]),
      ])
    );
  });

  it("should gracefully handle Drive folder read errors without breaking the sync transaction (@spec BBC-8-SPEC-2-ERROR-RESILIENCE)", async () => {
    vi.mocked(mockFolderReader.listImageFiles).mockRejectedValue(
      new Error("Google Drive API rate limit or folder not accessible")
    );

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => new ArrayBuffer(8),
    } as Response);

    const service = new DashboardSyncService({
      authProvider: mockAuth,
      spreadsheetParser: mockParser,
      dbPool: mockDbPool,
      fetchFn: mockFetch as any,
      folderReader: mockFolderReader,
      blobStorage: mockBlobStorage,
    });

    const result = await service.executeSync();
    expect(result.success).toBe(true);

    // Invariant: Non-fatal error in folder reader allows the overall transaction to commit
    const phaseUpsert = executedQueries.find((q) => q.sql.includes("INSERT INTO dashboard_project_phases"));
    expect(phaseUpsert).toBeDefined();
    expect(phaseUpsert?.params).toContain("https://drive.google.com/drive/folders/1ABC_xyz_FOLDER_001");
  });
});

