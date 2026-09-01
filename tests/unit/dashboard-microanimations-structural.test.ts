/**
 * @file tests/unit/dashboard-microanimations-structural.test.ts
 * @description Layer 1 & QA: Structural verification test for BBC-016 (Dashboard Micro-animations & Core Web Vitals).
 * Verifies that the required 4-layer architecture artifacts physically exist on disk.
 * @spec BBC-016
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("SPEC BBC-016: Dashboard Micro-animations Structural Contract", () => {
  // Step 1: Resolve repository root directory
  const rootDir = process.cwd();

  // Step 2: Declare all required 4-layer files projected in the Solution Spec
  const requiredMicroAnimationFiles = [
    // Layer 1: Presentation
    "apps/web/src/components/dashboard/dashboard-interactive-card.tsx",
    "apps/web/src/components/dashboard/investment-dashboard.tsx",
    "apps/web/src/components/dashboard/stat-chip.tsx",
    "apps/web/src/components/dashboard/project-phase-progress.tsx",
    "apps/web/src/app/globals.css",
    // Layer 2: Application / Consumption
    "apps/web/src/lib/hooks/use-reduced-motion.ts",
    // Layer 3: Domain / Pipelines
    "apps/web/src/lib/pipelines/micro-animation-tokens.ts",
  ];

  it.each(requiredMicroAnimationFiles)(
    "should verify file physically exists on disk: %s",
    (relativeFilePath) => {
      // Step 3: Check physical existence on filesystem
      const fullPath = path.resolve(rootDir, relativeFilePath);
      const exists = fs.existsSync(fullPath);
      expect(exists, `Expected file ${relativeFilePath} to exist`).toBe(true);
    }
  );
});
