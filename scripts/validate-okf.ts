#!/usr/bin/env node
/**
 * OKF v0.1 Validation Script
 * Validates Open Knowledge Format conformance for the knowledge/ bundle
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, extname, relative, dirname } from 'path';
import { parse } from 'yaml';

const BUNDLE_ROOT = 'knowledge';
const RESERVED = ['index.md', 'log.md'];
const REQUIRED_FIELDS = ['type'];
const RECOMMENDED_FIELDS = ['title', 'description', 'tags', 'timestamp', 'resource'];

interface ValidationResult {
  file: string;
  errors: string[];
  warnings: string[];
}

interface Frontmatter {
  type?: string;
  title?: string;
  description?: string;
  tags?: string[];
  timestamp?: string;
  resource?: string;
  [key: string]: unknown;
}

const results: ValidationResult[] = [];
let totalFiles = 0;
let totalErrors = 0;
let totalWarnings = 0;

function walk(dir: string): string[] {
  const files: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
    } else if (extname(entry.name) === '.md' || extname(entry.name) === '.json') {
      files.push(full);
    }
  }
  return files;
}

function extractFrontmatter(content: string): { frontmatter: Frontmatter | null; body: string; hasFrontmatter: boolean } {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { frontmatter: null, body: content, hasFrontmatter: false };
  try {
    const fm = parse(match[1]) as Frontmatter;
    return { frontmatter: fm, body: content.slice(match[0].length), hasFrontmatter: true };
  } catch {
    return { frontmatter: null, body: content, hasFrontmatter: false };
  }
}

function validateFile(file: string): ValidationResult {
  const rel = relative(BUNDLE_ROOT, file);
  const errors: string[] = [];
  const warnings: string[] = [];
  const basename = file.split('/').pop() || '';
  
  // JSON files are reference data, not concept documents - skip frontmatter validation
  if (extname(file) === '.json') {
    return { file: rel, errors, warnings };
  }
  
  const content = readFileSync(file, 'utf-8');
  const { frontmatter, body, hasFrontmatter } = extractFrontmatter(content);

  // Reserved filename check
  if (RESERVED.includes(basename)) {
    if (!hasFrontmatter && basename === 'index.md') {
      // index.md MAY have frontmatter only at bundle root
      if (rel !== 'index.md') {
        warnings.push('index.md in subdirectory should not have frontmatter');
      }
    }
  } else {
    // Concept documents MUST have frontmatter
    if (!hasFrontmatter) {
      errors.push('Missing YAML frontmatter (required for concept documents)');
    } else if (frontmatter) {
      // Required fields
      for (const field of REQUIRED_FIELDS) {
        if (!frontmatter[field] || (typeof frontmatter[field] === 'string' && !frontmatter[field].trim())) {
          errors.push(`Missing required frontmatter field: ${field}`);
        }
      }
      // Recommended fields
      for (const field of RECOMMENDED_FIELDS) {
        if (!frontmatter[field] || (Array.isArray(frontmatter[field]) && frontmatter[field].length === 0)) {
          warnings.push(`Missing recommended frontmatter field: ${field}`);
        }
      }
      // Timestamp format
      if (frontmatter.timestamp && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(frontmatter.timestamp)) {
        warnings.push('timestamp should be ISO 8601 UTC (YYYY-MM-DDTHH:MM:SSZ)');
      }
      // Tags should be array
      if (frontmatter.tags && !Array.isArray(frontmatter.tags)) {
        warnings.push('tags should be a YAML array');
      }
    }
  }

  // Cross-link validation: markdown links should be bundle-relative (/...) or relative (./ ../)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = linkRegex.exec(body)) !== null) {
    const url = match[2];
    if (url.startsWith('http://') || url.startsWith('https://')) continue; // external OK
    if (url.startsWith('/')) continue; // bundle-relative OK
    if (url.startsWith('./') || url.startsWith('../')) continue; // relative OK
    if (url.startsWith('#')) continue; // anchor OK
    if (url.startsWith('mailto:')) continue;
    warnings.push(`Link should be bundle-relative (/...) or relative (./): ${url}`);
  }

  // Check index.md structure if present
  if (basename === 'index.md' && hasFrontmatter && rel !== 'index.md') {
    warnings.push('Subdirectory index.md should not have frontmatter');
  }

  // Check log.md structure
  if (basename === 'log.md' && hasFrontmatter) {
    warnings.push('log.md should not have frontmatter');
  }

  return { file: rel, errors, warnings };
}

function checkDirectoryIndexes(): string[] {
  const warnings: string[] = [];
  const dirs = new Set<string>();

  const files = walk(BUNDLE_ROOT);
  for (const file of files) {
    const rel = relative(BUNDLE_ROOT, file);
    const d = dirname(rel);
    if (d !== '.') dirs.add(d);
  }

  for (const dir of dirs) {
    const indexPath = join(BUNDLE_ROOT, dir, 'index.md');
    if (!existsSync(indexPath)) {
      warnings.push(`Directory missing index.md: ${dir}/`);
    }
  }

  return warnings;
}

function main() {
  console.log('🔍 Validating OKF v0.1 bundle...\n');

  const files = walk(BUNDLE_ROOT);
  totalFiles = files.length;

  for (const file of files) {
    const result = validateFile(file);
    if (result.errors.length > 0 || result.warnings.length > 0) {
      results.push(result);
    }
  }

  // Directory index check
  const dirWarnings = checkDirectoryIndexes();
  if (dirWarnings.length > 0) {
    results.push({ file: '(directory structure)', errors: [], warnings: dirWarnings });
  }

  // Root index.md OKF version check
  const rootIndex = join(BUNDLE_ROOT, 'index.md');
  if (existsSync(rootIndex)) {
    const content = readFileSync(rootIndex, 'utf-8');
    const { frontmatter } = extractFrontmatter(content);
    if (frontmatter && frontmatter.okf_version !== '0.1') {
      results.push({ file: 'index.md', errors: ['Root index.md must declare okf_version: "0.1"'], warnings: [] });
    }
  }

  // Report
  for (const r of results) {
    if (r.errors.length > 0) {
      console.log(`❌ ${r.file}`);
      for (const e of r.errors) console.log(`   ERROR: ${e}`);
      totalErrors += r.errors.length;
    }
    if (r.warnings.length > 0) {
      console.log(`⚠️  ${r.file}`);
      for (const w of r.warnings) console.log(`   WARN: ${w}`);
      totalWarnings += r.warnings.length;
    }
  }

  console.log('\n📊 Summary');
  console.log(`   Files checked: ${totalFiles}`);
  console.log(`   Errors: ${totalErrors}`);
  console.log(`   Warnings: ${totalWarnings}`);

  if (totalErrors > 0) {
    console.log('\n❌ Validation FAILED');
    process.exit(1);
  } else if (totalWarnings > 0) {
    console.log('\n✅ Validation PASSED (with warnings)');
    process.exit(0);
  } else {
    console.log('\n✅ Validation PASSED');
    process.exit(0);
  }
}

main();