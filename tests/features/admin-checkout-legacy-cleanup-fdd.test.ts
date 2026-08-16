import { describe, test, expect } from 'vitest';
import path from 'path';
import fs from 'fs';

describe('SPEC-49 - Admin & Checkout Legacy Cleanup & Direct Feature Imports', () => {
  const repoRoot = path.resolve(__dirname, '../../');
  const legacyAdminDir = path.join(repoRoot, 'apps/web/src/components/admin');
  const legacyCheckoutDir = path.join(repoRoot, 'apps/web/src/components/checkout');
  const featureAdminDir = path.join(repoRoot, 'apps/web/src/features/admin/presentation');
  const featureCheckoutDir = path.join(repoRoot, 'apps/web/src/features/checkout-payment/presentation');

  test('legacy components/admin directory is completely removed', () => {
    expect(fs.existsSync(legacyAdminDir)).toBe(false);
  });

  test('legacy components/checkout directory is completely removed', () => {
    expect(fs.existsSync(legacyCheckoutDir)).toBe(false);
  });

  test('admin components exist natively under features/admin/presentation', () => {
    expect(fs.existsSync(path.join(featureAdminDir, 'executive-dashboard.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(featureAdminDir, 'compliance-console.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(featureAdminDir, 'distributions-console.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(featureAdminDir, 'monitoring-console.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(featureAdminDir, 'treasury-console.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(featureAdminDir, 'admin-shell.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(featureAdminDir, 'asset-creation/index.ts'))).toBe(true);
  });

  test('checkout components exist natively under features/checkout-payment/presentation', () => {
    expect(fs.existsSync(path.join(featureCheckoutDir, 'CheckoutPageClient.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(featureCheckoutDir, 'checkout-stepper.tsx'))).toBe(true);
  });
});
