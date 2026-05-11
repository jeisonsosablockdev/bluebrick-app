import { describe, expect, it } from "vitest";

import {
  assertNoCanonicalRouteCollisions,
  buildCanonicalRoutes,
  buildKnowledgeBreadcrumbs,
  getCanonicalPathForDocument
} from "@/lib/content/routes";

describe("lib/content/routes", () => {
  it("maps each document type to its canonical namespace", () => {
    expect(getCanonicalPathForDocument({ type: "institutional-page", slug: "about" })).toBe("/about");
    expect(getCanonicalPathForDocument({ type: "article", slug: "tokenization-101" })).toBe(
      "/knowledge/articles/tokenization-101"
    );
    expect(getCanonicalPathForDocument({ type: "knowledge-base", slug: "glossary" })).toBe(
      "/knowledge/glossary"
    );
    expect(getCanonicalPathForDocument({ type: "faq", slug: "fees" })).toBe(
      "/knowledge/faq/fees"
    );
    expect(getCanonicalPathForDocument({ type: "glossary-term", slug: "yield" })).toBe(
      "/knowledge/definitions/yield"
    );
    expect(getCanonicalPathForDocument({ type: "changelog", slug: "v1-2-0" })).toBe(
      "/resources/v1-2-0"
    );
  });

  it("builds canonical route entries in batch", () => {
    expect(
      buildCanonicalRoutes([
        { type: "article", slug: "a" },
        { type: "glossary-term", slug: "term" }
      ])
    ).toEqual([
      { type: "article", slug: "a", path: "/knowledge/articles/a" },
      { type: "glossary-term", slug: "term", path: "/knowledge/definitions/term" }
    ]);
  });

  it("rejects canonical path collisions", () => {
    expect(() =>
      assertNoCanonicalRouteCollisions([
        { type: "institutional-page", slug: "about" },
        { type: "institutional-page", slug: "about" }
      ])
    ).toThrow('Canonical route collision: "/about"');
  });

  it("builds knowledge breadcrumbs with stable hierarchy", () => {
    expect(buildKnowledgeBreadcrumbs({ label: "Tokenization", href: "/knowledge/articles/tokenization" })).toEqual([
      { label: "Home", href: "/" },
      { label: "Knowledge", href: "/knowledge" },
      { label: "Tokenization", href: "/knowledge/articles/tokenization" }
    ]);
  });
});
