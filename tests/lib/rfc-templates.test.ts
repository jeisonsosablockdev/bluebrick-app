import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

describe("RFC templates", () => {
  it("records documentation-slice ownership in the epic README template", () => {
    const epicTemplate = readFileSync(
      path.join(repoRoot, "docs", "rfcs", "templates", "EPIC-README.template.md"),
      "utf8"
    );

    expect(epicTemplate).toContain("Documentation owner slice");
  });

  it("records RFC owner slice in the story template", () => {
    const storyTemplate = readFileSync(
      path.join(repoRoot, "docs", "rfcs", "templates", "STORY.template.md"),
      "utf8"
    );

    expect(storyTemplate).toContain("RFC owner slice");
  });
});
