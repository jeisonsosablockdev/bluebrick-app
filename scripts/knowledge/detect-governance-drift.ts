import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildGovernanceDriftReport, renderGovernanceDriftReport } from "./governance-drift-core.ts";

type CliOptions = {
  check: boolean;
  output: string | null;
};

function parseCliOptions(argv: string[]): CliOptions {
  let output: string | null = null;

  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--output") {
      output = argv[index + 1] ?? null;
      index += 1;
    }
  }

  return {
    check: argv.includes("--check"),
    output
  };
}

function defaultOutputPath(rootDir: string): string {
  const dateStamp = new Date().toISOString().slice(0, 10);
  return path.join(rootDir, "docs", "knowledge", "reports", `governance-drift-${dateStamp}.md`);
}

async function main(): Promise<void> {
  const options = parseCliOptions(process.argv.slice(2));
  const rootDir = process.cwd();
  const report = await buildGovernanceDriftReport(rootDir);
  const content = renderGovernanceDriftReport(report);
  const outputPath = options.output ? path.resolve(rootDir, options.output) : defaultOutputPath(rootDir);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, content, "utf8");
  process.stdout.write(`Wrote ${path.relative(rootDir, outputPath)}\n`);

  if (options.check && report.checks.some((check) => !check.passed)) {
    throw new Error("Governance drift detected. Inspect the generated report.");
  }
}

void main();
