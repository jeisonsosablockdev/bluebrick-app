/**
 * ============================================================================
 * Layer 2: Application - Differential Sync Application Service
 * ============================================================================
 * Purpose: Orchestrates differential polling executions, filters irrelevant or
 * hidden files, and yields sanitized sync events ready for pipeline dispatch.
 * Invariants:
 *  - No direct SQL or raw network calls; relies on Layer 3 Ports.
 *  - Translates domain sync models into application execution batches.
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

import { IGoogleDriveChangesPort } from '../../domain/ports/drive-changes-port';
import { DriveChangeEvent, DifferentialPollResult } from '../../domain/models/sync-event-models';

/**
 * Filter criteria for differential polling.
 */
export interface SyncFilterOptions {
  readonly supportedMimeTypes?: readonly string[];
  readonly targetFolderId?: string;
  readonly ignoreTrashed?: boolean;
}

/**
 * Service orchestrating differential sync from Google Drive.
 */
export class DifferentialSyncService {
  private readonly changesPort: IGoogleDriveChangesPort;

  constructor(changesPort: IGoogleDriveChangesPort) {
    this.changesPort = changesPort;
  }

  /**
   * Executes a differential polling cycle against Google Drive.
   * 
   * @param pageToken - Last recorded page token
   * @param filter - Optional filters for MIME types and folders
   * @returns Filtered batch of discovered change events and updated token
   */
  public async executeSyncCycle(
    pageToken: string,
    filter: SyncFilterOptions = {}
  ): Promise<DifferentialPollResult> {
    // Step 1: Poll changes from Google Drive via domain port
    const pollResult = await this.changesPort.pollChanges(
      pageToken,
      filter.targetFolderId
    );

    // Step 2: Filter out unsupported MIME types and ignored items
    const filteredChanges: DriveChangeEvent[] = pollResult.changes.filter((change) => {
      // Step 2a: Check trashed status
      if (filter.ignoreTrashed && change.isTrashed) {
        return false;
      }

      // Step 2b: Ignore system files (e.g. .DS_Store, desktop.ini)
      if (change.fileName.startsWith('.') || change.fileName.toLowerCase() === 'desktop.ini') {
        return false;
      }

      // Step 2c: Filter by supported MIME types if provided
      if (filter.supportedMimeTypes && filter.supportedMimeTypes.length > 0) {
        return filter.supportedMimeTypes.includes(change.mimeType);
      }

      return true;
    });

    return {
      changes: filteredChanges,
      newPageToken: pollResult.newPageToken,
      tokenResetOccurred: pollResult.tokenResetOccurred,
      totalPagesScanned: pollResult.totalPagesScanned,
    };
  }
}
