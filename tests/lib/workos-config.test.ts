import { afterEach, describe, expect, it } from "vitest";

import { getWorkosCallbackPath, getWorkosConfig, isWorkosConfigured } from "@/lib/workos/config";

const ORIGINAL_ENV = {
  WORKOS_API_KEY: process.env.WORKOS_API_KEY,
  WORKOS_CLIENT_ID: process.env.WORKOS_CLIENT_ID,
  WORKOS_COOKIE_PASSWORD: process.env.WORKOS_COOKIE_PASSWORD,
  NEXT_PUBLIC_WORKOS_REDIRECT_URI: process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI
};

function restoreEnv() {
  process.env.WORKOS_API_KEY = ORIGINAL_ENV.WORKOS_API_KEY;
  process.env.WORKOS_CLIENT_ID = ORIGINAL_ENV.WORKOS_CLIENT_ID;
  process.env.WORKOS_COOKIE_PASSWORD = ORIGINAL_ENV.WORKOS_COOKIE_PASSWORD;
  process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI = ORIGINAL_ENV.NEXT_PUBLIC_WORKOS_REDIRECT_URI;
}

describe("lib/workos/config", () => {
  afterEach(() => {
    restoreEnv();
  });

  it("reports false when required WorkOS env is incomplete", () => {
    delete process.env.WORKOS_API_KEY;
    process.env.WORKOS_CLIENT_ID = "client_123";
    process.env.WORKOS_COOKIE_PASSWORD = "x".repeat(32);
    process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI = "http://localhost:3000/callback";

    expect(isWorkosConfigured()).toBe(false);
  });

  it("returns parsed config when required env is valid", () => {
    process.env.WORKOS_API_KEY = "sk_test_123";
    process.env.WORKOS_CLIENT_ID = "client_123";
    process.env.WORKOS_COOKIE_PASSWORD = "x".repeat(32);
    process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI = "http://localhost:3000/callback";

    expect(getWorkosConfig()).toEqual({
      apiKey: "sk_test_123",
      clientId: "client_123",
      cookiePassword: "x".repeat(32),
      redirectUri: "http://localhost:3000/callback"
    });
  });

  it("rejects an unsafe cookie password", () => {
    process.env.WORKOS_API_KEY = "sk_test_123";
    process.env.WORKOS_CLIENT_ID = "client_123";
    process.env.WORKOS_COOKIE_PASSWORD = "short";
    process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI = "http://localhost:3000/callback";

    expect(isWorkosConfigured()).toBe(false);
    expect(() => getWorkosConfig()).toThrow("WORKOS_COOKIE_PASSWORD must be at least 32 characters long.");
  });

  it("rejects a non-http redirect URI", () => {
    process.env.WORKOS_API_KEY = "sk_test_123";
    process.env.WORKOS_CLIENT_ID = "client_123";
    process.env.WORKOS_COOKIE_PASSWORD = "x".repeat(32);
    process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI = "javascript:alert(1)";

    expect(isWorkosConfigured()).toBe(false);
    expect(() => getWorkosConfig()).toThrow("NEXT_PUBLIC_WORKOS_REDIRECT_URI must use http or https.");
  });

  it("derives the callback path from the configured redirect URI", () => {
    process.env.WORKOS_API_KEY = "sk_test_123";
    process.env.WORKOS_CLIENT_ID = "client_123";
    process.env.WORKOS_COOKIE_PASSWORD = "x".repeat(32);
    process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI = "https://brids.io/callback";

    expect(getWorkosCallbackPath()).toBe("/callback");
  });
});
