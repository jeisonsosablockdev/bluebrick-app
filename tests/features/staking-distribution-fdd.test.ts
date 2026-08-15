import { describe, test, expect } from 'vitest';
import path from 'path';
import fs from 'fs';

describe('SPEC-36 - Staking & Distribution Feature Architecture', () => {
  const repoRoot = path.resolve(__dirname, '../../');
  const stakingRoot = path.join(repoRoot, 'apps/web/src/features/staking-distribution');
  const presentationDir = path.join(stakingRoot, 'presentation');

  test('staking-distribution feature exports public API and contains stake-module and rentas-module', () => {
    expect(fs.existsSync(stakingRoot)).toBe(true);
    expect(fs.existsSync(path.join(stakingRoot, 'index.ts'))).toBe(true);
    expect(fs.existsSync(path.join(presentationDir, 'stake-module.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(presentationDir, 'rentas-module.tsx'))).toBe(true);
  });

  test('no presentation files in staking-distribution directly import database clients', () => {
    const presFiles = fs.readdirSync(presentationDir).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
    for (const file of presFiles) {
      const content = fs.readFileSync(path.join(presentationDir, file), 'utf8');
      expect(content).not.toContain('@/lib/db');
      expect(content).not.toContain('infrastructure/db');
    }
  });
});
