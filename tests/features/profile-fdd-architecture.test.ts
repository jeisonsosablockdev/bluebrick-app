import { describe, test, expect } from 'vitest';
import path from 'path';
import fs from 'fs';

describe('SPEC-34 - Profile Feature 4-Layer Architecture', () => {
  const repoRoot = path.resolve(__dirname, '../../');
  const profileFeatureRoot = path.join(repoRoot, 'apps/web/src/features/profile');
  const presentationDir = path.join(profileFeatureRoot, 'presentation');
  const applicationDir = path.join(profileFeatureRoot, 'application');
  const domainDir = path.join(profileFeatureRoot, 'domain');
  const infrastructureDir = path.join(profileFeatureRoot, 'infrastructure');

  test('profile feature root exists and exports public API via index.ts', () => {
    expect(fs.existsSync(profileFeatureRoot)).toBe(true);
    expect(fs.existsSync(path.join(profileFeatureRoot, 'index.ts'))).toBe(true);
  });

  test('profile implements all 4 functional layers', () => {
    expect(fs.existsSync(presentationDir)).toBe(true);
    expect(fs.existsSync(applicationDir)).toBe(true);
    expect(fs.existsSync(domainDir)).toBe(true);
    expect(fs.existsSync(infrastructureDir)).toBe(true);
  });

  test('presentation layer exports profile-kyc-module, account-profile-support-module and historial-module', () => {
    expect(fs.existsSync(path.join(presentationDir, 'profile-kyc-module.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(presentationDir, 'account-profile-support-module.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(presentationDir, 'historial-module.tsx'))).toBe(true);
  });

  test('no presentation files in profile directly import database clients', () => {
    const presFiles = fs.readdirSync(presentationDir).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
    for (const file of presFiles) {
      const content = fs.readFileSync(path.join(presentationDir, file), 'utf8');
      expect(content).not.toContain('@/lib/db');
      expect(content).not.toContain('infrastructure/db');
    }
  });
});
