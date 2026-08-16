import { describe, test, expect } from 'vitest';
import path from 'path';
import fs from 'fs';

describe('SPEC-48 - Dashboard Legacy Cleanup & Direct Feature Imports', () => {
  const repoRoot = path.resolve(__dirname, '../../');
  const legacyDashboardDir = path.join(repoRoot, 'apps/web/src/components/dashboard');
  const featureProfileDir = path.join(repoRoot, 'apps/web/src/features/profile/presentation');
  const featurePortfolioDir = path.join(repoRoot, 'apps/web/src/features/investor-portfolio/presentation');
  const featureReferralsDir = path.join(repoRoot, 'apps/web/src/features/referral-marketing/presentation');
  const featureStakingDir = path.join(repoRoot, 'apps/web/src/features/staking-distribution/presentation');

  test('legacy components/dashboard directory is completely removed', () => {
    expect(fs.existsSync(legacyDashboardDir)).toBe(false);
  });

  test('profile components exist natively under features/profile', () => {
    expect(fs.existsSync(path.join(featureProfileDir, 'profile-kyc-module.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(featureProfileDir, 'account-profile-support-module.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(featureProfileDir, 'historial-module.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(featureProfileDir, 'protected-shell.tsx'))).toBe(true);
  });

  test('investor portfolio components exist natively under features/investor-portfolio', () => {
    expect(fs.existsSync(path.join(featurePortfolioDir, 'portfolio-module.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(featurePortfolioDir, 'overview-module.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(featurePortfolioDir, 'dashboard-charts.tsx'))).toBe(true);
  });

  test('referral marketing components exist natively under features/referral-marketing', () => {
    expect(fs.existsSync(path.join(featureReferralsDir, 'referral-program-module.tsx'))).toBe(true);
  });

  test('staking distribution components exist natively under features/staking-distribution', () => {
    expect(fs.existsSync(path.join(featureStakingDir, 'stake-module.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(featureStakingDir, 'rentas-module.tsx'))).toBe(true);
  });
});
