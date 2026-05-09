import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchAuthMe, fetchNonce, verifySiwsMessage } from "@/lib/auth-client";

describe("lib/auth-client", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("throws a controlled error when auth session returns an empty body", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response("", {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    ) as typeof fetch;

    await expect(fetchAuthMe()).rejects.toThrow("Could not check current session.");
  });

  it("throws a controlled error when nonce returns malformed json", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response("{", {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    ) as typeof fetch;

    await expect(fetchNonce()).rejects.toThrow("Could not fetch nonce.");
  });

  it("surfaces verify endpoint errors when the payload is valid json", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "Signature rejected." }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      })
    ) as typeof fetch;

    await expect(
      verifySiwsMessage({
        message: "message",
        signature: "signature",
        publicKey: "wallet"
      })
    ).rejects.toThrow("Signature rejected.");
  });

  it("throws a controlled error when verify returns an empty body", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response("", {
        status: 500,
        headers: { "Content-Type": "application/json" }
      })
    ) as typeof fetch;

    await expect(
      verifySiwsMessage({
        message: "message",
        signature: "signature",
        publicKey: "wallet"
      })
    ).rejects.toThrow("Authentication failed.");
  });
});
