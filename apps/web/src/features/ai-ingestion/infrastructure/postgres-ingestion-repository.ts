/**
 * ============================================================================
 * Layer 4: Infrastructure - PostgreSQL Ingestion Repository Adapter
 * ============================================================================
 * Purpose: Provides idempotent PostgreSQL persistence for sync records, media assets,
 * and canonical clients with advisory locks and parameterized query executions.
 * Invariants:
 *  - Server-only execution.
 *  - Strict parameterized queries preventing SQL injections.
 *  - Upsert semantics (ON CONFLICT) preventing race duplicate keys.
 *  - Maps snake_case DB columns to camelCase domain models.
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

import 'server-only';
import { executeQuery, DatabaseExecutor } from '../../../lib/infrastructure/db/neon-client';
import {
  IIngestionRepositoryPort,
  DbSyncRecord,
  DbMediaAsset,
  DbClient,
  RepositoryDomainError,
} from '../domain/ports/repositories-port';

/**
 * Raw DB row interface for sync_records.
 */
interface RawSyncRecordRow {
  id: string;
  file_id: string;
  folder_path: string;
  source_type: string;
  status: string;
  confidence_score: string | number;
  raw_payload: Record<string, unknown>;
  canonical_payload: Record<string, unknown>;
  validation_errors: Record<string, unknown>[];
  created_at: string | Date;
  updated_at: string | Date;
}

/**
 * Raw DB row interface for media_assets.
 */
interface RawMediaAssetRow {
  id: string;
  project_id: string;
  drive_file_id: string;
  blob_url: string;
  media_type: string;
  focal_x: string | number;
  focal_y: string | number;
  ai_tags: string[];
  caption: string | null;
  created_at: string | Date;
}

/**
 * Raw DB row interface for clients.
 */
interface RawClientRow {
  id: string;
  name: string;
  tax_id: string | null;
  email: string | null;
  phone: string | null;
  contract_amount: string | number | null;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string | Date;
  updated_at: string | Date;
}

/**
 * Adapter implementing IIngestionRepositoryPort with PostgreSQL.
 */
export class PostgresIngestionRepository implements IIngestionRepositoryPort {
  private readonly executor?: DatabaseExecutor;

  constructor(executor?: DatabaseExecutor) {
    this.executor = executor;
  }

  private async runQuery<R extends import('pg').QueryResultRow = any>(
    text: string,
    params: any[] = []
  ) {
    if (this.executor) {
      return this.executor.query<R>(text, params);
    }
    return executeQuery<R>(text, params);
  }

  /**
   * Upserts a sync_records row based on fileId.
   */
  public async upsertSyncRecord(record: {
    readonly fileId: string;
    readonly folderPath: string;
    readonly sourceType: DbSyncRecord['sourceType'];
    readonly status?: DbSyncRecord['status'];
    readonly confidenceScore?: number;
    readonly rawPayload?: Record<string, unknown>;
    readonly canonicalPayload?: Record<string, unknown>;
    readonly validationErrors?: readonly Record<string, unknown>[];
  }): Promise<DbSyncRecord> {
    try {
      const sql = `
        INSERT INTO sync_records (
          file_id, folder_path, source_type, status,
          confidence_score, raw_payload, canonical_payload, validation_errors, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        ON CONFLICT (file_id) DO UPDATE SET
          folder_path = EXCLUDED.folder_path,
          source_type = EXCLUDED.source_type,
          status = EXCLUDED.status,
          confidence_score = EXCLUDED.confidence_score,
          raw_payload = EXCLUDED.raw_payload,
          canonical_payload = EXCLUDED.canonical_payload,
          validation_errors = EXCLUDED.validation_errors,
          updated_at = NOW()
        RETURNING *;
      `;

      const params = [
        record.fileId,
        record.folderPath,
        record.sourceType,
        record.status || 'PENDING',
        record.confidenceScore || 0.0,
        JSON.stringify(record.rawPayload || {}),
        JSON.stringify(record.canonicalPayload || {}),
        JSON.stringify(record.validationErrors || []),
      ];

      const res = await this.runQuery<RawSyncRecordRow>(sql, params);
      const row = res.rows[0];
      if (!row) {
        throw new RepositoryDomainError('QUERY_EXECUTION_FAILED', 'Failed to upsert sync record');
      }

      return this.mapSyncRecord(row);
    } catch (err: unknown) {
      if (err instanceof RepositoryDomainError) throw err;
      throw new RepositoryDomainError(
        'QUERY_EXECUTION_FAILED',
        `Database error in upsertSyncRecord: ${(err as Error)?.message || 'Unknown'}`,
        false,
        err
      );
    }
  }

