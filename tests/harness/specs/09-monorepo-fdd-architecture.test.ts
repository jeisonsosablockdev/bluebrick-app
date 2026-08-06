import { describe, test, expect } from 'vitest';
import path from 'path';
import fs from 'fs';

describe('09 - Monorepo FDD Architecture & Governance Harness (BRI-186)', () => {
  const repoRoot = path.resolve(__dirname, '../../../');
  const featuresRoot = path.join(repoRoot, 'apps/web/src/features');
  const workspaceConfig = path.join(repoRoot, 'pnpm-workspace.yaml');

  test('pnpm-workspace.yaml exists and configures monorepo workspaces', () => {
    expect(fs.existsSync(workspaceConfig)).toBe(true);
    const content = fs.readFileSync(workspaceConfig, 'utf8');
    expect(content).toContain('apps/web');
    expect(content).toContain('packages/*');
  });

  test('src/features directory exists under apps/web', () => {
    expect(fs.existsSync(featuresRoot)).toBe(true);
  });

  test('each feature slice exports a valid Public API Boundary (index.ts)', () => {
    if (!fs.existsSync(featuresRoot)) {
      throw new Error(`Features root directory missing: ${featuresRoot}`);
    }

    const featureSlices = fs.readdirSync(featuresRoot, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    expect(featureSlices.length).toBeGreaterThan(0);

    for (const slice of featureSlices) {
      const indexPath = path.join(featuresRoot, slice, 'index.ts');
      expect(fs.existsSync(indexPath)).toBe(true);
    }
  });

  test('shared infrastructure contains explicit metaplex and squads subdirectories', () => {
    const metaplexDir = path.join(featuresRoot, 'shared/infrastructure/metaplex');
    const squadsDir = path.join(featuresRoot, 'shared/infrastructure/squads');

    expect(fs.existsSync(metaplexDir)).toBe(true);
    expect(fs.existsSync(squadsDir)).toBe(true);
    expect(fs.existsSync(path.join(metaplexDir, 'das-fetcher'))).toBe(true);
    expect(fs.existsSync(path.join(metaplexDir, 'core-writer'))).toBe(true);
  });
});
