const DEFAULT_SITE_ORIGIN = "https://brids.com";

export const SEO_SITE_NAME = "BRIDS";
export const SEO_DEFAULT_DESCRIPTION =
  "AI discovery infrastructure and public platform content for BRIDS.";

function normalizeOrigin(rawOrigin: string): string {
  const trimmed = rawOrigin.trim();

  if (!trimmed) {
    return DEFAULT_SITE_ORIGIN;
  }

  const withProtocol =
    trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return DEFAULT_SITE_ORIGIN;
  }
}

export function getSiteOrigin(): string {
  const envOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "";

  if (!envOrigin && process.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }

  return normalizeOrigin(envOrigin);
}

export function normalizeRoutePath(path: string): string {
  const trimmed = path.trim();

  if (!trimmed || trimmed === "/") {
    return "/";
  }

  const [rawPath] = trimmed.split(/[?#]/);
  const withLeadingSlash = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  const withoutTrailingSlash = withLeadingSlash.replace(/\/+$/, "");

  return withoutTrailingSlash || "/";
}

export function buildCanonicalUrl(path: string): string {
  const canonicalPath = normalizeRoutePath(path);
  return new URL(canonicalPath, getSiteOrigin()).toString();
}

export function resolveOpenGraphImageUrl(imagePath?: string): string | undefined {
  if (!imagePath) {
    return undefined;
  }

  return buildCanonicalUrl(imagePath);
}
