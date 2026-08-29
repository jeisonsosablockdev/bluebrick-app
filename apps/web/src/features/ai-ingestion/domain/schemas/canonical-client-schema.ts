/**
 * ============================================================================
 * Layer 3: Domain - Canonical Client Schema & Invariants
 * ============================================================================
 * Purpose: Single-source-of-truth Zod data contract for extracted and normalized
 * client entities across the AI Ingestion Pipeline.
 * Invariants:
 *  - Strict decimal representation for monetary values (prevents JS float drift).
 *  - Sanitization of prototype pollution vectors (__proto__, constructor).
 *  - Unknown hallucinated keys stripped automatically.
 *  - Zero external I/O or framework dependencies.
 * Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
 */

import { z } from 'zod';

/**
 * Sanitizes an object to eliminate prototype pollution keys.
 * 
 * @param obj - Raw unknown object
 * @returns Safe cleaned object without prototype or constructor keys
 */
export function stripPrototypeProperties<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(stripPrototypeProperties) as unknown as T;
  }

  const cleanObj: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    // Step 1: Filter out prototype pollution attack vectors
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    cleanObj[key] = stripPrototypeProperties(value);
  }
  return cleanObj as T;
}

/**
 * Regex enforcing strict financial decimal precision (e.g. "150000.00" or "5000").
 */
export const DECIMAL_MONEY_REGEX = /^\d+(\.\d{1,2})?$/;

/**
 * Zod Schema for Canonical Client Entity.
 */
export const CanonicalClientSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Client name is required').max(255).trim(),
  taxId: z.string().max(50).trim().nullable().optional(),
  email: z.string().email('Invalid email format').max(255).trim().toLowerCase().nullable().optional(),
  phone: z.string().max(50).trim().nullable().optional(),
  contractAmount: z.string()
    .regex(DECIMAL_MONEY_REGEX, 'Contract amount must be a valid non-negative decimal string with at most 2 decimal places')
    .nullable()
    .optional(),
  status: z.enum(['ACTIVE', 'PENDING', 'ARCHIVED', 'INACTIVE']).default('PENDING'),
  metadata: z.record(z.string(), z.unknown())
    .optional()
    .transform((val) => (val ? stripPrototypeProperties(val) : {})),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
}).strip();

/**
 * Inferred TypeScript type for Canonical Client.
 */
export type CanonicalClient = z.infer<typeof CanonicalClientSchema>;
