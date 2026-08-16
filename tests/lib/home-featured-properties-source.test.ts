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

describe("landing featured properties source contract", () => {
  it("keeps marketplace source as primary and allows fallback home data", () => {
    const sectionSource = readFileFromRepo("features/landing/presentation/properties.tsx");

    expect(sectionSource).toContain("getHomeContent(");
    expect(sectionSource).toContain("properties.length > 0 ? properties : fallbackProperties");
  });

  it("wires home page featured cards to marketplace server source", () => {
    const pageSource = readFileFromRepo("apps/web/src/app/page.tsx");

    expect(pageSource).toContain("listMarketplaceProperties");
    expect(
      pageSource.includes("<FeaturedPropertiesSection properties={featuredProperties} />") ||
      pageSource.includes("<PropertiesSection properties={featuredProperties} />")
    ).toBe(true);
  });

  it("keeps home imagery sized for mobile Core Web Vitals", () => {
    const heroSource = readFileFromRepo("features/landing/presentation/hero.tsx");
    const sectionSource = readFileFromRepo("features/landing/presentation/properties.tsx");

    expect(heroSource).toContain("priority");
    expect(heroSource).toContain("sizes=\"100vw\"");
    expect(sectionSource).toContain("sizes=\"(min-width: 1024px) 360px, (min-width: 768px) 33vw, 100vw\"");
  });
});