  /**
   * Retrieves a sync record by its Google Drive file ID.
   */
  public async getSyncRecordByFileId(fileId: string): Promise<DbSyncRecord | null> {
    try {
      const sql = 'SELECT * FROM sync_records WHERE file_id = $1 LIMIT 1;';
      const res = await this.runQuery<RawSyncRecordRow>(sql, [fileId]);
      if (res.rows.length === 0 || !res.rows[0]) return null;
      return this.mapSyncRecord(res.rows[0]);
    } catch (err) {
      throw new RepositoryDomainError(
        'QUERY_EXECUTION_FAILED',
        `Database error in getSyncRecordByFileId: ${(err as Error)?.message || 'Unknown'}`,
        false,
        err
      );
    }
  }

  /**
   * Lists sync records filtered by status.
   */
  public async listSyncRecordsByStatus(
    status: DbSyncRecord['status'],
    limit = 50
  ): Promise<readonly DbSyncRecord[]> {
    try {
      const sql = 'SELECT * FROM sync_records WHERE status = $1 ORDER BY updated_at DESC LIMIT $2;';
      const res = await this.runQuery<RawSyncRecordRow>(sql, [status, limit]);
      return res.rows.map((row) => this.mapSyncRecord(row));
    } catch (err) {
      throw new RepositoryDomainError(
        'QUERY_EXECUTION_FAILED',
        `Database error in listSyncRecordsByStatus: ${(err as Error)?.message || 'Unknown'}`,
        false,
        err
      );
    }
  }

  /**
   * Upserts a media_assets row based on driveFileId.
   */
  public async upsertMediaAsset(
    asset: Omit<DbMediaAsset, 'id' | 'createdAt'>
  ): Promise<DbMediaAsset> {
    try {
      const sql = `
        INSERT INTO media_assets (
          project_id, drive_file_id, blob_url, media_type, focal_x, focal_y, ai_tags, caption
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (drive_file_id) DO UPDATE SET
          project_id = EXCLUDED.project_id,
          blob_url = EXCLUDED.blob_url,
          media_type = EXCLUDED.media_type,
          focal_x = EXCLUDED.focal_x,
          focal_y = EXCLUDED.focal_y,
          ai_tags = EXCLUDED.ai_tags,
          caption = EXCLUDED.caption
        RETURNING *;
      `;

      const params = [
        asset.projectId,
        asset.driveFileId,
        asset.blobUrl,
        asset.mediaType,
        asset.focalX,
        asset.focalY,
        asset.aiTags,
        asset.caption || null,
      ];

      const res = await this.runQuery<RawMediaAssetRow>(sql, params);
      const row = res.rows[0];
      if (!row) {
        throw new RepositoryDomainError('QUERY_EXECUTION_FAILED', 'Failed to upsert media asset');
      }

      return this.mapMediaAsset(row);
    } catch (err) {
      if (err instanceof RepositoryDomainError) throw err;
      throw new RepositoryDomainError(
        'QUERY_EXECUTION_FAILED',
        `Database error in upsertMediaAsset: ${(err as Error)?.message || 'Unknown'}`,
        false,
        err
      );
    }
  }

