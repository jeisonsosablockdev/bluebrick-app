const fs = require("node:fs");
const path = require("node:path");

const PLAYWRIGHT_RANGE = ">=1.48.2 <2";
const candidatePaths = [
  path.join(
    process.cwd(),
    "node_modules",
    "@synthetixio",
    "synpress",
    "node_modules",
    "@synthetixio",
    "synpress-phantom",
    "package.json",
  ),
  path.join(
    process.cwd(),
    "node_modules",
    "@synthetixio",
    "synpress-phantom",
    "package.json",
  ),
];

let patchedFiles = 0;

for (const packageJsonPath of candidatePaths) {
  if (!fs.existsSync(packageJsonPath)) {
    continue;
  }

  const source = fs.readFileSync(packageJsonPath, "utf8");
  const manifest = JSON.parse(source);

  if (!manifest.peerDependencies || !manifest.peerDependencies["@playwright/test"]) {
    continue;
  }

  if (manifest.peerDependencies["@playwright/test"] === PLAYWRIGHT_RANGE) {
    continue;
  }

  manifest.peerDependencies["@playwright/test"] = PLAYWRIGHT_RANGE;
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(manifest, null, 2)}\n`);
  patchedFiles += 1;
}

if (patchedFiles > 0) {
  console.log(
    `patched ${patchedFiles} synpress-phantom package.json file(s) to accept @playwright/test ${PLAYWRIGHT_RANGE}`,
  );
}
