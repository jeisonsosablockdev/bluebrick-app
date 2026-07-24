import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import { evaluateLicenses, generateLicenseReportMarkdown } from '../../scripts/ci/check-licenses-core';

describe('License Checker Core Governance Tests', () => {
  const samplePolicy = {
    allowed: ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', 'CC0-1.0', '0BSD'],
    warn: ['LGPL-2.1', 'LGPL-3.0', 'MPL-2.0'],
    disallowed: ['GPL-2.0', 'GPL-3.0', 'AGPL-1.0', 'AGPL-3.0', 'SSPL-1.0', 'CC-BY-NC']
  };

  it('should pass packages with allowed permissive licenses', () => {
    const packages = [
      { name: 'react', version: '19.0.0', license: 'MIT' },
      { name: 'next', version: '16.2.4', license: 'MIT' },
      { name: 'zod', version: '3.25.76', license: 'MIT' }
    ];

    const result = evaluateLicenses(packages, samplePolicy);
    expect(result.violations).toHaveLength(0);
    expect(result.passed).toBe(true);
  });

  it('should flag warning for weak copyleft licenses (LGPL, MPL)', () => {
    const packages = [
      { name: 'some-lgpl-pkg', version: '1.0.0', license: 'LGPL-3.0' },
      { name: 'react', version: '19.0.0', license: 'MIT' }
    ];

    const result = evaluateLicenses(packages, samplePolicy);
    expect(result.violations).toHaveLength(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].name).toBe('some-lgpl-pkg');
    expect(result.passed).toBe(true);
  });

  it('should reject packages with strong copyleft licenses (GPL, AGPL, SSPL)', () => {
    const packages = [
      { name: 'copyleft-pkg', version: '2.0.0', license: 'GPL-3.0' },
      { name: 'agpl-pkg', version: '1.0.0', license: 'AGPL-3.0' },
      { name: 'react', version: '19.0.0', license: 'MIT' }
    ];

    const result = evaluateLicenses(packages, samplePolicy);
    expect(result.violations).toHaveLength(2);
    expect(result.passed).toBe(false);
  });

  it('should accept dual licenses (MIT OR GPL-3.0) when at least one option is allowed', () => {
    const packages = [{ name: 'jszip', version: '3.10.1', license: '(MIT OR GPL-3.0-or-later)' }];
    const result = evaluateLicenses(packages, samplePolicy);
    expect(result.violations).toHaveLength(0);
    expect(result.allowed).toHaveLength(1);
    expect(result.passed).toBe(true);
  });

  it('should format a valid markdown report for knowledge/governance/licenses-report.md', () => {
    const packages = [
      { name: 'react', version: '19.0.0', license: 'MIT' },
      { name: 'motion', version: '12.40.0', license: 'MIT' }
    ];

    const markdown = generateLicenseReportMarkdown(packages, samplePolicy);
    expect(markdown).toContain('# Informe de Licencias y Cumplimiento Legal');
    expect(markdown).toContain('react');
    expect(markdown).toContain('MIT');
  });
});
