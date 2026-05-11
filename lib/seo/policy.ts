import type { Metadata } from "next";

import type { DocumentStatus } from "@/lib/content/types";

import { normalizeRoutePath } from "./site";

export type SeoCanonicalSection = "software" | "knowledge" | "regulatory";

export const SEO_CANONICAL_PREFIX: Record<SeoCanonicalSection, string> = {
  software: "/software",
  knowledge: "/knowledge",
  regulatory: "/regulatory"
};

export type SeoSection =
  | SeoCanonicalSection
  | "home"
  | "marketplace"
  | "transparency"
  | "admin"
  | "protected"
  | "checkout"
  | "api"
  | "system"
  | "other";

const NOINDEX_PATH_PREFIXES = ["/admin", "/protected", "/checkout", "/api"];
const NOINDEX_EXACT_PATHS = new Set(["/403"]);
const NOINDEX_SECTIONS = new Set<SeoSection>(["admin", "protected", "checkout", "api", "system"]);

export interface SeoIndexPolicyInput {
  path: string;
  status?: DocumentStatus;
  explicitIndex?: boolean;
  explicitNoIndex?: boolean;
  section?: SeoSection;
}

export function resolveSeoSectionFromPath(path: string): SeoSection {
  const normalizedPath = normalizeRoutePath(path);

  if (normalizedPath === "/") {
    return "home";
  }

  if (normalizedPath.startsWith("/software")) {
    return "software";
  }

  if (normalizedPath.startsWith("/knowledge")) {
    return "knowledge";
  }

  if (normalizedPath.startsWith("/regulatory")) {
    return "regulatory";
  }

  if (normalizedPath.startsWith("/marketplace")) {
    return "marketplace";
  }

  if (normalizedPath.startsWith("/transparencia")) {
    return "transparency";
  }

  if (normalizedPath.startsWith("/admin")) {
    return "admin";
  }

  if (normalizedPath.startsWith("/protected")) {
    return "protected";
  }

  if (normalizedPath.startsWith("/checkout")) {
    return "checkout";
  }

  if (normalizedPath.startsWith("/api")) {
    return "api";
  }

  if (normalizedPath === "/403") {
    return "system";
  }

  return "other";
}

export function isRestrictedPath(path: string): boolean {
  const normalizedPath = normalizeRoutePath(path);

  if (NOINDEX_EXACT_PATHS.has(normalizedPath)) {
    return true;
  }

  return NOINDEX_PATH_PREFIXES.some((prefix) => normalizedPath.startsWith(prefix));
}

export function isIndexablePage({
  path,
  status,
  explicitIndex = false,
  explicitNoIndex = false,
  section
}: SeoIndexPolicyInput): boolean {
  const normalizedPath = normalizeRoutePath(path);
  const resolvedSection = section ?? resolveSeoSectionFromPath(normalizedPath);

  if (explicitNoIndex) {
    return false;
  }

  if (isRestrictedPath(normalizedPath) || NOINDEX_SECTIONS.has(resolvedSection)) {
    return false;
  }

  if (status && status !== "published") {
    return false;
  }

  if (explicitIndex) {
    return true;
  }

  return true;
}

export function buildRobotsDirectives(indexable: boolean): Metadata["robots"] {
  return {
    index: indexable,
    follow: indexable,
    googleBot: {
      index: indexable,
      follow: indexable,
      "max-image-preview": indexable ? "large" : "none",
      "max-snippet": indexable ? -1 : 0
    }
  };
}
