import { describe, it, expect, vi, beforeEach } from "vitest";
import { adaptStage } from "@/lib/reasoning-agent/stages/adapt";
import { SOLANA_ADAPTER } from "@/lib/reasoning-agent/adapters/solana-adapter";
import { COLLECTIBLE_ADAPTER } from "@/lib/reasoning-agent/adapters/collectible-domain-adapter";
import { COMPLIANCE_ADAPTER } from "@/lib/reasoning-agent/adapters/compliance-adapter";

const mockLLM = {
  invokeStructured: vi.fn(),
};

describe("ADAPT Stage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adapts modules for Solana PDA design", async () => {
    mockLLM.invokeStructured.mockResolvedValue({
      adaptedModules: [
        {
          original: "List the relevant facts, constraints, and unknowns",
          adapted: "List PDA seeds, rent-exempt lamports, signer requirements, authority constraints, program IDs",
        },
        {
          original: "Make a table, list, or diagram to organize the information",
          adapted: "Create account table: seeds, owner program, space, initializer, rent-exempt amount",
        },
      ],
    });

    const result = await adaptStage(mockLLM, {
      task: "Design PDA hierarchy for escrow",
      selectedModules: [
        "List the relevant facts, constraints, and unknowns",
        "Make a table, list, or diagram to organize the information",
      ],
      domainContext: "solana",
    });

    expect(result.adaptedModules).toHaveLength(2);
    expect(result.adaptedModules[0].adapted).toContain("PDA seeds");
    expect(result.adaptedModules[0].adapted).toContain("rent-exempt");
    expect(result.adaptedModules[1].adapted).toContain("account table");
    expect(result.adaptedModules[1].adapted).toContain("seeds");
  });

  it("enhances adaptations with Solana adapter", async () => {
    mockLLM.invokeStructured.mockResolvedValue({
      adaptedModules: [
        {
          original: "List the relevant facts, constraints, and unknowns",
          adapted: "List constraints for the task",
        },
        {
          original: "Consider counterexamples that would falsify a candidate answer",
          adapted: "Think of edge cases",
        },
      ],
    });

    const result = await adaptStage(mockLLM, {
      task: "Design PDA hierarchy",
      selectedModules: [
        "List the relevant facts, constraints, and unknowns",
        "Consider counterexamples that would falsify a candidate answer",
      ],
      domainContext: "solana",
    }, SOLANA_ADAPTER);

    expect(result.adaptedModules[0].adapted).toContain("PDA seeds");
    expect(result.adaptedModules[0].adapted).toContain("rent");
    expect(result.adaptedModules[1].adapted).toContain("PDA collision");
  });

  it("adapts modules for NFT minting flow", async () => {
    mockLLM.invokeStructured.mockResolvedValue({
      adaptedModules: [
        {
          original: "List the relevant facts, constraints, and unknowns",
          adapted: "List mint authority, metadata URI, royalty bps, collection verification, update authority",
        },
        {
          original: "Check consistency — does the candidate answer satisfy EVERY constraint?",
          adapted: "Verify: mint auth matches, royalty in range [0,10000], collection verified, metadata accessible",
        },
      ],
    });

    const result = await adaptStage(mockLLM, {
      task: "Design NFT minting with royalty",
      selectedModules: [
        "List the relevant facts, constraints, and unknowns",
        "Check consistency — does the candidate answer satisfy EVERY constraint?",
      ],
      domainContext: "nft",
    });

    expect(result.adaptedModules[0].adapted).toContain("mint authority");
    expect(result.adaptedModules[0].adapted).toContain("royalty bps");
    expect(result.adaptedModules[1].adapted).toContain("royalty in range");
    expect(result.adaptedModules[1].adapted).toContain("collection verified");
  });

  it("enhances adaptations with NFT adapter", async () => {
    mockLLM.invokeStructured.mockResolvedValue({
      adaptedModules: [
        {
          original: "List the relevant facts, constraints, and unknowns",
          adapted: "List facts for NFT task",
        },
        {
          original: "Make a table, list, or diagram to organize the information",
          adapted: "Create a table for NFT",
        },
      ],
    });

    const result = await adaptStage(mockLLM, {
      task: "Design NFT collection",
      selectedModules: [
        "List the relevant facts, constraints, and unknowns",
        "Make a table, list, or diagram to organize the information",
      ],
      domainContext: "nft",
    }, COLLECTIBLE_ADAPTER);

    expect(result.adaptedModules[0].adapted.toLowerCase()).toContain("mint auth");
    expect(result.adaptedModules[1].adapted.toLowerCase()).toContain("asset table");
  });

  it("adapts modules for compliance/KYC flow", async () => {
    mockLLM.invokeStructured.mockResolvedValue({
      adaptedModules: [
        {
          original: "Step-by-step reasoning from premises to conclusion",
          adapted: "Fetch profile → Check KYC → Check AML → Evaluate guardrails → Decide → Log audit",
        },
        {
          original: "Consider counterexamples that would falsify a candidate answer",
          adapted: "What if KYC expired? What if AML flagged post-approval? What if jurisdiction changed?",
        },
      ],
    });

    const result = await adaptStage(mockLLM, {
      task: "Design compliance decision flow",
      selectedModules: [
        "Step-by-step reasoning from premises to conclusion",
        "Consider counterexamples that would falsify a candidate answer",
      ],
      domainContext: "compliance",
    });

    expect(result.adaptedModules[0].adapted).toContain("KYC");
    expect(result.adaptedModules[0].adapted).toContain("AML");
    expect(result.adaptedModules[1].adapted).toContain("KYC expired");
    expect(result.adaptedModules[1].adapted).toContain("AML flagged");
  });

  it("enhances adaptations with Compliance adapter", async () => {
    mockLLM.invokeStructured.mockResolvedValue({
      adaptedModules: [
        {
          original: "List the relevant facts, constraints, and unknowns",
          adapted: "List generic facts",
        },
      ],
    });

    const result = await adaptStage(mockLLM, {
      task: "Design KYC flow",
      selectedModules: ["List the relevant facts, constraints, and unknowns"],
      domainContext: "compliance",
    }, COMPLIANCE_ADAPTER);

    expect(result.adaptedModules[0].adapted.toLowerCase()).toContain("kyc status");
    expect(result.adaptedModules[0].adapted.toLowerCase()).toContain("aml flags");
  });

  it("works without domain adapter (general reasoning)", async () => {
    mockLLM.invokeStructured.mockResolvedValue({
      adaptedModules: [
        {
          original: "Break the problem into sub-problems and solve each",
          adapted: "Break the architecture design into: components, interfaces, data flows, error handling",
        },
      ],
    });

    const result = await adaptStage(mockLLM, {
      task: "Design microservices architecture",
      selectedModules: ["Break the problem into sub-problems and solve each"],
    });

    expect(result.adaptedModules[0].adapted).toContain("components");
    expect(result.adaptedModules[0].adapted).toContain("data flows");
  });
});