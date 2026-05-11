import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

function readFileFromRepo(relativePath: string): string {
  const absolutePath = path.resolve(process.cwd(), relativePath);
  return fs.readFileSync(absolutePath, "utf-8");
}

describe("landing featured properties source contract", () => {
  it("keeps marketplace source as primary and allows fallback home data", () => {
    const sectionSource = readFileFromRepo("components/sections/properties.tsx");

    expect(sectionSource).toContain("getHomeContent(");
    expect(sectionSource).toContain("properties.length > 0 ? properties : fallbackProperties");
  });

  it("wires home page featured cards to marketplace server source", () => {
    const pageSource = readFileFromRepo("app/page.tsx");

    expect(pageSource).toContain("listMarketplaceProperties");
    expect(pageSource).toContain("<PropertiesSection properties={featuredProperties} />");
  });
});
