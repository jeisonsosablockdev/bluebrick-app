import { describe, test, expect } from 'vitest';
import path from 'path';
import fs from 'fs';

describe('09 - Monorepo 4-Layer Architecture & Governance Harness', () => {
  const repoRoot = path.resolve(__dirname, '../../../');
  const workspaceConfig = path.join(repoRoot, 'pnpm-workspace.yaml');
  const webAppRoot = path.join(repoRoot, 'apps/web');
  const libRoot = path.join(webAppRoot, 'src/lib');
  const appRoutesRoot = path.join(webAppRoot, 'src/app');

  describe('1. Monorepo Workspaces & Root Structure', () => {
    test('pnpm-workspace.yaml exists and configures monorepo workspaces', () => {
      expect(fs.existsSync(workspaceConfig)).toBe(true);
      const content = fs.readFileSync(workspaceConfig, 'utf8');
      expect(content).toContain('apps/*');
      expect(content).toContain('apps/web');
    });

    test('apps/web directory exists as Next.js app package', () => {
      expect(fs.existsSync(webAppRoot)).toBe(true);
      expect(fs.existsSync(path.join(webAppRoot, 'package.json'))).toBe(true);
    });
  });

  describe('2. 4-Layer Functional Architecture in apps/web/src/lib', () => {
    test('mandatory 4-layer directories exist in src/lib', () => {
      const layers = ['hooks', 'state', 'pipelines', 'infrastructure'];
      for (const layer of layers) {
        const layerDir = path.join(libRoot, layer);
        expect(fs.existsSync(layerDir), `Expected layer directory ${layer} to exist in src/lib`).toBe(true);
      }
    });

    test('infrastructure layer provides Solana RPC configuration', () => {
      const solanaInfra = path.join(libRoot, 'infrastructure/solana.ts');
      expect(fs.existsSync(solanaInfra)).toBe(true);
      const content = fs.readFileSync(solanaInfra, 'utf8');
      expect(content).toContain('getSolanaRpcUrl');
    });

    test('hooks layer provides wallet hook', () => {
      const walletHook = path.join(libRoot, 'hooks/use-solana-wallet.ts');
      expect(fs.existsSync(walletHook)).toBe(true);
      const content = fs.readFileSync(walletHook, 'utf8');
      expect(content).toContain('useSolanaWallet');
    });
  });

  describe('3. Clean Presentation Layer (apps/web/src/app)', () => {
    test('root layout and home page exist', () => {
      expect(fs.existsSync(path.join(appRoutesRoot, 'layout.tsx'))).toBe(true);
      expect(fs.existsSync(path.join(appRoutesRoot, 'page.tsx'))).toBe(true);
      expect(fs.existsSync(path.join(appRoutesRoot, 'providers.tsx'))).toBe(true);
      expect(fs.existsSync(path.join(appRoutesRoot, 'globals.css'))).toBe(true);
    });

    test('error and loading boundaries exist', () => {
      expect(fs.existsSync(path.join(appRoutesRoot, 'loading.tsx'))).toBe(true);
      expect(fs.existsSync(path.join(appRoutesRoot, 'error.tsx'))).toBe(true);
      expect(fs.existsSync(path.join(appRoutesRoot, 'not-found.tsx'))).toBe(true);
    });
  });

  describe('4. Strict Governance & Layer Isolation Rules', () => {
    test('no presentation components directly import database pg', () => {
      const componentsDir = path.join(webAppRoot, 'src/components');
      if (!fs.existsSync(componentsDir)) return;

      function scanDirForPg(dirPath: string) {
        const files = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const file of files) {
          const fullPath = path.join(dirPath, file.name);
          if (file.isDirectory()) {
            scanDirForPg(fullPath);
          } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            expect(content).not.toContain('from "pg"');
          }
        }
      }

      scanDirForPg(componentsDir);
      scanDirForPg(appRoutesRoot);
    });
  });

  describe('5. TSConfig Path Aliases Harmonization', () => {
    test('tsconfig compiler paths map directly to canonical apps/web/src locations', () => {
      const tsconfigPath = path.join(repoRoot, 'tsconfig.json');
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));

      expect(tsconfig.compilerOptions.paths['@/*']).toEqual(['./apps/web/src/*', './*']);
    });
  });
});
