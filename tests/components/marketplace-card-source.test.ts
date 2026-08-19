import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

function readFileFromRepo(relativePath: string): string {
  const absolutePath = path.resolve(process.cwd(), relativePath);
  return fs.readFileSync(absolutePath, "utf-8");
}

describe("features/marketplace/presentation/MarketplaceCard source", () => {
  it("sizes listing images so mobile browsers do not fetch desktop-width candidates", () => {
    const source = fs.existsSync(path.resolve(process.cwd(), "apps/web/src/features/marketplace/presentation/MarketplaceCard.tsx"))
      ? readFileFromRepo("apps/web/src/features/marketplace/presentation/MarketplaceCard.tsx")
      : readFileFromRepo("features/marketplace/presentation/MarketplaceCard.tsx");

    expect(source).toContain("sizes=\"(min-width: 1024px) 360px, (min-width: 768px) 50vw, 100vw\"");
    expect(source).toContain("fetchPriority={prioritizeImage ? \"high\" : \"auto\"}");
  });
});
