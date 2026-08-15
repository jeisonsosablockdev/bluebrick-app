import { describe, test, expect } from 'vitest';
import path from 'path';
import fs from 'fs';

describe('SPEC-43 - NFT Minting & Freeze Control Services Architecture', () => {
  const repoRoot = path.resolve(__dirname, '../../');
  const nftRoot = path.join(repoRoot, 'apps/web/src/features/nft-minting');
  const freezeRoot = path.join(repoRoot, 'apps/web/src/features/asset-freeze-control');

  test('nft-minting contains candy machine domain and application services', () => {
    expect(fs.existsSync(path.join(nftRoot, 'domain/core-candy-machine-naming.ts'))).toBe(true);
    expect(fs.existsSync(path.join(nftRoot, 'domain/candy-guard-payment-config.ts'))).toBe(true);
    expect(fs.existsSync(path.join(nftRoot, 'application/core-candy-machine-admin.ts'))).toBe(true);
    expect(fs.existsSync(path.join(nftRoot, 'application/core-candy-machine-snapshot-service.ts'))).toBe(true);
    expect(fs.existsSync(path.join(nftRoot, 'infrastructure/core-candy-machine-metadata-store.ts'))).toBe(true);
    expect(fs.existsSync(path.join(nftRoot, 'infrastructure/core-candy-machine-snapshot-repository.ts'))).toBe(true);
  });

  test('asset-freeze-control contains lifecycle application and archival infrastructure', () => {
    expect(fs.existsSync(path.join(freezeRoot, 'application/core-authority-lifecycle.ts'))).toBe(true);
    expect(fs.existsSync(path.join(freezeRoot, 'infrastructure/mint-authority-freeze.ts'))).toBe(true);
  });
});
