/**
 * @file apps/web/src/lib/hooks/use-reduced-motion.ts
 * @description Layer 2: Application / Consumption - Hook for User Accessibility Preferences.
 * Uses React 19 `useSyncExternalStore` to subscribe directly to `window.matchMedia`
 * without state lag, hydration mismatch, or cascading render warnings.
 */

"use client";

import { useSyncExternalStore } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Subscribes a listener callback to changes in the prefers-reduced-motion media query.
 *
 * @param callback - Function invoked whenever media query status changes
 * @returns Teardown unsubscribe function
 */
// Step 1: Subscribe callback for window.matchMedia event listener
function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) {
    return () => {};
  }

  const mediaQueryList = window.matchMedia(REDUCED_MOTION_QUERY);

  if (mediaQueryList.addEventListener) {
    mediaQueryList.addEventListener("change", callback);
  } else if ("addListener" in mediaQueryList) {
    (mediaQueryList as { addListener: (listener: () => void) => void }).addListener(callback);
  }

  return () => {
    if (mediaQueryList.removeEventListener) {
      mediaQueryList.removeEventListener("change", callback);
    } else if ("removeListener" in mediaQueryList) {
      (mediaQueryList as { removeListener: (listener: () => void) => void }).removeListener(callback);
    }
  };
}

/**
 * Returns current snapshot of whether reduced motion is preferred on the client.
 *
 * @returns boolean - true if reduced motion is active
 */
// Step 2: Client snapshot reader
function getSnapshot(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * Server snapshot reader providing a safe default during SSR.
 *
 * @returns boolean - always false during server rendering
 */
// Step 3: Server snapshot reader (SSR fallback)
function getServerSnapshot(): boolean {
  return false;
}

/**
 * Custom React hook that detects whether the user or operating system
 * has requested reduced motion for vestibular safety or accessibility.
 * 
 * @returns boolean - true if reduced motion is preferred, false otherwise
 */
export function useReducedMotion(): boolean {
  // Step 4: Synchronize state with browser media query store
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
