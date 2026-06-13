import { describe, it, expect } from "vitest";
import { COLLECTIBLE_ADAPTER } from "@/lib/reasoning-agent/adapters/collectible-domain-adapter";
import { adaptWithDomain } from "@/lib/reasoning-agent/adapters";

describe("Collectible/NFT Domain Adapter", () => {
  it("has correct name and hints", () => {
    expect(COLLECTIBLE_ADAPTER.name).toBe("nft");
    const hints = COLLECTIBLE_ADAPTER.getAdaptationHints().toLowerCase();
    expect(hints).toContain("mint authority");
    expect(hints).toContain("metadata uri");
    expect(hints).toContain("royalty basis points");
    expect(hints).toContain("collection verification");
    expect(hints).toContain("update authority");
    expect(hints).toContain("freeze authority");
    expect(hints).toContain("asset table");
    expect(hints).toContain("royalty > 10000");
  });

  it("enhances adaptations with Collectible-specific terms", () => {
    const modules = [
      { original: "List facts", adapted: "List facts for NFT task" },
      { original: "Make table", adapted: "Create a table for NFT" },
      { original: "Consider counterexamples", adapted: "Think of edge cases" },
      { original: "Check consistency", adapted: "Verify all constraints" },
    ];

    const enhanced = adaptWithDomain({ adaptedModules: modules }, COLLECTIBLE_ADAPTER);

    expect(enhanced.adaptedModules[0].adapted.toLowerCase()).toContain("mint auth");
    expect(enhanced.adaptedModules[0].adapted.toLowerCase()).toContain("royalty");
    expect(enhanced.adaptedModules[1].adapted.toLowerCase()).toContain("asset table");
    expect(enhanced.adaptedModules[1].adapted.toLowerCase()).toContain("metadata");
    expect(enhanced.adaptedModules[2].adapted.toLowerCase()).toContain("royalty > 10000");
    expect(enhanced.adaptedModules[3].adapted.toLowerCase()).toContain("royalty range");
    expect(enhanced.adaptedModules[3].adapted.toLowerCase()).toContain("collection verified");
  });

  it("hints cover all key Collectible/NFT concepts", () => {
    const hints = COLLECTIBLE_ADAPTER.getAdaptationHints();
    const requiredConcepts = [
      "mint", "metadata", "royalty", "collection", "authority", "freeze",
      "creator", "seller fee", "basis points", "verification", "metaplex"
    ];

    for (const concept of requiredConcepts) {
      expect(hints.toLowerCase()).toContain(concept.toLowerCase());
    }
  });
});