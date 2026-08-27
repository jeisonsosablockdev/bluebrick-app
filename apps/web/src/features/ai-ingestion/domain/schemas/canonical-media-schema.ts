/**
 * ============================================================================
 * Layer 3: Domain - Canonical Media Schema & Invariants
 * ============================================================================
 * Purpose: Single-source-of-truth Zod data contract for normalized media items
 * (images, videos) associated with projects.
 * Invariants:
 *  - Focal point coordinates clamped to [0.0, 1.0].
 *  - Dimensions strictly positive integers.
 *  - Aspect ratio validated against standard formats.
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

import { z } from 'zod';
import { stripPrototypeProperties } from './canonical-client-schema';

/**
 * Zod Schema for Focal Point Coordinates.
 */
export const FocalPointSchema = z.object({
  x: z.number().min(0.0).max(1.0).default(0.5),
  y: z.number().min(0.0).max(1.0).default(0.5),
});

/**
 * Zod Schema for Canonical Media Entity.
 */
export const CanonicalMediaSchema = z.object({
  id: z.string().uuid().optional(),
  projectId: z.string().uuid('Valid project UUID is required'),
  blobUrl: z.string().url('Must be a valid CDN URL').max(2048),
  mediaType: z.enum(['IMAGE', 'VIDEO', 'DOCUMENT']),
  caption: z.string().max(500).trim().nullable().optional(),
  aiTags: z.array(z.string().max(50).trim()).default([]),
  focalPoint: FocalPointSchema.default({ x: 0.5, y: 0.5 }),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
  aspectRatio: z.enum(['16:9', '4:3', '1:1', 'CUSTOM']).default('CUSTOM'),
  metadata: z.record(z.string(), z.unknown())
    .optional()
    .transform((val) => (val ? stripPrototypeProperties(val) : {})),
  createdAt: z.string().datetime().optional(),
}).strip();

/**
 * Inferred TypeScript type for Canonical Media.
 */
export type CanonicalMedia = z.infer<typeof CanonicalMediaSchema>;
