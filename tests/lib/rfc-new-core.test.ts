import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

const {
  createRfcScaffold,
  normalizeEpicId,
  normalizeStoryId,
  slugify
} = require("../../scripts/rfc-new-core.js");

async function createTemplateFiles(rootDir: string) {
  const templateDir = path.join(rootDir, "docs", "rfcs", "templates");
  await mkdir(templateDir, { recursive: true });

  await writeFile(
    path.join(templateDir, "EPIC-README.template.md"),
    [
      "# EPIC-<id>-<slug>",
      "",
      "## Metadata",
      "- Epic ID: `EPIC-<id>`",
      "- Owner: `<owner>`",
      "- Created: `<YYYY-MM-DD>`",
      "",
      "## Story Index",
      "| Story ID | RFC File |",
      "| --- | --- |",
      "| STORY-<id>-01 | `STORY-<id>-01-<slug>.md` |"
    ].join("\n"),
    "utf8"
  );

  await writeFile(
    path.join(templateDir, "STORY.template.md"),
    [
      "# STORY-<id>-<slug>",
      "",
      "## Metadata",
      "- Epic: `EPIC-<id>-<slug>`",
      "- Story ID: `STORY-<id>-<slug>`",
      "- Owner: `<owner>`",
      "- Created: `<YYYY-MM-DD>`"
    ].join("\n"),
    "utf8"
  );
}

describe("scripts/rfc-new-core", () => {
  it("normalizes ids and slug values predictably", () => {
    expect(normalizeEpicId("12")).toBe("012");
    expect(normalizeStoryId("2")).toBe("02");
    expect(slugify("Stake Module Safety")).toBe("stake-module-safety");
  });

  it("creates epic folder and story file from templates", async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), "rfc-new-test-"));
    await createTemplateFiles(rootDir);

    const result = await createRfcScaffold({
      rootDir,
      epicId: "12",
      epicSlug: "staking",
      storyId: "1",
      storySlug: "stake-loading-errors",
      owner: "qa-user",
      force: false
    });

    expect(result.epicFolderName).toBe("EPIC-012-staking");
    expect(result.storyFileName).toBe("STORY-012-01-stake-loading-errors.md");

    const readme = await readFile(result.epicReadmePath, "utf8");
    const story = await readFile(result.storyFilePath, "utf8");

    expect(readme).toContain("EPIC-012-staking");
    expect(readme).toContain("STORY-012-01");
    expect(story).toContain("EPIC-012-staking");
    expect(story).toContain("STORY-012-01-stake-loading-errors");
    expect(story).toContain("qa-user");
  });

  it("fails when epic folder already exists without force", async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), "rfc-new-test-"));
    await createTemplateFiles(rootDir);

    await createRfcScaffold({
      rootDir,
      epicId: "12",
      epicSlug: "staking",
      storyId: "1",
      storySlug: "kickoff",
      owner: "qa-user",
      force: false
    });

    await expect(
      createRfcScaffold({
        rootDir,
        epicId: "12",
        epicSlug: "staking",
        storyId: "2",
        storySlug: "next-step",
        owner: "qa-user",
        force: false
      })
    ).rejects.toThrow("already exists");
  });
});
