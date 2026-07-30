import { describe, test, expect } from 'vitest';
import { createSandboxWorkspace } from '../runner/sandbox-builder';
import { executeHarnessScript } from '../runner/script-executor';

describe('03 - Task Lifecycle & 8-Phase State Machine', () => {
  test('check-task-lifecycle.sh validates 8-phase state transition rules in active_task_state.json', () => {
    const sandbox = createSandboxWorkspace('lifecycle_test');
    try {
      // Create initial active task state file
      const stateContent = JSON.stringify({
        version: '1.0.0',
        task_id: 'BRI-TEST',
        branch: 'feature/test-branch',
        current_phase: 'PHASE_1_BOOTSTRAP',
        phases: {
          PHASE_1_BOOTSTRAP: { completed: true },
          PHASE_2_DOCS_FILLED: { completed: false },
          PHASE_3_ARCHITECT_GATE1: { completed: false },
          PHASE_4_HUMAN_DESIGN_APPROVED: { completed: false },
          PHASE_5_TESTS_RED: { completed: false },
          PHASE_6_CODE_GREEN: { completed: false },
          PHASE_7_VALIDATED: { completed: false },
          PHASE_8_HUMAN_MERGE_APPROVED: { completed: false },
        },
      });

      sandbox.createFile('.agents/active_task_state.json', stateContent);

      const result = executeHarnessScript('scripts/ci/check-task-lifecycle.sh', [], { cwd: sandbox.sandboxPath });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('TASK LIFECYCLE CHECK PASSED');
    } finally {
      sandbox.cleanup();
    }
  });

  test('check-task-lifecycle.sh fails if a required phase is bypassed prematurely', () => {
    const sandbox = createSandboxWorkspace('lifecycle_invalid');
    try {
      const stateContent = JSON.stringify({
        version: '1.0.0',
        task_id: 'BRI-TEST',
        branch: 'feature/test-branch',
        current_phase: 'PHASE_6_CODE_GREEN', // Illegal skip without Phase 4 & 5
        phases: {
          PHASE_1_BOOTSTRAP: { completed: true },
          PHASE_2_DOCS_FILLED: { completed: false },
          PHASE_3_ARCHITECT_GATE1: { completed: false },
          PHASE_4_HUMAN_DESIGN_APPROVED: { completed: false },
          PHASE_5_TESTS_RED: { completed: false },
          PHASE_6_CODE_GREEN: { completed: true },
          PHASE_7_VALIDATED: { completed: false },
          PHASE_8_HUMAN_MERGE_APPROVED: { completed: false },
        },
      });

      sandbox.createFile('.agents/active_task_state.json', stateContent);

      const result = executeHarnessScript('scripts/ci/check-task-lifecycle.sh', [], { cwd: sandbox.sandboxPath });
      expect(result.exitCode).not.toBe(0);
      expect(result.stdout).toContain('ERROR');
    } finally {
      sandbox.cleanup();
    }
  });
});
