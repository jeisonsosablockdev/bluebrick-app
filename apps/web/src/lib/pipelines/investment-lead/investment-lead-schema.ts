/**
 * @file apps/web/src/lib/pipelines/investment-lead/investment-lead-schema.ts
 * @description Layer 3: Domain - Zod validation schema and TypeScript contracts for investment leads.
 * Validates inbound lead submissions from institutional investors before notification dispatch.
 */

import { z } from "zod";

/**
 * Zod validation schema for an individual investment holding item.
 *
 * Invariants:
 * - Property name must be a non-empty trimmed string.
 * - Invested amount must be a non-negative number.
 * - ROI must be a number representing annualized yield percentage.
 * - Status must be a non-empty string indicating project state.
 */
export const currentInvestmentItemSchema = z.object({
  // Step 1: Enforce non-empty property name
  propertyName: z.string().trim().min(1, "Property name is required"),

  // Step 2: Enforce non-negative invested amount
  investedAmount: z.number().nonnegative("Invested amount must be non-negative"),

  // Step 3: Enforce numerical ROI percentage
  roi: z.number(),

  // Step 4: Enforce project status string
  status: z.string().trim(),
});

/**
 * TypeScript type inferred from currentInvestmentItemSchema.
 */
export type CurrentInvestmentItem = z.infer<typeof currentInvestmentItemSchema>;

/**
 * Zod validation schema for investment lead notification payload.
 *
 * Invariants:
 * - Investor ID must be a non-empty string.
 * - Investor email must be a valid email format, trimmed, and normalized to lowercase.
 * - Investor name must be at least 2 characters after trimming whitespace.
 * - Tier is constrained to valid institutional investor tiers, defaulting to 'BRONZE'.
 * - investorPhone is optional but trimmed if provided.
 * - reinvestmentCapital and totalInvested must be non-negative if provided.
 * - currentInvestments must contain valid investment holding items if provided.
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

  // Step 7: Optional contact telephone string
  investorPhone: z.string().trim().optional(),

  // Step 8: Optional capital available for reinvestment
  reinvestmentCapital: z
    .number()
    .nonnegative("Reinvestment capital must be non-negative")
    .optional(),

  // Step 9: Optional total historical invested capital
  totalInvested: z
    .number()
    .nonnegative("Total invested capital must be non-negative")
    .optional(),

  // Step 10: Optional portfolio holdings breakdown
  currentInvestments: z.array(currentInvestmentItemSchema).optional(),
});

/**
 * TypeScript type inferred from investmentLeadSchema.
 */
export type InvestmentLeadPayload = z.infer<typeof investmentLeadSchema>;
