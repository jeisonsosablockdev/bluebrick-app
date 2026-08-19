import { describe, test, expect } from 'vitest';
import path from 'path';
import fs from 'fs';

describe('SPEC-39 - Checkout & Purchase Services Architecture', () => {
  const repoRoot = path.resolve(__dirname, '../../');
  const checkoutRoot = path.join(repoRoot, 'apps/web/src/features/checkout-payment');
  const appDir = path.join(checkoutRoot, 'application');
  const domDir = path.join(checkoutRoot, 'domain');
  const infraDir = path.join(checkoutRoot, 'infrastructure');

  test('checkout-payment domain layer contains domain models and methods', () => {
    expect(fs.existsSync(path.join(domDir, 'checkout-domain.ts'))).toBe(true);
    expect(fs.existsSync(path.join(domDir, 'checkout-payment-methods.ts'))).toBe(true);
  });

  test('checkout-payment application layer contains services and workflow trace', () => {
    expect(fs.existsSync(path.join(appDir, 'checkout-service.ts'))).toBe(true);
    expect(fs.existsSync(path.join(appDir, 'purchase-service.ts'))).toBe(true);
    expect(fs.existsSync(path.join(appDir, 'purchase-anti-bot.ts'))).toBe(true);
    expect(fs.existsSync(path.join(appDir, 'purchase-metrics-service.ts'))).toBe(true);
    expect(fs.existsSync(path.join(appDir, 'purchase-flow-trace.ts'))).toBe(true);
  });

  test('checkout-payment infrastructure layer contains database repositories', () => {
    expect(fs.existsSync(path.join(infraDir, 'checkout-repository.ts'))).toBe(true);
    expect(fs.existsSync(path.join(infraDir, 'purchase-attempts-repository.ts'))).toBe(true);
    expect(fs.existsSync(path.join(infraDir, 'purchase-challenges-repository.ts'))).toBe(true);
    expect(fs.existsSync(path.join(infraDir, 'purchase-rate-limit-repository.ts'))).toBe(true);
  });
});
