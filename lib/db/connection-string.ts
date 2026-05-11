const LEGACY_SSLMODE_ALIASES = new Set(["prefer", "require", "verify-ca"]);

export function normalizeDatabaseUrlForPg(databaseUrl: string): string {
  const trimmed = databaseUrl.trim();
  if (!trimmed) {
    return trimmed;
  }

  const url = new URL(trimmed);
  const useLibpqCompat = url.searchParams.get("uselibpqcompat")?.trim().toLowerCase() === "true";
  const sslMode = url.searchParams.get("sslmode")?.trim().toLowerCase();

  if (!useLibpqCompat && sslMode && LEGACY_SSLMODE_ALIASES.has(sslMode)) {
    url.searchParams.set("sslmode", "verify-full");
  }

  return url.toString();
}
