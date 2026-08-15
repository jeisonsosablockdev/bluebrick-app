import { describe, test, expect } from 'vitest';
import path from 'path';
import fs from 'fs';

describe('SPEC-35 - Investor Portfolio & Referral Marketing Feature Architecture', () => {
  const repoRoot = path.resolve(__dirname, '../../');
  const portfolioRoot = path.join(repoRoot, 'apps/web/src/features/investor-portfolio');
  const referralRoot = path.join(repoRoot, 'apps/web/src/features/referral-marketing');

  test('investor-portfolio feature exports public API and contains portfolio-module', () => {
    expect(fs.existsSync(portfolioRoot)).toBe(true);
    expect(fs.existsSync(path.join(portfolioRoot, 'index.ts'))).toBe(true);
    expect(fs.existsSync(path.join(portfolioRoot, 'presentation/portfolio-module.tsx'))).toBe(true);
  });

  test('referral-marketing feature exports public API and contains referral-program-module', () => {
    expect(fs.existsSync(referralRoot)).toBe(true);
    expect(fs.existsSync(path.join(referralRoot, 'index.ts'))).toBe(true);
    expect(fs.existsSync(path.join(referralRoot, 'presentation/referral-program-module.tsx'))).toBe(true);
  });

  test('no presentation files in portfolio or referral directly import database clients', () => {
    const checkDir = (dir: string) => {
      const presFiles = fs.readdirSync(dir).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
      for (const file of presFiles) {
        const content = fs.readFileSync(path.join(dir, file), 'utf8');
        expect(content).not.toContain('@/lib/db');
        expect(content).not.toContain('infrastructure/db');
      }
    };

    checkDir(path.join(portfolioRoot, 'presentation'));
    checkDir(path.join(referralRoot, 'presentation'));
  });
});
