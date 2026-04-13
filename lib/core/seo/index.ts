export type SeoSection = "software" | "knowledge" | "regulatory";

export const SEO_CANONICAL_PREFIX: Record<SeoSection, string> = {
  software: "/software",
  knowledge: "/knowledge",
  regulatory: "/regulatory"
};
