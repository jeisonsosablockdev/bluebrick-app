/**
 * @file tests/unit/splash-load-optimization.test.tsx
 * @description Layer 3 & 4: Domain & Infrastructure - TDD Unit & Contract Test Suite for BBC-21
 * (Splash Load Optimization, Timing Schedules, Session Storage Gating, and SSR Safety).
 * @spec BBC-21-REQ-05 (Load Optimization & Prefetch Pipeline)
 * @spec BBC-21-REQ-06 (Web Storage & SSR Fallback Resilience)
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  calculateSplashSchedule,
  shouldBypassSplash,
  prefetchCriticalRoutes,
  DEFAULT_SPLASH_OPTIMIZATION_CONFIG,
} from "@/lib/splash/load-optimizer";
import {
  createMemorySplashStorage,
  createSessionSplashStorage,
  splashStorage,
} from "@/lib/splash/splash-storage";

describe("BBC-21: Splash Load Optimization & Storage Pipelines", () => {
  describe("Splash Schedule Calculations (@spec BBC-21-REQ-05)", () => {
    it("should accurately compute total elapsed time with default 1s hold duration and new phase timings", () => {
      // Step 1: Default 1000ms hold
      const schedule = calculateSplashSchedule();

      expect(schedule.enteringDurationMs).toBe(1200);
      expect(schedule.holdDurationMs).toBe(1000);
      expect(schedule.flippingDurationMs).toBe(500);
      expect(schedule.exitingDurationMs).toBe(300);

      // Total duration must equal sum of all 4 phases: 1200 + 1000 + 500 + 300 = 3000ms (3.0s)
      expect(schedule.totalDurationMs).toBe(3000);
    });

    it("should dynamically recalculate total elapsed time when custom hold duration is provided", () => {
      const schedule = calculateSplashSchedule(2000);

      expect(schedule.holdDurationMs).toBe(2000);
      expect(schedule.totalDurationMs).toBe(1200 + 2000 + 500 + 300);
    });

    it("should enforce non-negative hold durations", () => {
      const schedule = calculateSplashSchedule(-500);
      expect(schedule.holdDurationMs).toBe(0);
      expect(schedule.totalDurationMs).toBe(1200 + 0 + 500 + 300);
    });
  });

  describe("Session Gating & Bypass Logic (@spec BBC-21-REQ-05)", () => {
    it("should return false when the user has not viewed the splash screen yet", () => {
      const shouldBypass = shouldBypassSplash(false, false, true);
      expect(shouldBypass).toBe(false);
    });

    it("should return true when already viewed and bypassOnRepeatVisit is true", () => {
      const shouldBypass = shouldBypassSplash(true, false, true);
      expect(shouldBypass).toBe(true);
    });

    it("should return false when already viewed but forceShow is true (overrides bypass)", () => {
      const shouldBypass = shouldBypassSplash(true, true, true);
      expect(shouldBypass).toBe(false);
    });

    it("should return false when already viewed but bypassOnRepeatVisit is disabled", () => {
      const shouldBypass = shouldBypassSplash(true, false, false);
      expect(shouldBypass).toBe(false);
    });
  });

  describe("Critical Route & Resource Prefetching (@spec BBC-21-REQ-05)", () => {
    it("should trigger prefetch links for all specified critical routes without throwing", async () => {
      const routes = ["/dashboard", "/portfolio", "/auth/login"];

      // Act
      await prefetchCriticalRoutes(routes);

      // Assert that link tags with rel=prefetch were appended to document head
      const links = document.querySelectorAll('link[rel="prefetch"]');
      const hrefs = Array.from(links).map((l) => l.getAttribute("href"));

      expect(hrefs).toContain("/dashboard");
      expect(hrefs).toContain("/portfolio");
      expect(hrefs).toContain("/auth/login");
    });

    it("should safely handle empty route arrays gracefully", async () => {
      await expect(prefetchCriticalRoutes([])).resolves.not.toThrow();
    });

    it("should delegate prefetch scheduling to requestIdleCallback when available (@spec BBC-22-REQ-03)", async () => {
      const idleSpy = vi.fn((cb: () => void) => {
        cb();
        return 1;
      });
      vi.stubGlobal("requestIdleCallback", idleSpy);

      try {
        await prefetchCriticalRoutes(["/dashboard"]);
        expect(idleSpy).toHaveBeenCalledTimes(1);
      } finally {
        vi.unstubAllGlobals();
      }
    });
  });

  describe("Storage Adapters & SSR Safety (@spec BBC-21-REQ-06)", () => {
    beforeEach(() => {
      sessionStorage.clear();
    });

    it("should store and retrieve viewed state using createSessionSplashStorage", () => {
      const storage = createSessionSplashStorage();

      expect(storage.hasViewed()).toBe(false);
      storage.markAsViewed();
      expect(storage.hasViewed()).toBe(true);

      storage.clear();
      expect(storage.hasViewed()).toBe(false);
    });

    it("should work deterministically in pure memory when window is unavailable (SSR simulation)", () => {
      const memoryStorage = createMemorySplashStorage();

      expect(memoryStorage.hasViewed()).toBe(false);
      memoryStorage.markAsViewed();
      expect(memoryStorage.hasViewed()).toBe(true);

      memoryStorage.clear();
      expect(memoryStorage.hasViewed()).toBe(false);
    });

    it("should handle disabled or throwing storage gracefully without crashing", () => {
      // Mock sessionStorage.setItem to throw a QuotaExceededError / SecurityError
      const originalSetItem = sessionStorage.setItem;
      sessionStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error("SecurityError: Access is denied for this document");
      });

      const storage = createSessionSplashStorage();

      // Should not throw exception and should fall back safely
      expect(() => storage.markAsViewed()).not.toThrow();

      // Restore
      sessionStorage.setItem = originalSetItem;
    });

    it("should expose a reliable singleton instance splashStorage", () => {
      expect(splashStorage).toBeDefined();
      expect(typeof splashStorage.hasViewed).toBe("function");
      expect(typeof splashStorage.markAsViewed).toBe("function");
      expect(typeof splashStorage.clear).toBe("function");
    });
  });
});
