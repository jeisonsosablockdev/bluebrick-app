import { describe, test, expect } from 'vitest';
import path from 'path';
import fs from 'fs';

describe('SPEC-51 - Root Symlink Elimination & TSConfig Harmonization', () => {
  const repoRoot = path.resolve(__dirname, '../../');

  test('no symlinks exist in the root or apps/web', () => {
    const checkPaths = [
      path.join(repoRoot, 'components'),
      path.join(repoRoot, 'public'),
      path.join(repoRoot, 'src'),
      path.join(repoRoot, 'src/features'),
      path.join(repoRoot, 'apps/web/app')
    ];

    for (const p of checkPaths) {
      if (fs.existsSync(p)) {
        const stats = fs.lstatSync(p);
        expect(stats.isSymbolicLink(), `Path ${p} should not be a symbolic link`).toBe(false);
      }
    }
  });

  test('tsconfig paths map directly to canonical apps/web/src locations', () => {
    const tsconfigPath = path.join(repoRoot, 'tsconfig.json');
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));

    expect(tsconfig.compilerOptions.paths['@/features/*']).toEqual(['./apps/web/src/features/*']);
    expect(tsconfig.compilerOptions.paths['@core/*']).toEqual(['./apps/web/src/lib/core/*']);
    expect(tsconfig.compilerOptions.paths['@software/*']).toEqual(['./apps/web/src/lib/software/*']);
    expect(tsconfig.compilerOptions.paths['@knowledge/*']).toEqual(['./apps/web/src/lib/knowledge/*']);
    expect(tsconfig.compilerOptions.paths['@regulatory/*']).toEqual(['./apps/web/src/lib/regulatory/*']);
  });
});
