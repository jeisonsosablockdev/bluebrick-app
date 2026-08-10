const DEFAULT_MAX_TEXT_LENGTH = 240;

export type SanitizedContextValue = string | number | boolean | null;

function stripControlChars(value: string): string {
  return value.replace(/[\u0000-\u001F\u007F]/g, " ");
}

export function sanitizeText(value: unknown, maxLength = DEFAULT_MAX_TEXT_LENGTH): string {
  if (typeof value !== "string") {
    return "";
  }

  return stripControlChars(value)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function sanitizePath(value: unknown): string {
  const raw = sanitizeText(value, 512);
  if (!raw) {
    return "/";
  }

  const withoutProtocol = raw.replace(/^https?:\/\/[^/]+/i, "");
  const [pathOnly] = withoutProtocol.split(/[?#]/, 1);
  const normalized = pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`;

  return normalized.replace(/\/+/g, "/").slice(0, 256) || "/";
}

export function sanitizeInteger(value: unknown, fallback = 0, min?: number, max?: number): number {
  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(parsed)) {
    return fallback;
  }

  if (typeof min === "number" && parsed < min) {
    return fallback;
  }

  if (typeof max === "number" && parsed > max) {
    return fallback;
  }

  return parsed;
}

export function sanitizeContext(
  value: Record<string, unknown> | undefined,
  options?: { maxEntries?: number; maxValueLength?: number }
): Record<string, SanitizedContextValue> {
  if (!value) {
    return {};
  }

  const maxEntries = options?.maxEntries ?? 20;
  const maxValueLength = options?.maxValueLength ?? 120;

  const output: Record<string, SanitizedContextValue> = {};
  const entries = Object.entries(value).slice(0, maxEntries);

  for (const [keyRaw, current] of entries) {
    const key = sanitizeText(keyRaw, 48);
    if (!key) {
      continue;
    }

    if (typeof current === "string") {
      output[key] = sanitizeText(current, maxValueLength);
      continue;
    }

    if (typeof current === "number") {
      output[key] = Number.isFinite(current) ? current : null;
      continue;
    }

    if (typeof current === "boolean") {
      output[key] = current;
      continue;
    }

    output[key] = null;
  }

  return output;
}
