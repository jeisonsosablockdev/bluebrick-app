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
        className="grid min-h-11 w-full grid-cols-[3rem_minmax(0,1fr)] items-center gap-3 whitespace-nowrap rounded-full bg-slate-950/42 px-4 text-sm font-medium text-white shadow-[0_12px_32px_rgba(0,0,0,0.18)] transition hover:bg-slate-950/58"
        aria-label={t({
          en: "Toggle color theme",
          es: "Cambiar tema de color",
          pt: "Alternar tema de cor"
        })}
      >
        <span
          className={cn(
            "relative inline-flex h-6 w-12 shrink-0 items-center rounded-full p-1 shadow-[inset_0_-1px_0_rgba(0,176,249,0.05)]",
            theme === "dark"
              ? "bg-black/22"
              : "bg-[linear-gradient(135deg,rgba(47,198,255,0.18)_0%,rgba(124,58,237,0.2)_100%)] shadow-[inset_0_1px_12px_rgba(47,198,255,0.16),inset_0_-1px_0_rgba(124,58,237,0.08)]"
          )}
        >
          <motion.span
            animate={{ x: theme === "dark" ? 24 : 0 }}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.94 }}
            className={cn(
              "absolute left-1 top-1 h-4 w-4 rounded-full will-change-transform",
              theme === "dark"
                ? "bg-sky-200 shadow-[0_6px_18px_rgba(255,255,255,0.18)]"
                : "bg-gradientPrimary shadow-[0_6px_18px_rgba(47,198,255,0.3)]"
            )}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
          />
        </span>
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
