const fs = require("node:fs/promises");
const path = require("node:path");

const REQUIRED_TEMPLATES = {
  epic: "EPIC-README.template.md",
  story: "STORY.template.md"
};

function slugify(rawValue) {
  return String(rawValue ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-");
}

function normalizeEpicId(rawEpicId) {
  const value = String(rawEpicId ?? "").trim().replace(/^EPIC-/i, "");

  if (!value) {
    throw new Error("`--epic` is required (example: --epic 12).");
  }

  if (/^\d+$/.test(value)) {
    return value.padStart(3, "0");
  }

  return value.toUpperCase();
}

function normalizeStoryId(rawStoryId) {
  const value = String(rawStoryId ?? "").trim();

  if (!value) {
    throw new Error("`--story-id` must not be empty.");
  }

  if (/^\d+$/.test(value)) {
    return value.padStart(2, "0");
  }

  return value.toUpperCase();
}

function toTitleFromSlug(slug) {
  if (!slug) {
    return "Untitled";
  }

  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function parseArgs(argv) {
  const args = {
    epic: "",
    slug: "",
    storyId: "01",
    storySlug: "kickoff",
    owner: process.env.USER || process.env.USERNAME || "unknown",
    force: false,
    help: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--help" || token === "-h") {
      args.help = true;
      continue;
    }

    if (token === "--force") {
      args.force = true;
      continue;
    }

    if (token === "--epic" || token === "--slug" || token === "--story-id" || token === "--story-slug" || token === "--owner") {
      const next = argv[index + 1];

      if (!next || next.startsWith("--")) {
        throw new Error(`Missing value for ${token}.`);
      }

      if (token === "--epic") args.epic = next;
      if (token === "--slug") args.slug = next;
      if (token === "--story-id") args.storyId = next;
      if (token === "--story-slug") args.storySlug = next;
      if (token === "--owner") args.owner = next;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  return args;
}

function buildReplacements({ epicId, epicSlug, storyId, storySlug, owner, date }) {
  const epicName = `EPIC-${epicId}-${epicSlug}`;
  const storyPrefix = `STORY-${epicId}-${storyId}`;
  const storyName = `${storyPrefix}-${storySlug}`;

  return {
    epicName,
    storyName,
    storyPrefix,
    replacements: [
      ["EPIC-<id>-<slug>", epicName],
      ["EPIC-<id>", `EPIC-${epicId}`],
      ["STORY-<id>-01-<slug>.md", `${storyName}.md`],
      ["STORY-<id>-01", storyPrefix],
      ["STORY-<id>-<slug>", storyName],
      ["<short-title>", toTitleFromSlug(epicSlug)],
      ["<owner>", owner],
      ["<YYYY-MM-DD>", date]
    ]
  };
}

function applyReplacements(templateContent, replacementEntries) {
  return replacementEntries.reduce((content, [search, replace]) => {
    return content.split(search).join(replace);
  }, templateContent);
}

async function ensureTemplateFiles(templateDir) {
  const epicTemplatePath = path.join(templateDir, REQUIRED_TEMPLATES.epic);
  const storyTemplatePath = path.join(templateDir, REQUIRED_TEMPLATES.story);

  try {
    await fs.access(epicTemplatePath);
    await fs.access(storyTemplatePath);
  } catch {
    throw new Error(
      "RFC templates not found. Expected files: docs/rfcs/templates/EPIC-README.template.md and docs/rfcs/templates/STORY.template.md"
    );
  }

  return { epicTemplatePath, storyTemplatePath };
}

async function createRfcScaffold(options) {
  const rootDir = options.rootDir ? path.resolve(options.rootDir) : process.cwd();
  const epicId = normalizeEpicId(options.epicId);
  const epicSlug = slugify(options.epicSlug);
  const storyId = normalizeStoryId(options.storyId || "01");
  const storySlug = slugify(options.storySlug || "kickoff");
  const owner = String(options.owner || "unknown");
  const force = Boolean(options.force);

  if (!epicSlug) {
    throw new Error("`--slug` is required (example: --slug staking).");
  }

  if (!storySlug) {
    throw new Error("`--story-slug` cannot be empty.");
  }

  const rfcsRoot = path.join(rootDir, "docs", "rfcs");
  const templateDir = path.join(rfcsRoot, "templates");
  const { epicTemplatePath, storyTemplatePath } = await ensureTemplateFiles(templateDir);
  const { epicName, storyName, replacements } = buildReplacements({
    epicId,
    epicSlug,
    storyId,
    storySlug,
    owner,
    date: new Date().toISOString().slice(0, 10)
  });

  const epicFolderName = epicName;
  const epicDir = path.join(rfcsRoot, epicFolderName);
  const epicReadmePath = path.join(epicDir, "README.md");
  const storyFileName = `${storyName}.md`;
  const storyFilePath = path.join(epicDir, storyFileName);

  if (force) {
    await fs.rm(epicDir, { recursive: true, force: true });
  } else {
    try {
      await fs.access(epicDir);
      throw new Error(
        `Epic folder already exists: ${path.relative(rootDir, epicDir)}. Use --force to overwrite.`
      );
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("Epic folder already exists")) {
        // Folder does not exist; continue.
      } else {
        throw error;
      }
    }
  }

  await fs.mkdir(epicDir, { recursive: true });

  const [epicTemplate, storyTemplate] = await Promise.all([
    fs.readFile(epicTemplatePath, "utf8"),
    fs.readFile(storyTemplatePath, "utf8")
  ]);

  await Promise.all([
    fs.writeFile(epicReadmePath, applyReplacements(epicTemplate, replacements), "utf8"),
    fs.writeFile(storyFilePath, applyReplacements(storyTemplate, replacements), "utf8")
  ]);

  return {
    rootDir,
    epicFolderName,
    epicDir,
    epicReadmePath,
    storyFileName,
    storyFilePath
  };
}

function usage() {
  return [
    "Create RFC scaffold for an epic and first story.",
    "",
    "Usage:",
    "  npm run rfc:new -- --epic <id> --slug <epic-slug> [options]",
    "",
    "Options:",
    "  --story-id <id>        Story sequence id (default: 01)",
    "  --story-slug <slug>    Story slug (default: kickoff)",
    "  --owner <name>         Metadata owner value (default: $USER)",
    "  --force                Overwrite existing epic folder",
    "  --help                 Show this help"
  ].join("\n");
}

async function runCli(argv) {
  const args = parseArgs(argv);

  if (args.help) {
    console.log(usage());
    return;
  }

  const result = await createRfcScaffold({
    epicId: args.epic,
    epicSlug: args.slug,
    storyId: args.storyId,
    storySlug: args.storySlug,
    owner: args.owner,
    force: args.force
  });

  console.log("RFC scaffold created:");
  console.log(`- ${path.relative(result.rootDir, result.epicReadmePath)}`);
  console.log(`- ${path.relative(result.rootDir, result.storyFilePath)}`);
}

module.exports = {
  createRfcScaffold,
  normalizeEpicId,
  normalizeStoryId,
  parseArgs,
  runCli,
  slugify,
  usage
};

