import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { evaluateLicenses, LicensePolicy, PackageInfo } from './check-licenses-core';

const REPO_ROOT = path.resolve(__dirname, '../../');
const POLICY_PATH = path.join(REPO_ROOT, 'knowledge/governance/license-policy.json');

function main() {
  console.log('🔍 Executing License Compliance Check (pnpm check:licenses)...');

  if (!fs.existsSync(POLICY_PATH)) {
    console.error(`❌ License policy file not found at: ${POLICY_PATH}`);
    process.exit(1);
  }

  const policy: LicensePolicy = JSON.parse(fs.readFileSync(POLICY_PATH, 'utf-8'));

  let pnpmOutput = '';
  try {
    pnpmOutput = execSync('pnpm licenses list --json', {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      maxBuffer: 20 * 1024 * 1024
    });
  } catch (err: any) {
    console.error('❌ Failed to run "pnpm licenses list --json":', err.message);
    process.exit(1);
  }

  let packages: PackageInfo[] = [];

  try {
    const rawData = JSON.parse(pnpmOutput);
    // pnpm licenses list --json returns an object keyed by license type or package list
    if (Array.isArray(rawData)) {
      packages = rawData.map((item: any) => ({
        name: item.name,
        version: item.version,
        license: item.license || item.licenses || 'UNKNOWN'
      }));
    } else if (typeof rawData === 'object' && rawData !== null) {
      for (const [licenseName, pkgList] of Object.entries(rawData)) {
        if (Array.isArray(pkgList)) {
          for (const pkg of pkgList) {
            packages.push({
              name: pkg.name,
              version: pkg.version,
              license: pkg.license || licenseName || 'UNKNOWN'
            });
          }
        }
      }
    }
  } catch (e: any) {
    console.error('❌ Error parsing pnpm licenses JSON output:', e.message);
    process.exit(1);
  }

  const evalResult = evaluateLicenses(packages, policy);

  console.log(`\n📊 Scanned ${packages.length} dependencies:`);
  console.log(`  - Allowed (Permissive): ${evalResult.allowed.length}`);
  console.log(`  - Warnings (Weak Copyleft): ${evalResult.warnings.length}`);
  console.log(`  - Disallowed (Strong Copyleft): ${evalResult.violations.length}`);

  if (evalResult.warnings.length > 0) {
    console.warn('\n⚠️ WARNINGS - Weak Copyleft Dependencies Detected:');
    evalResult.warnings.forEach((w) => console.warn(`  - ${w.name}@${w.version} (${w.license})`));
  }

  if (evalResult.violations.length > 0) {
    console.error('\n❌ VIOLATIONS - Disallowed License Dependencies Detected:');
    evalResult.violations.forEach((v) => console.error(`  - ${v.name}@${v.version} (${v.license})`));
    console.error('\n🚨 Build failed due to license policy violations.');
    process.exit(1);
  }

  console.log('\n✅ License compliance check passed successfully.');
  process.exit(0);
}

main();
