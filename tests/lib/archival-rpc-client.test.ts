import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ArchivalRpcClient,
  DualProviderGapError,
  createArchivalRpcClient
} from "@/lib/archival/archival-rpc-client";

const originalHelius = process.env.HELIUS_API_KEY;
const originalAlchemy = process.env.ALCHEMY_API_KEY;

describe("lib/archival/archival-rpc-client", () => {
  beforeEach(() => {
    process.env.HELIUS_API_KEY = "dummy-helius-key";
    process.env.ALCHEMY_API_KEY = "dummy-alchemy-key";
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (originalHelius === undefined) {
      delete process.env.HELIUS_API_KEY;
    } else {
      process.env.HELIUS_API_KEY = originalHelius;
    }

    if (originalAlchemy === undefined) {
      delete process.env.ALCHEMY_API_KEY;
    } else {
      process.env.ALCHEMY_API_KEY = originalAlchemy;
    }
  });

  it("throws when HELIUS_API_KEY or ALCHEMY_API_KEY is missing", () => {
    delete process.env.HELIUS_API_KEY;
    expect(() => createArchivalRpcClient()).toThrow("HELIUS_API_KEY is required");

    process.env.HELIUS_API_KEY = "key";
    delete process.env.ALCHEMY_API_KEY;
    expect(() => createArchivalRpcClient()).toThrow("ALCHEMY_API_KEY is required");
  });

  it("sorts primary endpoint first (helius-archive)", () => {
    const client = createArchivalRpcClient();
    // @ts-expect-error accessing private endpoints for verification
    const endpoints = client.endpoints;
    expect(endpoints[0].name).toBe("helius-archive");
    expect(endpoints[1].name).toBe("alchemy-archive");
  });

  it("returns minimumLedgerSlot from RPC call", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ jsonrpc: "2.0", id: "1", result: 100000 }))
    );

    const client = createArchivalRpcClient();
    // @ts-expect-error accessing private method for test
    const minSlot = await client.getMinimumLedgerSlot(client.endpoints[0]);
    expect(minSlot).toBe(100000);
  });

  it("validates endpoint slot coverage correctly", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ jsonrpc: "2.0", id: "1", result: 200000 }))
    );

    const client = createArchivalRpcClient();
    // @ts-expect-error accessing private endpoint for test
    const valid = await client.validateEndpoint(client.endpoints[0], 250000);
    expect(valid).toBe(true); // min 200k <= required 250k
  });

  it("throws DualProviderGapError when required slot is older than minLedgerSlot on both providers", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ jsonrpc: "2.0", id: "1", result: 500000 }))
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ jsonrpc: "2.0", id: "2", result: 600000 }))
      );

    const client = createArchivalRpcClient();
    await expect(client.getTransaction("sig123", 100000)).rejects.toThrow(DualProviderGapError);
  });

  it("fetches transaction successfully from primary provider", async () => {
    vi.spyOn(globalThis, "fetch")
      // minimumLedgerSlot response
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ jsonrpc: "2.0", id: "1", result: 50000 }))
      )
      // getTransaction response
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            id: "2",
            result: { slot: 100000, blockTime: 1234567890, meta: { err: null }, transaction: {} },
            context: { slot: 100050 }
          })
        )
      );

    const client = createArchivalRpcClient();
    const result = await client.getTransaction("sig123", 100000);
    expect(result.endpointName).toBe("helius-archive");
    expect(result.contextSlot).toBe(100050);
  });
});
