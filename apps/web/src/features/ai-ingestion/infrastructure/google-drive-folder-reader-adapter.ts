/**
 * ============================================================================
 * Layer 4: Infrastructure - Google Drive Folder Reader Adapter
 * ============================================================================
 * Purpose: Implements IDriveFolderReaderPort against Google Drive API v3.
 * Queries folder contents filtering for image MIME types and downloads binary
 * streams using service account authentication tokens.
 * Invariants:
 *  - Server-only execution.
 *  - Bounded pagination to prevent infinite loops (configurable maxPagesLimit).
 *  - Maps Drive API HTTP errors to DriveFolderReaderDomainError.
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

import 'server-only';
import { IGoogleAuthProviderPort } from '../domain/ports/google-auth-port';
import {
  IDriveFolderReaderPort,
  DriveImageFileInfo,
  ListFolderImagesOptions,
  DriveFolderReaderDomainError,
} from '../domain/ports/drive-folder-reader-port';

/**
 * Configuration options for GoogleDriveFolderReaderAdapter.
 */
export interface DriveFolderReaderAdapterConfig {
  /** Authentication provider supplying valid OAuth2 / Service Account tokens */
  readonly authProvider: IGoogleAuthProviderPort;
  /** Google Drive API base URL (default: https://www.googleapis.com/drive/v3) */
  readonly baseUrl?: string;
  /** Request timeout in milliseconds (default: 15000) */
  readonly fetchTimeoutMs?: number;
  /** Safety pagination ceiling (default: 10) */
  readonly maxPagesLimit?: number;
}

/**
 * Default supported image MIME types for construction phase carousels.
 */
export const DEFAULT_ALLOWED_IMAGE_MIME_TYPES: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

/**
 * Adapter implementing IDriveFolderReaderPort via Google Drive REST API v3.
 */
export class GoogleDriveFolderReaderAdapter implements IDriveFolderReaderPort {
  private readonly authProvider: IGoogleAuthProviderPort;
  private readonly baseUrl: string;
  private readonly fetchTimeoutMs: number;
  private readonly maxPagesLimit: number;

  /**
   * Initializes GoogleDriveFolderReaderAdapter with configuration and auth provider.
   *
   * @param config - Adapter options containing auth provider, base URL, and limits
   * @throws DriveFolderReaderDomainError if authProvider is not supplied
   */
  constructor(config: DriveFolderReaderAdapterConfig) {
    // Step 1: Validate dependencies
    if (!config?.authProvider) {
      throw new DriveFolderReaderDomainError(
        'UNAUTHORIZED_DRIVE_ACCESS',
        'Google auth provider is required for GoogleDriveFolderReaderAdapter'
      );
    }
    this.authProvider = config.authProvider;
    this.baseUrl = config.baseUrl ?? 'https://www.googleapis.com/drive/v3';
    this.fetchTimeoutMs = config.fetchTimeoutMs ?? 15000;
    this.maxPagesLimit = config.maxPagesLimit ?? 10;
  }

