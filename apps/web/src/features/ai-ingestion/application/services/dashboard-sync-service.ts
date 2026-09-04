/**
 * ============================================================================
 * @file apps/web/src/features/ai-ingestion/application/services/dashboard-sync-service.ts
 * @description Layer 2: Application - Dashboard Excel Synchronization Service
 * ============================================================================
 * Purpose: Orchestrates end-to-end synchronization of the administrative Excel
 * workbook from Google Drive into the Neon PostgreSQL 7 relational dashboard tables.
 * 
 * Invariants:
 *  - Relies exclusively on Layer 3 Domain Ports (GoogleAuth, SpreadsheetParser).
 *  - Atomic transaction boundary: All 7 operational tables upsert or all rollback.
 *  - Atomic opportunity pruning: Obsolete opportunities deleted within the transaction boundary.
 *  - Fail-safe resource cleanup: Database client is guaranteed to be released back
 *    to the connection pool via try/finally block regardless of transaction outcome.
 *  - Zero direct UI or framework coupling; consumable by API route handlers & CLI scripts.
 * 
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 * 
 * @spec BBC-018-SYNC-SERVICE
 */

import { IGoogleAuthProviderPort } from "../../domain/ports/google-auth-port";
import { ISpreadsheetParserPort } from "../../domain/ports/spreadsheet-parser-port";
import { IDriveFolderReaderPort } from "../../domain/ports/drive-folder-reader-port";
import { IBlobStoragePort } from "../../domain/ports/blob-storage-port";
import { extractDriveFolderId } from "../../domain/utils/drive-folder-utils";
import {
  CanonicalDashboardWorkbook,
  CanonicalDashboardProject,
  CanonicalInvestor,
  CanonicalInvestment,
  CanonicalProjectPhase,
  CanonicalOpportunity,
  CanonicalReinvestmentTransaction,
  CanonicalInvestorSummary,
} from "../../domain/schemas/canonical-dashboard-schema";
import {
  DEFAULT_DASHBOARD_FILE_ID,
  DashboardSyncDomainError,
  DashboardSyncEntityCounts,
  DashboardSyncMetrics,
  DashboardSyncOptions,
  DashboardSyncResultDto,
} from "../../domain/models/dashboard-sync-models";

/** Known Vercel Blob hostnames for edge CDN asset filtering */
export const VERCEL_STORAGE_HOSTS = [
  "blob.vercel-storage.com",
  "vercel-storage.com",
] as const;

/**
 * Minimal database transaction client contract required for transactional operations.
 */
export interface IDashboardDbClient {
  /**
   * Executes a parameterized query against the active database transaction.
   * 
   * @param text - SQL query string with positional placeholders
   * @param params - Optional parameter values
   * @returns Promise resolving to the query result
   */
  query(text: string, params?: unknown[]): Promise<unknown>;

  /**
   * Releases the database client back to the pool.
   */
  release(): void;
}

/**
 * Minimal database pool contract required for acquiring transactional clients.
 */
export interface IDashboardDbPool {
  /**
   * Connects to the database pool and acquires a transactional client.
   * 
   * @returns Promise resolving to an acquired database client
   */
  connect(): Promise<IDashboardDbClient>;
}

/**
 * Dependency injection contracts required to instantiate DashboardSyncService.
 */
export interface DashboardSyncServiceDependencies {
  /** Provider for Google Drive OAuth2 Bearer tokens */
  readonly authProvider: IGoogleAuthProviderPort;
  /** Multi-sheet Excel workbook parser */
  readonly spreadsheetParser: ISpreadsheetParserPort;
  /** Database pool capable of providing transactional clients */
  readonly dbPool: IDashboardDbPool;
  /** Optional fetch function override for testing and custom HTTP dispatch */
  readonly fetchFn?: typeof fetch;
  /** Optional Drive folder reader port for construction phase image discovery */
  readonly folderReader?: IDriveFolderReaderPort;
  /** Optional Blob storage port for uploading edge CDN media assets */
  readonly blobStorage?: IBlobStoragePort;
}

