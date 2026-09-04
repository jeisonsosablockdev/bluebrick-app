/**
 * @file apps/web/src/components/theme/theme-toggle.tsx
 * @description Layer 1: Presentation - Interactive Light/Dark Luxury Theme Switcher Button.
 * Renders an accessible Sun/Moon toggle with smooth state transitions.
 */

"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./use-theme";
import { useI18n } from "@/features/i18n";

export interface ThemeToggleProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * ThemeToggle renders a luxury button to switch between dark and light modes.
 */
export function ThemeToggle({ className = "", style }: ThemeToggleProps): React.JSX.Element {
  // Step 1: Read active theme and toggle action
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();

  const isDark = theme === "dark";

  // Step 2: Render stylized toggle button
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={t("common.toggleThemeAria")}
      title={t("common.toggleThemeAria")}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 38,
        height: 38,
        borderRadius: 10,
        background: isDark ? "rgba(237, 241, 245, 0.06)" : "rgba(10, 18, 32, 0.05)",
        border: isDark ? "1px solid rgba(237, 241, 245, 0.12)" : "1px solid rgba(10, 18, 32, 0.12)",
        color: isDark ? "#EDF1F5" : "#0A1220",
        cursor: "pointer",
        transition: "all 0.2s ease",
        ...style,
      }}
    >
      {isDark ? (
        <Sun size={18} color="#57B98C" />
      ) : (
        <Moon size={18} color="#C41230" />
      )}
    </button>
  );
}
