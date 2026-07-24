import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { generateLicenseReportMarkdown, LicensePolicy, PackageInfo } from '../ci/check-licenses-core';

const REPO_ROOT = path.resolve(__dirname, '../../');
const POLICY_PATH = path.join(REPO_ROOT, 'knowledge/governance/license-policy.json');
const REPORT_PATH = path.join(REPO_ROOT, 'knowledge/governance/licenses-report.md');

function main() {
  console.log('📝 Generating License Report in /knowledge (pnpm knowledge:licenses)...');

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

  const markdown = generateLicenseReportMarkdown(packages, policy);

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, markdown, 'utf-8');

  console.log(`✅ Successfully generated report at: ${REPORT_PATH}`);
}

main();
