import { describe, test, expect } from 'vitest';
import path from 'path';
import { executeHarnessScript } from '../runner/script-executor';

describe('04 - 4-Layer Architecture & Monorepo Linter', () => {
  const repoRoot = path.resolve(__dirname, '../../../');

  test('check-layered-architecture.sh succeeds on repository codebase', () => {
    const result = executeHarnessScript('scripts/ci/check-layered-architecture.sh', [], { cwd: repoRoot });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('4-Layer architecture governance check passed');
  }, 15000);
});
