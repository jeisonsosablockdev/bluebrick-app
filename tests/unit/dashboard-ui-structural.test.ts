/**
 * @file tests/unit/dashboard-ui-structural.test.ts
 * @description Layer 1 & QA: Structural verification test for SPEC-3 (Dashboard UI & Vercel Blob).
 * @spec BBC-6-SPEC-3
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("SPEC-3: Dashboard UI & Vercel Blob Structural Contract (@spec BBC-6-SPEC-3)", () => {
  const rootDir = process.cwd();

  const requiredDashboardFiles = [
    "apps/web/src/app/dashboard/page.tsx",
    "apps/web/src/components/dashboard/investment-dashboard.tsx",
    "apps/web/src/components/dashboard/stat-chip.tsx",
    "apps/web/src/components/dashboard/metric-row.tsx",
    "apps/web/src/components/dashboard/status-badge.tsx",
    "apps/web/src/components/profile/avatar-upload-modal.tsx",
    "apps/web/src/lib/hooks/use-count-up.ts",
    "apps/web/src/lib/types/dashboard.ts",
    "apps/web/src/lib/pipelines/dashboard-metrics.ts",
    "apps/web/src/lib/pipelines/blob-storage-pipeline.ts",
    "apps/web/src/lib/infrastructure/blob/vercel-blob-client.ts",
  ];

  it.each(requiredDashboardFiles)("should physically exist on disk: %s", (relativeFilePath) => {
    const fullPath = path.resolve(rootDir, relativeFilePath);
    const exists = fs.existsSync(fullPath);
    expect(exists, `Expected file ${relativeFilePath} to exist`).toBe(true);
  });
});
