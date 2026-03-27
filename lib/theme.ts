export type ThemeMode = "dark" | "light";

export const THEME_STORAGE_KEY = "brids-ui-theme";
export const DEFAULT_THEME_MODE: ThemeMode = "dark";

export function sanitizeThemeMode(value: string | null | undefined, fallback: ThemeMode = DEFAULT_THEME_MODE): ThemeMode {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "light" ? "light" : normalized === "dark" ? "dark" : fallback;
}
