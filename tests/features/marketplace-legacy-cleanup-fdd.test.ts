import { describe, test, expect } from 'vitest';
import path from 'path';
import fs from 'fs';

describe('SPEC-46 - Marketplace Legacy Cleanup & Direct Feature Imports', () => {
  const repoRoot = path.resolve(__dirname, '../../');
  const legacyMarketplaceDir = path.join(repoRoot, 'apps/web/src/components/marketplace');
  const featureMarketplaceDir = path.join(repoRoot, 'apps/web/src/features/marketplace/presentation');

  test('legacy components/marketplace directory is completely removed', () => {
    expect(fs.existsSync(legacyMarketplaceDir)).toBe(false);
  });

  test('marketplace presentation components exist natively under features/marketplace', () => {
    expect(fs.existsSync(path.join(featureMarketplaceDir, 'MarketplaceCard.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(featureMarketplaceDir, 'MarketplaceExperience.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(featureMarketplaceDir, 'MarketplaceGridClient.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(featureMarketplaceDir, 'PropertyDetailContent.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(featureMarketplaceDir, 'PurchaseCta.tsx'))).toBe(true);
  });
});
