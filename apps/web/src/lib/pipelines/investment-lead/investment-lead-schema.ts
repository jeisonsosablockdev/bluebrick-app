/**
 * @file apps/web/src/lib/pipelines/investment-lead/investment-lead-schema.ts
 * @description Layer 3: Domain - Zod validation schema and TypeScript contracts for investment leads.
 * Validates inbound lead submissions from institutional investors before notification dispatch.
 */

import { z } from "zod";

/**
 * Zod validation schema for investment lead notification payload.
 *
 * Invariants:
 * - Investor ID must be a non-empty string.
 * - Investor email must be a valid email format, trimmed, and normalized to lowercase.
 * - Investor name must be at least 2 characters after trimming whitespace.
 * - Tier is constrained to valid institutional investor tiers, defaulting to 'BRONZE'.
 */
export const investmentLeadSchema = z.object({
  // Step 1: Enforce non-empty investor ID invariant
  investorId: z.string().min(1, "Investor ID is required"),

  // Step 2: Enforce non-whitespace investor name with min 2 characters
  investorName: z
    .string()
    .trim()
    .min(2, "Investor name must be at least 2 characters"),

  // Step 3: Trim, lowercase, and validate email format
  investorEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid investor email format"),

  // Step 4: Default tier assignment to BRONZE if omitted
  tier: z.string().default("BRONZE"),

  // Step 5: Optional ISO datetime timestamp
  timestamp: z.string().datetime().optional(),

  // Step 6: Optional arbitrary metadata dictionary
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * TypeScript type inferred from investmentLeadSchema.
 */
export type InvestmentLeadPayload = z.infer<typeof investmentLeadSchema>;
