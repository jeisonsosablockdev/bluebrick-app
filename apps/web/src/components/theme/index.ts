/**
 * @file apps/web/src/components/theme/index.ts
 * @description Layer 1 & 2: Barrel export for Theme module components, hooks, and types.
 */

export { ThemeProvider, type Theme, type ThemeProviderProps, type ThemeContextValue } from "./theme-provider";
export { useTheme } from "./use-theme";
export { ThemeToggle, type ThemeToggleProps } from "./theme-toggle";
