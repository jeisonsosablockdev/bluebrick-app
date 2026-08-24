/**
 * @file apps/web/src/components/theme/theme-toggle.tsx
 * @description Layer 1: Presentation - Theme mode toggle switch.
 */

"use client";

import React, { useState } from "react";
import { Button } from "../ui/button";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return true;
  });

  const toggleTheme = () => {
    // Step 1: Compute next theme state
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", nextDark);
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label="Toggle Color Theme">
      {isDark ? "🌙 Dark" : "☀️ Light"}
    </Button>
  );
}
