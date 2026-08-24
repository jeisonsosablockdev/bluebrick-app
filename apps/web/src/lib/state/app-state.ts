/**
 * @file apps/web/src/lib/state/app-state.ts
 * @description Layer 2: Application / State - Application Preferences & Client Store Types.
 * Declares domain state structures and client-side preference contracts.
 */

/**
 * Supported color theme modes.
 */
export type ThemeMode = "light" | "dark" | "system";

/**
 * Core application client state contract.
 */
export interface AppClientState {
  /** Active UI color theme */
  theme: ThemeMode;
  /** Flag indicating whether user preferences have hydrated from localStorage */
  hydrated: boolean;
}

/**
 * Local storage key constants for client-side persistence.
 */
export const STORAGE_KEYS = {
  THEME_PREFERENCE: "app_theme_mode",
  LAST_CONNECTED_WALLET: "app_last_wallet",
} as const;
