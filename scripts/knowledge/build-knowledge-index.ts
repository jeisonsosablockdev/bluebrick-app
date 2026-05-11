import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { collectKnowledgeIndex, renderKnowledgeReadme } from "./knowledge-core.ts";

type CliOptions = {
  check: boolean;
};

function parseCliOptions(argv: string[]): CliOptions {
  return {
    check: argv.includes("--check")
  };
}

const options = parseCliOptions(process.argv.slice(2));
const rootDir = process.cwd();
const readmePath = path.join(rootDir, "docs", "knowledge", "README.md");
const knowledgeIndex = await collectKnowledgeIndex(rootDir);
const nextContent = renderKnowledgeReadme(knowledgeIndex);

if (options.check) {
  const currentContent = await readFile(readmePath, "utf8");
  if (currentContent !== nextContent) {
    throw new Error("docs/knowledge/README.md is out of date. Run `npm run knowledge:index`.");
  }

  process.exit(0);
}

await writeFile(readmePath, nextContent, "utf8");
process.stdout.write(`Updated ${path.relative(rootDir, readmePath)}\n`);
