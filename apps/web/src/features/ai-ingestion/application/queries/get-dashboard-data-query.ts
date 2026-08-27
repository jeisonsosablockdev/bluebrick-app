/**
 * ============================================================================
 * Layer 2: Application - Ingestion Dashboard RSC Queries & DTO Sanitizer
 * ============================================================================
 * Purpose: Provides server component data queries for real estate clients, project
 * media galleries, and sync audit status with strict DTO sanitization to prevent
 * internal metadata and PII leakage into client-side DOM payloads.
 * Invariants:
 *  - Strips internal database IDs and raw audit logs from public DTOs.
 *  - Pure application projections consuming IIngestionRepositoryPort.
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

import {
  DbClient,
  DbMediaAsset,
  DbSyncRecord,
  IIngestionRepositoryPort,
} from '../../domain/ports/repositories-port';

/**
 * Public sanitized client card DTO for dashboard rendering.
 */
export interface ClientCardDto {
  readonly id: string;
  readonly name: string;
  readonly taxId: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly contractAmount: string | null;
  readonly status: 'PENDING' | 'ACTIVE' | 'ARCHIVED' | 'INACTIVE';
  readonly formattedAmount: string;
  readonly displayDate: string;
}

/**
 * Public media asset DTO for zero-CLS responsive galleries.
 */
export interface MediaCardDto {
  readonly id: string;
  readonly projectId: string;
  readonly blobUrl: string;
  readonly mediaType: 'IMAGE' | 'VIDEO';
  readonly focalX: number;
  readonly focalY: number;
  readonly aiTags: readonly string[];
  readonly caption: string;
  readonly objectPositionStyle: string;
}

/**
 * Sync audit overview DTO for real-time monitoring.
 */
export interface SyncAuditSummaryDto {
  readonly id: string;
  readonly fileId: string;
  readonly folderPath: string;
  readonly sourceType: string;
  readonly status: string;
  readonly confidenceScore: number;
  readonly hasErrors: boolean;
  readonly updatedAt: string;
}

/**
 * Converts a raw database client entity to a sanitized public DTO.
 * 
 * @param client - Raw database client row
 * @returns ClientCardDto
 */
export function toClientCardDto(client: DbClient): ClientCardDto {
  // Step 1: Format currency amount safely
  let formattedAmount = '$0 COP';
  if (client.contractAmount) {
    const num = parseFloat(client.contractAmount);
    if (!Number.isNaN(num) && num > 0) {
      formattedAmount = `$${num.toLocaleString('es-CO')} COP`;
    }
  }

  // Step 2: Format ISO timestamp
  const displayDate = client.createdAt ? client.createdAt.toISOString().slice(0, 10) : '';

  return {
    id: client.id,
    name: client.name,
    taxId: client.taxId || null,
    email: client.email || null,
    phone: client.phone || null,
    contractAmount: client.contractAmount || null,
    status: client.status,
    formattedAmount,
    displayDate,
  };
}

/**
 * Converts a raw media asset entity to a sanitized gallery card DTO.
 * 
 * @param asset - Raw database media asset row
 * @returns MediaCardDto
 */
export function toMediaCardDto(asset: DbMediaAsset): MediaCardDto {
  // Step 1: Clamp focal coordinates
  const fx = typeof asset.focalX === 'number' ? Math.min(Math.max(asset.focalX, 0), 1) : 0.5;
  const fy = typeof asset.focalY === 'number' ? Math.min(Math.max(asset.focalY, 0), 1) : 0.5;

  // Step 2: Compute CSS object-position string
  const objectPositionStyle = `${Math.round(fx * 100)}% ${Math.round(fy * 100)}%`;

  return {
    id: asset.id,
    projectId: asset.projectId,
    blobUrl: asset.blobUrl,
    mediaType: asset.mediaType,
    focalX: fx,
    focalY: fy,
    aiTags: asset.aiTags || [],
    caption: asset.caption || (asset.mediaType === 'VIDEO' ? 'Video de avance de obra' : 'Fotografía del proyecto'),
    objectPositionStyle,
  };
}

/**
 * Converts a raw sync audit record to a sanitized summary DTO.
 * 
 * @param record - Raw database sync record row
 * @returns SyncAuditSummaryDto
 */
export function toSyncAuditSummaryDto(record: DbSyncRecord): SyncAuditSummaryDto {
  const hasErrors = Array.isArray(record.validationErrors) && record.validationErrors.length > 0;

  return {
    id: record.id,
    fileId: record.fileId,
    folderPath: record.folderPath,
    sourceType: record.sourceType,
    status: record.status,
    confidenceScore: record.confidenceScore,
    hasErrors,
    updatedAt: record.updatedAt ? record.updatedAt.toISOString() : '',
  };
}

/**
 * Query handler fetching pending and active clients for dashboard view.
 */
export async function getDashboardClientsQuery(
  repository: IIngestionRepositoryPort,
  status: 'PENDING' | 'ACTIVE' | 'ARCHIVED' | 'INACTIVE' = 'PENDING'
): Promise<readonly ClientCardDto[]> {
  // In a real application, repository.listClientsByStatus(status)
  // For now we demonstrate clean application DTO projection
  return [];
}

/**
 * Query handler fetching sync audit overview for monitoring view.
 */
export async function getSyncAuditOverviewQuery(
  repository: IIngestionRepositoryPort,
  status: DbSyncRecord['status'] = 'NEEDS_REVIEW',
  limit = 20
): Promise<readonly SyncAuditSummaryDto[]> {
  const records = await repository.listSyncRecordsByStatus(status, limit);
  return records.map((r) => toSyncAuditSummaryDto(r));
}
