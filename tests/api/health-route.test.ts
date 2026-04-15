import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GET } from "@/app/api/health/route";
import { resetObservabilityStateForTests } from "@/lib/observability";

function createRequest(url = "https://example.com/api/health?minutes=120"): NextRequest {
  return new NextRequest(url, {
    method: "GET"
  });
}

describe("GET /api/health", () => {
  const previousSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const previousSolanaRpc = process.env.SOLANA_RPC_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://brids.com";
    process.env.SOLANA_RPC_URL = "https://api.devnet.solana.com";
    resetObservabilityStateForTests();
  });

  it("returns healthy status when required envs exist", async () => {
    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.status).toBe("ok");
    expect(payload.data.observability.analyticsWindowMinutes).toBe(120);
  });

  it("returns degraded status when required envs are missing", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;

    const response = await GET(createRequest("https://example.com/api/health"));
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.ok).toBe(false);
    expect(payload.data.status).toBe("degraded");
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = previousSiteUrl;
    process.env.SOLANA_RPC_URL = previousSolanaRpc;
  });
});
