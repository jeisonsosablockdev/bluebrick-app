import { describe, test, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import YAML from 'yaml';

describe('10 - Canonical In-Code Commentary Governance & Harness Standards', () => {
  const repoRoot = path.resolve(__dirname, '../../../');
  const agentsDir = path.join(repoRoot, '.agents/agents');
  const policiesDir = path.join(repoRoot, '.agents/policies');
  const workflowsDir = path.join(repoRoot, '.agents/workflows');
  const governanceDir = path.join(repoRoot, 'knowledge/governance');

  describe('1. Canonical Governance & Policy Files', () => {
    test('AGENTS.md mandates in-code commentary in Global Non-Negotiable Rule 5 and Definition of Done', () => {
      const agentsMd = fs.readFileSync(path.join(repoRoot, 'AGENTS.md'), 'utf-8');
      expect(agentsMd).toContain('MANDATORY IN-CODE COMMENTARY');
      expect(agentsMd).toContain('in-code commentary pass');
      expect(agentsMd).toContain('Presentation, Application/Consumption, Domain/Pipelines, Infrastructure separation');
    });

    test('clean-code-folder-structure.md contains Section 4.1 for Canonical In-Code Commentary Standard', () => {
      const cleanCodeMd = fs.readFileSync(path.join(governanceDir, 'clean-code-folder-structure.md'), 'utf-8');
      expect(cleanCodeMd).toContain('4.1. Estándar Canónico de Comentarios e Indicaciones en el Código');
      expect(cleanCodeMd).toContain('Encabezado de Archivo / Módulo');
      expect(cleanCodeMd).toContain('JSDoc / TSDoc / Rust');
      expect(cleanCodeMd).toContain('Step N:');
    });

    test('documentation-policy.md includes Canonical In-Code Commentary & Intent Indications', () => {
      const docPolicyMd = fs.readFileSync(path.join(governanceDir, 'documentation-policy.md'), 'utf-8');
      expect(docPolicyMd).toContain('Canonical In-Code Commentary & Intent Indications');
      expect(docPolicyMd).toContain('Step N:');
    });

    test('security-quality-policy.md mandates in-code commentary and inline security invariants in Development Philosophy', () => {
      const secPolicyMd = fs.readFileSync(path.join(governanceDir, 'security-quality-policy.md'), 'utf-8');
      expect(secPolicyMd).toContain('Mandatory in-code commentary');
      expect(secPolicyMd).toContain('security invariants, PDA derivations');
    });
  });

  describe('2. Specialist Agents YAML Configuration', () => {
    const agentsToVerify = [
      'architect',
      'reviewer',
      'solana',
      'frontend',
      'api',
      'db',
      'state',
      'qa',
      'planner',
      'docs',
      'security'
    ];

    agentsToVerify.forEach(agentName => {
      test(`agent "${agentName}.yaml" explicitly defines in-code commentary in scope and system_prompt`, () => {
        const filePath = path.join(agentsDir, `${agentName}.yaml`);
        expect(fs.existsSync(filePath)).toBe(true);

        const content = fs.readFileSync(filePath, 'utf-8');
        const parsed = YAML.parse(content) as Record<string, any>;

        expect(parsed.scope).toBeDefined();
        const scopeStr = JSON.stringify(parsed.scope).toLowerCase();
        expect(scopeStr).toMatch(/commentary|annotation|doc/);

        expect(parsed.system_prompt).toBeDefined();
        const promptStr = parsed.system_prompt.toLowerCase();
        expect(promptStr).toMatch(/comment|jsdoc|step|layer|invariant/);
      });
    });
  });

  describe('3. Agents Policies Execution Constraints & Required Evidence', () => {
    const policiesToVerify = [
      'frontend-policy.md',
      'blockchain-policy.md',
      'testing-policy.md',
      'docs-policy.md',
      'security-policy.md'
    ];

    policiesToVerify.forEach(policyFile => {
      test(`policy "${policyFile}" enforces in-code commentary and lists it in Required Evidence`, () => {
        const filePath = path.join(policiesDir, policyFile);
        expect(fs.existsSync(filePath)).toBe(true);

        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toContain('Mandatory In-Code');
        expect(content).toContain('Required Evidence');
        expect(content.toLowerCase()).toMatch(/commentary|annotation/);
      });
    });
  });

  describe('4. Workflows Sequence and Gate 2 Auditing', () => {
    const workflowsToVerify = [
      'blockchain-cycle.md',
      'frontend-cycle.md',
      'refactor-cycle.md'
    ];

    workflowsToVerify.forEach(workflowFile => {
      test(`workflow "${workflowFile}" includes in-code commentary in execution sequence and walkthrough evidence`, () => {
        const filePath = path.join(workflowsDir, workflowFile);
        expect(fs.existsSync(filePath)).toBe(true);

        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content.toLowerCase()).toMatch(/in-code commentary|comment/);
        expect(content).toContain('Required Evidence in Walkthrough');
      });
    });
  });
});
