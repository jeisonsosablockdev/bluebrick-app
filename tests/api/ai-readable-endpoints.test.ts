import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const aiMocks = vi.hoisted(() => ({
  buildKnowledgeContract: vi.fn(),
  buildEntitiesContract: vi.fn(),
  buildDefinitionsContract: vi.fn(),
  buildLlmsTxt: vi.fn(),
  buildAiTxt: vi.fn()
}));

vi.mock("@/lib/ai", () => ({
  buildKnowledgeContract: aiMocks.buildKnowledgeContract,
  buildEntitiesContract: aiMocks.buildEntitiesContract,
  buildDefinitionsContract: aiMocks.buildDefinitionsContract,
  buildLlmsTxt: aiMocks.buildLlmsTxt,
  buildAiTxt: aiMocks.buildAiTxt
}));

import { GET as getAiTxt } from "@/app/ai.txt/route";
import { GET as getDefinitionsApi } from "@/app/api/definitions/route";
import { GET as getEntitiesApi } from "@/app/api/entities/route";
import { GET as getKnowledgeApi } from "@/app/api/knowledge/route";
import { GET as getKnowledgeJson } from "@/app/knowledge.json/route";
import { GET as getLlmsTxt } from "@/app/llms.txt/route";

describe("AI-readable endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    aiMocks.buildKnowledgeContract.mockResolvedValue({
      schemaVersion: "1.0.0",
      generatedAt: "2026-04-13T00:00:00.000Z",
      items: []
    });
    aiMocks.buildEntitiesContract.mockResolvedValue({
      schemaVersion: "1.0.0",
      generatedAt: "2026-04-13T00:00:00.000Z",
      items: []
    });
    aiMocks.buildDefinitionsContract.mockResolvedValue({
      schemaVersion: "1.0.0",
      generatedAt: "2026-04-13T00:00:00.000Z",
      items: []
    });
    aiMocks.buildLlmsTxt.mockReturnValue("# BRIDS\n/knowledge.json");
    aiMocks.buildAiTxt.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns knowledge contract from /api/knowledge", async () => {
    const response = await getKnowledgeApi();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.schemaVersion).toBe("1.0.0");
    expect(response.headers.get("cache-control")).toContain("s-maxage=300");
  });

  it("returns entities contract from /api/entities", async () => {
    const response = await getEntitiesApi();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.schemaVersion).toBe("1.0.0");
  });

  it("returns definitions contract from /api/definitions", async () => {
    const response = await getDefinitionsApi();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.schemaVersion).toBe("1.0.0");
  });

  it("returns knowledge contract from /knowledge.json", async () => {
    const response = await getKnowledgeJson();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.schemaVersion).toBe("1.0.0");
  });

  it("returns llms.txt plain text", async () => {
    const response = await getLlmsTxt();
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/plain");
    expect(body).toContain("BRIDS");
  });

  it("returns 404 for ai.txt when feature flag is disabled", async () => {
    aiMocks.buildAiTxt.mockReturnValueOnce(null);

    const response = await getAiTxt();
    const body = await response.text();

    expect(response.status).toBe(404);
    expect(body).toContain("Not Found");
  });

  it("returns ai.txt content when feature flag is enabled", async () => {
    aiMocks.buildAiTxt.mockReturnValueOnce("BRIDS AI Interface");

    const response = await getAiTxt();
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/plain");
    expect(body).toContain("BRIDS AI Interface");
  });
});
