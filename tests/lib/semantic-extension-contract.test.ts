import { describe, expect, it } from "vitest";

import { getSemanticExtensionStatus } from "@/lib/ai";

describe("semantic extension contract", () => {
  it("remains explicitly disabled in EPIC-010", () => {
    const status = getSemanticExtensionStatus();

    expect(status.enabled).toBe(false);
    expect(status.reason).toBe("future_extension_contract");
    expect(status.requires).toEqual(
      expect.arrayContaining(["embedding_provider", "vector_store", "retriever", "indexer"])
    );
  });
});
