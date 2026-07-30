import { describe, test, expect } from 'vitest';
import { createSandboxWorkspace } from '../runner/sandbox-builder';
import { executeHarnessScript } from '../runner/script-executor';

describe('04 - 4-Layer Architecture & Monorepo Linter', () => {
  test('check-layered-architecture.sh succeeds on clean monorepo directory tree', () => {
    const sandbox = createSandboxWorkspace('arch_clean');
    try {
      sandbox.createFile('app/page.tsx', '// Next.js Presentation');
      sandbox.createFile('packages/shared/index.ts', '// Shared types');
      sandbox.createFile('programs/solana/src/lib.rs', '// Anchor program');
      sandbox.createFile('tests/integration.test.ts', '// Integration test');
      sandbox.createFile('scripts/deploy.sh', '#!/bin/bash');

      const result = executeHarnessScript('scripts/ci/check-layered-architecture.sh', [], { cwd: sandbox.sandboxPath });
      expect(result.exitCode).toBe(0);
    } finally {
      sandbox.cleanup();
    }
  });

  test('check-layered-architecture.sh fails if logic is placed outside 4-layer boundaries', () => {
    const sandbox = createSandboxWorkspace('arch_dirty');
    try {
      sandbox.createFile('invalid_logic_in_root.ts', 'export function bad() {}');

      const result = executeHarnessScript('scripts/ci/check-layered-architecture.sh', [], { cwd: sandbox.sandboxPath });
      expect(result.exitCode).not.toBe(0);
      expect(result.stdout + result.stderr).toContain('invalid_logic_in_root.ts');
    } finally {
      sandbox.cleanup();
    }
  });
});
