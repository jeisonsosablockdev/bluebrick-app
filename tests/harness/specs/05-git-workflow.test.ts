import { describe, test, expect } from 'vitest';
import { createSandboxWorkspace } from '../runner/sandbox-builder';
import { executeHarnessScript } from '../runner/script-executor';

describe('05 - Git Workflow & Branch Preflight', () => {
  test('preflight-start.sh detects untracked uncommitted changes', () => {
    const sandbox = createSandboxWorkspace('preflight_dirty');
    try {
      sandbox.createFile('untracked.txt', 'uncommitted content');

      const result = executeHarnessScript('scripts/ci/preflight-start.sh', [], { cwd: sandbox.sandboxPath });
      expect(result.exitCode).not.toBe(0);
      expect(result.stdout + result.stderr).toContain('untracked');
    } finally {
      sandbox.cleanup();
    }
  });

  test('preflight-start.sh passes on clean git workspace', () => {
    const sandbox = createSandboxWorkspace('preflight_clean');
    try {
      sandbox.createFile('README.md', '# Clean Repo');
      sandbox.runGitCommand('git add README.md');
      sandbox.runGitCommand('git commit -m "initial commit"');

      const result = executeHarnessScript('scripts/ci/preflight-start.sh', [], { cwd: sandbox.sandboxPath });
      expect(result.exitCode).toBe(0);
    } finally {
      sandbox.cleanup();
    }
  });
});