/**
 * Public application service contract for dashboard synchronization.
 */
export interface IDashboardSyncService {
  /**
   * Executes the end-to-end synchronization process.
   * 
   * @param options - Execution configuration and optional file ID overrides
   * @returns Structured sync result DTO
   */
  executeSync(options?: DashboardSyncOptions): Promise<DashboardSyncResultDto>;
}

/**
 * Resolves the persistent identifier for a canonical opportunity,
 * falling back to a deterministic slug generated from the opportunity title.
 * 
 * @param opp - Canonical opportunity object with optional id and title
 * @returns Non-empty unique identifier string
 */
export function resolveOpportunityId(opp: { id?: string; titulo?: string }): string {
  const safeTitle = opp.titulo || "opp";
  return opp.id || "opp_" + safeTitle.toLowerCase().replace(/[^a-z0-9]/g, "_");
}

/**
 * Application Service managing periodic and on-demand synchronization of the
 * BlueBrick Administration Excel workbook.
 */
export class DashboardSyncService implements IDashboardSyncService {
  private readonly authProvider: IGoogleAuthProviderPort;
  private readonly spreadsheetParser: ISpreadsheetParserPort;
  private readonly dbPool: IDashboardDbPool;
  private readonly fetchFn: typeof fetch;
  private readonly folderReader?: IDriveFolderReaderPort;
  private readonly blobStorage?: IBlobStoragePort;

  /**
   * Initializes the DashboardSyncService with required domain ports and database pool.
   * 
   * @param dependencies - Injected domain ports, database pool, and optional fetch override
   */
  constructor(dependencies: DashboardSyncServiceDependencies) {
    this.authProvider = dependencies.authProvider;
    this.spreadsheetParser = dependencies.spreadsheetParser;
    this.dbPool = dependencies.dbPool;
    this.fetchFn = dependencies.fetchFn ?? fetch;
    this.folderReader = dependencies.folderReader;
    this.blobStorage = dependencies.blobStorage;
  }

