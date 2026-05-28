"use client";

import { AnimatePresence, motion } from "motion/react";
import { useSyncExternalStore } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import { DEFAULT_THEME_MODE, sanitizeThemeMode, THEME_STORAGE_KEY, type ThemeMode } from "@/lib/theme";
import { cn } from "@/lib/utils";

function applyTheme(theme: ThemeMode): void {
  document.documentElement.setAttribute("data-theme", theme);
}

const THEME_CHANGE_EVENT = "brids-theme-change";

function readThemeSnapshot(): ThemeMode {
  if (typeof window === "undefined") {
    return DEFAULT_THEME_MODE;
  }

  return sanitizeThemeMode(
    document.documentElement.getAttribute("data-theme")
    ?? window.localStorage.getItem(THEME_STORAGE_KEY)
  );
}

function subscribeToThemeChange(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleThemeChange = (): void => {
    onStoreChange();
  };

  window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);
  window.addEventListener("storage", handleThemeChange);

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
    window.removeEventListener("storage", handleThemeChange);
  };
}

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { t } = useI18n();
  const theme = useSyncExternalStore(subscribeToThemeChange, readThemeSnapshot, () => DEFAULT_THEME_MODE);

  const toggleTheme = (): void => {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };

  return (
    <div className={cn("inline-flex w-full sm:w-[17rem]", className)} data-no-theme-invert="true">
      <motion.button
        type="button"
        onClick={toggleTheme}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.985 }}
        className="inline-flex min-h-11 w-full items-center justify-center gap-3 whitespace-nowrap rounded-full border border-white/20 bg-slate-900/85 px-4 text-sm font-medium text-white shadow-[0_10px_26px_rgba(0,0,0,0.25)] transition hover:bg-slate-900"
        aria-label={t({
          en: "Toggle color theme",
          es: "Cambiar tema de color",
          pt: "Alternar tema de cor"
        })}
      >
        <motion.span
          layout
          className="inline-flex h-6 w-12 items-center rounded-full border border-white/15 bg-black/20 p-1"
          transition={{ type: "spring", stiffness: 520, damping: 36 }}
        >
          <motion.span
            layout
            className={cn(
              "h-4 w-4 rounded-full shadow-[0_6px_18px_rgba(255,255,255,0.18)]",
              theme === "dark" ? "bg-sky-200" : "bg-amber-200"
            )}
            transition={{ type: "spring", stiffness: 520, damping: 36 }}
          />
        </motion.span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={theme}
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            transition={{ duration: 0.18 }}
          >
            {theme === "dark"
              ? t({ en: "Switch to light mode", es: "Cambiar a modo claro", pt: "Mudar para modo claro" })
              : t({ en: "Switch to dark mode", es: "Cambiar a modo oscuro", pt: "Mudar para modo escuro" })}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
