import { describe, test, expect } from 'vitest';
import path from 'path';
import fs from 'fs';

describe('SPEC-40 - Compliance & Profile Services Architecture', () => {
  const repoRoot = path.resolve(__dirname, '../../');
  const profileRoot = path.join(repoRoot, 'apps/web/src/features/profile');
  const appDir = path.join(profileRoot, 'application');
  const domDir = path.join(profileRoot, 'domain');
  const infraDir = path.join(profileRoot, 'infrastructure');

  test('profile domain layer contains compliance-status-projector', () => {
    expect(fs.existsSync(path.join(domDir, 'compliance-status-projector.ts'))).toBe(true);
  });

  test('profile application layer contains aml and case services', () => {
    expect(fs.existsSync(path.join(appDir, 'aml-screening-service.ts'))).toBe(true);
    expect(fs.existsSync(path.join(appDir, 'case-service.ts'))).toBe(true);
  });

  test('profile infrastructure layer contains aml-helius, profile and accounts repositories', () => {
    expect(fs.existsSync(path.join(infraDir, 'aml-helius.ts'))).toBe(true);
    expect(fs.existsSync(path.join(infraDir, 'profile-repository.ts'))).toBe(true);
    expect(fs.existsSync(path.join(infraDir, 'accounts-repository.ts'))).toBe(true);
  });
});
