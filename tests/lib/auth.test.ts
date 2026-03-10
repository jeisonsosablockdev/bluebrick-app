import { Keypair } from "@solana/web3.js";
import { NextRequest } from "next/server";
import nacl from "tweetnacl";
import { describe, expect, it } from "vitest";

import { getSessionPublicKey, issueNonce } from "@/lib/auth-store";
import { getRequestHost, isIssuedAtValid, normalizeHost, verifySiwsPayload } from "@/lib/auth";
import { buildSiwsMessage } from "@/lib/siws";

function signMessage(message: string, secretKey: Uint8Array): string {
  const messageBytes = new TextEncoder().encode(message);
  const signature = nacl.sign.detached(messageBytes, secretKey);
  return Buffer.from(signature).toString("base64");
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
  });

  it("validates issued-at timestamps inside allowed window", () => {
    const nowIso = new Date().toISOString();
    const oldIso = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    expect(isIssuedAtValid(nowIso)).toBe(true);
    expect(isIssuedAtValid(oldIso)).toBe(false);
    expect(isIssuedAtValid("not-a-date")).toBe(false);
  });

  it("verifies a valid SIWS payload and creates a session token", () => {
    const keypair = Keypair.generate();
    const nonce = issueNonce();
    const domain = "admin.example.com";
    const publicKey = keypair.publicKey.toBase58();
    const message = buildSiwsMessage({
      domain,
      publicKey,
      nonce,
      issuedAt: new Date().toISOString(),
      statement: "Authorize admin dashboard"
    });
    const signature = signMessage(message, keypair.secretKey);

    const result = verifySiwsPayload(
      {
        message,
        signature,
        publicKey
      },
      domain
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(getSessionPublicKey(result.sessionToken)).toBe(publicKey);
    }
  });

  it("rejects SIWS payload when host does not match domain", () => {
    const keypair = Keypair.generate();
    const nonce = issueNonce();
    const publicKey = keypair.publicKey.toBase58();
    const message = buildSiwsMessage({
      domain: "admin.example.com",
      publicKey,
      nonce,
      issuedAt: new Date().toISOString(),
      statement: "Authorize admin dashboard"
    });
    const signature = signMessage(message, keypair.secretKey);

    const result = verifySiwsPayload(
      {
        message,
        signature,
        publicKey
      },
      "other.example.com"
    );

    expect(result).toMatchObject({
      ok: false,
      status: 403,
      error: "Domain does not match request host."
    });
  });

  it("rejects SIWS payload for invalid nonce", () => {
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey.toBase58();
    const message = buildSiwsMessage({
      domain: "admin.example.com",
      publicKey,
      nonce: "nonce-not-issued",
      issuedAt: new Date().toISOString(),
      statement: "Authorize admin dashboard"
    });
    const signature = signMessage(message, keypair.secretKey);

    const result = verifySiwsPayload(
      {
        message,
        signature,
        publicKey
      },
      "admin.example.com"
    );

    expect(result).toMatchObject({
      ok: false,
      status: 409,
      error: "Invalid or expired nonce."
    });
  });
});
