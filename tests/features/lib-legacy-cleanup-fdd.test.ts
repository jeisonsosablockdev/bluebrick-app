import { describe, test, expect } from 'vitest';
import path from 'path';
import fs from 'fs';

describe('SPEC-50 - Services & Lib Legacy Proxies Cleanup', () => {
  const repoRoot = path.resolve(__dirname, '../../');
  const libDir = path.join(repoRoot, 'apps/web/src/lib');

  test('deleted proxy files no longer exist under apps/web/src/lib', () => {
    const legacyProxies = [
      'purchase-service.ts',
      'purchase-anti-bot.ts',
      'purchase-attempts-repository.ts',
      'purchase-challenges-repository.ts',
      'checkout-service.ts',
      'checkout-repository.ts',
      'checkout-domain.ts',
      'checkout-payment-methods.ts',
      'core-candy-machine-admin.ts',
      'core-candy-machine-snapshot-service.ts',
      'core-candy-machine-snapshot-repository.ts',
      'core-candy-machine-metadata-store.ts',
      'core-candy-machine-naming.ts',
      'candy-guard-payment-config.ts',
      'core-authority-lifecycle.ts',
      'stake-profile-events-repository.ts',
      'anti-bot/signature-verifier.ts',
      'anti-bot/challenge-builder.ts',
      'anti-bot/rate-limiter.ts',
      'anti-bot/config.ts',
      'referrals/preview-service.ts',
      'referrals/client-state.ts',
      'referrals/repository.ts',
      'referrals/reward-engine.ts',
      'referrals/payout-service.ts',
      'referrals/dashboard-service.ts',
      'referrals/domain.ts',
      'compliance/profile-repository.ts',
      'compliance/aml-screening-service.ts',
      'compliance/case-service.ts',
      'compliance/compliance-status-projector.ts',
      'compliance/aml-helius.ts',
      'archival/mint-authority-freeze.ts',
      'squads/squads-batch.ts',
      'accounts/repository.ts',
      'db/pool.ts',
      'db/connection-string.ts',
      'db/migration-guard.ts',
      'distributions/distribution-engine.ts',
      'distributions/distribution-repository.ts',
      'distributions/distribution-service.ts',
      'claims/claim-flow.ts',
      'claims/fee-policy.ts',
      'claims/compliance-monitor.ts'
    ];

    for (const file of legacyProxies) {
      expect(fs.existsSync(path.join(libDir, file))).toBe(false);
    }
  });
});
