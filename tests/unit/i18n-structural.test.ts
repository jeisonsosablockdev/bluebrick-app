/**
 * @file tests/unit/i18n-structural.test.ts
 * @description Layer 1 & QA: Structural verification test for BBC-009 4-Layer Internationalization Architecture.
 * @spec BBC-009-STRUCTURAL
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("BBC-009: 4-Layer Internationalization Structural Architecture (@spec BBC-009-STRUCTURAL)", () => {
  const rootDir = process.cwd();

  const requiredI18nFiles = [
    // Layer 1: Presentation
    "apps/web/src/features/i18n/presentation/components/locale-switcher.tsx",
    "apps/web/src/features/i18n/presentation/components/i18n-provider.tsx",

    // Layer 2: Application
    "apps/web/src/features/i18n/application/hooks/use-i18n.ts",
    "apps/web/src/features/i18n/application/actions/locale-cookie-actions.ts",
    "apps/web/src/features/i18n/application/queries/get-dictionary-query.ts",

    // Layer 3: Domain
    "apps/web/src/features/i18n/domain/models/locale-types.ts",
    "apps/web/src/features/i18n/domain/schemas/i18n-dictionary-schema.ts",
    "apps/web/src/features/i18n/domain/dictionaries/es.ts",
    "apps/web/src/features/i18n/domain/dictionaries/en.ts",
    "apps/web/src/features/i18n/domain/dictionaries/pt.ts",
    "apps/web/src/features/i18n/domain/ports/i18n-port.ts",
    "apps/web/src/features/i18n/domain/formatters/locale-formatters.ts",

    // Layer 4: Infrastructure
    "apps/web/src/features/i18n/infrastructure/cookie-locale-adapter.ts",
    "apps/web/src/features/i18n/infrastructure/browser-locale-detector.ts",
    "apps/web/src/features/i18n/infrastructure/dictionary-loader-adapter.ts",

    // Feature Barrel
    "apps/web/src/features/i18n/index.ts",
  ];

  it.each(requiredI18nFiles)("should physically exist on disk: %s", (relativeFilePath) => {
    // Step 1: Resolve full path from project root
    const fullPath = path.resolve(rootDir, relativeFilePath);
    const exists = fs.existsSync(fullPath);

    // Step 2: Assert file existence (RED prior to scaffolding, GREEN after)
    expect(exists, `Expected file ${relativeFilePath} to exist`).toBe(true);
  });
});
