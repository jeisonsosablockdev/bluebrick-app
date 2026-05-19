import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

describe("vitest baseline", () => {
  it("wires a shared vitest setup file", () => {
    const config = readFileSync(path.join(repoRoot, "vitest.config.ts"), "utf8");

    expect(config).toContain("setupFiles");
    expect(config).toContain("tests/setup/vitest.setup.ts");
    expect(existsSync(path.join(repoRoot, "tests", "setup", "vitest.setup.ts"))).toBe(true);
  });

  it("imports jest-dom matchers in the shared setup", () => {
    const setup = readFileSync(
      path.join(repoRoot, "tests", "setup", "vitest.setup.ts"),
      "utf8"
    );

    expect(setup).toContain("@testing-library/jest-dom");
  });
});
