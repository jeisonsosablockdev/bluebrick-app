import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

function readFileFromRepo(relativePath: string): string {
  const absolutePath = path.resolve(process.cwd(), relativePath);
  return fs.readFileSync(absolutePath, "utf-8");
}

describe("components/dashboard/protected-shell footer source", () => {
  it("renders the shared footer from the protected shell instead of a single profile page", () => {
    const shellSource = readFileFromRepo("components/dashboard/protected-shell.tsx");
    const profileSource = readFileFromRepo("app/protected/perfil/page.tsx");

    expect(shellSource).toContain("import { FooterSection }");
    expect(shellSource).toContain("<FooterSection />");
    expect(profileSource).not.toContain("FooterSection");
  });
});
