/**
 * ============================================================================
 * Layer 3: Domain - Google Drive Changes Port & Domain Errors
 * ============================================================================
 * Purpose: Defines the contract for polling Google Drive changes differentially,
 * retrieving start page tokens, and computing composite content hashes.
 * Invariants:
 *  - Explicit typed domain errors for 410 Gone (PAGE_TOKEN_EXPIRED), rate limits, and network errors.
 *  - Agnostic to network protocols and SDK libraries.
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

import { DifferentialPollResult } from '../models/sync-event-models';

/**
 * Domain error codes for Google Drive change operations.
 */
export type DriveChangesErrorCode =
  | 'PAGE_TOKEN_EXPIRED'
  | 'UNAUTHORIZED_DRIVE_ACCESS'
  | 'RATE_LIMITED'
  | 'NETWORK_FAILURE'
  | 'PAGINATION_LIMIT_EXCEEDED'
  | 'FOLDER_NOT_FOUND';

/**
 * Domain Error for Google Drive Change polling operations.
 */
export class DriveChangesDomainError extends Error {
  public readonly code: DriveChangesErrorCode;
  public readonly retryable: boolean;
  public readonly originalError?: unknown;

  constructor(
    code: DriveChangesErrorCode,
    message: string,
    retryable = false,
    originalError?: unknown
  ) {
    super(`[DriveChangesDomainError:${code}] ${message}`);
    this.name = 'DriveChangesDomainError';
    this.code = code;
    this.retryable = retryable;
    this.originalError = originalError;
    Object.setPrototypeOf(this, DriveChangesDomainError.prototype);
  }
}

/**
 * Port interface for Google Drive Differential Polling.
 */
export interface IGoogleDriveChangesPort {
  /**
   * Retrieves a new startPageToken from Google Drive API.
   * 
   * @param targetFolderId - Optional root folder ID to constrain changes
   * @returns Clean startPageToken string
   */
  getStartPageToken(targetFolderId?: string): Promise<string>;

  /**
   * Polls for changes incrementally since the provided pageToken.
   * 
   * @param pageToken - The last committed pageToken
   * @param targetFolderId - Optional root folder ID filter
   * @param maxPages - Safety pagination limit (default: 20)
   * @returns DifferentialPollResult with discovered changes and updated pageToken
   */
  pollChanges(
    pageToken: string,
    targetFolderId?: string,
    maxPages?: number
  ): Promise<DifferentialPollResult>;
}
