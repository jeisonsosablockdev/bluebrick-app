import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("domain & infrastructure migration (SPEC-31)", () => {
  const rootDir = process.cwd();
  const appsWebSrc = path.join(rootDir, "apps", "web", "src");

  it("verifies physical directories for schemas, content, and lib exist in apps/web/src", () => {
    expect(fs.existsSync(path.join(appsWebSrc, "schemas"))).toBe(true);
    expect(fs.existsSync(path.join(appsWebSrc, "content"))).toBe(true);
    expect(fs.existsSync(path.join(appsWebSrc, "lib"))).toBe(true);
  });

  it("ensures legacy standalone directories (schemas, content, lib) are deleted from root", () => {
    const rootSchemas = path.join(rootDir, "schemas");
    const rootContent = path.join(rootDir, "content");
    const rootLib = path.join(rootDir, "lib");

    expect(fs.existsSync(rootSchemas), "/schemas should be removed from root").toBe(false);
    expect(fs.existsSync(rootContent), "/content should be removed from root").toBe(false);
    expect(fs.existsSync(rootLib), "/lib should be removed from root").toBe(false);
  });
});
