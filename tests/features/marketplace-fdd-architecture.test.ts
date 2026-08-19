import { describe, test, expect } from 'vitest';
import path from 'path';
import fs from 'fs';

describe('SPEC-33 - Marketplace Feature 4-Layer Architecture', () => {
  const repoRoot = path.resolve(__dirname, '../../');
  const marketplaceFeatureRoot = path.join(repoRoot, 'apps/web/src/features/marketplace');
  const presentationDir = path.join(marketplaceFeatureRoot, 'presentation');
  const applicationDir = path.join(marketplaceFeatureRoot, 'application');
  const domainDir = path.join(marketplaceFeatureRoot, 'domain');
  const infrastructureDir = path.join(marketplaceFeatureRoot, 'infrastructure');

  test('marketplace feature root exists and exports public API via index.ts', () => {
    expect(fs.existsSync(marketplaceFeatureRoot)).toBe(true);
    expect(fs.existsSync(path.join(marketplaceFeatureRoot, 'index.ts'))).toBe(true);
  });

  test('marketplace implements all 4 functional layers', () => {
    expect(fs.existsSync(presentationDir)).toBe(true);
    expect(fs.existsSync(applicationDir)).toBe(true);
    expect(fs.existsSync(domainDir)).toBe(true);
    expect(fs.existsSync(infrastructureDir)).toBe(true);
  });

  test('presentation layer exports all interactive marketplace components', () => {
    const expectedComponents = [
      'MarketplaceCard.tsx',
      'MarketplaceExperience.tsx',
      'MarketplaceFilters.tsx',
      'MarketplaceGridClient.tsx',
      'MarketplaceMapClient.tsx',
      'MarketplaceMapMarker.tsx',
      'MarketplaceMapShell.tsx',
      'MarketplaceViewModeButton.tsx',
      'MarketplaceViewModeShell.tsx',
      'PropertyDetailContent.tsx',
      'PropertyDetailDealEconomicsCard.tsx',
      'PropertyDetailDocumentsBlockchainCards.tsx',
      'PropertyDetailExecutionGovernanceCards.tsx',
      'PropertyDetailFeesReturnCard.tsx',
      'PropertyDetailGoogleMapsCard.tsx',
      'PropertyDetailHeroSection.tsx',
      'PropertyDetailInvestmentSummaryCard.tsx',
      'PropertyDetailMediaSection.tsx',
      'PropertyDetailPropertyInfoCard.tsx',
      'PurchaseCta.tsx',
    ];

    expectedComponents.forEach(file => {
      expect(fs.existsSync(path.join(presentationDir, file))).toBe(true);
    });
  });

  test('application layer contains formatters and map state hooks', () => {
    expect(fs.existsSync(path.join(applicationDir, 'property-detail-formatters.ts'))).toBe(true);
    expect(fs.existsSync(path.join(applicationDir, 'status-utils.ts'))).toBe(true);
    expect(fs.existsSync(path.join(applicationDir, 'use-marketplace-map-view-state.ts'))).toBe(true);
  });

  test('no presentation files in marketplace directly import database clients', () => {
    const presFiles = fs.readdirSync(presentationDir).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
    for (const file of presFiles) {
      const content = fs.readFileSync(path.join(presentationDir, file), 'utf8');
      expect(content).not.toContain('@/lib/db');
      expect(content).not.toContain('infrastructure/db');
    }
  });
});
