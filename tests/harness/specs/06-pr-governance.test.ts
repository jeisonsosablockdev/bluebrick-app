import { describe, test, expect } from 'vitest';
import { createSandboxWorkspace } from '../runner/sandbox-builder';
import { executeHarnessScript } from '../runner/script-executor';

describe('06 - PR Governance & Human Acceptance Metadata', () => {
  test('pr-metadata-lint.sh rejects PR bodies missing Human Acceptance approval block', () => {
    const sandbox = createSandboxWorkspace('pr_missing_human_acceptance');
    try {
      const invalidPrBody = `
## Description
Added new feature slice.

## Issue
BRI-184
      `.trim();

      sandbox.createFile('pr-body.md', invalidPrBody);

      const result = executeHarnessScript('scripts/ci/pr-metadata-lint.sh', ['pr-body.md'], { cwd: sandbox.sandboxPath });
      expect(result.exitCode).not.toBe(0);
      expect(result.stdout + result.stderr).toContain('Human Acceptance');
    } finally {
      sandbox.cleanup();
    }
  });

  test('pr-metadata-lint.sh passes PR bodies containing valid Human Acceptance status: approved', () => {
    const sandbox = createSandboxWorkspace('pr_valid_human_acceptance');
    try {
      const validPrBody = `
## Description
Added new feature slice.

## Issue
BRI-184

## Human Acceptance
Status: approved
      `.trim();

      sandbox.createFile('pr-body.md', validPrBody);

      const result = executeHarnessScript('scripts/ci/pr-metadata-lint.sh', ['pr-body.md'], { cwd: sandbox.sandboxPath });
      expect(result.exitCode).toBe(0);
    } finally {
      sandbox.cleanup();
    }
  });
});
