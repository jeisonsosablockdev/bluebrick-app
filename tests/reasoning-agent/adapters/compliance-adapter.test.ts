import { describe, it, expect } from "vitest";
import { COMPLIANCE_ADAPTER } from "@/lib/reasoning-agent/adapters/compliance-adapter";
import { adaptWithDomain } from "@/lib/reasoning-agent/adapters";

describe("Compliance Domain Adapter", () => {
  it("has correct name and hints", () => {
    expect(COMPLIANCE_ADAPTER.name).toBe("compliance");
    const hints = COMPLIANCE_ADAPTER.getAdaptationHints();
    expect(hints).toContain("KYC status");
    expect(hints).toContain("AML flags");
    expect(hints).toContain("financial guardrails");
    expect(hints).toContain("audit requirements");
    expect(hints).toContain("wallet risk score");
    expect(hints).toContain("compliance queue");
    expect(hints).toContain("KYC expired");
    expect(hints).toContain("AML flagged post-approval");
  });

  it("enhances adaptations with compliance-specific terms", () => {
    const modules = [
      { original: "List facts", adapted: "List generic facts" },
      { original: "Make table", adapted: "Create a table" },
      { original: "Consider counterexamples", adapted: "Think of edge cases" },
      { original: "Check consistency", adapted: "Verify all constraints" },
    ];

    const enhanced = adaptWithDomain({ adaptedModules: modules }, COMPLIANCE_ADAPTER);

    expect(enhanced.adaptedModules[0].adapted.toLowerCase()).toContain("kyc status");
    expect(enhanced.adaptedModules[0].adapted.toLowerCase()).toContain("aml flags");
    expect(enhanced.adaptedModules[1].adapted.toLowerCase()).toContain("queue");
    expect(enhanced.adaptedModules[1].adapted.toLowerCase()).toContain("wallet");
    expect(enhanced.adaptedModules[2].adapted.toLowerCase()).toContain("expired");
    expect(enhanced.adaptedModules[2].adapted.toLowerCase()).toContain("post-approval");
    expect(enhanced.adaptedModules[3].adapted.toLowerCase()).toContain("kyc");
    expect(enhanced.adaptedModules[3].adapted.toLowerCase()).toContain("suspended");
  });

  it("hints cover all key compliance concepts", () => {
    const hints = COMPLIANCE_ADAPTER.getAdaptationHints();
    const requiredConcepts = [
      "kyc", "aml", "guardrail", "audit", "sanction",
      "risk score", "jurisdiction", "suspended", "queue", "decision"
    ];

    for (const concept of requiredConcepts) {
      expect(hints.toLowerCase()).toContain(concept.toLowerCase());
    }
  });
});