import { describe, it, expect } from "vitest";
import { SOLANA_ADAPTER } from "@/lib/reasoning-agent/adapters/solana-adapter";
import { adaptWithDomain } from "@/lib/reasoning-agent/adapters";

describe("Solana Domain Adapter", () => {
  it("has correct name and hints", () => {
    expect(SOLANA_ADAPTER.name).toBe("solana");
    const hints = SOLANA_ADAPTER.getAdaptationHints().toLowerCase();
    expect(hints).toContain("pda seeds");
    expect(hints).toContain("rent-exempt lamports");
    expect(hints).toContain("signer requirements");
    expect(hints).toContain("authority constraints");
    expect(hints).toContain("cpi");
    expect(hints).toContain("account table");
    expect(hints).toContain("pda collides");
  });

  it("enhances adaptations with Solana-specific terms", () => {
    const modules = [
      { original: "List facts", adapted: "List constraints for the task" },
      { original: "Make table", adapted: "Create a table for the task" },
      { original: "Consider counterexamples", adapted: "Think of edge cases" },
      { original: "Check consistency", adapted: "Verify all constraints" },
      { original: "Devise algorithm", adapted: "Create a procedure" },
    ];

    const enhanced = adaptWithDomain({ adaptedModules: modules }, SOLANA_ADAPTER);

    expect(enhanced.adaptedModules[0].adapted).toContain("PDA seeds");
    expect(enhanced.adaptedModules[0].adapted).toContain("rent");
    expect(enhanced.adaptedModules[1].adapted).toContain("account table");
    expect(enhanced.adaptedModules[1].adapted).toContain("seeds");
    expect(enhanced.adaptedModules[2].adapted).toContain("PDA collision");
    expect(enhanced.adaptedModules[3].adapted).toContain("rent-exempt");
    expect(enhanced.adaptedModules[3].adapted).toContain("signer match");
  });

  it("preserves original module references", () => {
    const modules = [
      { original: "List facts", adapted: "List PDA seeds, rent, signers" },
    ];

    const enhanced = adaptWithDomain({ adaptedModules: modules }, SOLANA_ADAPTER);

    expect(enhanced.adaptedModules[0].original).toBe("List facts");
    expect(enhanced.adaptedModules[0].adapted).toContain("PDA seeds");
  });

  it("hints cover all key Solana concepts", () => {
    const hints = SOLANA_ADAPTER.getAdaptationHints().toLowerCase();
    const requiredConcepts = [
      "pda", "seeds", "rent", "lamports", "signer", "authority",
      "cpi", "program", "account", "instruction", "devnet"
    ];

    for (const concept of requiredConcepts) {
      expect(hints).toContain(concept);
    }
  });
});