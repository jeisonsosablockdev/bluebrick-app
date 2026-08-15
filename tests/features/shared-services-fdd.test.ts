import { describe, test, expect } from 'vitest';
import path from 'path';
import fs from 'fs';

describe('SPEC-44 - Shared Infrastructure, DB & Auth State Architecture', () => {
  const repoRoot = path.resolve(__dirname, '../../');
  const sharedRoot = path.join(repoRoot, 'apps/web/src/features/shared');

  test('shared infrastructure contains db pool, migration guard and connection string', () => {
    expect(fs.existsSync(path.join(sharedRoot, 'infrastructure/db/pool.ts'))).toBe(true);
    expect(fs.existsSync(path.join(sharedRoot, 'infrastructure/db/connection-string.ts'))).toBe(true);
    expect(fs.existsSync(path.join(sharedRoot, 'infrastructure/db/migration-guard.ts'))).toBe(true);
  });

  test('shared auth domain contains auth-state and auth-store', () => {
    expect(fs.existsSync(path.join(sharedRoot, 'auth/domain/auth-state.ts'))).toBe(true);
    expect(fs.existsSync(path.join(sharedRoot, 'auth/domain/auth-store.ts'))).toBe(true);
  });
});
