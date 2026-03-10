import { describe, expect, it } from "vitest";

import { buildSiwsMessage, parseSiwsMessage, type SiwsPayload } from "@/lib/siws";

const basePayload: SiwsPayload = {
  domain: "app.example.com",
  publicKey: "11111111111111111111111111111111",
  nonce: "nonce-123",
  issuedAt: "2026-03-10T12:00:00.000Z",
  statement: "Authorize wallet session"
};

describe("lib/siws", () => {
  it("builds and parses an SIWS message", () => {
    const message = buildSiwsMessage(basePayload);

    expect(parseSiwsMessage(message)).toEqual(basePayload);
  });

  it("rejects messages with invalid header", () => {
    const invalidMessage = `Wrong Header\nDomain: ${basePayload.domain}\nAddress: ${basePayload.publicKey}\nStatement: ${basePayload.statement}\nNonce: ${basePayload.nonce}\nIssued At: ${basePayload.issuedAt}`;

    expect(parseSiwsMessage(invalidMessage)).toBeNull();
  });

  it("rejects messages with missing lines", () => {
    const tooShortMessage = "Sign-In With Solana\nDomain: app.example.com";

    expect(parseSiwsMessage(tooShortMessage)).toBeNull();
  });

  it("rejects empty labeled fields", () => {
    const invalidMessage = [
      "Sign-In With Solana",
      `Domain: ${basePayload.domain}`,
      `Address: ${basePayload.publicKey}`,
      `Statement: ${basePayload.statement}`,
      "Nonce: ",
      `Issued At: ${basePayload.issuedAt}`
    ].join("\n");

    expect(parseSiwsMessage(invalidMessage)).toBeNull();
  });
});
