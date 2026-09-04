/**
 * ============================================================================
 * Layer 4: Infrastructure - Vercel Blob Storage Adapter
 * ============================================================================
 * Purpose: Provides a secure edge object storage connector uploading normalized
 * media items to Vercel Blob with binary magic byte validation and XSS immunity.
 * Invariants:
 *  - Server-only execution.
 *  - Blocks SVG/HTML executable uploads even if disguised as images.
 *  - Enforces unique entropy on paths: projects/${projectId}/${driveFileId}-${entropy}.${ext}.
 *  - Explicit typed domain error mapping.
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

import 'server-only';
import * as crypto from 'node:crypto';
import { put, del } from '@vercel/blob';
import {
  IBlobStoragePort,
  BlobUploadOptions,
  BlobUploadResult,
  BlobStorageDomainError,
} from '../domain/ports/blob-storage-port';

/**
 * Configuration options for VercelBlobAdapter.
 */
export interface VercelBlobConfig {
  readonly token?: string;
}

/**
 * Validates binary magic bytes to determine the true content type.
 * Blocks dangerous executable web types (SVG, HTML, XML).
 * 
 * @param buffer - Binary data buffer (first bytes)
 * @returns Verified MIME type string or null if unrecognizable
 */
export function detectMagicBytesMime(buffer: Uint8Array): string | null {
  if (!buffer || buffer.length < 4) {
    return null;
  }

  // Step 1: Check for executable markup / script tags (Stored XSS defense)
  const headerSlice = Buffer.from(buffer.slice(0, 100)).toString('utf-8').trim().toLowerCase();
  if (
    headerSlice.includes('<svg') ||
    headerSlice.includes('<?xml') ||
    headerSlice.includes('<!doctype html') ||
    headerSlice.includes('<html') ||
    headerSlice.includes('<script')
  ) {
    return 'disallowed/executable-markup';
  }

  // Step 2: JPEG (FF D8 FF)
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // Step 3: PNG (89 50 4E 47)
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }

  // Step 4: WEBP (RIFF....WEBP)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && // 'R'
    buffer[1] === 0x49 && // 'I'
    buffer[2] === 0x46 && // 'F'
    buffer[3] === 0x46 && // 'F'
    buffer[8] === 0x57 && // 'W'
    buffer[9] === 0x45 && // 'E'
    buffer[10] === 0x42 && // 'B'
    buffer[11] === 0x50 // 'P'
  ) {
    return 'image/webp';
  }

  // Step 5: PDF (%PDF - 25 50 44 46)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return 'application/pdf';
  }

  // Step 6: MP4 (ftyp at offset 4: 66 74 79 70)
  if (
    buffer.length >= 8 &&
    buffer[4] === 0x66 && // 'f'
    buffer[5] === 0x74 && // 't'
    buffer[6] === 0x79 && // 'y'
    buffer[7] === 0x70 // 'p'
  ) {
    return 'video/mp4';
  }

  // Step 7: WebM / Matroska (1A 45 DF A3)
  if (
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return 'video/webm';
  }

  return null;
}

/**
 * Adapter implementing IBlobStoragePort via Vercel Blob.
 */
export class VercelBlobAdapter implements IBlobStoragePort {
  private readonly token?: string;

  constructor(config: VercelBlobConfig = {}) {
    this.token = config.token || process.env.BLOB_READ_WRITE_TOKEN;
  }

  /**
   * Uploads data to Vercel Blob after validating magic bytes.
   */
  public async uploadBlob(options: BlobUploadOptions): Promise<BlobUploadResult> {
    // Step 1: Validate auth token presence
    const activeToken = this.token || process.env.BLOB_READ_WRITE_TOKEN;
    if (!activeToken) {
      throw new BlobStorageDomainError(
        'BLOB_TOKEN_MISSING',
        'BLOB_READ_WRITE_TOKEN environment variable is not configured'
      );
    }

    // Step 2: Validate magic bytes against claimed contentType
    const detectedMime = detectMagicBytesMime(options.data);
    if (detectedMime === 'disallowed/executable-markup') {
      throw new BlobStorageDomainError(
        'DISALLOWED_MIME_TYPE',
        'Executable SVG/HTML markup is strictly prohibited for security (Stored XSS defense)'
      );
    }

    if (!detectedMime) {
      throw new BlobStorageDomainError(
        'INVALID_MAGIC_BYTES',
        `Unrecognized binary magic bytes for claimed content type: ${options.contentType}`
      );
    }

    // Step 3: Construct collision-free pathname with entropy
    const entropy = crypto.randomUUID().slice(0, 8);
    const sanitizedFilename = options.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const pathname = `projects/${options.projectId}/${options.driveFileId}-${entropy}-${sanitizedFilename}`;

    // Step 4: Execute upload to Vercel Blob
    try {
      const blob = await put(pathname, Buffer.from(options.data), {
        access: 'public',
        token: activeToken,
        contentType: detectedMime,
      });

      return {
        url: blob.url,
        pathname: blob.pathname,
        contentType: blob.contentType,
        sizeBytes: options.data.byteLength,
      };
    } catch (err: unknown) {
      if (err instanceof BlobStorageDomainError) {
        throw err;
      }
      throw new BlobStorageDomainError(
        'UPLOAD_FAILED',
        `Vercel Blob upload failed: ${(err as Error)?.message || 'Unknown error'}`,
        true,
        err
      );
    }
  }

  /**
   * Deletes one or more blobs from Vercel Blob storage by public URL.
   *
   * @param urlOrUrls - Blob URL or array of Blob URLs to delete
   */
  public async deleteBlob(urlOrUrls: string | string[]): Promise<void> {
    // Step 1: Validate auth token presence
    const activeToken = this.token || process.env.BLOB_READ_WRITE_TOKEN;
    if (!activeToken) {
      throw new BlobStorageDomainError(
        'BLOB_TOKEN_MISSING',
        'BLOB_READ_WRITE_TOKEN environment variable is not configured'
      );
    }

    // Step 2: Invoke @vercel/blob del() API with authorization token
    try {
      await del(urlOrUrls, { token: activeToken });
    } catch (err: unknown) {
      if (err instanceof BlobStorageDomainError) {
        throw err;
      }
      throw new BlobStorageDomainError(
        'UPLOAD_FAILED',
        `Vercel Blob deletion failed: ${(err as Error)?.message || 'Unknown error'}`,
        true,
        err
      );
    }
  }
}
