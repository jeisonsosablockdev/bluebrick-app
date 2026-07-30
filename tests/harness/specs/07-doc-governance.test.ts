import { describe, test, expect } from 'vitest';
import { createSandboxWorkspace } from '../runner/sandbox-builder';
import { executeHarnessScript } from '../runner/script-executor';

describe('07 - Documentation Governance & Placeholder Detection', () => {
  test('check-required-docs.sh flags unpopulated placeholder comments', () => {
    const sandbox = createSandboxWorkspace('docs_placeholder');
    try {
      const draftDoc = `
# Feature Spec
<!-- Describe el problema técnico, bug, limitación o requerimiento que se busca resolver en el codebase. -->
      `.trim();

      sandbox.createFile('knowledge/features/feature-test.md', draftDoc);

      const result = executeHarnessScript('scripts/ci/check-required-docs.sh', [], { cwd: sandbox.sandboxPath });
      expect(result.exitCode).not.toBe(0);
      expect(result.stdout + result.stderr).toContain('placeholder');
    } finally {
      sandbox.cleanup();
    }
  });
});
