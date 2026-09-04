/**
 * ============================================================================
 * Layer 2: Application - Human-in-the-Loop (HITL) Review Server Actions
 * ============================================================================
 * Purpose: Provides authenticated Server Actions to approve, correct, or reject
 * extracted ingestion records with strict RBAC authorization and Zod schema re-parsing.
 * Invariants:
 *  - Enforces RBAC permissions (ADMIN or COMPLIANCE roles required).
 *  - Mandatory Zod re-validation on all manual human corrections before DB write.
 *  - Idempotent execution preventing double-submit state corruption.
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

'use server';

import { CanonicalClientSchema } from '../../domain/schemas/canonical-client-schema';
import {
  IIngestionRepositoryPort,
  RepositoryDomainError,
} from '../../domain/ports/repositories-port';
import { PostgresIngestionRepository } from '../../infrastructure/postgres-ingestion-repository';
import { verifyHitlPermission } from '../../domain/policies/hitl-rbac-policy';

/**
 * Standard Action Response payload.
 */
export interface ActionResponse<T = unknown> {
  readonly success: boolean;
  readonly message: string;
  readonly data?: T;
  readonly errors?: readonly string[];
}

/**
 * Parameters for approving an ingested record.
 */
export interface ApproveRecordParams {
  readonly fileId: string;
  readonly userRole: string;
  readonly correctedClient?: unknown;
}

/**
 * Parameters for rejecting an ingested record.
 */
export interface RejectRecordParams {
  readonly fileId: string;
  readonly userRole: string;
  readonly reason: string;
}

/**
 * Server action to manually approve and promote a record from NEEDS_REVIEW to PROCESSED.
 */
export async function approveSyncRecordAction(
  params: ApproveRecordParams,
  injectedRepo?: IIngestionRepositoryPort
): Promise<ActionResponse> {
  // Step 1: RBAC Permission Check
  if (!verifyHitlPermission(params.userRole)) {
    return {
      success: false,
      message: 'Unauthorized: Only ADMIN or COMPLIANCE roles can approve ingestion records.',
      errors: ['UNAUTHORIZED_ROLE'],
    };
  }

  // Step 2: Validate fileId presence
  if (!params.fileId || typeof params.fileId !== 'string') {
    return {
      success: false,
      message: 'Invalid file identifier.',
      errors: ['INVALID_FILE_ID'],
    };
  }

  const repository = injectedRepo || new PostgresIngestionRepository();

  try {
    // Step 3: If manual corrections are provided, re-validate with Zod
    let validatedClientPayload: Record<string, unknown> | undefined;
    if (params.correctedClient) {
      const parseResult = CanonicalClientSchema.safeParse(params.correctedClient);
      if (!parseResult.success) {
        const errorMessages = parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
        return {
          success: false,
          message: 'Correction validation failed. Please check form inputs.',
          errors: errorMessages,
        };
      }
      validatedClientPayload = parseResult.data as unknown as Record<string, unknown>;

      // Persist corrected client entity
      await repository.upsertClient({
        name: parseResult.data.name,
        taxId: parseResult.data.taxId,
        email: parseResult.data.email,
        phone: parseResult.data.phone,
        contractAmount: parseResult.data.contractAmount,
        status: 'ACTIVE',
        metadata: parseResult.data.metadata,
      });
    }

    // Step 4: Update sync record status to PROCESSED
    const updatedRecord = await repository.upsertSyncRecord({
      fileId: params.fileId,
      folderPath: '',
      sourceType: 'DOCUMENT',
      status: 'PROCESSED',
      confidenceScore: 100.0,
      canonicalPayload: validatedClientPayload,
      validationErrors: [],
    });

    return {
      success: true,
      message: `Record ${params.fileId} successfully approved and marked as PROCESSED.`,
      data: updatedRecord,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: `Failed to approve record: ${(err as Error)?.message || 'Database error'}`,
      errors: ['DATABASE_WRITE_ERROR'],
    };
  }
}

/**
 * Server action to reject an ingestion record and mark it as FAILED.
 */
export async function rejectSyncRecordAction(
  params: RejectRecordParams,
  injectedRepo?: IIngestionRepositoryPort
): Promise<ActionResponse> {
  // Step 1: RBAC Permission Check
  if (!verifyHitlPermission(params.userRole)) {
    return {
      success: false,
      message: 'Unauthorized: Only ADMIN or COMPLIANCE roles can reject ingestion records.',
      errors: ['UNAUTHORIZED_ROLE'],
    };
  }

  // Step 2: Validate reason
  if (!params.reason || params.reason.trim().length < 5) {
    return {
      success: false,
      message: 'A rejection reason of at least 5 characters is required.',
      errors: ['INVALID_REASON'],
    };
  }

  const repository = injectedRepo || new PostgresIngestionRepository();

  try {
    const updatedRecord = await repository.upsertSyncRecord({
      fileId: params.fileId,
      folderPath: '',
      sourceType: 'DOCUMENT',
      status: 'FAILED',
      confidenceScore: 0.0,
      validationErrors: [{ rejectedByRole: params.userRole, reason: params.reason }],
    });

    return {
      success: true,
      message: `Record ${params.fileId} successfully rejected.`,
      data: updatedRecord,
    };
  } catch (err) {
    return {
      success: false,
      message: `Failed to reject record: ${(err as Error)?.message || 'Database error'}`,
      errors: ['DATABASE_WRITE_ERROR'],
    };
  }
}
