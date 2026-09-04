/**
 * ============================================================================
 * Layer 3: Domain - Google Drive Folder Reader Port & Domain Errors
 * ============================================================================
 * Purpose: Defines contracts, models, and domain errors for discovering,
 * listing, and downloading image files contained inside Google Drive folders.
 * Invariants:
 *  - Pure domain representation, zero external SDK or protocol dependencies.
 *  - Explicit typed domain error hierarchy.
 *  - Isolates Drive API specifics from application and presentation layers.
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

/**
 * Domain error codes for Google Drive Folder Reader operations.
 */
export type DriveFolderReaderErrorCode =
  | 'FOLDER_NOT_FOUND'
  | 'UNAUTHORIZED_DRIVE_ACCESS'
  | 'RATE_LIMITED'
  | 'NETWORK_FAILURE'
  | 'FILE_NOT_FOUND'
  | 'DOWNLOAD_FAILED'
  | 'INVALID_FOLDER_ID';

/**
 * Domain Error for Google Drive Folder Reader operations.
 */
export class DriveFolderReaderDomainError extends Error {
  public readonly code: DriveFolderReaderErrorCode;
  public readonly retryable: boolean;
  public readonly originalError?: unknown;

  /**
   * Initializes a DriveFolderReaderDomainError.
   *
   * @param code - Machine-readable error code identifying the failure mode
   * @param message - Human-readable diagnostic description
   * @param retryable - Whether the operation may succeed on immediate or backoff retry
   * @param originalError - Underlying caught error or rejection cause if any
   */
  constructor(
    code: DriveFolderReaderErrorCode,
    message: string,
    retryable = false,
    originalError?: unknown
  ) {
    super(`[DriveFolderReaderDomainError:${code}] ${message}`);
    this.name = 'DriveFolderReaderDomainError';
    this.code = code;
    this.retryable = retryable;
    this.originalError = originalError;
    Object.setPrototypeOf(this, DriveFolderReaderDomainError.prototype);
  }
}

/**
 * Normalized image file metadata discovered in a Google Drive folder.
 */
export interface DriveImageFileInfo {
  /** Google Drive unique file identifier */
  readonly id: string;
  /** Human-readable filename (e.g. 'avance_obra_1.jpg') */
  readonly name: string;
  /** Image MIME type (e.g. 'image/jpeg', 'image/png', 'image/webp') */
  readonly mimeType: string;
  /** Content size in bytes if available */
  readonly sizeBytes?: number | null;
  /** RFC 3339 timestamp of last file modification */
  readonly modifiedTime?: string | null;
  /** MD5 file checksum computed by Google Drive if available */
  readonly md5Checksum?: string | null;
}

/**
 * Query options for discovering image files within a Google Drive folder.
 */
export interface ListFolderImagesOptions {
  /** Maximum number of image files to retrieve (default: 100) */
  readonly maxFiles?: number;
  /** Filter list of allowable MIME types */
  readonly allowedMimeTypes?: readonly string[];
}

/**
 * Port interface for Google Drive Folder Reader operations.
 */
export interface IDriveFolderReaderPort {
  /**
   * Lists image files within a specified Google Drive folder.
   *
   * @param folderId - Clean Google Drive folder ID
   * @param options - Optional query and pagination bounds
   * @returns Array of normalized image file metadata records
   * @throws DriveFolderReaderDomainError if folder is not found or access is denied
   */
  listImageFiles(
    folderId: string,
    options?: ListFolderImagesOptions
  ): Promise<readonly DriveImageFileInfo[]>;

  /**
   * Downloads an image file binary stream from Google Drive.
   *
   * @param fileId - Clean Google Drive file ID
   * @returns Buffer containing the raw image binary bytes
   * @throws DriveFolderReaderDomainError if file is not found or download fails
   */
  downloadImageBinary(fileId: string): Promise<Buffer>;
}

/**
 * Canonical alias for backwards and cross-spec compatibility.
 */
export type IGoogleDriveFolderReaderPort = IDriveFolderReaderPort;
