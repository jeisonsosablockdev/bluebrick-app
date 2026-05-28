import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import MarketplaceDetailLoading from "@/app/marketplace/[id]/loading";

describe("app/marketplace/[id]/loading", () => {
  it("renders staged property loading copy", () => {
    const html = renderToStaticMarkup(MarketplaceDetailLoading());

    expect(html).toContain("Abriendo propiedad");
    expect(html).toContain("Ya casi");
  });
});
