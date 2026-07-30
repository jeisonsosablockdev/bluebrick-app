import { describe, test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('02 - Hooks & Graph Mapping (.agents/hooks.json)', () => {
  const repoRoot = path.resolve(__dirname, '../../../');
  const hooksPath = path.join(repoRoot, '.agents/hooks.json');

  test('hooks.json exists and parses cleanly', () => {
    expect(fs.existsSync(hooksPath)).toBe(true);
    const content = fs.readFileSync(hooksPath, 'utf-8');
    expect(() => JSON.parse(content)).not.toThrow();
  });

  test('every script handler referenced in hooks.json exists on disk', () => {
    const hooks = JSON.parse(fs.readFileSync(hooksPath, 'utf-8'));
    const verifyPathsRecursive = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      for (const [key, value] of Object.entries(obj)) {
        if (key === 'script' && typeof value === 'string') {
          const scriptFullPath = path.isAbsolute(value) ? value : path.join(repoRoot, value);
          expect(fs.existsSync(scriptFullPath)).toBe(true);
        } else if (typeof value === 'object') {
          verifyPathsRecursive(value);
        }
      }
    };
    verifyPathsRecursive(hooks);
  });
});
