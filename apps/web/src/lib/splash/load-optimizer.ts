/**
 * @file apps/web/src/lib/splash/load-optimizer.ts
 * @description Layer 3: Domain / Pipelines - Pure functional optimization pipeline for startup splash.
 * Evaluates session bypass rules, computes phase timing schedules, and orchestrates background asset prefetching.
 */

import type { SplashOptimizationConfig, SplashPhaseSchedule } from "./types";

/**
 * Default optimization and timing configuration.
 */
export const DEFAULT_SPLASH_OPTIMIZATION_CONFIG: SplashOptimizationConfig = {
  holdDurationMs: 5000,
  sessionStorageKey: "bluebrick:splash:viewed",
  bypassOnRepeatVisit: true,
  criticalRoutes: ["/dashboard", "/auth/login"],
  fallbackTimeoutMs: 10000,
} as const;

/**
 * Computes exact timing milestones and total duration for all state machine phases.
 *
 * @param holdDurationMs - Customizable hold duration in milliseconds (default: 5000ms)
 * @returns Fully resolved SplashPhaseSchedule
 */
export function calculateSplashSchedule(holdDurationMs: number = 5000): SplashPhaseSchedule {
  // Step 1: Enforce non-negative hold duration and calculate cumulative lifecycle duration
  const hold = Math.max(0, holdDurationMs);
  return {
    enteringDurationMs: 1200,
    holdDurationMs: hold,
    flippingDurationMs: 1000,
    exitingDurationMs: 600,
    totalDurationMs: 1200 + hold + 1000 + 600,
  };
}

/**
 * Evaluates whether the splash screen should be bypassed based on session state and override flags.
 *
 * @param hasViewedInSession - Whether the user has already experienced the splash in this session
 * @param forceShow - Explicit override to enforce splash display regardless of history
 * @param bypassEnabled - Configuration toggle controlling session bypass behavior
 * @returns True if splash screen should be bypassed
 */
export function shouldBypassSplash(
  hasViewedInSession: boolean,
  forceShow: boolean = false,
  bypassEnabled: boolean = true
): boolean {
  // Step 1: Evaluate bypass condition (bypassed if enabled, not forced, and previously viewed)
  return !forceShow && bypassEnabled && hasViewedInSession;
}

/**
 * Asynchronously triggers background prefetching for critical platform routes during the holding phase.
 * Defers execution to browser idle periods via requestIdleCallback (with setTimeout fallback)
 * to avoid network and CPU contention during active UI animations.
 * Safe for execution in both SSR (no-op) and browser environments.
 *
 * @param routes - Array of route paths to prefetch
 * @returns Promise that resolves once link hints are dispatched
 */
export async function prefetchCriticalRoutes(routes: readonly string[]): Promise<void> {
  // Step 1: Guard against server-side execution where document is unavailable or empty routes
  if (typeof window === "undefined" || typeof document === "undefined" || routes.length === 0) {
    return;
  }

  // Step 2: Define worker function to inject rel="prefetch" links into document head
  const injectPrefetchLinks = () => {
    for (const route of routes) {
      try {
        const existingLink = document.querySelector(`link[rel="prefetch"][href="${route}"]`);
        if (!existingLink) {
          const link = document.createElement("link");
          link.rel = "prefetch";
          link.href = route;
          link.as = "document";
          document.head.appendChild(link);
        }
      } catch {
        // Step 3: Non-blocking graceful fallback if DOM manipulation fails
        continue;
      }
    }
  };

  // Step 4: Schedule injection during idle browser time if requestIdleCallback is available
  return new Promise<void>((resolve) => {
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(() => {
        injectPrefetchLinks();
        resolve();
      });
    } else {
      // Step 5: Fallback to deferred timer for environments without requestIdleCallback
      setTimeout(() => {
        injectPrefetchLinks();
        resolve();
      }, 0);
    }
  });
}
