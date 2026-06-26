import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export type KnowledgeStatus = "observed" | "triaged" | "promoted" | "archived";
export type PromotionTarget = "guide" | "governance" | "automation" | "none";
export type KnowledgeKind = "observation" | "proposal" | "report" | "archive" | "reasoning-plan";

type Frontmatter = Record<string, string>;

export type KnowledgeEntry = {
  id: string;
  title: string;
  status: KnowledgeStatus;
  kind: KnowledgeKind;
  promotionTarget: PromotionTarget;
  scope: string;
  filePath: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
  sourceIssue: string;
  sourceFeature: string;
  enforcementCandidate: string;
};

export type KnowledgeIndex = {
  generatedAt: string;
  entries: KnowledgeEntry[];
  observations: KnowledgeEntry[];
  proposals: KnowledgeEntry[];
  reports: KnowledgeEntry[];
  archive: KnowledgeEntry[];
};

function normalizeValue(rawValue: string): string {
  const trimmed = rawValue.trim();
  return trimmed.replace(/^["']|["']$/g, "");
}

function parseFrontmatter(source: string): { frontmatter: Frontmatter; body: string } {
  if (!source.startsWith("---\n")) {
    return { frontmatter: {}, body: source };
  }

  const endIndex = source.indexOf("\n---\n", 4);
  if (endIndex === -1) {
    return { frontmatter: {}, body: source };
  }

  const frontmatterSource = source.slice(4, endIndex);
  const body = source.slice(endIndex + 5);

  const frontmatter: Frontmatter = {};

  for (const line of frontmatterSource.split(/\r?\n/)) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (!key) {
      continue;
    }

    frontmatter[key] = normalizeValue(value);
  }

  return { frontmatter, body };
}

async function listMarkdownFiles(dirPath: string): Promise<string[]> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    const files = await Promise.all(
      entries.map(async (entry) => {
        const absolutePath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          return listMarkdownFiles(absolutePath);
        }

        if (entry.isFile() && entry.name.endsWith(".md")) {
          return [absolutePath];
        }

        return [];
      })
    );

    return files.flat().sort((left, right) => left.localeCompare(right));
  } catch {
    return [];
  }
}

function inferKind(relativePath: string): KnowledgeKind {
  if (relativePath.startsWith("knowledge/inbox/")) {
    return "observation";
  }

  if (relativePath.startsWith("knowledge/proposals/")) {
    return "proposal";
  }

  if (relativePath.startsWith("knowledge/reports/")) {
    return "report";
  }

  if (relativePath.startsWith("knowledge/reasoning-plans/")) {
    return "reasoning-plan";
  }

  return "archive";
}

function inferStatus(metadata: Frontmatter, kind: KnowledgeKind): KnowledgeStatus {
  const raw = metadata.status?.toLowerCase();
  if (raw === "observed" || raw === "triaged" || raw === "promoted" || raw === "archived") {
    return raw;
  }

  return kind === "archive" ? "archived" : "observed";
}

function inferPromotionTarget(metadata: Frontmatter): PromotionTarget {
  const raw = metadata.promotion_target?.toLowerCase();
  if (raw === "guide" || raw === "governance" || raw === "automation" || raw === "none") {
    return raw;
  }

  return "none";
}

async function readKnowledgeEntry(rootDir: string, absolutePath: string): Promise<KnowledgeEntry> {
  const relativePath = path.relative(rootDir, absolutePath).replaceAll(path.sep, "/");
  const source = await readFile(absolutePath, "utf8");
  const { frontmatter } = parseFrontmatter(source);
  const kind = inferKind(relativePath);
  const generatedMatch = source.match(/^Generated:\s+(.+)$/m);
  const reportTimestamp = generatedMatch?.[1]?.trim() ?? "unknown";

  return {
    id: frontmatter.id ?? path.basename(relativePath, ".md"),
    title: frontmatter.title ?? path.basename(relativePath, ".md"),
    status: inferStatus(frontmatter, kind),
    kind,
    promotionTarget: inferPromotionTarget(frontmatter),
    scope: frontmatter.scope ?? "shared",
    filePath: relativePath,
    owner: frontmatter.owner ?? "unassigned",
    createdAt: frontmatter.created_at ?? reportTimestamp,
    updatedAt: frontmatter.updated_at ?? reportTimestamp,
    sourceIssue: frontmatter.source_issue ?? "n/a",
    sourceFeature: frontmatter.source_feature ?? "n/a",
    enforcementCandidate: frontmatter.enforcement_candidate ?? "no"
  };
}

