import { describe, test, expect } from 'vitest';
import path from 'path';
import { executeHarnessScript } from '../runner/script-executor';

describe('07 - Documentation Governance & Sync Verification', () => {
  const repoRoot = path.resolve(__dirname, '../../../');

  test('readme-sync.sh executes cleanly against repository root', () => {
    const result = executeHarnessScript('scripts/readme-sync.sh', [], { cwd: repoRoot });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('README sincronizado');
  });
});
