#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const rootDir = process.cwd();
const testResultsDir = path.join(rootDir, "test-results");
const outputFile = path.join(testResultsDir, "evidence-index.json");

function walk(currentPath, files = []) {
  if (!fs.existsSync(currentPath)) {
    return files;
  }

  for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
    const fullPath = path.join(currentPath, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }

    if (/\.(png|json|zip|webm)$/i.test(entry.name)) {
      files.push(path.relative(rootDir, fullPath));
    }
  }

  return files;
}

if (!fs.existsSync(testResultsDir)) {
  console.error("[e2e:evidence] test-results directory not found. Run evidence test first.");
  process.exit(1);
}

const artifacts = walk(testResultsDir).sort();
const evidenceIndex = {
  generatedAt: new Date().toISOString(),
  artifactCount: artifacts.length,
  artifacts
};

fs.writeFileSync(outputFile, JSON.stringify(evidenceIndex, null, 2));
console.log(`[e2e:evidence] Evidence index written: ${path.relative(rootDir, outputFile)}`);
console.log(`[e2e:evidence] Artifacts indexed: ${artifacts.length}`);
