/**
 * ============================================================================
 * Layer 3: Domain - Blob Storage Port & Domain Errors
 * ============================================================================
 * Purpose: Defines the contract for uploading normalized media and document
 * artifacts to edge object storage (Vercel Blob) with MIME verification.
 * Invariants:
 *  - Explicit typed domain errors for invalid magic bytes, missing tokens, and upload errors.
 *  - Pure domain representation, zero external SDK imports.
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

/**
 * Domain error codes for Blob Storage operations.
 */
export type BlobStorageErrorCode =
  | 'INVALID_MAGIC_BYTES'
  | 'BLOB_TOKEN_MISSING'
  | 'UPLOAD_FAILED'
  | 'DISALLOWED_MIME_TYPE';

/**
 * Domain Error for Blob Storage operations.
 */
export class BlobStorageDomainError extends Error {
  public readonly code: BlobStorageErrorCode;
  public readonly retryable: boolean;
  public readonly originalError?: unknown;

  constructor(
    code: BlobStorageErrorCode,
    message: string,
    retryable = false,
    originalError?: unknown
  ) {
    super(`[BlobStorageDomainError:${code}] ${message}`);
    this.name = 'BlobStorageDomainError';
    this.code = code;
    this.retryable = retryable;
    this.originalError = originalError;
    Object.setPrototypeOf(this, BlobStorageDomainError.prototype);
  }
}

/**
 * Upload parameters for blob storage.
 */
export interface BlobUploadOptions {
  readonly projectId: string;
  readonly driveFileId: string;
  readonly filename: string;
  readonly contentType: string;
  readonly data: Uint8Array | Buffer;
}

/**
 * Result payload from blob upload.
 */
export interface BlobUploadResult {
  readonly url: string;
  readonly pathname: string;
  readonly contentType: string;
  readonly sizeBytes: number;
}

/**
 * Port interface for Blob Storage.
 */
export interface IBlobStoragePort {
  /**
   * Uploads data to blob storage verifying magic bytes.
   * 
   * @param options - Upload parameters
   * @returns BlobUploadResult with public CDN URL
   */
  uploadBlob(options: BlobUploadOptions): Promise<BlobUploadResult>;

  /**
   * Deletes one or more blobs from storage by public URL.
   * 
   * @param urlOrUrls - Blob URL or array of Blob URLs to delete
   */
  deleteBlob?(urlOrUrls: string | string[]): Promise<void>;
}
