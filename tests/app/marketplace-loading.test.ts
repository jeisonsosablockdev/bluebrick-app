import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const loadingMocks = vi.hoisted(() => ({
  prefersReducedMotionMock: vi.fn(() => false)
}));

vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, ...props }: { children?: ReactNode; [key: string]: unknown }) =>
      createElement("div", props, children)
  },
  useReducedMotion: loadingMocks.prefersReducedMotionMock
}));

import MarketplaceLoading from "@/app/marketplace/loading";

describe("app/marketplace/loading", () => {
  it("renders staged marketplace loading copy", () => {
    const html = renderToStaticMarkup(MarketplaceLoading());

    expect(html).toContain("Preparando marketplace");
    expect(html).toContain("Casi listo");
  });

  it("removes animation classes when reduced motion is preferred", () => {
    loadingMocks.prefersReducedMotionMock.mockReturnValue(true);

    const html = renderToStaticMarkup(MarketplaceLoading());

    expect(html).not.toContain("animate-pulse");
    expect(html).toContain("Preparando marketplace");
    expect(html).toContain("Casi listo");
  });
});
