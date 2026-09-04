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
import { CanonicalDashboardWorkbook } from "../../domain/schemas/canonical-dashboard-schema";
import {
  DEFAULT_DASHBOARD_FILE_ID,
  DashboardSyncDomainError,
  DashboardSyncEntityCounts,
  DashboardSyncMetrics,
  DashboardSyncOptions,
  DashboardSyncResultDto,
} from "../../domain/models/dashboard-sync-models";

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
export function resolveOpportunityId(opp: { id?: string; titulo: string }): string {
  return opp.id || "opp_" + opp.titulo.toLowerCase().replace(/[^a-z0-9]/g, "_");
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
      for (const proj of workbookData.proyectos) {
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

      // Step 5.3: Upsert operational Sheet 2: dashboard_investors
      for (const inv of workbookData.inversionistas) {
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

      // Step 5.4: Upsert operational Sheet 3: dashboard_investments
      for (const inv of workbookData.inversiones) {
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

      // Step 5.5: Upsert operational Sheet 4: dashboard_project_phases
      for (const phase of workbookData.fases) {
        const phaseId = `${phase.idFase}_${phase.idInversion}`;
        const img1 = phase.imagenes?.[0] || null;
        const img2 = phase.imagenes?.[1] || null;
        const img3 = phase.imagenes?.[2] || null;

        await client.query(
          `INSERT INTO dashboard_project_phases (
             id, id_fase, id_inversion, orden, nombre_fase, estado, fecha_inicio, fecha_fin,
             imagen_url_1, imagen_url_2, imagen_url_3, updated_at
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
           ON CONFLICT (id) DO UPDATE SET
             orden = EXCLUDED.orden,
             nombre_fase = EXCLUDED.nombre_fase,
             estado = EXCLUDED.estado,
             fecha_inicio = EXCLUDED.fecha_inicio,
             fecha_fin = EXCLUDED.fecha_fin,
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
            img1,
            img2,
            img3,
          ]
        );
      }

      // Step 5.6: Upsert operational Sheet 5: dashboard_opportunities & backward compatible sync
      // Invariant: Prune obsolete opportunities not present in current active workbook to prevent stale entries
      const activeOppIds = workbookData.oportunidades.map(resolveOpportunityId);
      if (activeOppIds.length > 0) {
        // Step 5.6.1: Prune removed opportunities from dashboard_opportunities table
        await client.query(
          `DELETE FROM dashboard_opportunities WHERE id_oportunidad != ALL($1::varchar[])`,
          [activeOppIds]
        );
        // Step 5.6.2: Prune removed opportunities from marketplace reinvestment_opportunities table
        await client.query(
          `DELETE FROM reinvestment_opportunities WHERE id != ALL($1::varchar[])`,
          [activeOppIds]
        );
      }

      // Step 5.6.3: Upsert current active opportunities into operational and marketplace tables
      for (const opp of workbookData.oportunidades) {
        const oppId = resolveOpportunityId(opp);
        const roi = opp.roiProyectado > 1 ? opp.roiProyectado / 100 : opp.roiProyectado;
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
          [oppId, opp.titulo, opp.ciudad, roi, opp.inversionMinima, opp.gradient]
        );

        // Maintain backward compatibility with marketplace reinvestment_opportunities table
        await client.query(
          `INSERT INTO reinvestment_opportunities (id, title, city, projected_roi, min_investment, days_left, gradient)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title,
             city = EXCLUDED.city,
             projected_roi = EXCLUDED.projected_roi,
             min_investment = EXCLUDED.min_investment,
             gradient = EXCLUDED.gradient`,
          [oppId, opp.titulo, opp.ciudad, opp.roiProyectado, opp.inversionMinima, opp.diasRestantes, opp.gradient]
        );
      }

      // Step 5.7: Upsert operational Sheet 6: dashboard_reinvestment_transactions
      for (const trx of workbookData.transacciones) {
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

      // Step 5.8: Upsert operational Sheet 7: dashboard_investor_summaries
      for (const res of workbookData.resumenes) {
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
}
