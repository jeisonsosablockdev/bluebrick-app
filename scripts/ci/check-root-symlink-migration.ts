import fs from "node:fs";
import path from "node:path";

interface SymlinkStatus {
  name: string;
  isSymlink: boolean;
  target?: string;
}

interface ImportReference {
  filePath: string;
  line: number;
  content: string;
}

const ROOT_DIR = process.cwd();
const SYMLINKS_TO_CHECK = ["components", "content", "lib", "public", "schemas"];
const DIRS_TO_SCAN = ["scripts", "tests"];

function getSymlinkStatuses(): SymlinkStatus[] {
  return SYMLINKS_TO_CHECK.map((name) => {
    const fullPath = path.join(ROOT_DIR, name);
    try {
      const lstat = fs.lstatSync(fullPath);
      if (lstat.isSymbolicLink()) {
        const target = fs.readlinkSync(fullPath);
        return { name, isSymlink: true, target };
      }
      return { name, isSymlink: false };
    } catch {
      return { name, isSymlink: false };
    }
  });
}

function scanFilesForLegacyImports(dir: string): ImportReference[] {
  const references: ImportReference[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".next") {
        references.push(...scanFilesForLegacyImports(fullPath));
      }
    } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx") || entry.name.endsWith(".js"))) {
      const content = fs.readFileSync(fullPath, "utf8");
      const lines = content.split("\n");
      lines.forEach((line, index) => {
        if (/import\s+.*from\s+["'](?:\.\.\/)+(?:lib|components|schemas|content)\/.*["']/.test(line)) {
          references.push({
            filePath: path.relative(ROOT_DIR, fullPath),
            line: index + 1,
            content: line.trim()
          });
        }
      });
    }
  }

  return references;
}

function runDiagnostic() {
  console.log("🔍 Diagnosticating Monorepo Root Symlink Hygiene...\n");

  const symlinks = getSymlinkStatuses();
  console.log("📋 Root Symlink Status:");
  symlinks.forEach((s) => {
    if (s.isSymlink) {
      console.log(`  - 🔗 /${s.name} -> ${s.target}`);
    } else {
      console.log(`  - ✅ /${s.name} (No symlink)`);
    }
  });

  console.log("\n🔎 Scanning scripts/ and tests/ for legacy relative imports...");
  const legacyImports: ImportReference[] = [];

  // Check next.config.ts explicitly if it imports from ./lib
  const nextConfigPath = path.join(ROOT_DIR, "next.config.ts");
  if (fs.existsSync(nextConfigPath)) {
    const content = fs.readFileSync(nextConfigPath, "utf8");
    const lines = content.split("\n");
    lines.forEach((line, index) => {
      if (/import\s+.*from\s+["']\.\/lib\/.*["']/.test(line)) {
        legacyImports.push({
          filePath: "next.config.ts",
          line: index + 1,
          content: line.trim()
        });
      }
    });
  }

  DIRS_TO_SCAN.forEach((dir) => {
    const fullDirPath = path.join(ROOT_DIR, dir);
    if (fs.existsSync(fullDirPath)) {
      legacyImports.push(...scanFilesForLegacyImports(fullDirPath));
    }
  });

  if (legacyImports.length === 0) {
    console.log("✅ Zero legacy relative imports found in next.config.ts, scripts/, and tests/!");
  } else {
    console.log(`⚠️ Found ${legacyImports.length} legacy relative imports to migrate:\n`);
    legacyImports.forEach((imp) => {
      console.log(`  - ${imp.filePath}:${imp.line}`);
      console.log(`    ${imp.content}\n`);
    });
  }

  console.log("🏁 Diagnostic Complete.");
}

runDiagnostic();
