import { describe, test, expect } from 'vitest';
import path from 'path';
import fs from 'fs';

describe('SPEC-45 - App Router Physical Relocation to apps/web/src/app', () => {
  const repoRoot = path.resolve(__dirname, '../../');
  const appRouterRoot = path.join(repoRoot, 'apps/web/src/app');

  test('app router root contains layout, page, and core Next.js conventions', () => {
    expect(fs.existsSync(path.join(appRouterRoot, 'layout.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(appRouterRoot, 'page.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(appRouterRoot, 'globals.css'))).toBe(true);
    expect(fs.existsSync(path.join(appRouterRoot, 'providers.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(appRouterRoot, 'manifest.ts'))).toBe(true);
    expect(fs.existsSync(path.join(appRouterRoot, 'robots.ts'))).toBe(true);
    expect(fs.existsSync(path.join(appRouterRoot, 'sitemap.ts'))).toBe(true);
  });

  test('app router contains all key domain route groups', () => {
    expect(fs.existsSync(path.join(appRouterRoot, 'marketplace'))).toBe(true);
    expect(fs.existsSync(path.join(appRouterRoot, 'profile'))).toBe(true);
    expect(fs.existsSync(path.join(appRouterRoot, 'admin'))).toBe(true);
    expect(fs.existsSync(path.join(appRouterRoot, 'checkout'))).toBe(true);
    expect(fs.existsSync(path.join(appRouterRoot, 'api'))).toBe(true);
  });
});
