import { describe, test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

describe('01 - Specialist Agents YAML Schema & Tooling', () => {
  const repoRoot = path.resolve(__dirname, '../../../');
  const agentsDir = path.join(repoRoot, '.agents/agents');

  test('agents directory exists and contains specialist YAML definitions', () => {
    expect(fs.existsSync(agentsDir)).toBe(true);
    const files = fs.readdirSync(agentsDir).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));
    expect(files.length).toBeGreaterThan(0);
  });

  test('every agent YAML definition parses cleanly without syntax errors', () => {
    const files = fs.readdirSync(agentsDir).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));
    for (const file of files) {
      const filePath = path.join(agentsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(() => yaml.load(content)).not.toThrow();
      const parsed = yaml.load(content) as Record<string, any>;
      expect(parsed).toBeDefined();
      expect(parsed.name).toBeDefined();
      expect(parsed.description).toBeDefined();
    }
  });

  test('essential specialist agents exist (planner, architect, qa, reviewer, security)', () => {
    const files = fs.readdirSync(agentsDir);
    const agentNames = files.map((f) => path.basename(f, path.extname(f)));
    expect(agentNames).toContain('planner');
    expect(agentNames).toContain('architect');
    expect(agentNames).toContain('qa');
    expect(agentNames).toContain('reviewer');
    expect(agentNames).toContain('security');
  });
});
