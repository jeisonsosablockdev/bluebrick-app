import { describe, test, expect } from 'vitest';
import path from 'path';
import fs from 'fs';

describe('SPEC-41 - Referral Marketing Services Architecture', () => {
  const repoRoot = path.resolve(__dirname, '../../');
  const referralRoot = path.join(repoRoot, 'apps/web/src/features/referral-marketing');
  const appDir = path.join(referralRoot, 'application');
  const domDir = path.join(referralRoot, 'domain');
  const infraDir = path.join(referralRoot, 'infrastructure');

  test('referral-marketing domain layer contains referrals-domain', () => {
    expect(fs.existsSync(path.join(domDir, 'referrals-domain.ts'))).toBe(true);
  });

  test('referral-marketing application layer contains dashboard, payout and reward services', () => {
    expect(fs.existsSync(path.join(appDir, 'dashboard-service.ts'))).toBe(true);
    expect(fs.existsSync(path.join(appDir, 'payout-service.ts'))).toBe(true);
    expect(fs.existsSync(path.join(appDir, 'reward-engine.ts'))).toBe(true);
    expect(fs.existsSync(path.join(appDir, 'client-state.ts'))).toBe(true);
  });

  test('referral-marketing infrastructure layer contains referrals-repository', () => {
    expect(fs.existsSync(path.join(infraDir, 'referrals-repository.ts'))).toBe(true);
  });
});
