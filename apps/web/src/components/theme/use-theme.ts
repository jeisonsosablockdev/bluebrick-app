/**
 * @file apps/web/src/components/theme/use-theme.ts
 * @description Layer 2: Application - Custom Hook for Theme Consumption.
 * Provides access to the active theme ("dark" | "light") and theme toggle function with safe fallback.
 */

"use client";

import { useContext } from "react";
import { ThemeContext, type ThemeContextValue } from "./theme-provider";

const fallbackThemeValue: ThemeContextValue = {
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
};

/**
 * useTheme hook accesses the nearest ThemeContext.
 * Returns default dark theme fallback if rendered outside ThemeProvider.
 */
export function useTheme(): ThemeContextValue {
  // Step 1: Read ThemeContext
  const context = useContext(ThemeContext);

  // Step 2: Fall back to safe dark theme default if outside provider boundary
  return context || fallbackThemeValue;
}
