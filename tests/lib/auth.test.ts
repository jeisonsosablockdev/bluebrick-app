import { createSignableMessage, generateKeyPairSigner } from "@solana/kit";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { getSessionPublicKey, issueNonce } from "@/lib/state/auth-store";
import { getRequestHost, isIssuedAtValid, normalizeHost, verifySiwsPayload } from "@/lib/auth";
import { buildSiwsMessage } from "@/lib/siws";

type TestWalletIdentity = {
  publicKey: string;
  signMessage: (message: string) => Promise<string>;
};

async function createWalletIdentity(): Promise<TestWalletIdentity> {
  const signer = await generateKeyPairSigner();

  return {
    publicKey: signer.address,
    signMessage: async (message: string) => {
      const [signatures] = await signer.signMessages([createSignableMessage(message)]);
      const signatureBytes = signatures[signer.address];

      if (!signatureBytes) {
        throw new Error("Could not sign SIWS message.");
      }

      return Buffer.from(signatureBytes).toString("base64");
    }
  };
}

describe("lib/auth", () => {
  it("extracts request host from x-forwarded-host first", () => {
    const request = new NextRequest("https://api.example.com/path", {
      headers: {
        "x-forwarded-host": "proxy.example.com, api.example.com",
        host: "api.example.com"
      }
    });

    expect(getRequestHost(request)).toBe("proxy.example.com");
  });

  it("normalizes host values", () => {
    expect(normalizeHost("  API.Example.Com ")).toBe("api.example.com");
    expect(normalizeHost("http://localhost:3001")).toBe("localhost");
    expect(normalizeHost("127.0.0.1:3001")).toBe("localhost");
  });

  it("validates issued-at timestamps inside allowed window", () => {
    const nowIso = new Date().toISOString();
    const oldIso = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    expect(isIssuedAtValid(nowIso)).toBe(true);
    expect(isIssuedAtValid(oldIso)).toBe(false);
    expect(isIssuedAtValid("not-a-date")).toBe(false);
  });

  it("verifies a valid SIWS payload and creates a session token", async () => {
    const wallet = await createWalletIdentity();
    const nonce = issueNonce();
    const domain = "admin.example.com";
    const message = buildSiwsMessage({
      domain,
      publicKey: wallet.publicKey,
      nonce,
      issuedAt: new Date().toISOString(),
      statement: "Authorize admin dashboard"
    });
    const signature = await wallet.signMessage(message);

    const result = verifySiwsPayload(
      {
        message,
        signature,
        publicKey: wallet.publicKey
      },
      domain,
      nonce
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(getSessionPublicKey(result.sessionToken)).toBe(wallet.publicKey);
    }
  });

  it("rejects SIWS payload when host does not match domain", async () => {
    const wallet = await createWalletIdentity();
    const nonce = issueNonce();
    const message = buildSiwsMessage({
      domain: "admin.example.com",
      publicKey: wallet.publicKey,
      nonce,
      issuedAt: new Date().toISOString(),
      statement: "Authorize admin dashboard"
    });
    const signature = await wallet.signMessage(message);

    const result = verifySiwsPayload(
      {
        message,
        signature,
        publicKey: wallet.publicKey
      },
      "other.example.com",
      nonce
    );

    expect(result).toMatchObject({
      ok: false,
      status: 403,
      error: "Domain does not match request host."
    });
  });

  it("rejects SIWS payload for invalid nonce", async () => {
    const wallet = await createWalletIdentity();
    const issuedNonce = issueNonce();
    const message = buildSiwsMessage({
      domain: "admin.example.com",
      publicKey: wallet.publicKey,
      nonce: "nonce-not-issued",
      issuedAt: new Date().toISOString(),
      statement: "Authorize admin dashboard"
    });
    const signature = await wallet.signMessage(message);

    const result = verifySiwsPayload(
      {
        message,
        signature,
        publicKey: wallet.publicKey
      },
      "admin.example.com",
      issuedNonce
    );

    expect(result).toMatchObject({
      ok: false,
      status: 409,
      error: "Invalid or expired nonce."
    });
  });
});
