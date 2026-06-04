import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  getSolanaRpcUrl: vi.fn(),
  getWebhookEventsBySignatures: vi.fn(),
  createKitRpcConnection: vi.fn(),
  getSignatureStatusWithKitRpc: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/lib/mint-orchestrator-store", () => ({
  getWebhookEventsBySignatures: routeMocks.getWebhookEventsBySignatures
}));

vi.mock("@/lib/solana", () => ({
  getSolanaRpcUrl: routeMocks.getSolanaRpcUrl
}));

vi.mock("@/lib/solana-kit/compat/web3-transactions", () => ({
  createKitRpcConnection: routeMocks.createKitRpcConnection,
  getSignatureStatusWithKitRpc: routeMocks.getSignatureStatusWithKitRpc
}));

import { POST } from "@/app/api/admin/core-candy-machine/status/route";
import { parseCoreCandyMachineStatusRequestBody } from "@/lib/admin/core-candy-machine-status-contract";

describe("api/admin/core-candy-machine/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      role: "admin",
      pubkey: "11111111111111111111111111111111"
    });
    routeMocks.getSolanaRpcUrl.mockReturnValue("https://api.devnet.solana.com");
    routeMocks.createKitRpcConnection.mockReturnValue({ rpc: true });
    routeMocks.getSignatureStatusWithKitRpc.mockResolvedValue(null);
  });

  it("rejects unauthenticated or non-admin requests", async () => {
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: false,
      role: "user",
      pubkey: null
    });

    const request = new NextRequest("https://example.com/api/admin/core-candy-machine/status", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ signatures: ["sig-1"] })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error).toBe("Forbidden");
  });

  it("returns 400 when signatures payload is missing or empty", async () => {
    const invalidBodyRequest = new NextRequest("https://example.com/api/admin/core-candy-machine/status", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });

    const invalidBodyResponse = await POST(invalidBodyRequest);
    expect(invalidBodyResponse.status).toBe(400);

    const emptyRequest = new NextRequest("https://example.com/api/admin/core-candy-machine/status", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ signatures: [null, "", 123] })
    });

    const emptyResponse = await POST(emptyRequest);
    const payload = await emptyResponse.json();
    expect(emptyResponse.status).toBe(400);
    expect(payload.error).toBe("At least one signature is required.");
  });

  it("parses status request signatures before route execution", () => {
    expect(parseCoreCandyMachineStatusRequestBody(null)).toEqual({
      ok: false,
      error: "Invalid request body."
    });
    expect(parseCoreCandyMachineStatusRequestBody({ signatures: ["  sig-1  ", "", null] })).toEqual({
      ok: true,
      signatures: ["sig-1"]
    });
    expect(parseCoreCandyMachineStatusRequestBody({ signatures: [null, ""] })).toEqual({
      ok: false,
      error: "At least one signature is required."
    });
  });

  it("does not treat a webhook observation as confirmed without RPC confirmation", async () => {
    routeMocks.getWebhookEventsBySignatures.mockReturnValue({
      "sig-1": {
        provider: "helius",
        eventId: null,
        eventFingerprint: "sig-1",
        signature: "sig-1",
        eventType: "UNKNOWN",
        slot: 123,
        firstSeenAt: "2026-06-03T00:00:00.000Z",
        lastSeenAt: "2026-06-03T00:00:00.000Z",
        deliveryCount: 1
      }
    });

    const request = new NextRequest("https://example.com/api/admin/core-candy-machine/status", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ signatures: ["sig-1"] })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(routeMocks.getWebhookEventsBySignatures).toHaveBeenCalledWith("helius", ["sig-1"]);
    expect(payload.statuses).toEqual({
      "sig-1": {
        confirmed: false,
        failed: false,
        confirmationStatus: null,
        observedByWebhook: true,
        source: "webhook"
      }
    });
  });

  it("falls back to Kit RPC when webhook status is missing", async () => {
    routeMocks.getWebhookEventsBySignatures.mockReturnValue({
      "sig-1": null
    });
    routeMocks.getSignatureStatusWithKitRpc.mockResolvedValue({
      confirmationStatus: "confirmed",
      err: null,
      slot: 123n
    });

    const request = new NextRequest("https://example.com/api/admin/core-candy-machine/status", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ signatures: ["sig-1"] })
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(routeMocks.createKitRpcConnection).toHaveBeenCalledWith("https://api.devnet.solana.com");
    expect(routeMocks.getSignatureStatusWithKitRpc).toHaveBeenCalledWith(
      { rpc: true },
      "sig-1",
      { searchTransactionHistory: true }
    );
    expect(payload.statuses).toEqual({
      "sig-1": {
        confirmed: true,
        failed: false,
        confirmationStatus: "confirmed",
        observedByWebhook: false,
        source: "rpc"
      }
    });
  });
});
