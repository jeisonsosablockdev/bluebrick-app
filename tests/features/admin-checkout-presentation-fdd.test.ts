import { describe, test, expect } from 'vitest';
import path from 'path';
import fs from 'fs';

describe('SPEC-37 - Admin Operations & Checkout Presentation Architecture', () => {
  const repoRoot = path.resolve(__dirname, '../../');
  const adminRoot = path.join(repoRoot, 'apps/web/src/features/admin');
  const checkoutRoot = path.join(repoRoot, 'apps/web/src/features/checkout-payment');

  test('admin feature root exists and contains executive-dashboard and compliance-console', () => {
    expect(fs.existsSync(adminRoot)).toBe(true);
    expect(fs.existsSync(path.join(adminRoot, 'presentation/executive-dashboard.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(adminRoot, 'presentation/compliance-console.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(adminRoot, 'presentation/core-candy-machine-panel.tsx'))).toBe(true);
  });

  test('checkout-payment feature root exists and contains CheckoutPageClient', () => {
    expect(fs.existsSync(checkoutRoot)).toBe(true);
    expect(fs.existsSync(path.join(checkoutRoot, 'presentation/CheckoutPageClient.tsx'))).toBe(true);
  });

  test('no presentation files in admin or checkout directly import database clients', () => {
    const checkDir = (dir: string) => {
      const presFiles = fs.readdirSync(dir).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
      for (const file of presFiles) {
        const content = fs.readFileSync(path.join(dir, file), 'utf8');
        expect(content).not.toContain('@/lib/db');
        expect(content).not.toContain('infrastructure/db');
      }
    };

    checkDir(path.join(adminRoot, 'presentation'));
    checkDir(path.join(checkoutRoot, 'presentation'));
  });
});
