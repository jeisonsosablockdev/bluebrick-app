/**
 * Layer: Tests / Governance Harness
 * File: tests/harness/specs/11-ai-architect-governance.test.ts
 * Description: Governance test suite verifying AI Architect agent specification,
 *              AI-Augmented Ingestion Pipeline & Schema Alignment ADR, and 4-layer FDD isolation.
 */

import { describe, test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

describe('11 - AI Architect & Ingestion Pipeline Governance', () => {
  const repoRoot = path.resolve(__dirname, '../../../');
  const aiArchitectYamlPath = path.join(repoRoot, '.agents/agents/ai-architect.yaml');
  const aiIngestionAdrPath = path.join(repoRoot, 'knowledge/architecture/ai-augmented-ingestion-pipeline.md');
  const agentsMdPath = path.join(repoRoot, 'AGENTS.md');
  const plannerYamlPath = path.join(repoRoot, '.agents/agents/planner.yaml');
  const hooksJsonPath = path.join(repoRoot, '.agents/hooks.json');

  test('ai-architect.yaml exists and parses cleanly', () => {
    // Step 1: Verify file existence
    expect(fs.existsSync(aiArchitectYamlPath)).toBe(true);

    // Step 2: Parse YAML content
    const content = fs.readFileSync(aiArchitectYamlPath, 'utf-8');
    const parsed = YAML.parse(content) as Record<string, any>;

    // Step 3: Validate schema contracts
    expect(parsed.name).toBe('ai-architect');
    expect(parsed.description).toContain('AI-Augmented Ingestion Pipeline');
    expect(Array.isArray(parsed.scope)).toBe(true);
    expect(parsed.scope.some((s: string) => s.includes('ingestion pipeline'))).toBe(true);
    expect(parsed.scope.some((s: string) => s.includes('schema alignment'))).toBe(true);
  });

  test('ai-architect enforces strict 4-layer isolation and forbidden imports', () => {
    // Step 1: Parse YAML rules
    const content = fs.readFileSync(aiArchitectYamlPath, 'utf-8');
    const parsed = YAML.parse(content) as Record<string, any>;

    const layers = parsed.layered_architecture_rules?.layers;
    expect(Array.isArray(layers)).toBe(true);
    expect(layers.length).toBe(4);

    // Step 2: Check Presentation Layer prohibitions
    const presLayer = layers.find((l: any) => l.name.includes('Presentation'));
    expect(presLayer).toBeDefined();
    expect(presLayer.forbidden_imports).toContain('@google/genai');

    // Step 3: Check Domain Layer prohibitions
    const domainLayer = layers.find((l: any) => l.name.includes('Domain'));
    expect(domainLayer).toBeDefined();
    expect(domainLayer.forbidden_imports).toContain('react');
    expect(domainLayer.forbidden_imports).toContain('pg');
  });

  test('canonical ADR ai-augmented-ingestion-pipeline.md exists and documents all 5 stages', () => {
    // Step 1: Verify ADR existence
    expect(fs.existsSync(aiIngestionAdrPath)).toBe(true);

    // Step 2: Verify documented stages
    const adrContent = fs.readFileSync(aiIngestionAdrPath, 'utf-8');
    expect(adrContent).toContain('Stage 1: Source Acquisition');
    expect(adrContent).toContain('Stage 2: Deterministic Preprocessing');
    expect(adrContent).toContain('Stage 3: AI-Augmented Semantic Schema Alignment');
    expect(adrContent).toContain('Stage 4: Data Contracts');
    expect(adrContent).toContain('Stage 5: Persistence');
  });

  test('AGENTS.md, planner.yaml, and hooks.json are synchronized with ai-architect', () => {
    // Step 1: Check AGENTS.md
    const agentsMdContent = fs.readFileSync(agentsMdPath, 'utf-8');
    expect(agentsMdContent).toContain('`ai-architect`');

    // Step 2: Check planner.yaml delegates
    const plannerContent = fs.readFileSync(plannerYamlPath, 'utf-8');
    const parsedPlanner = YAML.parse(plannerContent) as Record<string, any>;
    expect(parsedPlanner.delegates_to).toContain('ai-architect');

    // Step 3: Check hooks.json domain bindings
    const hooksContent = fs.readFileSync(hooksJsonPath, 'utf-8');
    const parsedHooks = JSON.parse(hooksContent);
    expect(parsedHooks.domain_subagent_bindings.ai).toBeDefined();
    expect(parsedHooks.domain_subagent_bindings.ai.primary).toBe('ai-architect');
  });

  test('ai-cycle.md workflow exists and documents the full Antigravity execution sequence', () => {
    const aiCycleWorkflowPath = path.join(repoRoot, '.agents/workflows/ai-cycle.md');
    // Step 1: Verify workflow file existence
    expect(fs.existsSync(aiCycleWorkflowPath)).toBe(true);

    // Step 2: Verify contents and subagent bindings
    const workflowContent = fs.readFileSync(aiCycleWorkflowPath, 'utf-8');
    expect(workflowContent).toContain('AI Ingestion & Schema Alignment Cycle');
    expect(workflowContent).toContain('ai-architect');
    expect(workflowContent).toContain('Gate 1: Architecture Review & Scaffolding');
    expect(workflowContent).toContain('Gate 2: Diff Audit');
  });
});