  /**
   * Upserts a clients row based on taxId.
   */
  public async upsertClient(
    client: Omit<DbClient, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DbClient> {
    try {
      let sql: string;
      let params: any[];

      if (client.taxId) {
        sql = `
          INSERT INTO clients (
            name, tax_id, email, phone, contract_amount, status, metadata, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          ON CONFLICT (tax_id) DO UPDATE SET
            name = EXCLUDED.name,
            email = COALESCE(EXCLUDED.email, clients.email),
            phone = COALESCE(EXCLUDED.phone, clients.phone),
            contract_amount = COALESCE(EXCLUDED.contract_amount, clients.contract_amount),
            status = EXCLUDED.status,
            metadata = EXCLUDED.metadata,
            updated_at = NOW()
          RETURNING *;
        `;
        params = [
          client.name,
          client.taxId,
          client.email || null,
          client.phone || null,
          client.contractAmount || null,
          client.status || 'PENDING',
          JSON.stringify(client.metadata || {}),
        ];
      } else {
        sql = `
          INSERT INTO clients (
            name, tax_id, email, phone, contract_amount, status, metadata, updated_at
          ) VALUES ($1, NULL, $2, $3, $4, $5, $6, NOW())
          RETURNING *;
        `;
        params = [
          client.name,
          client.email || null,
          client.phone || null,
          client.contractAmount || null,
          client.status || 'PENDING',
          JSON.stringify(client.metadata || {}),
        ];
      }

      const res = await this.runQuery<RawClientRow>(sql, params);
      const row = res.rows[0];
      if (!row) {
        throw new RepositoryDomainError('QUERY_EXECUTION_FAILED', 'Failed to upsert client');
      }

      return this.mapClient(row);
    } catch (err) {
      if (err instanceof RepositoryDomainError) throw err;
      throw new RepositoryDomainError(
        'QUERY_EXECUTION_FAILED',
        `Database error in upsertClient: ${(err as Error)?.message || 'Unknown'}`,
        false,
        err
      );
    }
  }

  /**
   * Executes a callback within a PostgreSQL advisory transaction lock.
   */
  public async withAdvisoryLock<T>(lockKey: string, callback: () => Promise<T>): Promise<T> {
    try {
      const lockRes = await this.runQuery<{ locked: boolean }>(
        'SELECT pg_try_advisory_xact_lock(hashtext($1)) AS locked;',
        [lockKey]
      );

      const isLocked = lockRes.rows[0]?.locked ?? false;
      if (!isLocked) {
        throw new RepositoryDomainError(
          'LOCK_ACQUISITION_FAILED',
          `Could not acquire advisory lock for key "${lockKey}"; another worker holds the lock`,
          true
        );
      }

      return await callback();
    } catch (err) {
      if (err instanceof RepositoryDomainError) throw err;
      throw new RepositoryDomainError(
        'QUERY_EXECUTION_FAILED',
        `Error executing advisory lock transaction: ${(err as Error)?.message || 'Unknown'}`,
        false,
        err
      );
    }
  }

  // --- Entity Mappers ---

  private mapSyncRecord(row: RawSyncRecordRow): DbSyncRecord {
    return {
      id: row.id,
      fileId: row.file_id,
      folderPath: row.folder_path,
      sourceType: row.source_type as DbSyncRecord['sourceType'],
      status: row.status as DbSyncRecord['status'],
      confidenceScore: typeof row.confidence_score === 'number' ? row.confidence_score : parseFloat(String(row.confidence_score || '0')),
      rawPayload: typeof row.raw_payload === 'string' ? JSON.parse(row.raw_payload) : row.raw_payload || {},
      canonicalPayload: typeof row.canonical_payload === 'string' ? JSON.parse(row.canonical_payload) : row.canonical_payload || {},
      validationErrors: typeof row.validation_errors === 'string' ? JSON.parse(row.validation_errors) : row.validation_errors || [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapMediaAsset(row: RawMediaAssetRow): DbMediaAsset {
    return {
      id: row.id,
      projectId: row.project_id,
      driveFileId: row.drive_file_id,
      blobUrl: row.blob_url,
      mediaType: row.media_type as DbMediaAsset['mediaType'],
      focalX: typeof row.focal_x === 'number' ? row.focal_x : parseFloat(String(row.focal_x || '0.5')),
      focalY: typeof row.focal_y === 'number' ? row.focal_y : parseFloat(String(row.focal_y || '0.5')),
      aiTags: row.ai_tags || [],
      caption: row.caption,
      createdAt: new Date(row.created_at),
    };
  }

  private mapClient(row: RawClientRow): DbClient {
    return {
      id: row.id,
      name: row.name,
      taxId: row.tax_id,
      email: row.email,
      phone: row.phone,
      contractAmount: row.contract_amount !== null ? String(row.contract_amount) : null,
      status: row.status as DbClient['status'],
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata || {},
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
