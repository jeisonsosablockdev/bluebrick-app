import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";

import { ContentFrontmatterSchema } from "./schema";
import { parseFrontmatter } from "./frontmatter";
import type { ContentDocument, ContentLayer, LoadContentOptions } from "./types";

const SUPPORTED_EXTENSIONS = new Set([".md", ".mdx"]);
const LAYERS: ContentLayer[] = ["software", "knowledge", "regulatory"];

async function collectFilesRecursively(directoryPath: string): Promise<string[]> {
  const directoryEntries = await fsPromises.readdir(directoryPath, { withFileTypes: true });
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
        `Duplicated slug detected: "${document.slug}" in ${existingPath} and ${document.sourcePath}`
      );
    }
    seen.set(document.slug, document.sourcePath);
  }
}

export async function loadContentDocuments(
  options: LoadContentOptions = {}
): Promise<ContentDocument[]> {
  const defaultPath = fs.existsSync(path.join(process.cwd(), "apps", "web", "src", "content"))
    ? path.join(process.cwd(), "apps", "web", "src", "content")
    : path.join(process.cwd(), "content");

  const contentRoot = options.contentRoot ?? defaultPath;
  const includeDrafts = options.includeDrafts ?? false;

  const targetLayers = options.layer ? [options.layer] : LAYERS;

  const layerPaths = targetLayers.map((layer) => path.join(contentRoot, layer));
  const existingLayerPaths = layerPaths.filter((layerPath) => fs.existsSync(layerPath));

  const allFilePaths = (
    await Promise.all(existingLayerPaths.map((layerPath) => collectFilesRecursively(layerPath)))
  ).flat();

  const documents: ContentDocument[] = [];

  for (const filePath of allFilePaths) {
    const fileContent = await fsPromises.readFile(filePath, "utf8");
    const { frontmatter: rawFrontmatter, body } = parseFrontmatter(fileContent);

    const parsedResult = ContentFrontmatterSchema.safeParse(rawFrontmatter);
    if (!parsedResult.success) {
      throw new Error(
        `Invalid content frontmatter in ${filePath}: ${parsedResult.error.message}`
      );
    }

    const frontmatter = parsedResult.data;
    if (frontmatter.status === "draft" && !includeDrafts) {
      continue;
    }

    const layer = getLayerFromPath(contentRoot, filePath);

    documents.push({
      ...frontmatter,
      layer,
      sourcePath: filePath,
      body
    });
  }

  ensureUniqueSlugs(documents);

  return documents.sort((a, b) =>
    (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")
  );
}
