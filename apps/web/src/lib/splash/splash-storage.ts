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
    hasViewed(): boolean {
      // Step 1: Query in-memory flag
      return viewed;
    },
    markAsViewed(): void {
      // Step 2: Set in-memory flag
      viewed = true;
    },
    reset(): void {
      // Step 3: Clear in-memory flag
      viewed = false;
    },
    clear(): void {
      // Step 4: Alias to reset for test suite compatibility
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

  // Step 1: Detect if window and sessionStorage are accessible in current runtime
  const isSessionStorageAvailable = (): boolean => {
    if (typeof window === "undefined" || !window.sessionStorage) {
      return false;
    }
    try {
      const testKey = "__bluebrick_storage_test__";
      window.sessionStorage.setItem(testKey, "1");
      window.sessionStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  };

  return {
    hasViewed(): boolean {
      // Step 2: Read from sessionStorage if available, otherwise fall back to memory
      if (!isSessionStorageAvailable()) {
        return memoryFallback.hasViewed();
      }
      try {
        return window.sessionStorage.getItem(storageKey) === "true";
      } catch {
        return memoryFallback.hasViewed();
      }
    },
    markAsViewed(): void {
      // Step 3: Write to sessionStorage and sync memory fallback
      memoryFallback.markAsViewed();
      if (isSessionStorageAvailable()) {
        try {
          window.sessionStorage.setItem(storageKey, "true");
        } catch {
          // Graceful fallback: storage quota exceeded or disabled
        }
      }
    },
    reset(): void {
      // Step 4: Clear from sessionStorage and memory fallback
      memoryFallback.reset();
      if (isSessionStorageAvailable()) {
        try {
          window.sessionStorage.removeItem(storageKey);
        } catch {
          // Graceful fallback
        }
      }
    },
    clear(): void {
      // Step 5: Alias to reset for clean testing lifecycles
      memoryFallback.clear();
      if (isSessionStorageAvailable()) {
        try {
          window.sessionStorage.removeItem(storageKey);
        } catch {
          // Graceful fallback
        }
      }
    },
  };
}

/**
 * Default global singleton storage adapter instance for use across the application.
 */
export const splashStorage: SplashStorageAdapter = createSessionSplashStorage();
