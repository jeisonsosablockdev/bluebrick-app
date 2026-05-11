import { describe, expect, it, vi } from "vitest";

import {
  AUTH_SYNC_STORAGE_KEY,
  createAuthSyncPayload,
  emitAuthSyncPayload,
  parseAuthSyncPayloadFromUnknown,
  parseAuthSyncPayload,
  serializeAuthSyncPayload
} from "@/lib/auth-sync";

describe("lib/auth-sync", () => {
  it("creates normalized payloads", () => {
    const payload = createAuthSyncPayload("login", "   ");

    expect(payload.event).toBe("login");
    expect(payload.pubkey).toBeNull();
    expect(payload.ts).toBeGreaterThan(0);
  });

  it("serializes and parses a payload", () => {
    const raw = serializeAuthSyncPayload({
      event: "logout",
      ts: Date.now(),
      pubkey: "abc123"
    });

    expect(parseAuthSyncPayload(raw)).toMatchObject({
      event: "logout",
      pubkey: "abc123"
    });
  });

  it("rejects malformed payloads", () => {
    expect(parseAuthSyncPayload("")).toBeNull();
    expect(parseAuthSyncPayload("not-json")).toBeNull();
    expect(parseAuthSyncPayload(JSON.stringify({ event: "unknown", ts: Date.now() }))).toBeNull();
    expect(parseAuthSyncPayload(JSON.stringify({ event: "login", ts: "nope" }))).toBeNull();
  });

  it("parses payloads from unknown channel data", () => {
    const validPayload = parseAuthSyncPayloadFromUnknown({
      event: "login",
      ts: Date.now(),
      pubkey: "wallet-1"
    });
    const invalidPayload = parseAuthSyncPayloadFromUnknown({
      event: "login",
      ts: "nope"
    });

    expect(validPayload).toMatchObject({
      event: "login",
      pubkey: "wallet-1"
    });
    expect(invalidPayload).toBeNull();
  });

  it("emits payloads to storage key", () => {
    const setItem = vi.fn();
    emitAuthSyncPayload(
      {
        event: "login",
        ts: Date.now(),
        pubkey: "wallet-1"
      },
      { setItem }
    );

    expect(setItem).toHaveBeenCalledTimes(1);
    expect(setItem.mock.calls[0][0]).toBe(AUTH_SYNC_STORAGE_KEY);
    expect(typeof setItem.mock.calls[0][1]).toBe("string");
  });
});
