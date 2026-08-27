/**
 * ============================================================================
 * Layer 3: Domain - Google Drive Sync Event Models & Invariants
 * ============================================================================
 * Purpose: Defines domain models and sanitization functions for Google Drive
 * change notifications, differential events, and folder traversal records.
 * Invariants:
 *  - Sanitization of relative path traversal attempts (../ or leading slashes).
 *  - Strict typed change event types: FILE_UPSERT, FILE_REMOVED, TOKEN_RESET.
 *  - Pure domain representation, zero infrastructure or framework imports.
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

/**
 * Sanitizes Google Drive folder and file paths to prevent Path Traversal vulnerabilities.
 * 
 * @param rawPath - Unsanitized relative or absolute folder path
 * @returns Clean normalized path string starting with '/' and free of '..' sequences
 */
export function sanitizeDrivePath(rawPath: string): string {
  // Step 1: Handle null, undefined or empty input
  if (!rawPath || typeof rawPath !== 'string') {
    return '/';
  }

  // Step 2: Normalize backslashes to forward slashes and remove dangerous traversal tokens
  let cleaned = rawPath.replace(/\\/g, '/').replace(/\.\./g, '');

  // Step 3: Collapse repeated slashes into single slashes
  cleaned = cleaned.replace(/\/+/g, '/');

  // Step 4: Ensure path starts with a leading slash and remove trailing slash (unless root)
  if (!cleaned.startsWith('/')) {
    cleaned = `/${cleaned}`;
  }
  if (cleaned.length > 1 && cleaned.endsWith('/')) {
    cleaned = cleaned.slice(0, -1);
  }

  return cleaned;
}

/**
 * Represents a single file change event discovered via Google Drive Changes API.
 */
export interface DriveChangeEvent {
  readonly fileId: string;
  readonly fileName: string;
  readonly mimeType: string;
  readonly folderPath: string;
  readonly isTrashed: boolean;
  readonly md5Checksum: string | null;
  readonly compositeHash: string;
  readonly sizeBytes: number | null;
  readonly lastModifiedTime: string;
}

/**
 * Result payload returned from a differential polling execution.
 */
export interface DifferentialPollResult {
  readonly changes: readonly DriveChangeEvent[];
  readonly newPageToken: string;
  readonly tokenResetOccurred: boolean;
  readonly totalPagesScanned: number;
}
