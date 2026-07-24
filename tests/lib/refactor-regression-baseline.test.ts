import { describe, expect, it } from "vitest";

import {
  consumeNonce,
  createSession,
  getSessionPublicKey,
  hasUsableNonce,
  issueNonce,
  revokeSession
} from "@/lib/state/auth-store";
import { getAllowedDevOrigins } from "@/lib/dev-origins";
import { formatUsdByLocale, ONBOARDING_REWARD_STATUS_LABELS } from "@/lib/onboarding-reward-copy";
import { readBoundedIntegerEnv } from "@/lib/runtime-config";
import { generateUuidV7 } from "@/lib/uuid-v7";

describe("refactor regression baseline (SPEC-01)", () => {
  it("freezes auth store nonce and session behavior", () => {
    const nonce = issueNonce();
    expect(hasUsableNonce(nonce)).toBe(true);
    expect(consumeNonce(nonce)).toBe(true);
    expect(hasUsableNonce(nonce)).toBe(false);

    const pubkey = "test-pubkey-spec01";
    const sessionToken = createSession(pubkey);
    expect(getSessionPublicKey(sessionToken)).toBe(pubkey);
    revokeSession(sessionToken);
    expect(getSessionPublicKey(sessionToken)).toBeNull();
  });

  it("freezes runtime config contract", () => {
    const value = readBoundedIntegerEnv({
      env: { MAX_CONCURRENCY: "5" },
      name: "MAX_CONCURRENCY",
      fallback: 1,
      min: 1,
      max: 10
    });
    expect(value).toBe(5);
  });

  it("freezes dev origins contract", () => {
    const origins = getAllowedDevOrigins();
    expect(origins).toContain("localhost");
    expect(origins).toContain("127.0.0.1");
  });

  it("freezes UUID v7 generator contract", () => {
    const uuid = generateUuidV7();
    expect(typeof uuid).toBe("string");
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it("freezes onboarding reward copy and currency formatting contract", () => {
    const formatted = formatUsdByLocale(1250, "en");
    expect(formatted).toContain("1,250");
    expect(ONBOARDING_REWARD_STATUS_LABELS.earned.es).toBe("Ganado");
  });
});
