#!/usr/bin/env node
/**
 * Fix malformed frontmatter in specific files
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const files = [
  'knowledge/features/feature-business-logic-reasoner-bri-177.md',
  'knowledge/features/feature-business-logic-reasoner-bri-177-implementation.md',
  'knowledge/features/feature-solana-dev-skill.md',
  'knowledge/features/feature-solana-dev-skill-implementation.md',
  'knowledge/knowledge/inbox/2026-05/KNOW-2026-05-001-governance-summary-defers-to-canonical-policy.md',
  'knowledge/knowledge/inbox/2026-06/KNOW-2026-06-001-admin-candy-machine-module-worklog.md',
  'knowledge/knowledge/inbox/2026-06/KNOW-2026-06-002-candy-machine-deploy-iteration-2026-06-07.md',
  'knowledge/knowledge/inbox/2026-06/KNOW-2026-06-003-candy-machine-deploy-iteration-current-system-branch.md',
  'knowledge/knowledge/inbox/2026-06/KNOW-2026-06-004-stake-distribution-traceability-draft.md',
  'knowledge/knowledge/inbox/2026-06/KNOW-2026-06-005-candy-machine-deploy-iteration-2026-06-11-branching-policy-preflight.md',
];

function inferType(relPath: string): string {
  if (relPath.startsWith('knowledge/inbox/')) return 'Knowledge Item';
  return 'Feature Spec';
}

function inferTitle(relPath: string): string {
  const name = relPath.split('/').pop()?.replace('.md', '') || '';
  return name
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/Bri/gi, 'BRI-');
}

for (const rel of files) {
  const content = readFileSync(rel, 'utf-8');
  
  // Extract body (everything after frontmatter)
  const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  const body = match ? match[1] : content;
  
  const type = inferType(rel);
  const title = inferTitle(rel);
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  
  const frontmatter = `---
type: ${type}
title: ${title}
description: ${title} - migrated from knowledge/
tags: [${rel.split('/')[0]}]
timestamp: ${now}
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/${rel}
---

`;
  
  writeFileSync(rel, frontmatter + body);
  console.log(`Fixed: ${rel}`);
}

console.log('\nDone!');