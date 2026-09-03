/**
 * ============================================================================
 * @file apps/web/src/features/ai-ingestion/domain/models/dashboard-sync-models.ts
 * @description Layer 3: Domain - Contracts, DTOs & Invariants for Dashboard Synchronization
 * ============================================================================
 * Purpose: Defines domain models, contracts, metrics, error types, and security
 * verification functions for automated Excel dashboard synchronization.
 * 
 * Invariants:
 *  - Pure domain representation: Zero external network, I/O, or database dependencies.
 *  - Constant-time secret comparison preventing timing attacks on cron authorization.
 *  - Enforces structured immutable metrics for operational observability.
 * 
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

/**
 * Canonical Google Drive File ID for DASH-BOARD-Blue-Brick-Panel-Administracion.xlsx.
 */
export const DEFAULT_DASHBOARD_FILE_ID = "1MToOPlgJnmrLk8kDYooyQeCrTqT3HtGl";

/**
 * Domain error codes for dashboard synchronization operations.
 */
export type DashboardSyncErrorCode =
  | "UNAUTHORIZED"
  | "AUTHENTICATION_FAILED"
  | "MISSING_SECRET"
  | "DOWNLOAD_FAILED"
  | "DRIVE_DOWNLOAD_FAILED"
  | "EMPTY_WORKBOOK"
  | "PARSING_FAILED"
  | "TRANSACTION_FAILED"
  | "DATABASE_TRANSACTION_FAILED"
  | "DATABASE_ERROR";

/**
 * Domain-specific error class for dashboard synchronization lifecycle failures.
 */
export class DashboardSyncDomainError extends Error {
  public readonly code: DashboardSyncErrorCode;
  public readonly retryable: boolean;
  public readonly originalError?: unknown;

  /**
   * Constructs a typed DashboardSyncDomainError.
   * 
   * @param code - Categorized error code for deterministic handling
   * @param message - Descriptive, non-sensitive error explanation
   * @param retryable - Indicates whether caller can retry the operation with backoff
   * @param originalError - Underlying error or cause if available (redacted)
   */
  constructor(
    code: DashboardSyncErrorCode,
    message: string,
    retryable = false,
    originalError?: unknown
  ) {
    super(`[DashboardSyncDomainError:${code}] ${message}`);
    this.name = "DashboardSyncDomainError";
    this.code = code;
    this.retryable = retryable;
    this.originalError = originalError;
    Object.setPrototypeOf(this, DashboardSyncDomainError.prototype);
  }
}

/**
 * Count breakdown of entities extracted and upserted across the 7 operational sheets.
 */
export interface DashboardSyncEntityCounts {
  readonly proyectos: number;
  readonly inversionistas: number;
  readonly inversiones: number;
  readonly fases: number;
  readonly oportunidades: number;
  readonly transacciones: number;
  readonly resumenes: number;
}

/**
 * Operational latency and throughput metrics for observability.
 */
export interface DashboardSyncMetrics {
  readonly downloadDurationMs: number;
  readonly parseDurationMs: number;
  readonly dbTransactionDurationMs: number;
  readonly totalDurationMs: number;
  readonly bytesProcessed: number;
  readonly downloadLatencyMs?: number;
  readonly parseLatencyMs?: number;
  readonly dbTransactionLatencyMs?: number;
}

/**
 * Structured DTO representing the outcome of a dashboard synchronization execution.
 */
export interface DashboardSyncResultDto {
  readonly success: boolean;
  readonly message: string;
  readonly fileId: string;
  readonly timestamp: string;
  readonly durationMs: number;
  readonly totalEntitiesSynced: number;
  readonly counts: DashboardSyncEntityCounts;
  readonly metrics?: DashboardSyncMetrics;
  readonly error?: string;
}

/**
 * Options configuring a dashboard synchronization execution run.
 */
export interface DashboardSyncOptions {
  /** Optional override for the target Google Drive file ID */
  readonly fileId?: string;
  /** Force refresh the Google OAuth2 access token cache */
  readonly forceRefreshAuth?: boolean;
}

/**
 * Performs a constant-time string comparison to mitigate timing attacks against authorization secrets.
 * 
 * @param a - First string
 * @param b - Second string
 * @returns True if both strings are identical in constant time
 */
export function constantTimeCompare(a: string, b: string): boolean {
  // Step 1: Invariant validation for string types
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }

  // Step 2: Compare lengths (non-matching lengths exit safely)
  if (a.length !== b.length) {
    return false;
  }

  // Step 3: Bitwise XOR accumulator over each character code point
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return diff === 0;
}

/**
 * Verifies that the provided HTTP Authorization header matches the expected CRON_SECRET Bearer token.
 * 
 * @param authHeader - Raw Authorization HTTP header (e.g., 'Bearer <secret>')
 * @param expectedSecret - Configured environment CRON_SECRET value
 * @returns True if the header contains a valid, matching Bearer secret
 */
export function verifyCronAuthorization(
  authHeader: string | null | undefined,
  expectedSecret: string | undefined
): boolean {
  // Step 1: Fail closed if either header or expected secret is missing/empty
  if (!authHeader || !expectedSecret || typeof authHeader !== "string") {
    return false;
  }

  // Step 2: Parse Bearer scheme prefix
  const parts = authHeader.trim().split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return false;
  }

  const token = parts[1];

  // Step 3: Verify equality using constant-time comparison
  return constantTimeCompare(token, expectedSecret);
}
