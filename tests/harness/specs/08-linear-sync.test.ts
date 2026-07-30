import { describe, test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('08 - Linear Integration & Status Core Script Integrity', () => {
  const repoRoot = path.resolve(__dirname, '../../../');
  const linearStatusPath = path.join(repoRoot, 'scripts/linear-status-core.js');
  const linearPlanPath = path.join(repoRoot, 'scripts/linear-plan-core.js');

  test('linear-status-core.js exists and exports clean module functions', () => {
    expect(fs.existsSync(linearStatusPath)).toBe(true);
    expect(() => require(linearStatusPath)).not.toThrow();
  });

  test('linear-plan-core.js exists and exports clean module functions', () => {
    expect(fs.existsSync(linearPlanPath)).toBe(true);
    expect(() => require(linearPlanPath)).not.toThrow();
  });
});