  /**
   * Lists image files within a specified Google Drive folder.
   *
   * @param folderId - Google Drive folder ID
   * @param options - Optional query and pagination bounds
   * @returns Array of discovered image file metadata
   */
  public async listImageFiles(
    folderId: string,
    options?: ListFolderImagesOptions
  ): Promise<readonly DriveImageFileInfo[]> {
    // Step 1: Validate folderId invariant
    if (!folderId || typeof folderId !== 'string' || folderId.trim() === '') {
      throw new DriveFolderReaderDomainError(
        'INVALID_FOLDER_ID',
        'A valid non-empty folderId must be provided to list images'
      );
    }

    const cleanFolderId = folderId.trim().replace(/'/g, "\\'");
    const allowedMimeTypes = options?.allowedMimeTypes ?? DEFAULT_ALLOWED_IMAGE_MIME_TYPES;
    const maxFiles = options?.maxFiles ?? 100;

    // Step 2: Build Google Drive API query predicate
    const mimeQuery = allowedMimeTypes
      .map((m) => `mimeType = '${m}'`)
      .join(' or ');
    const query = `'${cleanFolderId}' in parents and trashed = false and (${mimeQuery})`;

    const discoveredImages: DriveImageFileInfo[] = [];
    let pageToken: string | undefined = undefined;
    let pagesScanned = 0;

    // Step 3: Page through folder results up to configured safety limits
    while (pagesScanned < this.maxPagesLimit) {
      pagesScanned += 1;
      const auth = await this.authProvider.getAccessToken();

      const url = new URL(`${this.baseUrl}/files`);
      url.searchParams.set('q', query);
      url.searchParams.set('pageSize', Math.min(maxFiles, 100).toString());
      url.searchParams.set('supportsAllDrives', 'true');
      url.searchParams.set('includeItemsFromAllDrives', 'true');
      url.searchParams.set(
        'fields',
        'nextPageToken,files(id,name,mimeType,size,modifiedTime,md5Checksum)'
      );
      if (pageToken) {
        url.searchParams.set('pageToken', pageToken);
      }

      const response = await this.executeFetch(url.toString(), auth.token);
      const data = (await response.json()) as {
        nextPageToken?: string;
        files?: Array<{
          id?: string;
          name?: string;
          mimeType?: string;
          size?: string;
          modifiedTime?: string;
          md5Checksum?: string;
        }>;
      };

      if (Array.isArray(data.files)) {
        for (const file of data.files) {
          if (file.id && file.name && file.mimeType) {
            discoveredImages.push({
              id: file.id,
              name: file.name,
              mimeType: file.mimeType,
              sizeBytes: file.size ? parseInt(file.size, 10) : null,
              modifiedTime: file.modifiedTime ?? null,
              md5Checksum: file.md5Checksum ?? null,
            });

            if (discoveredImages.length >= maxFiles) {
              return discoveredImages.slice(0, maxFiles);
            }
          }
        }
      }

      pageToken = data.nextPageToken;
      if (!pageToken) {
        break;
      }
    }

    return discoveredImages;
  }

  /**
   * Downloads an image file binary stream from Google Drive.
   *
   * @param fileId - Google Drive file ID
   * @returns Buffer containing binary payload
   */
  public async downloadImageBinary(fileId: string): Promise<Buffer> {
    // Step 1: Validate fileId invariant
    if (!fileId || typeof fileId !== 'string' || fileId.trim() === '') {
      throw new DriveFolderReaderDomainError(
        'FILE_NOT_FOUND',
        'A valid non-empty fileId must be provided to download binary'
      );
    }

    // Step 2: Acquire valid authorization token
    const auth = await this.authProvider.getAccessToken();
    const downloadUrl = `${this.baseUrl}/files/${encodeURIComponent(fileId.trim())}?alt=media&supportsAllDrives=true`;

    // Step 3: Fetch binary payload
    const response = await this.executeFetch(downloadUrl, auth.token);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Internal helper to execute fetch requests with timeouts and HTTP error handling.
   */
  private async executeFetch(url: string, token: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.fetchTimeoutMs);

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: '*/*',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new DriveFolderReaderDomainError(
            'FOLDER_NOT_FOUND',
            `Google Drive resource not found (HTTP 404): ${url}`,
            false
          );
        }
        if (response.status === 401 || response.status === 403) {
          throw new DriveFolderReaderDomainError(
            'UNAUTHORIZED_DRIVE_ACCESS',
            `Google Drive API authorization failed (HTTP ${response.status})`,
            false
          );
        }
        if (response.status === 429) {
          throw new DriveFolderReaderDomainError(
            'RATE_LIMITED',
            'Google Drive API rate limit exceeded (HTTP 429)',
            true
          );
        }
        throw new DriveFolderReaderDomainError(
          'NETWORK_FAILURE',
          `Google Drive API returned HTTP ${response.status}: ${response.statusText}`,
          response.status >= 500
        );
      }

      return response;
    } catch (err) {
      if (err instanceof DriveFolderReaderDomainError) {
        throw err;
      }
      throw new DriveFolderReaderDomainError(
        'NETWORK_FAILURE',
        (err as Error)?.message || 'Failed to communicate with Google Drive API',
        true,
        err
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
