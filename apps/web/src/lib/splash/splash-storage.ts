/**
 * @file apps/web/src/lib/splash/splash-storage.ts
 * @description Layer 4: Infrastructure - Web Storage adapter providing SSR-safe and sandbox-resilient
 * session tracking for the startup splash screen.
 */

import type { SplashStorageAdapter } from "./types";

/**
 * Canonical session storage key for splash screen display status.
 */
export const DEFAULT_SPLASH_STORAGE_KEY = "bluebrick:splash:viewed";

/**
 * Creates an in-memory storage adapter suitable for SSR, testing, or sandboxed environments.
 *
 * @returns In-memory SplashStorageAdapter implementation
 */
export function createMemorySplashStorage(): SplashStorageAdapter {
  let viewed = false;

  return {
    hasViewed: () => viewed,
    markAsViewed: () => {
      viewed = true;
    },
    reset: () => {
      viewed = false;
    },
    clear: () => {
      viewed = false;
    },
  };
}

/**
 * Creates a browser sessionStorage adapter with fallback to memory if storage is inaccessible.
 * Handles SSR and Private Browsing exceptions gracefully.
 *
 * @param storageKey - The key identifier in sessionStorage (defaults to DEFAULT_SPLASH_STORAGE_KEY)
 * @returns Resilient SplashStorageAdapter implementation
 */
export function createSessionSplashStorage(
  storageKey: string = DEFAULT_SPLASH_STORAGE_KEY
): SplashStorageAdapter {
  const memoryFallback = createMemorySplashStorage();

  return {
    hasViewed(): boolean {
      // Step 1: Read from sessionStorage if available, fallback to memory
      try {
        if (typeof window !== "undefined" && window.sessionStorage) {
          return window.sessionStorage.getItem(storageKey) === "true";
        }
      } catch {
        // Storage access restricted (private browsing / sandbox)
      }
      return memoryFallback.hasViewed();
    },
    markAsViewed(): void {
      // Step 2: Write to sessionStorage and sync memory fallback
      memoryFallback.markAsViewed();
      try {
        if (typeof window !== "undefined" && window.sessionStorage) {
          window.sessionStorage.setItem(storageKey, "true");
        }
      } catch {
        // Storage quota exceeded or disabled
      }
    },
    reset(): void {
      // Step 3: Delegate reset to clear
      this.clear();
    },
    clear(): void {
      // Step 4: Clear from sessionStorage and memory fallback
      memoryFallback.clear();
      try {
        if (typeof window !== "undefined" && window.sessionStorage) {
          window.sessionStorage.removeItem(storageKey);
        }
      } catch {
        // Storage restricted or inaccessible
      }
    },
  };
}

/**
 * Default global singleton storage adapter instance for use across the application.
 */
export const splashStorage: SplashStorageAdapter = createSessionSplashStorage();
