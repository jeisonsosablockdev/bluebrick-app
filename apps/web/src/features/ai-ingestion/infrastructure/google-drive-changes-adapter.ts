/**
 * ============================================================================
 * Layer 4: Infrastructure - Google Drive Changes API Adapter
 * ============================================================================
 * Purpose: Implements differential polling against Google Drive Changes API v3,
 * handling page tokens, 410 Gone recovery, composite SHA-256 hashes for Docs/Sheets,
 * and safety pagination limits.
 * Invariants:
 *  - Server-only execution.
 *  - 410 Gone recovers safely by renewing startPageToken with tokenResetOccurred flag.
 *  - Composite hash for non-binary Google Docs: sha256(id + modifiedTime + version).
 *  - Strict pagination bounding (maxPages <= 20).
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

import 'server-only';
import * as crypto from 'node:crypto';
import { IGoogleAuthProviderPort } from '../domain/ports/google-auth-port';
import {
  IGoogleDriveChangesPort,
  DriveChangesDomainError,
} from '../domain/ports/drive-changes-port';
import {
  DriveChangeEvent,
  DifferentialPollResult,
  sanitizeDrivePath,
} from '../domain/models/sync-event-models';

/**
 * Raw Google Drive File representation from Changes API response.
 */
interface RawDriveFile {
  id?: string;
  name?: string;
  mimeType?: string;
  trashed?: boolean;
  md5Checksum?: string;
  version?: string;
  size?: string;
  modifiedTime?: string;
  parents?: string[];
}

/**
 * Raw Google Drive Change item.
 */
interface RawDriveChange {
  kind?: string;
  type?: string;
  changeType?: string;
  time?: string;
  removed?: boolean;
  fileId?: string;
  file?: RawDriveFile;
}

/**
 * Raw Google Drive changes.list API response.
 */
interface RawChangesListResponse {
  nextPageToken?: string;
  newStartPageToken?: string;
  changes?: RawDriveChange[];
}

/**
 * Configuration options for GoogleDriveChangesAdapter.
 */
export interface DriveChangesAdapterConfig {
  readonly authProvider: IGoogleAuthProviderPort;
  readonly baseUrl?: string;
  readonly maxPagesLimit?: number;
  readonly fetchTimeoutMs?: number;
}

/**
 * Adapter implementing IGoogleDriveChangesPort.
 */
export class GoogleDriveChangesAdapter implements IGoogleDriveChangesPort {
  private readonly authProvider: IGoogleAuthProviderPort;
  private readonly baseUrl: string;
  private readonly maxPagesLimit: number;
  private readonly fetchTimeoutMs: number;

  constructor(config: DriveChangesAdapterConfig) {
    if (!config?.authProvider) {
      throw new DriveChangesDomainError(
        'UNAUTHORIZED_DRIVE_ACCESS',
        'Google auth provider is required'
      );
    }
    this.authProvider = config.authProvider;
    this.baseUrl = config.baseUrl ?? 'https://www.googleapis.com/drive/v3';
    this.maxPagesLimit = config.maxPagesLimit ?? 20;
    this.fetchTimeoutMs = config.fetchTimeoutMs ?? 10000;
  }

  /**
   * Retrieves a new startPageToken from Google Drive API.
   */
  public async getStartPageToken(targetFolderId?: string): Promise<string> {
    // Step 1: Obtain valid Bearer access token
    const auth = await this.authProvider.getAccessToken();
    
    // Step 2: Build URL with optional supportsAllDrives
    const url = new URL(`${this.baseUrl}/changes/startPageToken`);
    url.searchParams.set('supportsAllDrives', 'true');
    if (targetFolderId) {
      url.searchParams.set('driveId', targetFolderId);
    }

    // Step 3: Execute GET request
    const response = await this.executeFetch(url.toString(), auth.token);
    const data = (await response.json()) as { startPageToken?: string };

    if (!data?.startPageToken || typeof data.startPageToken !== 'string') {
      throw new DriveChangesDomainError(
        'NETWORK_FAILURE',
        'Malformed startPageToken response from Google Drive API'
      );
    }

    return data.startPageToken;
  }

