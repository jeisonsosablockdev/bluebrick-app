import { describe, expect, it } from "vitest";
import {
  APP_SPLASH_MINIMUM_VISIBLE_MS,
  getAppSplashExitDelay,
  shouldWaitForAppLoad
} from "../../apps/web/src/features/splash-screen/domain/splash-state-rules";
import * as SplashScreenExports from "../../apps/web/src/features/splash-screen";

describe("splash-screen feature slice (SPEC-26)", () => {
  it("calculates correct exit delay based on minimum visible threshold", () => {
    expect(getAppSplashExitDelay(1000)).toBe(APP_SPLASH_MINIMUM_VISIBLE_MS - 1000);
    expect(getAppSplashExitDelay(4000)).toBe(0);
    expect(getAppSplashExitDelay(3000)).toBe(0);
  });

  it("evaluates shouldWaitForAppLoad correctly", () => {
    expect(shouldWaitForAppLoad("loading")).toBe(true);
    expect(shouldWaitForAppLoad("interactive")).toBe(true);
    expect(shouldWaitForAppLoad("complete")).toBe(false);
  });

  it("exports SplashScreenOverlay, useSplashScreen and domain rules from index.ts", () => {
    expect(SplashScreenExports.SplashScreenOverlay).toBeDefined();
    expect(SplashScreenExports.useSplashScreen).toBeDefined();
    expect(SplashScreenExports.getAppSplashExitDelay).toBeDefined();
  });
});
