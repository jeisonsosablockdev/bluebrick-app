import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();

function migrateNextConfig(): number {
  const nextConfigPath = path.join(ROOT_DIR, "next.config.ts");
  if (!fs.existsSync(nextConfigPath)) return 0;

  let content = fs.readFileSync(nextConfigPath, "utf8");
  const original = content;

  content = content.replace(/from\s+["']\.\/lib\/(.*)["']/g, 'from "./apps/web/src/lib/$1"');

  if (content !== original) {
    fs.writeFileSync(nextConfigPath, content, "utf8");
    console.log("  - ✅ Migrated next.config.ts");
    return 1;
  }
  return 0;
}

function migrateDirectory(dir: string): number {
  let count = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".next") {
        count += migrateDirectory(fullPath);
      }
    } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx") || entry.name.endsWith(".js"))) {
      let content = fs.readFileSync(fullPath, "utf8");
      const original = content;

      // Calculate relative prefix to root based on file depth
      const relDirToRoot = path.relative(path.dirname(fullPath), ROOT_DIR);
      const prefix = relDirToRoot.endsWith("/") ? relDirToRoot : `${relDirToRoot}/`;

      content = content.replace(/from\s+["'](?:\.\.\/)+lib\/(.*)["']/g, `from "${prefix}apps/web/src/lib/$1"`);
      content = content.replace(/from\s+["'](?:\.\.\/)+components\/(.*)["']/g, `from "${prefix}apps/web/src/components/$1"`);
      content = content.replace(/from\s+["'](?:\.\.\/)+schemas\/(.*)["']/g, `from "${prefix}apps/web/src/schemas/$1"`);
      content = content.replace(/from\s+["'](?:\.\.\/)+content\/(.*)["']/g, `from "${prefix}apps/web/src/content/$1"`);

      if (content !== original) {
        fs.writeFileSync(fullPath, content, "utf8");
        const relPath = path.relative(ROOT_DIR, fullPath);
        console.log(`  - ✅ Migrated ${relPath}`);
        count++;
      }
    }
  }

  return count;
}

function runMigration() {
  console.log("🚀 Programmatically Migrating Root Symlink Imports...\n");

  let totalUpdated = 0;
  totalUpdated += migrateNextConfig();

  ["scripts", "tests"].forEach((dir) => {
    const fullPath = path.join(ROOT_DIR, dir);
    if (fs.existsSync(fullPath)) {
      totalUpdated += migrateDirectory(fullPath);
    }
  });

  console.log(`\n🎉 Migration Complete: ${totalUpdated} file(s) updated.`);
}

runMigration();
