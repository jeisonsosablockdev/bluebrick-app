import { describe, expect, it } from "vitest";

import { generateUuidV7 } from "@/lib/uuid-v7";

function decodeTimestampFromUuidV7(uuid: string): number {
  const compact = uuid.replace(/-/g, "");
  const timestampHex = compact.slice(0, 12);
  return Number.parseInt(timestampHex, 16);
}

describe("lib/uuid-v7", () => {
  it("generates an RFC-compatible UUIDv7 string", () => {
    const uuid = generateUuidV7();

    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it("embeds the provided millisecond timestamp", () => {
    const fixedMs = Date.UTC(2026, 2, 20, 12, 0, 0, 123);
    const uuid = generateUuidV7(fixedMs);

    expect(decodeTimestampFromUuidV7(uuid)).toBe(fixedMs);
  });
});