  /**
   * Orchestrates the downloading, parsing, and atomic database upsert of the dashboard workbook.
   * 
   * @param options - Configuration options such as target file ID and auth refresh flags
   * @returns Promise resolving to the structured DashboardSyncResultDto
   * @throws {DashboardSyncDomainError} If authentication, download, parsing, or database queries fail
   */
  public async executeSync(options?: DashboardSyncOptions): Promise<DashboardSyncResultDto> {
    // Step 1: Pre-flight parameter resolution, start timers, and resolve target fileId
    const startTime = Date.now();
    const fileId = options?.fileId || DEFAULT_DASHBOARD_FILE_ID;

    // Step 2: Authenticate with Google Drive via authProvider port
    let authPayload;
    try {
      authPayload = await this.authProvider.getAccessToken(options?.forceRefreshAuth);
    } catch (authError: unknown) {
      const errMsg = authError instanceof Error ? authError.message : String(authError);
      // Preserve message if already prefixed/formatted with AUTHENTICATION_FAILED
      const finalMsg = errMsg.includes("AUTHENTICATION_FAILED")
        ? errMsg
        : `Failed to authenticate with Google Drive API: ${errMsg}`;
      throw new DashboardSyncDomainError("AUTHENTICATION_FAILED", finalMsg, false, authError);
    }

    // Step 3: Download Excel binary stream from Google Drive API v3
    const downloadStart = Date.now();
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`;
    let response: Response;
    try {
      response = await this.fetchFn(downloadUrl, {
        headers: {
          Authorization: `Bearer ${authPayload.token}`,
        },
      });
    } catch (fetchError: unknown) {
      const errMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);
      throw new DashboardSyncDomainError(
        "DRIVE_DOWNLOAD_FAILED",
        `Network error during Google Drive file download: ${errMsg}`,
        true,
        fetchError
      );
    }

    // Step 3.1: Validate HTTP status invariant from Google Drive API
    if (!response.ok) {
      throw new DashboardSyncDomainError(
        "DRIVE_DOWNLOAD_FAILED",
        `Failed to download dashboard workbook from Google Drive (HTTP ${response.status} ${response.statusText})`,
        response.status >= 500
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const downloadLatencyMs = Date.now() - downloadStart;

    // Step 4: Parse workbook and validate all 7 sheets via spreadsheetParser port
    const parseStart = Date.now();
    let workbookData: CanonicalDashboardWorkbook;
    try {
      workbookData = await this.spreadsheetParser.parseDashboardWorkbook(buffer, "dashboard.xlsx");
    } catch (parseError: unknown) {
      const errMsg = parseError instanceof Error ? parseError.message : String(parseError);
      throw new DashboardSyncDomainError(
        "PARSING_FAILED",
        `Failed to parse dashboard workbook: ${errMsg}`,
        false,
        parseError
      );
    }
    const parseLatencyMs = Date.now() - parseStart;

    // Step 5: Acquire database transaction client and execute atomic upserts across all 7 tables
    const dbStart = Date.now();
    let client: IDashboardDbClient;
    try {
      client = await this.dbPool.connect();
    } catch (connectError: unknown) {
      const errMsg = connectError instanceof Error ? connectError.message : String(connectError);
      throw new DashboardSyncDomainError(
        "DATABASE_TRANSACTION_FAILED",
        `Failed to acquire database connection from pool: ${errMsg}`,
        true,
        connectError
      );
    }

    try {
      // Step 5.1: Begin atomic transaction block
      await client.query("BEGIN");

      // Step 5.2: Upsert operational Sheet 1: dashboard_projects
      await this.syncProjects(client, workbookData.proyectos);

      // Step 5.3: Upsert operational Sheet 2: dashboard_investors
      await this.syncInvestors(client, workbookData.inversionistas);

      // Step 5.4: Upsert operational Sheet 3: dashboard_investments
      await this.syncInvestments(client, workbookData.inversiones);

      // Step 5.5: Upsert operational Sheet 4: dashboard_project_phases
      await this.syncProjectPhases(client, workbookData.fases);

      // Step 5.6: Upsert operational Sheet 5: dashboard_opportunities & backward compatible sync with pruning
      await this.syncOpportunities(client, workbookData.oportunidades);

      // Step 5.7: Upsert operational Sheet 6: dashboard_reinvestment_transactions
      await this.syncTransactions(client, workbookData.transacciones);

      // Step 5.8: Upsert operational Sheet 7: dashboard_investor_summaries
      await this.syncInvestorSummaries(client, workbookData.resumenes);

      // Step 5.9: Commit atomic database transaction
      await client.query("COMMIT");
    } catch (dbError: unknown) {
      // Invariant: Rollback transaction on any database failure before releasing client
      try {
        await client.query("ROLLBACK");
      } catch {
        // Suppress rollback errors to preserve the original exception context
      }
      const errMsg = dbError instanceof Error ? dbError.message : String(dbError);
      throw new DashboardSyncDomainError(
        "DATABASE_TRANSACTION_FAILED",
        `Database transaction failed during dashboard sync: ${errMsg}`,
        true,
        dbError
      );
    } finally {
      // Invariant: Client must always be released back to the connection pool
      client.release();
    }

    const dbTransactionLatencyMs = Date.now() - dbStart;
    const totalDurationMs = Date.now() - startTime;

    // Step 6: Collate entity counts, operational metrics, and return structured DTO
    const counts: DashboardSyncEntityCounts = {
      proyectos: workbookData.proyectos.length,
      inversionistas: workbookData.inversionistas.length,
      inversiones: workbookData.inversiones.length,
      fases: workbookData.fases.length,
      oportunidades: workbookData.oportunidades.length,
      transacciones: workbookData.transacciones.length,
      resumenes: workbookData.resumenes.length,
    };

    const totalEntitiesSynced =
      counts.proyectos +
      counts.inversionistas +
      counts.inversiones +
      counts.fases +
      counts.oportunidades +
      counts.transacciones +
      counts.resumenes;

    const metrics: DashboardSyncMetrics = {
      downloadDurationMs: downloadLatencyMs,
      parseDurationMs: parseLatencyMs,
      dbTransactionDurationMs: dbTransactionLatencyMs,
      totalDurationMs,
      bytesProcessed: buffer.length,
      downloadLatencyMs,
      parseLatencyMs,
      dbTransactionLatencyMs,
    };

    return {
      success: true,
      message: `Successfully synchronized ${totalEntitiesSynced} entities across all 7 operational tables`,
      fileId,
      timestamp: new Date().toISOString(),
      durationMs: totalDurationMs,
      totalEntitiesSynced,
      counts,
      metrics,
    };
  }

  /**
   * Upserts projects from Sheet 'Proyectos' into dashboard_projects.
   */
  private async syncProjects(
    client: IDashboardDbClient,
    proyectos: readonly CanonicalDashboardProject[]
  ): Promise<void> {
    for (const proj of proyectos) {
      await client.query(
        `INSERT INTO dashboard_projects (id_inversion, nombre, direccion, tipo_proyecto, timing_months, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (id_inversion) DO UPDATE SET
           nombre = EXCLUDED.nombre,
           direccion = EXCLUDED.direccion,
           tipo_proyecto = EXCLUDED.tipo_proyecto,
           timing_months = EXCLUDED.timing_months,
           updated_at = NOW()`,
        [proj.idInversion, proj.nombre, proj.ciudad, proj.tipoProyecto, proj.duracionMeses]
      );
    }
  }

  /**
   * Upserts investors from Sheet 'Inversionistas' into dashboard_investors.
   */
  private async syncInvestors(
    client: IDashboardDbClient,
    inversionistas: readonly CanonicalInvestor[]
  ): Promise<void> {
    for (const inv of inversionistas) {
      await client.query(
        `INSERT INTO dashboard_investors (id_inversionista, nombre, email, tipo_inversionista, fecha_ingreso, timing_months, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (id_inversionista) DO UPDATE SET
           nombre = EXCLUDED.nombre,
           email = EXCLUDED.email,
           tipo_inversionista = EXCLUDED.tipo_inversionista,
           fecha_ingreso = EXCLUDED.fecha_ingreso,
           timing_months = EXCLUDED.timing_months,
           updated_at = NOW()`,
        [inv.idInversionista, inv.nombre, inv.email, inv.tipoInversionista, inv.fechaIngreso, inv.timingMonths]
      );
    }
  }

  /**
   * Upserts investments from Sheet 'Inversiones' into dashboard_investments.
   */
  private async syncInvestments(
    client: IDashboardDbClient,
    inversiones: readonly CanonicalInvestment[]
  ): Promise<void> {
    for (const inv of inversiones) {
      const invId = inv.id || `INV_${inv.idInversion}_${inv.idInversionista ?? "UNKNOWN"}`;
      await client.query(
        `INSERT INTO dashboard_investments (
           id, id_inversion, id_inversionista, nombre_proyecto, ciudad, tipo_propiedad, tipo_proyecto,
           monto_invertido, roi_pct, estado, fecha_inicio, duracion_meses, rango_esperado, fecha_timing,
           allocation_pct, imagen_url, avance_fase_pct, fase_actual, ganancia_proyectada, rendimiento_devengado, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW())
         ON CONFLICT (id) DO UPDATE SET
           nombre_proyecto = EXCLUDED.nombre_proyecto,
           ciudad = EXCLUDED.ciudad,
           monto_invertido = EXCLUDED.monto_invertido,
           roi_pct = EXCLUDED.roi_pct,
           estado = EXCLUDED.estado,
           duracion_meses = EXCLUDED.duracion_meses,
           fecha_timing = EXCLUDED.fecha_timing,
           allocation_pct = EXCLUDED.allocation_pct,
           imagen_url = EXCLUDED.imagen_url,
           avance_fase_pct = EXCLUDED.avance_fase_pct,
           fase_actual = EXCLUDED.fase_actual,
           ganancia_proyectada = EXCLUDED.ganancia_proyectada,
           rendimiento_devengado = EXCLUDED.rendimiento_devengado,
           updated_at = NOW()`,
        [
          invId,
          inv.idInversion,
          inv.idInversionista,
          inv.nombreProyecto,
          inv.ciudad,
          inv.tipoPropiedad,
          inv.tipoProyecto,
          inv.montoInvertido,
          inv.roiPct,
          inv.estado,
          inv.fechaInicio,
          inv.duracionMeses,
          inv.rangoEsperado,
          inv.fechaTiming,
          inv.allocationPct,
          inv.imagenUrl,
          inv.avanceFasePct,
          inv.faseActual,
          inv.gananciaProyectada,
          inv.rendimientoDevengado,
        ]
      );
    }
  }

  /**
   * Upserts project milestones from Sheet 'Fases_Proyecto' into dashboard_project_phases.
   * Resolves Google Drive folder images, uploads new assets to Vercel Blob with magic byte
   * validation, deduplicates against media_assets, and populates both the new array column
   * (imagenes) and backwards-compatible scalar columns (imagen_url_1, 2, 3).
   */
  /**
   * Retrieves previous images associated with a project phase from the database.
   *
   * @param client - Active database transaction client
   * @param phaseId - Compound identifier of the project phase (idFase_idInversion)
   * @returns Array of previous image URLs
   */
  private async fetchPreviousPhaseImages(
    client: IDashboardDbClient,
    phaseId: string
  ): Promise<string[]> {
    try {
      const prevRes = (await client.query(
        `SELECT folder_url, imagenes FROM dashboard_project_phases WHERE id = $1`,
        [phaseId]
      )) as { rows?: Array<{ folder_url?: string | null; imagenes?: string[] | null }> };
      if (prevRes?.rows?.[0]?.imagenes && Array.isArray(prevRes.rows[0].imagenes)) {
        return prevRes.rows[0].imagenes;
      }
    } catch (err) {
      // Invariant: Non-fatal fallback if table or column is not yet queried
      console.warn(`[DashboardSyncService] Could not fetch previous images for phase ${phaseId}:`, err);
    }
    return [];
  }

  /**
   * Discovers images within a Google Drive folder, deduplicates against media_assets,
   * uploads new binaries to Vercel Blob, and returns resolved CDN URLs.
   *
   * @param client - Active database transaction client
   * @param phase - Canonical project phase record
   * @param folderId - Extracted Google Drive folder ID
   * @returns Array of resolved Vercel Blob CDN URLs
   */
  private async resolvePhaseFolderImages(
    client: IDashboardDbClient,
    phase: CanonicalProjectPhase,
    folderId: string
  ): Promise<string[]> {
    if (!this.folderReader || !this.blobStorage) return [];

    const resolvedBlobUrls: string[] = [];

    try {
      const driveImages = await this.folderReader.listImageFiles(folderId);
      if (driveImages.length === 0) return [];

      const driveFileIds = driveImages.map((img) => img.id);

      // Step 1: Query existing media_assets to deduplicate previously uploaded blobs
      const existingRes = (await client.query(
        `SELECT drive_file_id, blob_url FROM media_assets WHERE drive_file_id = ANY($1::varchar[])`,
        [driveFileIds]
      )) as { rows?: Array<{ drive_file_id: string; blob_url: string }> };

      const existingMap = new Map<string, string>();
      if (existingRes?.rows) {
        for (const row of existingRes.rows) {
          existingMap.set(row.drive_file_id, row.blob_url);
        }
      }

      // Step 2: Process each image (deduplicate or upload to Vercel Blob)
      for (const img of driveImages) {
        const existingBlobUrl = existingMap.get(img.id);

        if (existingBlobUrl) {
          // Invariant: Re-use existing Vercel Blob URL without re-downloading or re-uploading
          resolvedBlobUrls.push(existingBlobUrl);
        } else {
          // Download binary from Google Drive API v3
          const binary = await this.folderReader.downloadImageBinary(img.id);

          // Upload to Vercel Blob Edge CDN
          const uploadResult = await this.blobStorage.uploadBlob({
            projectId: phase.idInversion,
            driveFileId: img.id,
            filename: img.name,
            contentType: img.mimeType,
            data: binary,
          });

          // Upsert mapping in media_assets table for subsequent deduplication
          await client.query(
            `INSERT INTO media_assets (
               project_id, drive_file_id, blob_url, media_type, caption
             )
             VALUES ($1, $2, $3, 'IMAGE', $4)
             ON CONFLICT (drive_file_id) DO UPDATE SET
               blob_url = EXCLUDED.blob_url,
               project_id = EXCLUDED.project_id`,
            [phase.idInversion, img.id, uploadResult.url, img.name]
          );

          resolvedBlobUrls.push(uploadResult.url);
        }
      }
    } catch (err) {
      // Invariant: Non-fatal graceful degradation — proceed with available images
      console.warn(`[DashboardSyncService] Failed to resolve Drive folder images for project ${phase.idInversion}:`, err);
    }

    return resolvedBlobUrls;
  }

  /**
   * Identifies orphaned Vercel Blob URLs no longer present in Google Drive,
   * verifies they are not shared with other active phases, and deletes them.
   *
   * @param client - Active database transaction client
   * @param phaseId - Compound identifier of current phase
   * @param previousPhaseImages - Images previously associated with the phase
   * @param resolvedBlobUrls - Active images currently discovered in Google Drive
   */
  private async prunePhaseOrphanBlobs(
    client: IDashboardDbClient,
    phaseId: string,
    previousPhaseImages: string[],
    resolvedBlobUrls: string[]
  ): Promise<void> {
    const orphanBlobUrls = previousPhaseImages.filter(
      (url) =>
        !resolvedBlobUrls.includes(url) &&
        VERCEL_STORAGE_HOSTS.some((host) => url.includes(host))
    );

    for (const orphanUrl of orphanBlobUrls) {
      // Invariant: Guard against deleting assets shared with other project phases
      const sharedRes = (await client.query(
        `SELECT 1 FROM dashboard_project_phases WHERE id != $1 AND $2 = ANY(imagenes) LIMIT 1`,
        [phaseId, orphanUrl]
      )) as { rows?: unknown[] };

      const isShared = Boolean(sharedRes?.rows && sharedRes.rows.length > 0);

      if (!isShared) {
        // Step 1: Delete from Vercel Blob storage (storage maintenance)
        if (this.blobStorage?.deleteBlob) {
          try {
            await this.blobStorage.deleteBlob(orphanUrl);
          } catch (delErr) {
            // Invariant: Non-fatal graceful degradation if edge deletion encounters temporary network issue
            console.warn(`[DashboardSyncService] Failed to delete orphan blob at ${orphanUrl}:`, delErr);
          }
        }

        // Step 2: Prune media_assets mapping
        await client.query(
          `DELETE FROM media_assets WHERE blob_url = $1`,
          [orphanUrl]
        );
      }
    }
  }

  /**
   * Upserts project milestones from Sheet 'Fases_Proyecto' into dashboard_project_phases.
   * Resolves Google Drive folder images, uploads new assets to Vercel Blob with magic byte
   * validation, deduplicates against media_assets, and populates both the new array column
   * (imagenes) and backwards-compatible scalar columns (imagen_url_1, 2, 3).
   */
  private async syncProjectPhases(
    client: IDashboardDbClient,
    fases: readonly CanonicalProjectPhase[]
  ): Promise<void> {
    for (const phase of fases) {
      const phaseId = `${phase.idFase}_${phase.idInversion}`;

      // Step 5.5.0: Query existing phase record to track previously associated images
      const previousPhaseImages = await this.fetchPreviousPhaseImages(client, phaseId);

      // Step 5.5.1: If phase references a Google Drive folder, discover and ingest images
      let resolvedBlobUrls: string[] = [];
      if (phase.folderUrl && this.folderReader && this.blobStorage) {
        const folderId = extractDriveFolderId(phase.folderUrl);
        if (folderId) {
          resolvedBlobUrls = await this.resolvePhaseFolderImages(client, phase, folderId);
          await this.prunePhaseOrphanBlobs(client, phaseId, previousPhaseImages, resolvedBlobUrls);
        }
      }

      // Step 5.5.2: Deduplicate and aggregate images array
      const allImages = Array.from(
        new Set([...resolvedBlobUrls, ...(phase.imagenes || [])])
      );
      const img1 = allImages[0] || null;
      const img2 = allImages[1] || null;
      const img3 = allImages[2] || null;

      // Step 5.5.6: Upsert phase record into dashboard_project_phases table
      await client.query(
        `INSERT INTO dashboard_project_phases (
           id, id_fase, id_inversion, orden, nombre_fase, estado, fecha_inicio, fecha_fin,
           folder_url, imagenes, imagen_url_1, imagen_url_2, imagen_url_3, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
         ON CONFLICT (id) DO UPDATE SET
           orden = EXCLUDED.orden,
           nombre_fase = EXCLUDED.nombre_fase,
           estado = EXCLUDED.estado,
           fecha_inicio = EXCLUDED.fecha_inicio,
           fecha_fin = EXCLUDED.fecha_fin,
           folder_url = EXCLUDED.folder_url,
           imagenes = EXCLUDED.imagenes,
           imagen_url_1 = EXCLUDED.imagen_url_1,
           imagen_url_2 = EXCLUDED.imagen_url_2,
           imagen_url_3 = EXCLUDED.imagen_url_3,
           updated_at = NOW()`,
        [
          phaseId,
          phase.idFase,
          phase.idInversion,
          phase.orden,
          phase.nombreFase,
          phase.estado,
          phase.fechaInicio,
          phase.fechaFin,
          phase.folderUrl || null,
          allImages,
          img1,
          img2,
          img3,
        ]
      );
    }
  }

  /**
   * Reconciles opportunities from Sheet 'Oportunidades' into dashboard_opportunities
   * and backward-compatible marketplace reinvestment_opportunities with atomic orphan pruning.
   */
  private async syncOpportunities(
    client: IDashboardDbClient,
    oportunidades: readonly CanonicalOpportunity[]
  ): Promise<void> {
    // Invariant: Prune obsolete opportunities not present in current active workbook to prevent stale entries
    const activeOppIds = oportunidades.map(resolveOpportunityId);
    if (activeOppIds.length > 0) {
      await client.query(
        `DELETE FROM dashboard_opportunities WHERE id_oportunidad != ALL($1::varchar[])`,
        [activeOppIds]
      );
      await client.query(
        `DELETE FROM reinvestment_opportunities WHERE id != ALL($1::varchar[])`,
        [activeOppIds]
      );
    } else {
      await client.query(`DELETE FROM dashboard_opportunities`);
      await client.query(`DELETE FROM reinvestment_opportunities`);
    }

    // Upsert current active opportunities into operational and marketplace tables
    for (const opp of oportunidades) {
      const oppId = resolveOpportunityId(opp);
      const roi = opp.roiProyectado > 1 ? opp.roiProyectado / 100 : opp.roiProyectado;
      const title = opp.titulo || "Oportunidad";
      const city = opp.ciudad || "TAMPA";

      await client.query(
        `INSERT INTO dashboard_opportunities (
           id_oportunidad, nombre_proyecto, ciudad, roi_estimado, ticket_minimo, activa, gradient, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, TRUE, $6, NOW())
         ON CONFLICT (id_oportunidad) DO UPDATE SET
           nombre_proyecto = EXCLUDED.nombre_proyecto,
           ciudad = EXCLUDED.ciudad,
           roi_estimado = EXCLUDED.roi_estimado,
           ticket_minimo = EXCLUDED.ticket_minimo,
           updated_at = NOW()`,
        [oppId, title, city, roi, opp.inversionMinima, opp.gradient]
      );

      await client.query(
        `INSERT INTO reinvestment_opportunities (id, title, city, projected_roi, min_investment, days_left, gradient)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           city = EXCLUDED.city,
           projected_roi = EXCLUDED.projected_roi,
           min_investment = EXCLUDED.min_investment,
           gradient = EXCLUDED.gradient`,
        [oppId, title, city, opp.roiProyectado, opp.inversionMinima, opp.diasRestantes, opp.gradient]
      );
    }
  }

  /**
   * Upserts reinvestment requests from Sheet 'Transacciones_Reinversion' into dashboard_reinvestment_transactions.
   */
  private async syncTransactions(
    client: IDashboardDbClient,
    transacciones: readonly CanonicalReinvestmentTransaction[]
  ): Promise<void> {
    for (const trx of transacciones) {
      await client.query(
        `INSERT INTO dashboard_reinvestment_transactions (
           id_transaccion, id_inversionista, id_oportunidad, monto, fecha_solicitud, estado, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (id_transaccion) DO UPDATE SET
           monto = EXCLUDED.monto,
           estado = EXCLUDED.estado,
           updated_at = NOW()`,
        [
          trx.idTransaccion,
          trx.idInversionista,
          trx.idOportunidad,
          trx.monto,
          trx.fechaSolicitud || new Date().toISOString(),
          trx.estado,
        ]
      );
    }
  }

  /**
   * Upserts portfolio investor aggregations from Sheet 'Resumen_Dashboard' into dashboard_investor_summaries.
   */
  private async syncInvestorSummaries(
    client: IDashboardDbClient,
    resumenes: readonly CanonicalInvestorSummary[]
  ): Promise<void> {
    for (const res of resumenes) {
      await client.query(
        `INSERT INTO dashboard_investor_summaries (
           id_inversionista, nombre, patrimonio_total_invertido, rendimiento_acumulado,
           capital_total_actual, roi_ponderado, num_activas, num_concluidas,
           capital_disponible_reinversion, ganancia_proyectada_total, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
         ON CONFLICT (id_inversionista) DO UPDATE SET
           nombre = EXCLUDED.nombre,
           patrimonio_total_invertido = EXCLUDED.patrimonio_total_invertido,
           rendimiento_acumulado = EXCLUDED.rendimiento_acumulado,
           capital_total_actual = EXCLUDED.capital_total_actual,
           roi_ponderado = EXCLUDED.roi_ponderado,
           num_activas = EXCLUDED.num_activas,
           num_concluidas = EXCLUDED.num_concluidas,
           capital_disponible_reinversion = EXCLUDED.capital_disponible_reinversion,
           ganancia_proyectada_total = EXCLUDED.ganancia_proyectada_total,
           updated_at = NOW()`,
        [
          res.idInversionista,
          res.nombre,
          res.patrimonioTotalInvertido,
          res.rendimientoAcumulado,
          res.capitalTotalActual,
          res.roiPonderado,
          res.numActivas,
          res.numConcluidas,
          res.capitalDisponibleReinversion,
          res.gananciaProyectadaTotal,
        ]
      );
    }
  }
}