  /**
   * Polls for changes incrementally since the provided pageToken.
   */
  public async pollChanges(
    pageToken: string,
    targetFolderId?: string,
    maxPages = this.maxPagesLimit
  ): Promise<DifferentialPollResult> {
    // Step 1: Validate input token
    if (!pageToken || typeof pageToken !== 'string' || pageToken.trim() === '') {
      throw new DriveChangesDomainError(
        'PAGE_TOKEN_EXPIRED',
        'Valid pageToken is required for differential polling'
      );
    }

    const discoveredChanges: DriveChangeEvent[] = [];
    let currentPageToken: string | undefined = pageToken;
    let newStartPageToken = '';
    let pagesCount = 0;
    let tokenResetOccurred = false;

    // Step 2: Loop through change pages up to safety limit
    while (currentPageToken && pagesCount < maxPages) {
      pagesCount += 1;
      const auth = await this.authProvider.getAccessToken();

      const url = new URL(`${this.baseUrl}/changes`);
      url.searchParams.set('pageToken', currentPageToken);
      url.searchParams.set('pageSize', '100');
      url.searchParams.set('supportsAllDrives', 'true');
      url.searchParams.set('includeItemsFromAllDrives', 'true');
      url.searchParams.set(
        'fields',
        'nextPageToken,newStartPageToken,changes(fileId,removed,time,file(id,name,mimeType,trashed,md5Checksum,version,size,modifiedTime,parents))'
      );

      let response: Response;
      try {
        response = await this.executeFetch(url.toString(), auth.token);
      } catch (err) {
        // Step 3: Check for 410 Gone token expiration and recover
        if (err instanceof DriveChangesDomainError && err.code === 'PAGE_TOKEN_EXPIRED') {
          tokenResetOccurred = true;
          const freshToken = await this.getStartPageToken(targetFolderId);
          return {
            changes: [],
            newPageToken: freshToken,
            tokenResetOccurred: true,
            totalPagesScanned: pagesCount,
          };
        }
        throw err;
      }

      const data = (await response.json()) as RawChangesListResponse;

      // Step 4: Map raw changes to domain event models
      if (Array.isArray(data.changes)) {
        for (const rawChange of data.changes) {
          const mapped = this.mapRawChangeToEvent(rawChange);
          if (mapped) {
            discoveredChanges.push(mapped);
          }
        }
      }

      // Step 5: Advance to next page or capture terminal newStartPageToken
      if (data.nextPageToken) {
        currentPageToken = data.nextPageToken;
      } else {
        newStartPageToken = data.newStartPageToken ?? currentPageToken;
        currentPageToken = undefined;
      }
    }

    if (pagesCount >= maxPages && currentPageToken) {
      // Pagination limit reached, return current page token for next cron tick
      newStartPageToken = currentPageToken;
    }

    return {
      changes: discoveredChanges,
      newPageToken: newStartPageToken || pageToken,
      tokenResetOccurred,
      totalPagesScanned: pagesCount,
    };
  }

  /**
   * Maps a raw API change object to a typed DriveChangeEvent.
   */
  private mapRawChangeToEvent(raw: RawDriveChange): DriveChangeEvent | null {
    const fileId = raw.fileId || raw.file?.id;
    if (!fileId) return null;

    const file = raw.file;
    const fileName = file?.name ?? 'Untitled';
    const mimeType = file?.mimeType ?? 'application/octet-stream';
    const isTrashed = Boolean(raw.removed || file?.trashed);
    const md5Checksum = file?.md5Checksum ?? null;
    const modifiedTime = file?.modifiedTime ?? raw.time ?? new Date().toISOString();
    const sizeBytes = file?.size ? parseInt(file.size, 10) : null;

    // Step 1: Calculate composite SHA-256 hash for Google Docs/Sheets lacking md5Checksum
    let compositeHash: string;
    if (md5Checksum) {
      compositeHash = md5Checksum;
    } else {
      const version = file?.version ?? '1';
      const sizeStr = file?.size ?? '0';
      compositeHash = crypto
        .createHash('sha256')
        .update(`${fileId}:${modifiedTime}:${version}:${sizeStr}`)
        .digest('hex');
    }

    return {
      fileId,
      fileName,
      mimeType,
      folderPath: sanitizeDrivePath('/'),
      isTrashed,
      md5Checksum,
      compositeHash,
      sizeBytes,
      lastModifiedTime: modifiedTime,
    };
  }

  /**
   * Helper to execute fetch with timeout and standard Google error mapping.
   */
  private async executeFetch(url: string, token: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.fetchTimeoutMs);

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status === 410) {
          throw new DriveChangesDomainError(
            'PAGE_TOKEN_EXPIRED',
            'Google Drive page token has expired or is invalid (410 Gone)',
            false
          );
        }
        if (response.status === 401 || response.status === 403) {
          throw new DriveChangesDomainError(
            'UNAUTHORIZED_DRIVE_ACCESS',
            `Google Drive API authorization failed (HTTP ${response.status})`,
            false
          );
        }
        if (response.status === 429) {
          throw new DriveChangesDomainError(
            'RATE_LIMITED',
            'Google Drive API rate limit exceeded (HTTP 429)',
            true
          );
        }
        throw new DriveChangesDomainError(
          'NETWORK_FAILURE',
          `Google Drive API returned HTTP ${response.status}`,
          response.status >= 500
        );
      }

      return response;
    } catch (err) {
      if (err instanceof DriveChangesDomainError) {
        throw err;
      }
      throw new DriveChangesDomainError(
        'NETWORK_FAILURE',
        (err as Error)?.message || 'Failed to connect to Google Drive API',
        true,
        err
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
