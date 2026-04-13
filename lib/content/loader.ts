import fs from "node:fs/promises";
import path from "node:path";

import { ContentFrontmatterSchema } from "./schema";
import { parseFrontmatter } from "./frontmatter";
import type { ContentDocument, ContentLayer, LoadContentOptions } from "./types";

const SUPPORTED_EXTENSIONS = new Set([".md", ".mdx"]);
const LAYERS: ContentLayer[] = ["software", "knowledge", "regulatory"];

async function collectFilesRecursively(directoryPath: string): Promise<string[]> {
  const directoryEntries = await fs.readdir(directoryPath, { withFileTypes: true });
  const nestedResults = await Promise.all(
    directoryEntries.map(async (entry) => {
      const absolutePath = path.join(directoryPath, entry.name);
      if (entry.isDirectory()) {
        return collectFilesRecursively(absolutePath);
      }
      if (SUPPORTED_EXTENSIONS.has(path.extname(entry.name))) {
        return [absolutePath];
      }
      return [];
    })
  );

  return nestedResults.flat();
}

function getLayerFromPath(contentRoot: string, filePath: string): ContentLayer {
  const relativePath = path.relative(contentRoot, filePath);
  const [firstSegment] = relativePath.split(path.sep);

  if (!LAYERS.includes(firstSegment as ContentLayer)) {
    throw new Error(`Unsupported content layer for file: ${relativePath}`);
  }

  return firstSegment as ContentLayer;
}

function ensureUniqueSlugs(documents: ContentDocument[]): void {
  const seen = new Map<string, string>();

  for (const document of documents) {
    const existingPath = seen.get(document.slug);
    if (existingPath) {
      throw new Error(
        `Duplicated slug detected: \"${document.slug}\" in ${existingPath} and ${document.sourcePath}`
      );
    }
    seen.set(document.slug, document.sourcePath);
  }
}

export async function loadContentDocuments(
  options: LoadContentOptions = {}
): Promise<ContentDocument[]> {
  const contentRoot = options.contentRoot ?? path.join(process.cwd(), "content");
  const includeDrafts = options.includeDrafts ?? false;

  const targetLayers = options.layer ? [options.layer] : LAYERS;

  const allFiles = (
    await Promise.all(
      targetLayers.map(async (layer) => {
        const layerDir = path.join(contentRoot, layer);
        try {
          return await collectFilesRecursively(layerDir);
        } catch {
          return [];
        }
      })
    )
  ).flat();

  const documents: ContentDocument[] = [];

  for (const absoluteFilePath of allFiles) {
    const source = await fs.readFile(absoluteFilePath, "utf8");
    const parsed = parseFrontmatter(source);
    const validatedFrontmatter = ContentFrontmatterSchema.parse(parsed.frontmatter);
    const layer = getLayerFromPath(contentRoot, absoluteFilePath);

    if (!includeDrafts && validatedFrontmatter.status === "draft") {
      continue;
    }

    documents.push({
      ...validatedFrontmatter,
      body: parsed.body,
      layer,
      sourcePath: absoluteFilePath
    });
  }

  ensureUniqueSlugs(documents);
  return documents;
}