function resolveIndexTimestamp(entries: KnowledgeEntry[]): string {
  const timestamps = entries
    .map((entry) => entry.updatedAt)
    .filter((value) => value !== "unknown" && Number.isFinite(Date.parse(value)))
    .sort((left, right) => Date.parse(right) - Date.parse(left));

  return timestamps[0] ?? "deterministic-from-content";
}

export async function collectKnowledgeIndex(rootDir: string): Promise<KnowledgeIndex> {
  const knowledgeRoot = path.join(rootDir, "knowledge");
  const markdownFiles = await listMarkdownFiles(knowledgeRoot);
  const entries = await Promise.all(markdownFiles.map((filePath) => readKnowledgeEntry(rootDir, filePath)));
  const filteredEntries = entries.filter((entry) => !entry.filePath.endsWith("README.md") && !entry.filePath.includes("/templates/"));

  return {
    generatedAt: resolveIndexTimestamp(filteredEntries),
    entries: filteredEntries,
    observations: filteredEntries.filter((entry) => entry.kind === "observation"),
    proposals: filteredEntries.filter((entry) => entry.kind === "proposal"),
    reports: filteredEntries.filter((entry) => entry.kind === "report"),
    archive: filteredEntries.filter((entry) => entry.kind === "archive")
  };
}

function renderEntryRow(entry: KnowledgeEntry): string {
  return `| ${entry.id} | ${entry.status} | ${entry.promotionTarget} | [${entry.title}](${entry.filePath}) | ${entry.sourceIssue} |`;
}

function renderSection(title: string, entries: KnowledgeEntry[]): string {
  const lines = [`## ${title}`];

  if (entries.length === 0) {
    lines.push("", "_No items yet._");
    return lines.join("\n");
  }

  lines.push(
    "",
    "| ID | Status | Target | File | Source |",
    "| --- | --- | --- | --- | --- |",
    ...entries.map(renderEntryRow)
  );

  return lines.join("\n");
}

function countByStatus(entries: KnowledgeEntry[], status: KnowledgeStatus): number {
  return entries.filter((entry) => entry.status === status).length;
}

export function renderKnowledgeReadme(index: KnowledgeIndex): string {
  const lines = [
    "# Knowledge Inbox",
    "",
    "This directory is the shared capture-and-promotion layer for reusable workflow knowledge.",
    "",
    "Promotion ladder:",
    "1. `knowledge/features/*.md` or RFCs capture delivery-specific evidence.",
    "2. `knowledge/inbox/*` stores reusable observations.",
    "3. `knowledge/proposals/*` stores promotion candidates.",
    "4. `knowledge/guides/*` stores approved reusable guides.",
    "5. `knowledge/governance/*` and CI/scripts store stable mandatory rules and executable enforcement.",
    "",
    "Human checkpoints:",
    "- Inbox items can be captured by the agent.",
    "- Promotion to `guide`, `governance`, or `automation` requires human review.",
    "- `AGENTS.md` is updated only after canonical docs or enforcement change.",
    "",
    "Commands:",
    "- `npm run knowledge:scan -- --base develop`",
    "- `npm run knowledge:index`",
    "- `npm run knowledge:index -- --check`",
    "- `npm run knowledge:drift`",
    "- `npm run validate:knowledge`",
    "",
    `Last Generated: ${index.generatedAt}`,
    "",
    "## Snapshot",
    "",
    "| Metric | Count |",
    "| --- | ---: |",
    `| Observations | ${index.observations.length} |`,
    `| Proposals | ${index.proposals.length} |`,
    `| Reports | ${index.reports.length} |`,
    `| Archived | ${index.archive.length} |`,
    `| Observed status | ${countByStatus(index.entries, "observed")} |`,
    `| Triaged status | ${countByStatus(index.entries, "triaged")} |`,
    `| Promoted status | ${countByStatus(index.entries, "promoted")} |`,
    `| Archived status | ${countByStatus(index.entries, "archived")} |`,
    "",
    renderSection("Inbox", index.observations),
    "",
    renderSection("Promotion Proposals", index.proposals),
    "",
    renderSection("Reports", index.reports),
    "",
    renderSection("Archive", index.archive)
  ];

  return `${lines.join("\n").trim()}\n`;
}
