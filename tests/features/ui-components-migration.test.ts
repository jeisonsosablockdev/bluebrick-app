import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("SPEC-32 UI Components Relocation Governance", () => {
  const rootDir = process.cwd();
  const targetComponentsDir = path.join(rootDir, "apps", "web", "src", "components");
  const rootComponentsSymlink = path.join(rootDir, "components");

  it("should have relocated physical components directory into apps/web/src/components", () => {
    expect(fs.existsSync(targetComponentsDir)).toBe(true);
    const stat = fs.statSync(targetComponentsDir);
    expect(stat.isDirectory()).toBe(true);

    const subdirs = fs.readdirSync(targetComponentsDir);
    expect(subdirs).toContain("ui");
  });

  it("should maintain a root symlink 'components' pointing to apps/web/src/components for backward compatibility", () => {
    expect(fs.existsSync(rootComponentsSymlink)).toBe(true);
    const lstat = fs.lstatSync(rootComponentsSymlink);
    expect(lstat.isSymbolicLink()).toBe(true);

    const targetPath = fs.readlinkSync(rootComponentsSymlink);
    expect(targetPath).toBe(path.join("apps", "web", "src", "components"));
  });
});
