import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import MarketplaceLoading from "@/app/marketplace/loading";

describe("app/marketplace/loading", () => {
  it("renders staged marketplace loading copy", () => {
    const html = renderToStaticMarkup(MarketplaceLoading());

    expect(html).toContain("Preparando marketplace");
    expect(html).toContain("Casi listo");
  });
});
