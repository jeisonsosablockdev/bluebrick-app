import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT_DIR = process.cwd();

async function walkDir(dir, extension = ".md") {
  const files = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const res = path.resolve(dir, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith(".") && entry.name !== "node_modules") {
          files.push(...(await walkDir(res, extension)));
        }
      } else if (entry.name.endsWith(extension)) {
        files.push(res);
      }
    }
  } catch {
    // Directory might not exist
  }
  return files;
}

export async function generateGraph() {
  const nodes = [];
  const edges = [];

  // 1. Add Core Governance Nodes
  nodes.push({
    id: "AGENTS.md",
    type: "agent_rule",
    label: "Agent Routing & Unified Governance",
    path: "AGENTS.md"
  });

  // 2. Scan Knowledge Base
  const knowledgeFiles = await walkDir(path.join(ROOT_DIR, "knowledge"));
  for (const filePath of knowledgeFiles) {
    const relPath = path.relative(ROOT_DIR, filePath);
    const id = relPath;
    let type = "governance";

    if (relPath.includes("knowledge/features/")) {
      type = "feature";
    } else if (relPath.includes("knowledge/fixes/")) {
      type = "fix";
    }

    nodes.push({
      id,
      type,
      label: path.basename(filePath, ".md"),
      path: relPath
    });

    if (relPath.includes("knowledge/governance/")) {
      edges.push({
        source: "AGENTS.md",
        target: id,
        relation: "governs"
      });
    }
  }

  // 3. Scan Code Modules
  const modules = ["app", "programs", "components", "lib", "scripts", "db"];
  for (const mod of modules) {
    nodes.push({
      id: `module:${mod}`,
      type: "code_module",
      label: `Module /${mod}`,
      path: mod
    });

    edges.push({
      source: "AGENTS.md",
      target: `module:${mod}`,
      relation: "governs"
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    nodes,
    edges
  };
}

async function main() {
  console.log("🕸️ Generating Repository Knowledge Graph (Graphify)...");
  const graph = await generateGraph();

  const outputPath = path.join(ROOT_DIR, ".agents", "graph.json");
  await writeFile(outputPath, JSON.stringify(graph, null, 2), "utf8");
  console.log(`✅ Graph successfully saved to ${outputPath}`);
  console.log(`📊 Summary: ${graph.nodes.length} nodes, ${graph.edges.length} edges mapped.`);
}

main().catch((err) => {
  console.error("❌ Graphify generation failed:", err);
  process.exit(1);
});
