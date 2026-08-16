import { describe, test, expect } from 'vitest';
import path from 'path';
import fs from 'fs';

describe('SPEC-47 - Landing Sections Legacy Cleanup & Direct Feature Imports', () => {
  const repoRoot = path.resolve(__dirname, '../../');
  const legacySectionsDir = path.join(repoRoot, 'apps/web/src/components/sections');
  const featureLandingDir = path.join(repoRoot, 'apps/web/src/features/landing/presentation');

  test('legacy components/sections directory is completely removed', () => {
    expect(fs.existsSync(legacySectionsDir)).toBe(false);
  });

  test('landing presentation components exist natively under features/landing', () => {
    expect(fs.existsSync(path.join(featureLandingDir, 'hero-section.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(featureLandingDir, 'features-section.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(featureLandingDir, 'featured-properties-section.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(featureLandingDir, 'faq-section.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(featureLandingDir, 'footer-section.tsx'))).toBe(true);
  });
});
