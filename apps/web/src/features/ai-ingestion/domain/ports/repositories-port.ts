/**
 * ============================================================================
 * Layer 3: Domain - Ingestion Repositories Port & Domain Errors
 * ============================================================================
 * Purpose: Defines persistence contracts for sync audit records, media assets,
 * and canonical clients with advisory locks and upsert semantics.
 * Invariants:
 *  - Explicit typed domain error hierarchy.
 *  - Upsert semantics preventing primary key collision errors.
 *  - Pure domain representation, zero database client types in signatures.
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

/**
 * Domain error codes for repository operations.
 */
export type RepositoryErrorCode =
  | 'RECORD_NOT_FOUND'
  | 'DUPLICATE_KEY_VIOLATION'
  | 'LOCK_ACQUISITION_FAILED'
  | 'QUERY_EXECUTION_FAILED'
  | 'CONNECTION_FAILED';

/**
 * Domain Error for Repository operations.
 */
export class RepositoryDomainError extends Error {
  public readonly code: RepositoryErrorCode;
  public readonly retryable: boolean;
  public readonly originalError?: unknown;

  constructor(
    code: RepositoryErrorCode,
    message: string,
    retryable = false,
    originalError?: unknown
  ) {
    super(`[RepositoryDomainError:${code}] ${message}`);
    this.name = 'RepositoryDomainError';
    this.code = code;
    this.retryable = retryable;
    this.originalError = originalError;
    Object.setPrototypeOf(this, RepositoryDomainError.prototype);
  }
}

/**
 * Domain representation of a sync_records database row.
 */
export interface DbSyncRecord {
  readonly id: string;
  readonly fileId: string;
  readonly folderPath: string;
  readonly sourceType: 'DOCUMENT' | 'SPREADSHEET' | 'IMAGE' | 'VIDEO';
  readonly status: 'PENDING' | 'PROCESSED' | 'FAILED' | 'NEEDS_REVIEW';
  readonly confidenceScore: number;
  readonly rawPayload: Record<string, unknown>;
  readonly canonicalPayload: Record<string, unknown>;
  readonly validationErrors: readonly Record<string, unknown>[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Domain representation of a media_assets database row.
 */
export interface DbMediaAsset {
  readonly id: string;
  readonly projectId: string;
  readonly driveFileId: string;
  readonly blobUrl: string;
  readonly mediaType: 'IMAGE' | 'VIDEO';
  readonly focalX: number;
  readonly focalY: number;
  readonly aiTags: readonly string[];
  readonly caption?: string | null;
  readonly createdAt: Date;
}

/**
 * Domain representation of a clients database row.
 */
export interface DbClient {
  readonly id: string;
  readonly name: string;
  readonly taxId?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly contractAmount?: string | null;
  readonly status: 'PENDING' | 'ACTIVE' | 'ARCHIVED' | 'INACTIVE';
  readonly metadata: Record<string, unknown>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Port interface for Ingestion Persistence Repository.
 */
export interface IIngestionRepositoryPort {
  /**
   * Upserts a sync_records row based on fileId.
   */
  upsertSyncRecord(
    record: {
      readonly fileId: string;
      readonly folderPath: string;
      readonly sourceType: DbSyncRecord['sourceType'];
      readonly status?: DbSyncRecord['status'];
      readonly confidenceScore?: number;
      readonly rawPayload?: Record<string, unknown>;
      readonly canonicalPayload?: Record<string, unknown>;
      readonly validationErrors?: readonly Record<string, unknown>[];
    }
  ): Promise<DbSyncRecord>;

  /**
   * Retrieves a sync record by its Google Drive file ID.
   */
  getSyncRecordByFileId(fileId: string): Promise<DbSyncRecord | null>;

  /**
   * Lists sync records filtered by status.
   */
  listSyncRecordsByStatus(status: DbSyncRecord['status'], limit?: number): Promise<readonly DbSyncRecord[]>;

  /**
   * Upserts a media_assets row based on driveFileId.
   */
  upsertMediaAsset(
    asset: Omit<DbMediaAsset, 'id' | 'createdAt'>
  ): Promise<DbMediaAsset>;

  /**
   * Upserts a clients row based on taxId.
   */
  upsertClient(
    client: Omit<DbClient, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DbClient>;

  /**
   * Executes a callback within a PostgreSQL advisory lock.
   */
  withAdvisoryLock<T>(lockKey: string, callback: () => Promise<T>): Promise<T>;
}
