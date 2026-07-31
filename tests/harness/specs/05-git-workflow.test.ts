import { describe, test, expect } from 'vitest';
import { createSandboxWorkspace } from '../runner/sandbox-builder';
import { executeHarnessScript } from '../runner/script-executor';

describe('05 - Git Workflow & Branch Preflight', () => {
  test('preflight-start.sh detects untracked uncommitted changes', () => {
    const sandbox = createSandboxWorkspace('preflight_dirty');
    try {
      sandbox.runGitCommand('git checkout -b feature/test-branch');
      sandbox.createFile('untracked.txt', 'uncommitted content');

      const result = executeHarnessScript('scripts/ci/preflight-start.sh', ['--no-fetch'], { cwd: sandbox.sandboxPath });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('1 untracked file(s)');
    } finally {
      sandbox.cleanup();
    }
  });

  test('preflight-start.sh passes on clean git workspace with bootstrap mode', () => {
    const sandbox = createSandboxWorkspace('preflight_clean');
    try {
      sandbox.runGitCommand('git checkout -b feature/test-branch');
      sandbox.createFile('README.md', '# Clean Repo');
      sandbox.runGitCommand('git add README.md');
      sandbox.runGitCommand('git commit -m "initial commit"');

      const result = executeHarnessScript('scripts/ci/preflight-start.sh', ['--bootstrap', '--no-fetch'], { cwd: sandbox.sandboxPath });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Preflight complete.');
    } finally {
      sandbox.cleanup();
    }
  });
});
