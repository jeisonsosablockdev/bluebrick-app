/**
 * @file tests/unit/investment-lead-structural.test.ts
 * @description Layer 1 & QA: Structural verification test for BBC-17 (Investment Lead Notification System - 4-Layer Architecture).
 * Validates that all projected structural files across Presentation, Application, Domain, and Infrastructure layers
 * physically exist on disk before behavioral implementation begins.
 * @spec BBC-17
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Structural file descriptor interface.
 * Represents an architectural file artifact in the 4-layer taxonomy.
 */
interface StructuralFileDescriptor {
  /** Relative file path from repository root */
  path: string;
  /** Architectural layer classification */
  layer: "Layer 1: Presentation" | "Layer 2: Application" | "Layer 3: Domain" | "Layer 4: Infrastructure";
  /** Purpose and responsibility of the component file */
  description: string;
}

/**
 * Fixture: Required 4-Layer Architecture Files for BBC-17.
 * 
 * Enforces strict decoupling across the four canonical layers:
 * - Layer 1 (Presentation): Dashboard CTA button and interactive state in investment dashboard.
 * - Layer 2 (Application): Next.js Server Action with session auth and rate limiting.
 * - Layer 3 (Domain): Lead validation Zod schema and corporate email HTML/text template.
 * - Layer 4 (Infrastructure): Resilient Nodemailer SMTP transport adapter.
 */
const REQUIRED_INVESTMENT_LEAD_FILES: readonly StructuralFileDescriptor[] = [
  // Layer 4: Infrastructure SMTP transport
  {
    path: "apps/web/src/lib/infrastructure/email/smtp-mailer.ts",
    layer: "Layer 4: Infrastructure",
    description: "Nodemailer SMTP transport module with dry-run fallback and environment configuration",
  },
  // Layer 3: Domain Zod schema
  {
    path: "apps/web/src/lib/pipelines/investment-lead/investment-lead-schema.ts",
    layer: "Layer 3: Domain",
    description: "Zod validation contract for investment lead payload and metadata",
  },
  // Layer 3: Domain Email template
  {
    path: "apps/web/src/lib/pipelines/investment-lead/investment-lead-template.ts",
    layer: "Layer 3: Domain",
    description: "Corporate HTML/plain text email generator with dark mode styling and investor details",
  },
  // Layer 2: Application Server Action
  {
    path: "apps/web/src/lib/auth/investment-actions.ts",
    layer: "Layer 2: Application",
    description: "Server Action validating WorkOS session and orchestrating domain notification pipeline",
  },
  // Layer 1: Presentation Dashboard CTA
  {
    path: "apps/web/src/components/dashboard/investment-dashboard.tsx",
    layer: "Layer 1: Presentation",
    description: "Presentation component hosting the 'Invertir ahora' CTA button with reactive feedback",
  },
] as const;

describe("BBC-17: Investment Lead Notification 4-Layer Structural Suite (@spec BBC-17)", () => {
  // Step 1: Resolve repository root directory anchor
  const rootDir = process.cwd();

  describe("Architectural File Existence Contract", () => {
    it.each(REQUIRED_INVESTMENT_LEAD_FILES)(
      "should physically exist on disk: [$layer] $path ($description)",
      ({ path: relativeFilePath, layer, description }) => {
        // Arrange: Build absolute file path and verify target boundaries
        // Step 2: Resolve absolute path from project root to prevent path traversal edge cases
        const targetPath = path.resolve(rootDir, relativeFilePath);

        // Act: Inspect physical filesystem presence
        // Step 3: Check synchronous file existence
        const fileExists = fs.existsSync(targetPath);

        // Assert: Ensure file is present on disk
        // Step 4: Verify assertion satisfies 4-layer scaffolding requirement
        // Edge Case: File missing or scaffolded in incorrect layer directory fails with descriptive diagnostics
        expect(
          fileExists,
          `[STRUCTURAL RED] Missing ${layer} artifact at "${relativeFilePath}". ` +
            `Purpose: ${description}. Scaffolding required before behavioral phase.`
        ).toBe(true);
      }
    );
  });
});
