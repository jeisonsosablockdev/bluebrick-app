import { describe, test, expect } from 'vitest';
import path from 'path';
import fs from 'fs';

describe('SPEC-42 - Staking, Squads v4 & Distribution Services Architecture', () => {
  const repoRoot = path.resolve(__dirname, '../../');
  const stakingRoot = path.join(repoRoot, 'apps/web/src/features/staking-distribution');
  const appDir = path.join(stakingRoot, 'application');
  const domDir = path.join(stakingRoot, 'domain');
  const infraDir = path.join(stakingRoot, 'infrastructure');

  test('staking-distribution domain layer contains fee-policy', () => {
    expect(fs.existsSync(path.join(domDir, 'fee-policy.ts'))).toBe(true);
  });

  test('staking-distribution application layer contains claim-flow, distribution-engine and squads-batch', () => {
    expect(fs.existsSync(path.join(appDir, 'claim-flow.ts'))).toBe(true);
    expect(fs.existsSync(path.join(appDir, 'compliance-monitor.ts'))).toBe(true);
    expect(fs.existsSync(path.join(appDir, 'distribution-engine.ts'))).toBe(true);
    expect(fs.existsSync(path.join(appDir, 'distribution-service.ts'))).toBe(true);
    expect(fs.existsSync(path.join(appDir, 'squads-batch.ts'))).toBe(true);
  });

  test('staking-distribution infrastructure layer contains distribution-repository and stake-profile-events-repository', () => {
    expect(fs.existsSync(path.join(infraDir, 'distribution-repository.ts'))).toBe(true);
    expect(fs.existsSync(path.join(infraDir, 'stake-profile-events-repository.ts'))).toBe(true);
  });
});
