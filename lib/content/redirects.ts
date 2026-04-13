import type { ContentDocument, ContentRedirectRule } from "./types";

function buildCanonicalBySlugMap(documents: ContentDocument[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const document of documents) {
    map.set(document.slug, document.canonicalPath);
  }
  return map;
}

export function buildContentRedirectRules(
  documents: ContentDocument[]
): ContentRedirectRule[] {
  const canonicalBySlug = buildCanonicalBySlugMap(documents);
  const rules: ContentRedirectRule[] = [];

  for (const document of documents) {
    for (const aliasPath of document.aliases ?? []) {
      rules.push({
        sourcePath: aliasPath,
        destinationPath: document.canonicalPath,
        permanent: true,
        reason: "alias"
      });
    }

    if (document.status === "superseded" && document.supersededBySlug) {
      const destinationPath = canonicalBySlug.get(document.supersededBySlug);
      if (!destinationPath) {
        throw new Error(
          `Missing superseded destination for slug: ${document.slug} -> ${document.supersededBySlug}`
        );
      }
      rules.push({
        sourcePath: document.canonicalPath,
        destinationPath,
        permanent: true,
        reason: "superseded"
      });
    }
  }

  return rules;
}
