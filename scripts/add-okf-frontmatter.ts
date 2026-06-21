#!/usr/bin/env node
/**
 * Auto-add OKF frontmatter to markdown files missing it
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname, relative, basename } from 'path';

const BUNDLE_ROOT = 'knowledge';
const SKIP_DIRS = ['node_modules', '.git'];

function walk(dir: string): string[] {
  const files: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP_DIRS.includes(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
    } else if (extname(entry.name) === '.md') {
      files.push(full);
    }
  }
  return files;
}

function hasFrontmatter(content: string): boolean {
  return content.startsWith('---\n');
}

function inferType(relPath: string): string {
  if (relPath.startsWith('governance/')) return 'Policy';
  if (relPath.startsWith('architecture/')) return 'ADR';
  if (relPath.startsWith('features/')) return 'Feature Spec';
  if (relPath.startsWith('fixes/')) return 'Fix Spec';
  if (relPath.startsWith('rfcs/')) return 'RFC';
  if (relPath.startsWith('guides/')) return 'Guide';
  if (relPath.startsWith('api/')) return 'API Reference';
  if (relPath.startsWith('database/')) return 'Database Reference';
  if (relPath.startsWith('operations/')) return 'Operations Reference';
  if (relPath.startsWith('security/')) return 'Security Reference';
  if (relPath.startsWith('mapbox/')) return 'Config';
  if (relPath.startsWith('knowledge/inbox/')) return 'Knowledge Item';
  if (relPath.startsWith('knowledge/')) return 'Knowledge Reference';
  return 'Document';
}

function inferTitle(relPath: string): string {
  const name = basename(relPath, '.md');
  return name
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/Bri/gi, 'BRI-')
    .replace(/Epic/gi, 'EPIC-')
    .replace(/Story/gi, 'STORY-');
}

function main() {
  const files = walk(BUNDLE_ROOT);
  let added = 0;

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    if (hasFrontmatter(content)) continue;

    const rel = relative(BUNDLE_ROOT, file);
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

    writeFileSync(file, frontmatter + content);
    added++;
    console.log(`Added frontmatter: ${rel}`);
  }

  console.log(`\nAdded frontmatter to ${added} files`);
}

main();