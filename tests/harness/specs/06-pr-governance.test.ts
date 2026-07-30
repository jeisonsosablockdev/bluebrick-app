import { describe, test, expect } from 'vitest';
import path from 'path';
import { createSandboxWorkspace } from '../runner/sandbox-builder';
import { executeHarnessScript } from '../runner/script-executor';

describe('06 - PR Governance & Human Acceptance Metadata', () => {
  const repoRoot = path.resolve(__dirname, '../../../');
  const policyFile = path.join(repoRoot, 'knowledge/governance/pr-policy-source-of-truth.json');

  test('pr-metadata-lint.sh rejects PR bodies missing required sections', () => {
    const sandbox = createSandboxWorkspace('pr_missing_section');
    try {
      sandbox.runGitCommand('git checkout -b feature/test-branch');
      const invalidPrBody = `
## Description
Added new feature slice.

## Issue
BRI-184
      `.trim();

      sandbox.createFile('pr-body.md', invalidPrBody);

      const result = executeHarnessScript(
        'scripts/ci/pr-metadata-lint.sh',
        ['--body-file', 'pr-body.md', '--scope', 'scope:shared', '--type', 'type:feature', '--risk', 'risk:low', '--policy-file', policyFile],
        { cwd: sandbox.sandboxPath }
      );
      expect(result.exitCode).not.toBe(0);
      expect(result.stdout + result.stderr).toContain('Missing required PR section');
    } finally {
      sandbox.cleanup();
    }
  });

  test('pr-metadata-lint.sh passes PR bodies containing all required sections including Human Acceptance', () => {
    const sandbox = createSandboxWorkspace('pr_valid_human_acceptance');
    try {
      sandbox.runGitCommand('git checkout -b feature/test-branch');
      const validPrBody = `
## Description
Added new feature slice.

## Issue
[BRI-184](https://linear.app/brids-app/issue/BRI-184/test-suite-for-harnessing)

## RFC
RFC-015

## Riesgos
Low risk infrastructure addition.

## Rollback Plan
Revert commit.

## Prueba Devnet
N/A infrastructure tool test.

## Human Acceptance
Status: approved
      `.trim();

      sandbox.createFile('pr-body.md', validPrBody);

      const result = executeHarnessScript(
        'scripts/ci/pr-metadata-lint.sh',
        ['--body-file', 'pr-body.md', '--scope', 'scope:shared', '--type', 'type:feature', '--risk', 'risk:low', '--policy-file', policyFile],
        { cwd: sandbox.sandboxPath }
      );
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('PR metadata lint passed');
    } finally {
      sandbox.cleanup();
    }
  });
});
