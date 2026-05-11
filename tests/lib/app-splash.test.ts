import { describe, expect, it } from "vitest";

import {
  APP_SPLASH_MARK_DELAY_MS,
  APP_SPLASH_MINIMUM_VISIBLE_MS,
  APP_SPLASH_NAME_INTRO_MS,
  getAppSplashExitDelay,
  shouldWaitForAppLoad
} from "@/lib/app-splash";

describe("app splash contract", () => {
  it("keeps the splash visible for at least one second", () => {
    expect(APP_SPLASH_MINIMUM_VISIBLE_MS).toBeGreaterThanOrEqual(1000);
    expect(getAppSplashExitDelay(350)).toBe(650);
    expect(getAppSplashExitDelay(1200)).toBe(0);
  });

  it("stages the mark after the name intro", () => {
    expect(APP_SPLASH_NAME_INTRO_MS).toBeLessThanOrEqual(400);
    expect(APP_SPLASH_MARK_DELAY_MS).toBeGreaterThanOrEqual(APP_SPLASH_NAME_INTRO_MS);
  });

  it("waits for the app load event only while the document is not complete", () => {
    expect(shouldWaitForAppLoad("loading")).toBe(true);
    expect(shouldWaitForAppLoad("interactive")).toBe(true);
    expect(shouldWaitForAppLoad("complete")).toBe(false);
  });
});
