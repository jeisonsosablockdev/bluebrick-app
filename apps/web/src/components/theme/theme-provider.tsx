/**
 * @file apps/web/src/components/theme/theme-provider.tsx
 * @description Layer 1: Presentation - Application Theme Context Provider.
 * Manages Dark/Light luxury theme state, DOM class synchronization, and localStorage persistence.
 */

"use client";

import React, { createContext, useState, useEffect, useCallback, useMemo } from "react";

export type Theme = "dark" | "light";

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = "bluebrick_theme";

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

/**
 * ThemeProvider component encapsulates light/dark mode state and DOM manipulation.
 */
export function ThemeProvider({
  children,
  defaultTheme = "dark",
}: ThemeProviderProps): React.JSX.Element {
  // Step 1: Initialize theme state with localStorage persistence or defaultTheme
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
        if (savedTheme === "light" || savedTheme === "dark") {
          return savedTheme;
        }
      } catch {
        // Ignore localStorage read errors in restricted contexts
      }
    }
    return defaultTheme;
  });

  // Step 3: Sync DOM root element classList whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  }, [theme]);

  // Step 4: Define memoized theme setters and toggle actions
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // Ignore localStorage write errors
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prevTheme) => {
      const nextTheme = prevTheme === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      } catch {
        // Ignore localStorage write errors
      }
      return nextTheme;
    });
  }, []);

  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}
