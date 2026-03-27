"use client";

import { useEffect, useState } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import { DEFAULT_THEME_MODE, sanitizeThemeMode, THEME_STORAGE_KEY, type ThemeMode } from "@/lib/theme";
import { cn } from "@/lib/utils";

function applyTheme(theme: ThemeMode): void {
  document.documentElement.setAttribute("data-theme", theme);
}

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { t } = useI18n();
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_THEME_MODE;
    }

    return sanitizeThemeMode(
      document.documentElement.getAttribute("data-theme")
      ?? window.localStorage.getItem(THEME_STORAGE_KEY)
    );
  });

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = (): void => {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  };

  return (
    <div className={cn("inline-flex", className)} data-no-theme-invert="true">
      <button
        type="button"
        onClick={toggleTheme}
        className="inline-flex min-h-11 items-center rounded-full border border-white/20 bg-slate-900/85 px-4 text-sm font-medium text-white shadow-[0_10px_26px_rgba(0,0,0,0.25)] transition hover:bg-slate-900"
        aria-label={t({
          en: "Toggle color theme",
          es: "Cambiar tema de color",
          pt: "Alternar tema de cor"
        })}
      >
        {theme === "dark"
          ? t({ en: "Switch to light mode", es: "Cambiar a modo claro", pt: "Mudar para modo claro" })
          : t({ en: "Switch to dark mode", es: "Cambiar a modo oscuro", pt: "Mudar para modo escuro" })}
      </button>
    </div>
  );
}
