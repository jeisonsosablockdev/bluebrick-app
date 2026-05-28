import { createElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/motion/path-route-transition", () => ({
  PathRouteTransition: ({ children }: { children: ReactNode }) => createElement("path-route-transition", null, children)
}));

import MarketplaceLayout from "@/app/marketplace/layout";

describe("app/marketplace/layout", () => {
  it("wraps marketplace content in a route transition boundary", () => {
    const child = createElement("div", { "data-testid": "marketplace-shell" }, "Marketplace");
    const element = MarketplaceLayout({ children: child });

    expect(element.type).toBeTypeOf("function");
    expect(element.props.children).toBe(child);
  });
});
