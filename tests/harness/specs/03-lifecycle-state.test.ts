import { describe, test, expect } from 'vitest';
import { createSandboxWorkspace } from '../runner/sandbox-builder';
import { executeHarnessScript } from '../runner/script-executor';

describe('03 - Task Lifecycle & 8-Phase State Machine', () => {
  test('check-task-lifecycle.sh validates 8-phase state transition rules in active_task_state.json', () => {
    const sandbox = createSandboxWorkspace('lifecycle_test');
    try {
      const stateContent = JSON.stringify({
        version: '1.0.0',
        task_id: 'BRI-TEST',
        branch: 'feature/test-branch',
        current_phase: 'PHASE_6_CODE_GREEN',
        phases: {
          PHASE_1_BOOTSTRAP: { completed: true },
          PHASE_2_DOCS_FILLED: { completed: true },
          PHASE_3_ARCHITECT_GATE1: { completed: true },
          PHASE_4_HUMAN_DESIGN_APPROVED: { completed: true },
          PHASE_5_TESTS_RED: { completed: true },
          PHASE_6_CODE_GREEN: { completed: true },
          PHASE_7_VALIDATED: { completed: false },
          PHASE_8_HUMAN_MERGE_APPROVED: { completed: false },
        },
      });

      sandbox.createFile('.agents/active_task_state.json', stateContent);

      const result = executeHarnessScript('scripts/ci/check-task-lifecycle.sh', [], { cwd: sandbox.sandboxPath });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Task Lifecycle & Idempotency Check Passed');
    } finally {
      sandbox.cleanup();
    }
  });

  test('check-task-lifecycle.sh fails if active_task_state.json is missing or corrupted', () => {
    const sandbox = createSandboxWorkspace('lifecycle_missing');
    try {
      const result = executeHarnessScript('scripts/ci/check-task-lifecycle.sh', [], { cwd: sandbox.sandboxPath });
      expect(result.exitCode).not.toBe(0);
    } finally {
      sandbox.cleanup();
    }
  });
});
