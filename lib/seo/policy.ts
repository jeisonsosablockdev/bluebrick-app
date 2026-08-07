import type { Metadata } from "next";
import { normalizeRoutePath } from "./site";

export type SeoSection =
  | "home"
  | "software"
  | "knowledge"
  | "regulatory"
  | "marketplace"
  | "transparency"
  | "admin"
  | "profile"
  | "protected"
  | "checkout"
  | "api"
  | "system"
  | "other";

export type SeoCanonicalSection = SeoSection;
export const SEO_CANONICAL_PREFIX = "/";

const NOINDEX_PATH_PREFIXES = ["/admin", "/profile", "/protected", "/checkout", "/api"];
const NOINDEX_EXACT_PATHS = new Set(["/403"]);
const NOINDEX_SECTIONS = new Set<SeoSection>(["admin", "profile", "protected", "checkout", "api", "system"]);

export interface SeoIndexPolicyInput {
  path: string;
  explicitIndex?: boolean;
  explicitNoIndex?: boolean;
  section?: SeoSection;
  status?: string;
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

  if (normalizedPath.startsWith("/transparency")) {
    return "transparency";
  }

  if (normalizedPath.startsWith("/admin")) {
    return "admin";
  }

  if (normalizedPath.startsWith("/profile")) {
    return "profile";
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

  return "other";
}

export function isIndexablePage(input: SeoIndexPolicyInput): boolean {
  const normalizedPath = normalizeRoutePath(input.path);

  if (input.explicitNoIndex === true) {
    return false;
  }

  if (input.explicitIndex === true) {
    return true;
  }

  if (NOINDEX_EXACT_PATHS.has(normalizedPath)) {
    return false;
  }

  for (const prefix of NOINDEX_PATH_PREFIXES) {
    if (normalizedPath.startsWith(prefix)) {
      return false;
    }
  }

  const resolvedSection = input.section ?? resolveSeoSectionFromPath(normalizedPath);
  if (NOINDEX_SECTIONS.has(resolvedSection)) {
    return false;
  }

  if (input.status && input.status !== "published") {
    return false;
  }

  return true;
}

export function buildRobotsDirectives(input: SeoIndexPolicyInput): Metadata["robots"] {
  const indexable = isIndexablePage(input);
  return {
    index: indexable,
    follow: indexable,
    googleBot: {
      index: indexable,
      follow: indexable
    }
  };
}
