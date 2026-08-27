/**
 * ============================================================================
 * Layer 3: Domain - Canonical Project Schema & Invariants
 * ============================================================================
 * Purpose: Single-source-of-truth Zod data contract for property/project entities
 * normalized across the AI Ingestion Pipeline.
 * Invariants:
 *  - Sanitization of prototype pollution vectors.
 *  - Strict slug & naming requirements.
 *  - Unknown hallucinated keys stripped automatically.
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

import { z } from 'zod';
import { stripPrototypeProperties } from './canonical-client-schema';

/**
 * Zod Schema for Canonical Project Entity.
 */
export const CanonicalProjectSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Project name is required').max(255).trim(),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase alphanumeric characters and hyphens').optional(),
  description: z.string().max(5000).trim().nullable().optional(),
  status: z.enum(['ACTIVE', 'PLANNING', 'COMPLETED', 'ARCHIVED']).default('PLANNING'),
  metadata: z.record(z.string(), z.unknown())
    .optional()
    .transform((val) => (val ? stripPrototypeProperties(val) : {})),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
}).strip();

/**
 * Inferred TypeScript type for Canonical Project.
 */
export type CanonicalProject = z.infer<typeof CanonicalProjectSchema>;
