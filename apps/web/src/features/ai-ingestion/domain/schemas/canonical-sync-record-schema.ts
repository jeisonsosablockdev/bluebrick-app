/**
 * ============================================================================
 * Layer 3: Domain - Canonical Sync Record Schema & Invariants
 * ============================================================================
 * Purpose: Single-source-of-truth Zod data contract for tracking the lifecycle
 * of files ingested from Google Drive (audits, checksums, and HITL state).
 * Invariants:
 *  - Confidence score strictly within [0, 100].
 *  - Strict sync statuses: PENDING, PROCESSING, PROCESSED, NEEDS_REVIEW, FAILED.
 *  - Helper to format Zod validation issues for Human-in-the-Loop display.
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

import { z } from 'zod';
import { stripPrototypeProperties } from './canonical-client-schema';

/**
 * Human-in-the-Loop friendly validation issue representation.
 */
export interface HitlValidationIssue {
  readonly path: string;
  readonly message: string;
  readonly code: string;
}

/**
 * Transforms raw Zod validation issues into structured HITL issue records.
 * 
 * @param issues - Array of ZodIssue objects
 * @returns Clean array of HitlValidationIssue objects
 */
export function formatZodIssuesForHitl(issues: z.ZodIssue[]): HitlValidationIssue[] {
  return issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));
}

/**
 * Zod Schema for Canonical Sync Record Entity.
 */
export const CanonicalSyncRecordSchema = z.object({
  driveFileId: z.string().min(1, 'Drive File ID is required').max(255),
  fileName: z.string().min(1, 'File name is required').max(500).trim(),
  folderPath: z.string().max(1000).trim().default('/'),
  md5Checksum: z.string().max(64).nullable().optional(),
  syncStatus: z.enum(['PENDING', 'PROCESSING', 'PROCESSED', 'NEEDS_REVIEW', 'FAILED']).default('PENDING'),
  confidenceScore: z.number().min(0).max(100).default(0),
  extractedPayload: z.record(z.string(), z.unknown())
    .nullable()
    .optional()
    .transform((val) => (val ? stripPrototypeProperties(val) : null)),
  validationIssues: z.array(z.object({
    path: z.string(),
    message: z.string(),
    code: z.string(),
  })).default([]),
  metadata: z.record(z.string(), z.unknown())
    .optional()
    .transform((val) => (val ? stripPrototypeProperties(val) : {})),
  lastModifiedTime: z.string().datetime().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
}).strip();

/**
 * Inferred TypeScript type for Canonical Sync Record.
 */
export type CanonicalSyncRecord = z.infer<typeof CanonicalSyncRecordSchema>;
