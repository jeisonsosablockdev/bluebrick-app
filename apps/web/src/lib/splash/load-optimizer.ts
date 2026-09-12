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
  // Step 1: Establish phase durations according to Motion 12 brand choreography
  const enteringDurationMs = 1200;  // 1.2s staggered piece entrance
  const resolvedHoldMs = Math.max(0, holdDurationMs); // Enforce non-negative duration
  const flippingDurationMs = 1000;  // 1.0s 3D axial rotation & color transition
  const exitingDurationMs = 600;    // 0.6s curtain dissolve reveal

  // Step 2: Calculate cumulative lifecycle duration
  const totalDurationMs = enteringDurationMs + resolvedHoldMs + flippingDurationMs + exitingDurationMs;

  return {
    enteringDurationMs,
    holdDurationMs: resolvedHoldMs,
    flippingDurationMs,
    exitingDurationMs,
    totalDurationMs,
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
  // Step 1: Honor explicit manual force show override
  if (forceShow) {
    return false;
  }

  // Step 2: Honor global configuration bypass toggle
  if (!bypassEnabled) {
    return false;
  }

  // Step 3: Check session observation marker
  return hasViewedInSession;
}

/**
 * Asynchronously triggers background prefetching for critical platform routes during the holding phase.
 * Safe for execution in both SSR (no-op) and browser environments.
 *
 * @param routes - Array of route paths to prefetch
 * @returns Promise that resolves once link hints are dispatched
 */
export async function prefetchCriticalRoutes(routes: readonly string[]): Promise<void> {
  // Step 1: Guard against server-side execution where document is unavailable
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  // Step 2: Insert rel="prefetch" link tags in document head for non-existing links
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
}
