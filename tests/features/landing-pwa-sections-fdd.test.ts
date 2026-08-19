import { describe, test, expect } from 'vitest';
import path from 'path';
import fs from 'fs';

describe('SPEC-38 - Landing Sections & Shared UI Architecture', () => {
  const repoRoot = path.resolve(__dirname, '../../');
  const landingRoot = path.join(repoRoot, 'apps/web/src/features/landing');
  const pwaRoot = path.join(repoRoot, 'apps/web/src/features/pwa-notifications');

  test('landing feature root exists and contains presentation sections', () => {
    expect(fs.existsSync(landingRoot)).toBe(true);
    expect(fs.existsSync(path.join(landingRoot, 'presentation/hero.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(landingRoot, 'presentation/footer.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(landingRoot, 'presentation/features.tsx'))).toBe(true);
  });

  test('pwa-notifications feature root exists and contains modal & banner', () => {
    expect(fs.existsSync(pwaRoot)).toBe(true);
    expect(fs.existsSync(path.join(pwaRoot, 'presentation/web-push-notification-modal.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(pwaRoot, 'presentation/pwa-install-banner.tsx'))).toBe(true);
  });

  test('no presentation files in landing or pwa directly import database clients', () => {
    const checkDir = (dir: string) => {
      const presFiles = fs.readdirSync(dir).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
      for (const file of presFiles) {
        const content = fs.readFileSync(path.join(dir, file), 'utf8');
        expect(content).not.toContain('@/lib/db');
        expect(content).not.toContain('infrastructure/db');
      }
    };

    checkDir(path.join(landingRoot, 'presentation'));
    checkDir(path.join(pwaRoot, 'presentation'));
  });
});
