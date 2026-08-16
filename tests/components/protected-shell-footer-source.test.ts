import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

function readFileFromRepo(relativePath: string): string {
  const directPath = path.resolve(process.cwd(), relativePath);
  if (fs.existsSync(directPath)) {
    return fs.readFileSync(directPath, "utf-8");
  }
  const appWebPath = path.resolve(process.cwd(), "apps/web/src", relativePath);
  if (fs.existsSync(appWebPath)) {
    return fs.readFileSync(appWebPath, "utf-8");
  }
  throw new Error(`File not found: ${relativePath}`);
}

describe("features/profile/presentation/protected-shell footer source", () => {
  it("renders the shared footer from the protected shell instead of a single profile page", () => {
    const shellSource = readFileFromRepo("features/profile/presentation/protected-shell.tsx");
    const profileSource = readFileFromRepo("apps/web/src/app/profile/perfil/page.tsx");

    expect(shellSource).toContain("import { FooterSection }");
    expect(shellSource).toContain("<FooterSection />");
    expect(profileSource).not.toContain("FooterSection");
  });
});
